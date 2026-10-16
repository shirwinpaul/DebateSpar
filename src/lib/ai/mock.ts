import type { FallacyType } from "@/types/debate";
import type { HintRequest, JudgeOutput, JudgeRequest, RoundOutput, RoundRequest } from "@/lib/schemas";

/** Development-only canned responses (MOCK_AI=true). Uses no AI quota. */

const FALLACY_LINES: Record<FallacyType, string> = {
  strawman: "My opponent basically wants to throw away every rule we have.",
  "ad hominem": "Frankly, only people who haven't thought about this would say that.",
  "slippery slope": "If we allow this, soon nothing will be off limits at all.",
  "false dilemma": "Either we accept my side completely, or we accept total chaos.",
  "hasty generalisation": "I know two people this went badly for, so it fails for everyone.",
  "appeal to emotion": "Think of how heartbroken everyone would be if we got this wrong.",
  "red herring": "And besides, aren't there bigger problems in the world to worry about?",
  "circular reasoning": "This is the right choice because it is clearly the correct one.",
  bandwagon: "Everyone already agrees with my side, so it must be right.",
  "appeal to authority": "A famous celebrity once said so, which settles it.",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockRound(req: RoundRequest, fallacy: FallacyType | null): Promise<RoundOutput> {
  await sleep(700);
  if (!req.settings.motionFromLibrary && req.roundNumber === 1 && /\b(bomb|weapon|hurt people)\b/i.test(req.settings.motion)) {
    return {
      motionSafety: { allowed: false, reason: "This motion asks for harmful content.", suggestedMotion: "This House would ban the sale of fireworks to the public" },
      aiSpeech: "I'm sorry, I can't debate this motion.",
      aiSpeechPoints: ["Motion declined"],
      includedFallacy: null,
      userRoundScore: null,
    };
  }
  const side = req.userSide === "for" ? "against" : "for";
  const opening = req.userSpeech
    ? `Thank you. My opponent raised some interesting points, but they leave key questions unanswered.`
    : `Good evening. I stand firmly ${side} this motion, and I'll show you why.`;
  const fallacyLine = fallacy ? ` ${FALLACY_LINES[fallacy]}` : "";
  const aiSpeech =
    `${opening} First, consider the practical consequences: many experts argue that changes like this cost more than they deliver. ` +
    `Second, there are fairness concerns we cannot ignore.${fallacyLine} ` +
    `Finally, the burden of proof lies with the other side, and in round ${req.roundNumber} it has not been met.`;
  const n = req.roundNumber;
  return {
    motionSafety: { allowed: true },
    aiSpeech,
    aiSpeechPoints: ["Practical costs", "Fairness concerns", "Burden of proof"],
    includedFallacy: fallacy ? { type: fallacy, quote: FALLACY_LINES[fallacy] } : null,
    userRoundScore: req.userSpeech
      ? {
          logic: 5 + (n % 4),
          evidence: 4 + (n % 3),
          rebuttal: 5 + ((n + 1) % 4),
          clarity: 6 + (n % 3),
          fallaciesDetected: [],
          strongestLine: req.userSpeech.split(/[.!?]/)[0].slice(0, 120) || null,
          coachTip: "Back up your main claim with a concrete, widely known example.",
        }
      : null,
  };
}

export async function mockJudge(req: JudgeRequest, needsFinalScore: boolean): Promise<JudgeOutput> {
  await sleep(900);
  const firstUser = req.rounds.find((r) => r.userSpeech);
  const lastUser = [...req.rounds].reverse().find((r) => r.userSpeech);
  const quote = (t?: string) => (t ?? "").split(/[.!?]/)[0].slice(0, 120);
  return {
    winner: "user",
    verdictReason: "You engaged directly with the opponent's main arguments and closed strongly. The AI's practical-cost case was solid but less well defended in the final rounds.",
    scores: {
      logic: { score: 7, reason: "Clear chain of reasoning in most speeches." },
      evidence: { score: 5, reason: "Several claims needed concrete examples." },
      rebuttal: { score: 7, reason: "You answered the fairness point well." },
      clarity: { score: 8, reason: "Easy to follow, good signposting." },
      persuasion: { score: 6, reason: "Convincing tone; could use a stronger closing image." },
      structure: { score: 7, reason: "Good opening and close; the middle drifted." },
    },
    bestMoment: { round: firstUser?.number ?? 1, quote: quote(firstUser?.userSpeech), whyItWorked: "It framed the debate on your terms early." },
    weakestMoment: { round: lastUser?.number ?? 1, quote: quote(lastUser?.userSpeech), whatToDoInstead: "Name the opponent's argument, then show why it fails." },
    missedArguments: ["Long-term benefits outweigh short-term costs.", "Successful real-world comparisons from other places."],
    fallacySummary: [],
    tips: [
      "Open each rebuttal by naming the exact point you are answering.",
      "Support every key claim with one concrete, well-known example.",
      "Finish with a one-sentence summary of why your side wins.",
    ],
    judgeComment: "A confident performance with real promise. Tighten your evidence and you'll be hard to beat.",
    finalUserRoundScore: needsFinalScore
      ? { logic: 7, evidence: 5, rebuttal: 7, clarity: 7, fallaciesDetected: [], strongestLine: quote(lastUser?.userSpeech) || null, coachTip: "Strong close. Add a concrete example next time." }
      : null,
  };
}

export async function mockHint(req: HintRequest): Promise<{ hint: string }> {
  await sleep(400);
  return {
    hint:
      req.rounds.length === 0
        ? "Open by defining the key term in the motion, so the debate happens on your ground."
        : "Ask who bears the cost of the opponent's plan and whether it is fair to them.",
  };
}
