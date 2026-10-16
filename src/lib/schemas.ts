import { z } from "zod";
import { FALLACY_TYPES } from "@/types/debate";

/* ---------- Shared pieces ---------- */

const lower = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase().replace(/[-_]/g, " ") : v);
/** Accept "Strawman" / "ad-hominem" etc. and normalise to our fallacy list. */
export const fallacyTypeSchema = z.preprocess((v) => {
  const s = lower(v);
  if (s === "straw man") return "strawman";
  if (s === "hasty generalization") return "hasty generalisation";
  return s;
}, z.enum(FALLACY_TYPES));

const score10 = z.number().min(0).max(10);
const shortText = (max: number) => z.string().trim().max(max);

/* ---------- Settings (wizard / API input) ---------- */

export const settingsSchema = z.object({
  motion: z.string().max(200),
  motionFromLibrary: z.boolean(),
  sideChoice: z.enum(["for", "against", "random"]),
  rounds: z.number().int().min(2).max(7),
  opener: z.enum(["user", "ai"]),
  timerMinutes: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  difficulty: z.enum(["beginner", "intermediate", "champion"]),
  style: z.enum(["professor", "challenger", "diplomat", "wit"]),
  language: z.enum(["en", "ta", "hi"]),
  coachMode: z.boolean(),
  fallacyHunt: z.boolean(),
});

/* ---------- AI output: round call ---------- */

export const roundScoreSchema = z.object({
  logic: score10,
  evidence: score10,
  rebuttal: score10,
  clarity: score10,
  fallaciesDetected: z.array(z.object({ type: shortText(60), quote: shortText(400) })).max(5).default([]),
  strongestLine: shortText(400).nullable().default(null),
  coachTip: shortText(400).default(""),
});

export const roundOutputSchema = z.object({
  motionSafety: z
    .object({
      allowed: z.boolean(),
      reason: z.string().nullish(),
      suggestedMotion: z.string().nullish(),
    })
    .default({ allowed: true }),
  aiSpeech: z.string().trim().min(1).max(6000),
  aiSpeechPoints: z.array(shortText(120)).min(1).max(3),
  includedFallacy: z.object({ type: fallacyTypeSchema, quote: shortText(400) }).nullable().default(null),
  userRoundScore: roundScoreSchema.nullable().default(null),
});
export type RoundOutput = z.infer<typeof roundOutputSchema>;

/* ---------- AI output: final judging call ---------- */

const scored = z.object({ score: score10, reason: shortText(300) });

export const judgeOutputSchema = z.object({
  winner: z.enum(["user", "ai", "draw"]),
  verdictReason: shortText(800),
  scores: z.object({
    logic: scored,
    evidence: scored,
    rebuttal: scored,
    clarity: scored,
    persuasion: scored,
    structure: scored,
  }),
  bestMoment: z.object({ round: z.number().int().min(1), quote: shortText(500), whyItWorked: shortText(400) }),
  weakestMoment: z.object({ round: z.number().int().min(1), quote: shortText(500), whatToDoInstead: shortText(400) }),
  missedArguments: z.array(shortText(300)).min(2).max(5).transform((a) => a.slice(0, 3)),
  fallacySummary: z.array(z.object({ type: shortText(60), explanation: shortText(300) })).max(6).default([]),
  tips: z.array(shortText(300)).length(3),
  judgeComment: shortText(1200),
  /** Score for the user's final speech when no round call scored it (AI-opens format). */
  finalUserRoundScore: roundScoreSchema.nullish(),
});
export type JudgeOutput = z.infer<typeof judgeOutputSchema>;

/* ---------- AI output: hint ---------- */

export const hintOutputSchema = z.object({ hint: z.string().trim().min(1).max(400) });

/* ---------- API inputs ---------- */

const speech = z.string().max(5000); // 400 words ≈ 2.5k chars; generous headroom for Tamil/Hindi
const roundInput = z.object({
  number: z.number().int().min(1).max(7),
  userSpeech: speech.optional(),
  userOverTime: z.boolean().optional(),
  aiSpeech: z.string().max(6000).optional(),
  aiPoints: z.array(z.string().max(120)).max(3).optional(),
  userScore: roundScoreSchema.nullish(),
});
export type RoundInput = z.infer<typeof roundInput>;

const debateContext = z.object({
  settings: settingsSchema.extend({ motion: z.string().trim().min(3).max(200) }),
  userSide: z.enum(["for", "against"]),
  rounds: z.array(roundInput).max(7),
});

export const roundRequestSchema = debateContext.extend({
  roundNumber: z.number().int().min(1).max(7),
  /** The user's latest speech (absent when the AI opens round 1). */
  userSpeech: speech.optional(),
  userOverTime: z.boolean().optional(),
  plantFallacy: z.boolean(),
});
export type RoundRequest = z.infer<typeof roundRequestSchema>;

export const judgeRequestSchema = debateContext.extend({ endedEarly: z.boolean() });
export type JudgeRequest = z.infer<typeof judgeRequestSchema>;

export const hintRequestSchema = debateContext;
export type HintRequest = z.infer<typeof hintRequestSchema>;
