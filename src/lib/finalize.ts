import type { DebateState, FallacyType, RoundScore } from "@/types/debate";
import type { JudgeOutput } from "@/lib/schemas";
import type { DebateRecord } from "@/lib/history";
import { computeOverall, rankFor } from "@/lib/scoring";

/** Turn a judged debate into a stored record. The overall score is computed here, in code. */
export function buildRecord(d: DebateState, judge: JudgeOutput, endedEarly: boolean): DebateRecord {
  const rounds = d.rounds.slice();
  // AI-opens format: attach the judge's score for the final user speech.
  const lastUserIdx = rounds.map((r) => !!r.userSpeech).lastIndexOf(true);
  if (lastUserIdx >= 0 && !rounds[lastUserIdx].userScore && judge.finalUserRoundScore) {
    rounds[lastUserIdx] = { ...rounds[lastUserIdx], userScore: judge.finalUserRoundScore };
  }

  const roundScores = rounds.map((r) => r.userScore).filter((s): s is RoundScore => !!s);
  const overruns = rounds.filter((r) => r.userOverTime).length;
  const planted = rounds.filter((r) => r.includedFallacy);
  const caught = rounds.filter((r) => r.callout?.correct).length;
  const wrongCalls = rounds.filter((r) => r.callout && !r.callout.correct).length;
  const missed = planted.filter((r) => !r.callout?.correct).map((r) => r.includedFallacy!.type as FallacyType);

  const skills = {
    logic: judge.scores.logic.score,
    evidence: judge.scores.evidence.score,
    rebuttal: judge.scores.rebuttal.score,
    clarity: judge.scores.clarity.score,
    persuasion: judge.scores.persuasion.score,
    structure: judge.scores.structure.score,
  };
  const overall = computeOverall({ skills, roundScores, overruns, correctCallouts: caught });

  return {
    id: d.id,
    date: new Date().toISOString(),
    settings: d.settings,
    userSide: d.userSide,
    rounds,
    judge,
    overall,
    rank: rankFor(overall).badge,
    winner: judge.winner,
    endedEarly,
    fallacyStats: d.settings.fallacyHunt ? { planted: planted.length, caught, wrongCalls, missed } : null,
  };
}
