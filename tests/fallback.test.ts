import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { generateJSON, extractJson, finalError } from "@/lib/ai/orchestrator";
import { AIError, classifyHttpError, parseRetryAfter } from "@/lib/ai/errors";
import type { Provider } from "@/lib/ai/providers";
import { AI_CONFIG } from "@/config/ai";

const schema = z.object({ answer: z.string() });
const opts = { system: "sys", buildPrompt: vi.fn((level: string) => `prompt-${level}`), schema, maxTokens: 100 };

function provider(name: "gemini" | "groq", ...results: (string | AIError)[]): Provider & { call: ReturnType<typeof vi.fn> } {
  const call = vi.fn();
  for (const r of results) call.mockImplementationOnce(async () => (r instanceof AIError ? Promise.reject(r) : r));
  return { name, call };
}

const quiet = { log: () => {} };

describe("AI fallback and retries (mocked providers)", () => {
  it("returns Gemini's answer when it works", async () => {
    const gemini = provider("gemini", '{"answer":"hi"}');
    const groq = provider("groq");
    expect(await generateJSON(opts, { gemini, groq, ...quiet })).toEqual({ answer: "hi" });
    expect(groq.call).not.toHaveBeenCalled();
  });

  it("on 429 waits retry-after (≤10s) and retries Gemini once", async () => {
    const gemini = provider("gemini", new AIError("rate_limit", "gemini", 429, 4), '{"answer":"second"}');
    const sleep = vi.fn(async () => {});
    expect(await generateJSON(opts, { gemini, sleep, ...quiet })).toEqual({ answer: "second" });
    expect(sleep).toHaveBeenCalledWith(4000);
    expect(gemini.call).toHaveBeenCalledTimes(2);
  });

  it("falls back to Groq straight away when retry-after is too long", async () => {
    const gemini = provider("gemini", new AIError("rate_limit", "gemini", 429, 45));
    const groq = provider("groq", '{"answer":"groq"}');
    const sleep = vi.fn(async () => {});
    expect(await generateJSON(opts, { gemini, groq, sleep, ...quiet })).toEqual({ answer: "groq" });
    expect(sleep).not.toHaveBeenCalled();
    expect(gemini.call).toHaveBeenCalledTimes(1);
  });

  it("retries Gemini only once after 429, then falls back", async () => {
    const gemini = provider("gemini", new AIError("rate_limit", "gemini", 429, 2), new AIError("rate_limit", "gemini", 429, 2));
    const groq = provider("groq", '{"answer":"groq"}');
    expect(await generateJSON(opts, { gemini, groq, sleep: async () => {}, ...quiet })).toEqual({ answer: "groq" });
    expect(gemini.call).toHaveBeenCalledTimes(2);
  });

  it("falls back on 5xx, timeout and daily quota", async () => {
    for (const kind of ["server", "timeout", "daily_quota"] as const) {
      const gemini = provider("gemini", new AIError(kind, "gemini", 500));
      const groq = provider("groq", '{"answer":"ok"}');
      expect(await generateJSON(opts, { gemini, groq, ...quiet })).toEqual({ answer: "ok" });
    }
  });

  it("retries once with the validation error appended, then falls back on invalid JSON", async () => {
    const gemini = provider("gemini", "not json", '{"wrong":1}');
    const groq = provider("groq", '{"answer":"groq"}');
    expect(await generateJSON(opts, { gemini, groq, ...quiet })).toEqual({ answer: "groq" });
    expect(gemini.call).toHaveBeenCalledTimes(2);
    expect(gemini.call.mock.calls[1][0].prompt).toContain("YOUR PREVIOUS REPLY WAS INVALID");
  });

  it("trims context for Groq when the request won't fit its TPM limit", async () => {
    const big = { ...opts, buildPrompt: (level: string) => (level === "full" ? "x".repeat(AI_CONFIG.groq.tokensPerMinute * 4) : "short") };
    const groq = provider("groq", '{"answer":"ok"}');
    await generateJSON(big, { groq, ...quiet });
    expect(groq.call.mock.calls[0][0].prompt).toBe("short");
  });

  it("surfaces a rate-limit error with a countdown when every provider is limited", async () => {
    const gemini = provider("gemini", new AIError("rate_limit", "gemini", 429, 40));
    const groq = provider("groq", new AIError("rate_limit", "groq", 429, 20));
    await expect(generateJSON(opts, { gemini, groq, ...quiet })).rejects.toMatchObject({ kind: "rate_limit", retryAfter: 20 });
  });

  it("reports not_configured when no keys are set", async () => {
    await expect(generateJSON(opts, quiet)).rejects.toMatchObject({ kind: "not_configured" });
  });

  it("never logs prompt content or keys", async () => {
    const log = vi.fn();
    const gemini = provider("gemini", new AIError("server", "gemini", 503));
    const groq = provider("groq", '{"answer":"ok"}');
    await generateJSON({ ...opts, buildPrompt: () => "SECRET SPEECH" }, { gemini, groq, log });
    expect(JSON.stringify(log.mock.calls)).not.toContain("SECRET SPEECH");
    expect(log.mock.calls[0][0]).toEqual({ provider: "gemini", status: 503, type: "server", retryAfter: null });
  });
});

describe("error helpers", () => {
  it("parses retry-after values", () => {
    expect(parseRetryAfter("17s")).toBe(17);
    expect(parseRetryAfter("2.5")).toBe(3);
    expect(parseRetryAfter(null)).toBeUndefined();
  });
  it("separates per-minute and daily 429s", () => {
    expect(classifyHttpError("groq", 429, "Rate limit reached on tokens per minute (TPM)").kind).toBe("rate_limit");
    expect(classifyHttpError("groq", 429, "Rate limit reached on requests per day (RPD)").kind).toBe("daily_quota");
    expect(classifyHttpError("gemini", 429, 'quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier"').kind).toBe("daily_quota");
    expect(classifyHttpError("gemini", 503, "").kind).toBe("server");
  });
  it("prefers daily quota message when nothing is rate limited", () => {
    expect(finalError([new AIError("daily_quota", "gemini"), new AIError("server", "groq")], true).kind).toBe("daily_quota");
  });
  it("extracts JSON from fenced replies", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Sure! {"a":2} hope that helps')).toEqual({ a: 2 });
  });
});
