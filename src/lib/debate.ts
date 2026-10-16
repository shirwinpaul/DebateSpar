import type { DebateSettings, DebateState, Difficulty, Language, OpponentStyle, Side } from "@/types/debate";

export const MOTION_MAX_CHARS = 200;
export const SPEECH_MAX_WORDS = 400;

export const DEFAULT_SETTINGS: DebateSettings = {
  motion: "",
  motionFromLibrary: false,
  sideChoice: "for",
  rounds: 3,
  opener: "user",
  timerMinutes: 0,
  difficulty: "intermediate",
  style: "professor",
  language: "en",
  coachMode: true,
  fallacyHunt: false,
};

export const SIDE_LABEL: Record<Side, string> = { for: "Proposition (For)", against: "Opposition (Against)" };
export const SIDE_SHORT: Record<Side, string> = { for: "Proposition", against: "Opposition" };
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { beginner: "🟢 Beginner", intermediate: "🟡 Intermediate", champion: "🔴 Champion" };
export const STYLE_LABEL: Record<OpponentStyle, string> = {
  professor: "🎓 The Professor",
  challenger: "🔥 The Challenger",
  diplomat: "🕊️ The Diplomat",
  wit: "😄 The Wit",
};
export const LANGUAGE_LABEL: Record<Language, string> = { en: "English", ta: "Tamil (தமிழ்)", hi: "Hindi (हिन्दी)" };
/** BCP-47 tags for speech recognition / synthesis. */
export const LANGUAGE_BCP47: Record<Language, string> = { en: "en-US", ta: "ta-IN", hi: "hi-IN" };

export const opposite = (s: Side): Side => (s === "for" ? "against" : "for");

/** Pick the rounds where the AI plants a fallacy: roughly half, always at least one. */
export function pickFallacyRounds(rounds: number, rng: () => number = Math.random): number[] {
  const picked: number[] = [];
  for (let r = 1; r <= rounds; r++) if (rng() < 0.5) picked.push(r);
  if (picked.length === 0) picked.push(1 + Math.floor(rng() * rounds));
  return picked;
}

export function createDebate(settings: DebateSettings, rng: () => number = Math.random): DebateState {
  const userSide: Side = settings.sideChoice === "random" ? (rng() < 0.5 ? "for" : "against") : settings.sideChoice;
  return {
    id: `${Date.now().toString(36)}-${Math.floor(rng() * 1e6).toString(36)}`,
    createdAt: new Date().toISOString(),
    settings,
    userSide,
    rounds: [],
    fallacyRounds: settings.fallacyHunt ? pickFallacyRounds(settings.rounds, rng) : [],
    hintsUsed: 0,
    hints: [],
    status: "active",
  };
}

/** Rounds where the user actually gave a speech. */
export function completedUserRounds(d: DebateState): number {
  return d.rounds.filter((r) => r.userSpeech).length;
}
