"use client";
import type { ApiErrorKind } from "@/lib/ai/route";
import { useCountdown } from "@/hooks/useCountdown";

export interface ArenaError {
  kind: ApiErrorKind;
  message: string;
  retryAfter?: number;
  /** Unique per occurrence so the countdown restarts. */
  at: number;
}

/** Friendly error with a live countdown for per-minute limits. The user's text is never touched. */
export function ErrorBanner({ error, onRetry, onDismiss }: { error: ArenaError; onRetry: () => void; onDismiss: () => void }) {
  const wait = error.kind === "rate_limit" || error.kind === "too_many_requests" ? error.retryAfter ?? 30 : 0;
  const left = useCountdown(wait, wait > 0, error.at);
  const daily = error.kind === "daily_quota";
  return (
    <div role="alert" className="card border-opp/60 bg-opp/10 p-4">
      <p className="font-semibold">
        {error.kind === "rate_limit" ? `⏳ The AI judge needs a breather — try again in ${left} seconds.` : `⚠️ ${error.message}`}
      </p>
      {daily && <p className="mt-1 text-sm text-muted">Tip: open ⚙️ Settings (top right) to add your own free Gemini key.</p>}
      <p className="mt-1 text-sm text-muted">Don&apos;t worry, everything you typed is saved.</p>
      <div className="mt-3 flex gap-2">
        {error.kind !== "bad_request" && (
          <button type="button" className="btn btn-gold" onClick={onRetry} disabled={left > 0}>
            {left > 0 ? `Retry in ${left}s` : "🔁 Try again"}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onDismiss}>Dismiss</button>
      </div>
    </div>
  );
}
