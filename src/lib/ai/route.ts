import type { z } from "zod";
import { isMockMode, isRealKey } from "@/config/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { AIError, userMessage, type AIErrorKind } from "./errors";
import type { Deps } from "./orchestrator";
import { geminiProvider, groqProvider } from "./providers";

/** Text-only app: requests are tiny. Reject anything over 64 KB (far below Vercel's ~4.5 MB limit). */
export const MAX_BODY_BYTES = 64 * 1024;

export type ApiErrorKind = AIErrorKind | "bad_request" | "too_many_requests";
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { kind: ApiErrorKind; message: string; retryAfter?: number } };

function fail(kind: ApiErrorKind, message: string, status: number, retryAfter?: number): Response {
  const body: ApiResult<never> = { ok: false, error: { kind, message, retryAfter } };
  return Response.json(body, { status, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined });
}

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

/** Build providers. A BYOK Gemini key from the request header wins over the server key. */
export function buildDeps(req: Request): Deps {
  const byok = req.headers.get("x-gemini-key");
  const geminiKey = isRealKey(byok) ? byok : process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  return {
    gemini: isRealKey(geminiKey) ? geminiProvider(geminiKey) : undefined,
    groq: isRealKey(groqKey) ? groqProvider(groqKey) : undefined,
  };
}

/** Shared pipeline for every AI route: size check → rate limit → Zod validation → AI → friendly errors. */
export async function handleAIRoute<S extends z.ZodTypeAny, T>(
  req: Request,
  schema: S,
  run: (data: z.infer<S>, deps: Deps | "mock") => Promise<T>,
): Promise<Response> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return fail("bad_request", "That request is too large.", 413);

  const limit = checkRateLimit(clientIp(req));
  if (!limit.ok) {
    return fail("too_many_requests", `You've reached the hourly limit for AI calls. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`, 429, limit.retryAfter);
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return fail("bad_request", "Could not read the request.", 400);
  }
  if (raw.length > MAX_BODY_BYTES) return fail("bad_request", "That request is too large.", 413);

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail("bad_request", "Invalid request.", 400);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return fail("bad_request", "Some debate details were invalid. Please start a new debate.", 400);

  try {
    const data = await run(parsed.data, isMockMode() ? "mock" : buildDeps(req));
    const body: ApiResult<T> = { ok: true, data };
    return Response.json(body);
  } catch (e) {
    const err = e instanceof AIError ? e : new AIError("unknown", "route");
    if (!(e instanceof AIError)) console.error("[ai] unexpected error type:", (e as Error)?.name ?? "unknown");
    const status = err.kind === "rate_limit" || err.kind === "daily_quota" ? 429 : err.kind === "not_configured" ? 503 : 502;
    return fail(err.kind, userMessage(err.kind, err.retryAfter), status, err.retryAfter);
  }
}
