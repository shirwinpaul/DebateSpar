"use client";
import type { ApiResult } from "@/lib/ai/route";
import { KEYS, loadString } from "@/lib/storage";

/** POST to one of our AI routes. Adds the user's own Gemini key (BYOK) if they saved one. Never throws. */
export async function callApi<T>(path: "/api/round" | "/api/judge" | "/api/hint", body: unknown): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const byok = loadString(KEYS.byok);
  if (byok) headers["x-gemini-key"] = byok;
  try {
    const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => null)) as ApiResult<T> | null;
    if (json && typeof json === "object" && "ok" in json) return json;
    return { ok: false, error: { kind: "unknown", message: "The server sent an unexpected reply. Please try again." } };
  } catch {
    return { ok: false, error: { kind: "unknown", message: "Network problem. Check your connection and try again. Your speech is safe." } };
  }
}
