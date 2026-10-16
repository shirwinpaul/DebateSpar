import { describe, it, expect, vi, afterEach } from "vitest";
import { isRealKey, isMockMode, AI_CONFIG } from "@/config/ai";

describe("AI config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("treats placeholders and empty values as missing keys", () => {
    expect(isRealKey("PASTE_YOUR_GEMINI_KEY_HERE")).toBe(false);
    expect(isRealKey("")).toBe(false);
    expect(isRealKey(undefined)).toBe(false);
    expect(isRealKey("AIzaFakeKeyForTests1234567")).toBe(true);
  });

  it("mock mode only works outside production", () => {
    vi.stubEnv("MOCK_AI", "true");
    vi.stubEnv("NODE_ENV", "development");
    expect(isMockMode()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(isMockMode()).toBe(false);
  });

  it("keeps all model IDs in one config", () => {
    expect(AI_CONFIG.gemini.model).toMatch(/gemini/);
    expect(AI_CONFIG.groq.model.length).toBeGreaterThan(0);
  });
});
