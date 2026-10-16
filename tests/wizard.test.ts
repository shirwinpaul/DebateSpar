import { describe, it, expect } from "vitest";
import { validateStep } from "@/components/wizard/Wizard";
import { DEFAULT_SETTINGS, createDebate, pickFallacyRounds } from "@/lib/debate";
import { settingsSchema } from "@/lib/schemas";

describe("setup wizard", () => {
  it("requires a motion of sensible length", () => {
    expect(validateStep(0, { ...DEFAULT_SETTINGS, motion: "" })).toMatch(/motion/);
    expect(validateStep(0, { ...DEFAULT_SETTINGS, motion: "This House would ban homework" })).toBeNull();
  });

  it("limits custom rounds to 2–7", () => {
    expect(validateStep(2, { ...DEFAULT_SETTINGS, rounds: 8 })).not.toBeNull();
    expect(validateStep(2, { ...DEFAULT_SETTINGS, rounds: 7 })).toBeNull();
  });

  it("default settings pass the schema", () => {
    expect(settingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
  });

  it("resolves a random side and picks fallacy rounds when Fallacy Hunt is on", () => {
    const d = createDebate({ ...DEFAULT_SETTINGS, sideChoice: "random", fallacyHunt: true, motion: "x" }, () => 0.9);
    expect(d.userSide).toBe("against");
    expect(d.fallacyRounds.length).toBeGreaterThan(0);
  });

  it("always plants at least one fallacy", () => {
    expect(pickFallacyRounds(3, () => 0.99).length).toBe(1);
  });
});
