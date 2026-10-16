import { describe, it, expect } from "vitest";
import { roundOutputSchema, judgeOutputSchema, hintOutputSchema, roundRequestSchema } from "@/lib/schemas";
import { validRound, validJudge, roundReq } from "./fixtures";

describe("round output schema", () => {
  it("accepts valid output and normalises fallacy names", () => {
    const r = roundOutputSchema.parse(validRound);
    expect(r.includedFallacy?.type).toBe("strawman");
  });

  it("accepts an opening round with no user score", () => {
    expect(roundOutputSchema.safeParse({ ...validRound, userRoundScore: null, includedFallacy: null }).success).toBe(true);
  });

  it("rejects scores out of range", () => {
    const bad = { ...validRound, userRoundScore: { ...validRound.userRoundScore, logic: 11 } };
    expect(roundOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects missing speech, too many points and unknown fallacies", () => {
    expect(roundOutputSchema.safeParse({ ...validRound, aiSpeech: "" }).success).toBe(false);
    expect(roundOutputSchema.safeParse({ ...validRound, aiSpeechPoints: ["a", "b", "c", "d"] }).success).toBe(false);
    expect(roundOutputSchema.safeParse({ ...validRound, includedFallacy: { type: "made up", quote: "x" } }).success).toBe(false);
  });
});

describe("judge output schema", () => {
  it("accepts valid output", () => {
    expect(judgeOutputSchema.safeParse(validJudge).success).toBe(true);
  });

  it("requires exactly 3 tips", () => {
    expect(judgeOutputSchema.safeParse({ ...validJudge, tips: ["a", "b"] }).success).toBe(false);
    expect(judgeOutputSchema.safeParse({ ...validJudge, tips: ["a", "b", "c", "d"] }).success).toBe(false);
  });

  it("rejects an invalid winner or missing scores", () => {
    expect(judgeOutputSchema.safeParse({ ...validJudge, winner: "me" }).success).toBe(false);
    const { scores: _scores, ...noScores } = validJudge;
    void _scores;
    expect(judgeOutputSchema.safeParse(noScores).success).toBe(false);
  });

  it("does not let the AI set the overall score", () => {
    const parsed = judgeOutputSchema.parse({ ...validJudge, overall: 100 });
    expect("overall" in parsed).toBe(false);
  });
});

describe("request schemas", () => {
  it("accepts a valid round request and rejects a bad one", () => {
    expect(roundRequestSchema.safeParse(roundReq()).success).toBe(true);
    expect(roundRequestSchema.safeParse({ ...roundReq(), roundNumber: 9 }).success).toBe(false);
    expect(roundRequestSchema.safeParse({ ...roundReq(), userSpeech: "x".repeat(6000) }).success).toBe(false);
  });

  it("hint output must be non-empty", () => {
    expect(hintOutputSchema.safeParse({ hint: "" }).success).toBe(false);
  });
});
