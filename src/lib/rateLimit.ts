import { AI_CONFIG } from "@/config/ai";

/**
 * Best-effort per-IP sliding-window rate limit. In-memory, so on serverless each
 * instance keeps its own counts (documented in README).
 */
const hits = new Map<string, number[]>();

export function checkRateLimit(ip: string, now = Date.now()): { ok: true } | { ok: false; retryAfter: number } {
  const { maxCalls, windowMs } = AI_CONFIG.rateLimit;
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= maxCalls) {
    hits.set(ip, recent);
    return { ok: false, retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000) };
  }
  recent.push(now);
  hits.set(ip, recent);
  // Keep memory bounded.
  if (hits.size > 5000) hits.delete(hits.keys().next().value as string);
  return { ok: true };
}

export function resetRateLimit() {
  hits.clear();
}
