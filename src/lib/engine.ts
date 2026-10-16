import type { DebateState, Round } from "@/types/debate";
import type { RoundInput, RoundOutput, RoundRequest, JudgeRequest, HintRequest } from "@/lib/schemas";

/**
 * Turn order:
 *  - User opens: each round = user speech → AI call (scores it + replies). AI has the last word.
 *  - AI opens:   each round = AI call (scores previous user speech + speaks) → user speech.
 *                The final user speech is scored by the judge.
 */
export type Turn = "user" | "ai" | "judge";

export function nextTurn(d: DebateState): Turn {
  const total = d.settings.rounds;
  const last = d.rounds[d.rounds.length - 1];
  if (d.settings.opener === "user") {
    if (!last || (last.userSpeech && last.aiSpeech)) return d.rounds.length >= total ? "judge" : "user";
    return last.userSpeech ? "ai" : "user";
  }
  if (!last) return "ai";
  if (last.aiSpeech && !last.userSpeech) return "user";
  return d.rounds.length >= total ? "judge" : "ai";
}

/** The round number currently being played (for "Round 2 of 5"). */
export function currentRoundNumber(d: DebateState): number {
  const turn = nextTurn(d);
  const n = d.rounds.length;
  if (d.settings.opener === "user") return turn === "user" ? Math.min(n + 1, d.settings.rounds) : Math.max(n, 1);
  return turn === "ai" ? Math.min(n + 1, d.settings.rounds) : Math.max(n, 1);
}

export function addUserSpeech(d: DebateState, speech: string, overTime: boolean): DebateState {
  const text = speech.trim();
  if (d.settings.opener === "user") {
    return { ...d, rounds: [...d.rounds, { number: d.rounds.length + 1, userSpeech: text, userOverTime: overTime }] };
  }
  const rounds = d.rounds.slice();
  rounds[rounds.length - 1] = { ...rounds[rounds.length - 1], userSpeech: text, userOverTime: overTime };
  return { ...d, rounds };
}

/** Strip client-only fields to keep request bodies small. */
export function toApiRounds(rounds: Round[]): RoundInput[] {
  return rounds.map((r) => ({
    number: r.number,
    userSpeech: r.userSpeech,
    userOverTime: r.userOverTime,
    aiSpeech: r.aiSpeech,
    aiPoints: r.aiPoints,
    userScore: r.userScore ?? undefined,
  }));
}

function context(d: DebateState) {
  return { settings: d.settings, userSide: d.userSide };
}

/** Build the round request. `rounds` = everything said so far EXCEPT the latest user speech. */
export function buildRoundRequest(d: DebateState): RoundRequest {
  const last = d.rounds[d.rounds.length - 1];
  if (d.settings.opener === "user") {
    return {
      ...context(d),
      rounds: toApiRounds(d.rounds.slice(0, -1)),
      roundNumber: last.number,
      userSpeech: last.userSpeech,
      userOverTime: last.userOverTime,
      plantFallacy: d.fallacyRounds.includes(last.number),
    };
  }
  const roundNumber = d.rounds.length + 1;
  const prior = d.rounds.map((r, i) => (i === d.rounds.length - 1 ? { ...r, userSpeech: undefined, userOverTime: undefined } : r));
  return {
    ...context(d),
    rounds: toApiRounds(prior),
    roundNumber,
    userSpeech: last?.userSpeech,
    userOverTime: last?.userOverTime,
    plantFallacy: d.fallacyRounds.includes(roundNumber),
  };
}

export function applyRoundOutput(d: DebateState, out: RoundOutput): DebateState {
  const ai: Partial<Round> = { aiSpeech: out.aiSpeech, aiPoints: out.aiSpeechPoints, includedFallacy: out.includedFallacy };
  const rounds = d.rounds.slice();
  if (d.settings.opener === "user") {
    rounds[rounds.length - 1] = { ...rounds[rounds.length - 1], ...ai, userScore: out.userRoundScore };
  } else {
    if (rounds.length) rounds[rounds.length - 1] = { ...rounds[rounds.length - 1], userScore: out.userRoundScore };
    rounds.push({ number: rounds.length + 1, ...ai });
  }
  return { ...d, rounds };
}

/** Rounds to send to the judge: only rounds where the user spoke, plus any AI reply in them. */
export function buildJudgeRequest(d: DebateState, endedEarly: boolean): JudgeRequest {
  return { ...context(d), rounds: toApiRounds(d.rounds.filter((r) => r.userSpeech || r.aiSpeech)), endedEarly };
}

export function buildHintRequest(d: DebateState): HintRequest {
  return { ...context(d), rounds: toApiRounds(d.rounds) };
}

export function canEndEarly(d: DebateState): boolean {
  return d.rounds.some((r) => r.userSpeech);
}
