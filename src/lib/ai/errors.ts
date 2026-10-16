export type AIErrorKind =
  | "rate_limit" // per-minute limit
  | "daily_quota"
  | "server" // 5xx
  | "timeout"
  | "invalid_json"
  | "auth" // bad / missing key
  | "not_configured"
  | "unknown";

export class AIError extends Error {
  constructor(
    public kind: AIErrorKind,
    public provider: string,
    public status?: number,
    /** Seconds to wait before retrying, if the provider told us. */
    public retryAfter?: number,
  ) {
    super(`${provider}: ${kind}${status ? ` (${status})` : ""}`);
  }
}

/** Parse "17s", "1.5s", "17" or an HTTP-date into seconds. */
export function parseRetryAfter(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  if (!Number.isNaN(n)) return Math.max(0, Math.ceil(n));
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  return undefined;
}

/** Classify an HTTP error status + message into an AIError. */
export function classifyHttpError(provider: string, status: number, message: string, retryAfter?: number): AIError {
  if (status === 429) {
    // Daily quotas mention "per day", "PerDay", "RPD" or "TPD" in their error details.
    const daily = /per\s?day|perday|\bRPD\b|\bTPD\b|daily/i.test(message);
    return new AIError(daily ? "daily_quota" : "rate_limit", provider, status, retryAfter);
  }
  if (status === 401 || status === 403 || (status === 400 && /api key|API_KEY_INVALID/i.test(message))) {
    return new AIError("auth", provider, status);
  }
  if (status >= 500) return new AIError("server", provider, status);
  return new AIError("unknown", provider, status);
}

/** User-facing messages. Never include provider internals. */
export function userMessage(kind: AIErrorKind, retryAfter?: number): string {
  switch (kind) {
    case "rate_limit":
      return `The AI judge needs a breather — try again in ${retryAfter ?? 30} seconds.`;
    case "daily_quota":
      return "Today's free AI limit is reached. Add your own free Gemini key in Settings, or come back tomorrow.";
    case "not_configured":
      return "The AI isn't set up yet. Add a free Gemini key to .env.local (see README), or paste your own key in Settings.";
    case "auth":
      return "The AI key was rejected. Check the key in .env.local or in Settings.";
    default:
      return "The AI opponent is having trouble right now. Your speech is safe. Please try again in a moment.";
  }
}
