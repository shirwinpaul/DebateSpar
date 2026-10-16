import { describe, it, expect } from "vitest";
import { computeOverall, rankFor, checkCallout } from "@/lib/scoring";
import type { RoundScore, SkillScores } from "@/types/debate";

const skills = (n: number): SkillScores => ({ logic: n, evidence: n, rebuttal: n, clarity: n, persuasion: n, structure: n });
const round = (n: number): RoundScore => ({ logic: n, evidence: n, rebuttal: n, clarity: n, fallaciesDetected: [], strongestLine: null, coachTip: "" });

describe("overall score formula", () => {
  it("weights skills 70% and rounds 30%", () => {
    expect(computeOverall({ skills: skills(8), roundScores: [round(6)], overruns: 0, correctCallouts: 0 })).toBe(74); // (5.6+1.8)*10
  });

  it("uses skills alone when there are no round scores", () => {
    expect(computeOverall({ skills: skills(7), roundScores: [], overruns: 0, correctCallouts: 0 })).toBe(70);
  });

  it("subtracts 2 per overrun, capped at 6", () => {
    expect(computeOverall({ skills: skills(7), roundScores: [], overruns: 1, correctCallouts: 0 })).toBe(68);
    expect(computeOverall({ skills: skills(7), roundScores: [], overruns: 10, correctCallouts: 0 })).toBe(64);
  });

  it("adds 3 per correct call-out, capped at 9", () => {
    expect(computeOverall({ skills: skills(7), roundScores: [], overruns: 0, correctCallouts: 2 })).toBe(76);
    expect(computeOverall({ skills: skills(7), roundScores: [], overruns: 0, correctCallouts: 5 })).toBe(79);
  });

  it("clamps to 0–100", () => {
    expect(computeOverall({ skills: skills(10), roundScores: [round(10)], overruns: 0, correctCallouts: 3 })).toBe(100);
    expect(computeOverall({ skills: skills(0), roundScores: [round(0)], overruns: 3, correctCallouts: 0 })).toBe(0);
  });
});

describe("rank badges", () => {
  it("uses the documented thresholds", () => {
    expect(rankFor(0).badge).toBe("Novice");
    expect(rankFor(39).badge).toBe("Novice");
    expect(rankFor(40).badge).toBe("Debater");
    expect(rankFor(59).badge).toBe("Debater");
    expect(rankFor(60).badge).toBe("Orator");
    expect(rankFor(79).badge).toBe("Orator");
    expect(rankFor(80).badge).toBe("Champion");
    expect(rankFor(100).emoji).toBe("🏆");
  });
});

describe("Fallacy Hunt call-outs", () => {
  it("correct call-out", () => {
    expect(checkCallout("strawman", { type: "strawman" })).toEqual({ guess: "strawman", actual: "strawman", correct: true });
  });
  it("incorrect call-out", () => {
    expect(checkCallout("bandwagon", { type: "strawman" }).correct).toBe(false);
  });
  it("no fallacy present", () => {
    expect(checkCallout("red herring", null)).toEqual({ guess: "red herring", actual: null, correct: false });
  });
});
