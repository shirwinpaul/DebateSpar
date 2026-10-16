import type { z } from "zod";
import { AI_CONFIG } from "@/config/ai";
import { AIError } from "./errors";
import type { Provider } from "./providers";
import { estimateTokens, type CompactLevel } from "./tokens";

export interface GenerateOptions<S extends z.ZodTypeAny> {
  system: string;
  /** Builds the user prompt. "compact" must produce a shorter prompt (used to fit Groq's TPM limit). */
  buildPrompt: (level: CompactLevel) => string;
  schema: S;
  maxTokens: number;
}

export interface Deps {
  gemini?: Provider;
  groq?: Provider;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  log?: (entry: Record<string, unknown>) => void;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Logs metadata only: provider, status, error type, retry-after. NEVER keys or debate content. */
const defaultLog = (entry: Record<string, unknown>) => console.warn("[ai]", JSON.stringify(entry));

/** Pull the first JSON object out of a reply (tolerates ```json fences or stray text). */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("No JSON object found");
  }
}

/** Call one provider; on invalid JSON / schema mismatch retry ONCE with the validation error appended. */
async function callValidated<S extends z.ZodTypeAny>(
  provider: Provider,
  opts: GenerateOptions<S>,
  prompt: string,
  timeLeft: () => number,
): Promise<z.infer<S>> {
  let currentPrompt = prompt;
  for (let attempt = 0; attempt < 2; attempt++) {
    const timeoutMs = Math.min(AI_CONFIG.timeoutMs, timeLeft());
    if (timeoutMs < 3000) throw new AIError("timeout", provider.name);
    const text = await provider.call({ system: opts.system, prompt: currentPrompt, maxTokens: opts.maxTokens, timeoutMs });
    let problem: string;
    try {
      const parsed = opts.schema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
      problem = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    } catch {
      problem = "Reply was not valid JSON.";
    }
    currentPrompt = `${prompt}\n\nYOUR PREVIOUS REPLY WAS INVALID: ${problem}\nReturn ONLY one valid JSON object with exactly the required fields.`;
  }
  throw new AIError("invalid_json", provider.name);
}

/**
 * One user action = one logical AI call, with at most:
 *  - Gemini: 1 retry after a short retry-after wait on 429 (≤ maxRetryWaitMs), then fall back.
 *  - Groq fallback on 429/daily quota/5xx/timeout/invalid JSON/auth, with the prompt trimmed to fit its TPM limit.
 */
export async function generateJSON<S extends z.ZodTypeAny>(opts: GenerateOptions<S>, deps: Deps): Promise<z.infer<S>> {
  const sleep = deps.sleep ?? defaultSleep;
  const log = deps.log ?? defaultLog;
  const now = deps.now ?? Date.now;
  // Stay inside the serverless function limit across all retries and fallbacks.
  const deadline = now() + AI_CONFIG.totalBudgetMs;
  const timeLeft = () => deadline - now();
  const errors: AIError[] = [];

  const record = (e: unknown, provider: string): AIError => {
    const err = e instanceof AIError ? e : new AIError("unknown", provider);
    log({ provider: err.provider, status: err.status ?? null, type: err.kind, retryAfter: err.retryAfter ?? null });
    errors.push(err);
    return err;
  };

  if (deps.gemini) {
    const prompt = opts.buildPrompt("full");
    try {
      return await callValidated(deps.gemini, opts, prompt, timeLeft);
    } catch (e) {
      const err = record(e, "gemini");
      const waitMs = (err.retryAfter ?? 5) * 1000;
      if (err.kind === "rate_limit" && waitMs <= AI_CONFIG.maxRetryWaitMs) {
        await sleep(waitMs);
        try {
          return await callValidated(deps.gemini, opts, prompt, timeLeft);
        } catch (e2) {
          record(e2, "gemini");
        }
      }
    }
  }

  if (deps.groq) {
    // Groq counts prompt + max output tokens against its per-minute budget; keep 10% headroom.
    const budget = AI_CONFIG.groq.tokensPerMinute * 0.9 - opts.maxTokens;
    let prompt = opts.buildPrompt("full");
    if (estimateTokens(opts.system + prompt) > budget) prompt = opts.buildPrompt("compact");
    try {
      return await callValidated(deps.groq, opts, prompt, timeLeft);
    } catch (e) {
      record(e, "groq");
    }
  }

  throw finalError(errors, !!deps.gemini || !!deps.groq);
}

/** Choose the most useful error to show the user once every provider has failed. */
export function finalError(errors: AIError[], anyProvider: boolean): AIError {
  if (!anyProvider) return new AIError("not_configured", "none");
  const rate = errors.filter((e) => e.kind === "rate_limit");
  if (rate.length) {
    const wait = Math.min(...rate.map((e) => e.retryAfter ?? 30));
    return new AIError("rate_limit", "all", 429, Math.max(5, Math.min(wait, 120)));
  }
  if (errors.some((e) => e.kind === "daily_quota")) return new AIError("daily_quota", "all", 429);
  if (errors.length && errors.every((e) => e.kind === "auth")) return new AIError("auth", "all");
  return new AIError("unknown", "all");
}
