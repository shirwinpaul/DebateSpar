import { AI_CONFIG } from "@/config/ai";
import {
  hintOutputSchema,
  judgeOutputSchema,
  roundOutputSchema,
  type HintRequest,
  type JudgeOutput,
  type JudgeRequest,
  type RoundOutput,
  type RoundRequest,
} from "@/lib/schemas";
import { SPEECH_MAX_WORDS } from "@/lib/debate";
import { randomFallacy } from "@/lib/scoring";
import { enforceWordCap } from "@/lib/words";
import type { FallacyType } from "@/types/debate";
import { generateJSON, type Deps } from "./orchestrator";
import { mockHint, mockJudge, mockRound } from "./mock";
import { AI_WORD_CAP, buildHintPrompt, buildHintSystem, buildJudgePrompt, buildJudgeSystem, buildRoundPrompt, buildRoundSystem } from "./prompts";

/** Enforce the 400-word limit on every user speech server-side, whatever the client sent. */
function capUserSpeeches<T extends { rounds: { userSpeech?: string }[] }>(req: T): T {
  return { ...req, rounds: req.rounds.map((r) => (r.userSpeech ? { ...r, userSpeech: enforceWordCap(r.userSpeech, SPEECH_MAX_WORDS) } : r)) };
}

/** Clean up AI output: word cap, and strip fields that shouldn't be set this round. */
export function postProcessRound(out: RoundOutput, req: RoundRequest, fallacy: FallacyType | null): RoundOutput {
  // Allow 20% slack over the difficulty cap before truncating.
  const cap = Math.round(AI_WORD_CAP[req.settings.difficulty] * 1.2);
  const safetyChecked = req.roundNumber === 1 && !req.settings.motionFromLibrary;
  return {
    ...out,
    aiSpeech: enforceWordCap(out.aiSpeech, cap),
    motionSafety: safetyChecked ? out.motionSafety : { allowed: true },
    includedFallacy: fallacy ? out.includedFallacy : null,
    userRoundScore: req.userSpeech ? out.userRoundScore : null,
  };
}

export async function runRound(input: RoundRequest, deps: Deps | "mock", rng: () => number = Math.random): Promise<RoundOutput> {
  const req = capUserSpeeches({ ...input, userSpeech: input.userSpeech ? enforceWordCap(input.userSpeech, SPEECH_MAX_WORDS) : undefined });
  const fallacy = req.plantFallacy && req.settings.fallacyHunt ? randomFallacy(rng) : null;
  const out =
    deps === "mock"
      ? await mockRound(req, fallacy)
      : await generateJSON(
          { system: buildRoundSystem(req, fallacy), buildPrompt: (l) => buildRoundPrompt(req, l), schema: roundOutputSchema, maxTokens: AI_CONFIG.maxOutputTokens.round },
          deps,
        );
  return postProcessRound(out, req, fallacy);
}

/** The judge must score the final speech itself when no round call came after it (AI-opens format). */
export function needsFinalScore(req: JudgeRequest): boolean {
  const last = [...req.rounds].reverse().find((r) => r.userSpeech);
  return !!last && !last.userScore;
}

export async function runJudge(input: JudgeRequest, deps: Deps | "mock"): Promise<JudgeOutput> {
  const req = capUserSpeeches(input);
  const final = needsFinalScore(req);
  if (deps === "mock") return mockJudge(req, final);
  return generateJSON(
    { system: buildJudgeSystem(req, final), buildPrompt: (l) => buildJudgePrompt(req, l), schema: judgeOutputSchema, maxTokens: AI_CONFIG.maxOutputTokens.judge },
    deps,
  );
}

export async function runHint(input: HintRequest, deps: Deps | "mock"): Promise<{ hint: string }> {
  const req = capUserSpeeches(input);
  if (deps === "mock") return mockHint(req);
  const out = await generateJSON(
    { system: buildHintSystem(req), buildPrompt: (l) => buildHintPrompt(req, l), schema: hintOutputSchema, maxTokens: AI_CONFIG.maxOutputTokens.hint },
    deps,
  );
  return { hint: enforceWordCap(out.hint, 50) };
}
