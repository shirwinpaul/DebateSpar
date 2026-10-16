import { describe, it, expect } from "vitest";
import { MOTIONS } from "@/data/motions";
import { MOTION_CATEGORIES } from "@/types/debate";

describe("Motion library", () => {
  it("has at least 60 motions", () => {
    expect(MOTIONS.length).toBeGreaterThanOrEqual(60);
  });

  it("covers every category", () => {
    for (const c of MOTION_CATEGORIES) {
      expect(MOTIONS.some((m) => m.category === c)).toBe(true);
    }
  });

  it("has no duplicates", () => {
    const set = new Set(MOTIONS.map((m) => m.text.toLowerCase()));
    expect(set.size).toBe(MOTIONS.length);
  });

  it("uses standard motion formats and the 200-char limit", () => {
    for (const m of MOTIONS) {
      expect(m.text).toMatch(/^This House (believes|would)/);
      expect(m.text.length).toBeLessThanOrEqual(200);
      expect(["Beginner", "Intermediate", "Advanced"]).toContain(m.difficulty);
    }
  });
});
