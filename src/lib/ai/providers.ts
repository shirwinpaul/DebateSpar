import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { AI_CONFIG } from "@/config/ai";
import { AIError, classifyHttpError, parseRetryAfter } from "./errors";

export interface ProviderRequest {
  system: string;
  prompt: string;
  maxTokens: number;
  /** Abort after this many ms (defaults to AI_CONFIG.timeoutMs). */
  timeoutMs?: number;
}

export interface Provider {
  name: "gemini" | "groq";
  call(req: ProviderRequest): Promise<string>;
}

/** Run `fn` with an abort signal that fires after the configured timeout. */
async function withTimeout<T>(provider: string, timeoutMs: number | undefined, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? AI_CONFIG.timeoutMs);
  try {
    return await fn(controller.signal);
  } catch (e) {
    if (e instanceof AIError) throw e;
    if (controller.signal.aborted) throw new AIError("timeout", provider);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Gemini errors embed details as JSON text, e.g. "retryDelay": "17s" and quota IDs with "PerDay". */
function geminiError(e: unknown): AIError {
  const err = e as { status?: number; message?: string };
  const message = String(err?.message ?? "");
  const status = typeof err?.status === "number" ? err.status : 0;
  const delay = message.match(/"retryDelay"\s*:\s*"([\d.]+)s"/)?.[1] ?? message.match(/retry in ([\d.]+)s/i)?.[1];
  if (!status) return new AIError("unknown", "gemini");
  return classifyHttpError("gemini", status, message, parseRetryAfter(delay));
}

export function geminiProvider(apiKey: string): Provider {
  const client = new GoogleGenAI({ apiKey });
  return {
    name: "gemini",
    call: (req) =>
      withTimeout("gemini", req.timeoutMs, async (signal) => {
        try {
          const res = await client.models.generateContent({
            model: AI_CONFIG.gemini.model,
            contents: req.prompt,
            config: {
              systemInstruction: req.system,
              maxOutputTokens: req.maxTokens,
              responseMimeType: "application/json",
              temperature: 0.8,
              thinkingConfig: { thinkingLevel: ThinkingLevel[AI_CONFIG.gemini.thinkingLevel] },
              abortSignal: signal,
            },
          });
          return res.text ?? "";
        } catch (e) {
          if (signal.aborted) throw new AIError("timeout", "gemini");
          throw geminiError(e);
        }
      }),
  };
}

/** Groq exposes an OpenAI-compatible chat completions endpoint; plain fetch keeps dependencies small. */
export function groqProvider(apiKey: string): Provider {
  return {
    name: "groq",
    call: (req) =>
      withTimeout("groq", req.timeoutMs, async (signal) => {
        const res = await fetch(AI_CONFIG.groq.baseUrl, {
          method: "POST",
          signal,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: AI_CONFIG.groq.model,
            messages: [
              { role: "system", content: req.system },
              { role: "user", content: req.prompt },
            ],
            max_completion_tokens: req.maxTokens,
            temperature: 0.8,
            reasoning_effort: AI_CONFIG.groq.reasoningEffort,
            response_format: { type: "json_object" },
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw classifyHttpError("groq", res.status, body, parseRetryAfter(res.headers.get("retry-after")));
        }
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        return json.choices?.[0]?.message?.content ?? "";
      }),
  };
}
