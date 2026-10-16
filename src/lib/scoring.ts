import type { FallacyCallout, FallacyType, RankBadge, RoundScore, SkillScores } from "@/types/debate";
import { FALLACY_TYPES, SKILLS } from "@/types/debate";

/**
 * Overall score formula (0–100), computed in CODE, never by the AI:
 *   base    = (0.7 × average of the 6 judge skill scores + 0.3 × average per-round score) × 10
 *   penalty = 2 points per speech that ran over the timer, capped at 6
 *   bonus   = 3 points per correct Fallacy Hunt call-out, capped at 9 (wrong calls cost nothing)
 *   overall = clamp(round(base − penalty + bonus), 0, 100)
 * A per-round score is the mean of logic, evidence, rebuttal and clarity for that speech.
 */
export const SCORING = { skillWeight: 0.7, roundWeight: 0.3, overrunPenalty: 2, maxPenalty: 6, calloutBonus: 3, maxBonus: 9 } as const;

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function roundAverage(s: Pick<RoundScore, "logic" | "evidence" | "rebuttal" | "clarity">): number {
  return mean([s.logic, s.evidence, s.rebuttal, s.clarity]);
}

export interface OverallInput {
  skills: SkillScores;
  roundScores: RoundScore[];
  overruns: number;
  correctCallouts: number;
}

export function computeOverall({ skills, roundScores, overruns, correctCallouts }: OverallInput): number {
  const skillAvg = mean(SKILLS.map((k) => clamp(skills[k], 0, 10)));
  const roundAvg = roundScores.length ? mean(roundScores.map(roundAverage)) : skillAvg;
  const base = (SCORING.skillWeight * skillAvg + SCORING.roundWeight * roundAvg) * 10;
  const penalty = Math.min(overruns * SCORING.overrunPenalty, SCORING.maxPenalty);
  const bonus = Math.min(correctCallouts * SCORING.calloutBonus, SCORING.maxBonus);
  return clamp(Math.round(base - penalty + bonus), 0, 100);
}

export const RANKS: { min: number; badge: RankBadge; emoji: string }[] = [
  { min: 80, badge: "Champion", emoji: "🏆" },
  { min: 60, badge: "Orator", emoji: "🥇" },
  { min: 40, badge: "Debater", emoji: "🥈" },
  { min: 0, badge: "Novice", emoji: "🥉" },
];

export function rankFor(overall: number): { badge: RankBadge; emoji: string } {
  const r = RANKS.find((x) => overall >= x.min) ?? RANKS[RANKS.length - 1];
  return { badge: r.badge, emoji: r.emoji };
}

/** Check a Fallacy Hunt call-out against the fallacy the AI reported in its round JSON. */
export function checkCallout(guess: FallacyType, included: { type: FallacyType } | null | undefined): FallacyCallout {
  const actual = included?.type ?? null;
  return { guess, actual, correct: actual !== null && actual === guess };
}

export function randomFallacy(rng: () => number = Math.random): FallacyType {
  return FALLACY_TYPES[Math.floor(rng() * FALLACY_TYPES.length)];
}
