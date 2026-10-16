/**
 * ALL AI model IDs and provider settings live in this one file.
 * Model IDs verified against the official docs (Oct 2026):
 *  - Gemini: https://ai.google.dev/gemini-api/docs/models  (gemini-3.8-flash; thinking can only go down to "low")
 *  - Groq:   https://console.groq.com/docs/rate-limits     (openai/gpt-oss-120b, 8K tokens/minute on base plan)
 */
export const AI_CONFIG = {
  gemini: {
    model: "gemini-3.8-flash",
    /** Lowest thinking level this model supports — keeps token usage small. */
    thinkingLevel: "LOW" as const,
  },
  groq: {
    model: "openai/gpt-oss-120b",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    /** Groq's free-tier tokens-per-minute limit for this model. Requests are trimmed to fit. */
    tokensPerMinute: 8000,
    /** Lowest reasoning effort for gpt-oss models. */
    reasoningEffort: "low" as const,
  },
  /**
   * Max output tokens per call type. Includes the (low) thinking/reasoning tokens both
   * models spend, plus headroom for Tamil/Hindi, which use more tokens per word.
   */
  maxOutputTokens: {
    round: 2000,
    judge: 2600,
    hint: 500,
  },
  /** Abort a provider call after this long and fall back. */
  timeoutMs: 30_000,
  /** Total time for one request across retries + fallback (route maxDuration is 60s). */
  totalBudgetMs: 56_000,
  /** Max time we'll wait to honour a Gemini retry-after before falling back. */
  maxRetryWaitMs: 10_000,
  /** Per-IP rate limit on AI routes (best-effort, in-memory). */
  rateLimit: { maxCalls: 60, windowMs: 60 * 60 * 1000 },
  /** Hints allowed per debate. */
  maxHints: 2,
} as const;

/** Vercel Hobby allows up to 60s for serverless functions. */
export const AI_ROUTE_MAX_DURATION = 60;

/** Treat empty or placeholder keys as missing. */
export function isRealKey(key: string | undefined | null): key is string {
  return !!key && key.trim().length > 10 && !key.startsWith("PASTE_");
}

/** Mock mode only in development — always off in production builds. */
export function isMockMode(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MOCK_AI === "true";
}
