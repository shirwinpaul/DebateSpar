import type { RoundRequest } from "@/lib/schemas";
import { DEFAULT_SETTINGS } from "@/lib/debate";

/** Fake data only. */
export const validRound = {
  motionSafety: { allowed: true },
  aiSpeech: "Homework builds discipline, and my opponent ignores that.",
  aiSpeechPoints: ["Discipline", "Practice"],
  includedFallacy: { type: "Straw man", quote: "my opponent ignores that" },
  userRoundScore: {
    logic: 7,
    evidence: 5,
    rebuttal: 6,
    clarity: 8,
    fallaciesDetected: [{ type: "hasty generalisation", quote: "everyone hates homework" }],
    strongestLine: "Rest matters as much as practice.",
    coachTip: "Give one concrete example.",
  },
};

export const validJudge = {
  winner: "draw",
  verdictReason: "Both sides made strong points.",
  scores: {
    logic: { score: 7, reason: "ok" },
    evidence: { score: 6, reason: "ok" },
    rebuttal: { score: 7, reason: "ok" },
    clarity: { score: 8, reason: "ok" },
    persuasion: { score: 6, reason: "ok" },
    structure: { score: 7, reason: "ok" },
  },
  bestMoment: { round: 1, quote: "Rest matters", whyItWorked: "Clear." },
  weakestMoment: { round: 2, quote: "Everyone agrees", whatToDoInstead: "Give a reason." },
  missedArguments: ["Point A", "Point B"],
  fallacySummary: [],
  tips: ["Tip 1", "Tip 2", "Tip 3"],
  judgeComment: "Good effort.",
};

export function roundReq(over: Partial<RoundRequest> = {}): RoundRequest {
  return {
    settings: { ...DEFAULT_SETTINGS, motion: "This House would abolish homework in primary schools", motionFromLibrary: true },
    userSide: "for",
    rounds: [],
    roundNumber: 1,
    userSpeech: "Children need rest. Homework steals family time.",
    plantFallacy: false,
    ...over,
  };
}
