import { describe, it, expect } from "vitest";
import { createDebate, DEFAULT_SETTINGS } from "@/lib/debate";
import { addUserSpeech, applyRoundOutput, buildRoundRequest, buildJudgeRequest, nextTurn, currentRoundNumber, canEndEarly } from "@/lib/engine";
import { buildRecord } from "@/lib/finalize";
import { roundRequestSchema, judgeRequestSchema, type RoundOutput, type JudgeOutput } from "@/lib/schemas";
import { checkCallout } from "@/lib/scoring";
import { validJudge } from "./fixtures";

const score = { logic: 6, evidence: 6, rebuttal: 6, clarity: 6, fallaciesDetected: [], strongestLine: null, coachTip: "tip" };
const out = (over: Partial<RoundOutput> = {}): RoundOutput => ({
  motionSafety: { allowed: true },
  aiSpeech: "AI speech",
  aiSpeechPoints: ["p"],
  includedFallacy: null,
  userRoundScore: score,
  ...over,
});

const settings = { ...DEFAULT_SETTINGS, motion: "This House would ban homework", motionFromLibrary: true, rounds: 2 };

describe("turn engine — user opens", () => {
  it("plays user → AI each round, then the judge", () => {
    let d = createDebate(settings, () => 0.1);
    expect(nextTurn(d)).toBe("user");
    expect(canEndEarly(d)).toBe(false);
    d = addUserSpeech(d, "First speech", false);
    expect(nextTurn(d)).toBe("ai");
    const req = buildRoundRequest(d);
    expect(req.roundNumber).toBe(1);
    expect(req.userSpeech).toBe("First speech");
    expect(req.rounds).toHaveLength(0); // the latest speech is not duplicated in the transcript
    expect(roundRequestSchema.safeParse(req).success).toBe(true);
    d = applyRoundOutput(d, out());
    expect(d.rounds[0].userScore?.coachTip).toBe("tip");
    expect(nextTurn(d)).toBe("user");
    expect(currentRoundNumber(d)).toBe(2);
    d = addUserSpeech(d, "Second speech", true);
    d = applyRoundOutput(d, out());
    expect(nextTurn(d)).toBe("judge");
    expect(judgeRequestSchema.safeParse(buildJudgeRequest(d, false)).success).toBe(true);
  });
});

describe("turn engine — AI opens", () => {
  it("plays AI → user each round; the judge scores the last speech", () => {
    let d = createDebate({ ...settings, opener: "ai" }, () => 0.1);
    expect(nextTurn(d)).toBe("ai");
    let req = buildRoundRequest(d);
    expect(req.roundNumber).toBe(1);
    expect(req.userSpeech).toBeUndefined();
    d = applyRoundOutput(d, out({ userRoundScore: null }));
    expect(nextTurn(d)).toBe("user");
    d = addUserSpeech(d, "Reply one", false);
    expect(nextTurn(d)).toBe("ai");
    req = buildRoundRequest(d);
    expect(req.roundNumber).toBe(2);
    expect(req.userSpeech).toBe("Reply one");
    expect(req.rounds[0].userSpeech).toBeUndefined();
    expect(req.rounds[0].aiSpeech).toBe("AI speech");
    d = applyRoundOutput(d, out());
    expect(d.rounds[0].userScore).toEqual(score);
    d = addUserSpeech(d, "Reply two", false);
    expect(nextTurn(d)).toBe("judge");

    const judge: JudgeOutput = { ...(validJudge as JudgeOutput), finalUserRoundScore: { ...score, logic: 9 } };
    const rec = buildRecord(d, judge, false);
    expect(rec.rounds[1].userScore?.logic).toBe(9);
  });
});

describe("record building", () => {
  it("computes overall, rank and Fallacy Hunt stats in code", () => {
    let d = createDebate({ ...settings, fallacyHunt: true }, () => 0.1);
    d = addUserSpeech(d, "One", true);
    d = applyRoundOutput(d, out({ includedFallacy: { type: "strawman", quote: "q" } }));
    d.rounds[0].callout = checkCallout("strawman", d.rounds[0].includedFallacy);
    d = addUserSpeech(d, "Two", false);
    d = applyRoundOutput(d, out({ includedFallacy: { type: "bandwagon", quote: "q" } }));
    const rec = buildRecord(d, validJudge as JudgeOutput, true);
    expect(rec.fallacyStats).toEqual({ planted: 2, caught: 1, wrongCalls: 0, missed: ["bandwagon"] });
    expect(rec.overall).toBeGreaterThan(0);
    expect(rec.overall).toBeLessThanOrEqual(100);
    expect(rec.endedEarly).toBe(true);
    expect(["Novice", "Debater", "Orator", "Champion"]).toContain(rec.rank);
  });

  it("keeps request bodies far below Vercel's 4.5 MB limit even at maximum length", () => {
    let d = createDebate({ ...settings, rounds: 7 }, () => 0.1);
    const longSpeech = "word ".repeat(400);
    for (let i = 0; i < 7; i++) {
      d = addUserSpeech(d, longSpeech, false);
      d = applyRoundOutput(d, out({ aiSpeech: "palabra ".repeat(300), aiSpeechPoints: ["a", "b", "c"] }));
    }
    const bytes = new TextEncoder().encode(JSON.stringify(buildJudgeRequest(d, false))).length;
    expect(bytes).toBeLessThan(64 * 1024);
  });
});
