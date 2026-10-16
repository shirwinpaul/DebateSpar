import { describe, it, expect } from "vitest";
import { computeStreak, averageSkills, type DebateRecord } from "@/lib/history";
import { validJudge } from "./fixtures";
import type { JudgeOutput } from "@/lib/schemas";

const today = new Date(2026, 9, 11, 12);
const daysAgo = (n: number) => new Date(2026, 9, 11 - n, 10).toISOString();

describe("streak counter", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak([daysAgo(0), daysAgo(1), daysAgo(2), daysAgo(4)], today)).toBe(3);
  });
  it("still counts a streak that ended yesterday", () => {
    expect(computeStreak([daysAgo(1), daysAgo(2)], today)).toBe(2);
  });
  it("is 0 after a missed day, and counts multiple debates per day once", () => {
    expect(computeStreak([daysAgo(2)], today)).toBe(0);
    expect(computeStreak([daysAgo(0), daysAgo(0)], today)).toBe(1);
    expect(computeStreak([], today)).toBe(0);
  });
});

describe("average skills", () => {
  it("averages each skill across debates", () => {
    const rec = (n: number) => ({ judge: { ...(validJudge as JudgeOutput), scores: { ...validJudge.scores, logic: { score: n, reason: "" } } } }) as DebateRecord;
    expect(averageSkills([rec(6), rec(9)])?.logic).toBe(7.5);
    expect(averageSkills([])).toBeNull();
  });
});
