export const FALLACY_TYPES = [
  "strawman",
  "ad hominem",
  "slippery slope",
  "false dilemma",
  "hasty generalisation",
  "appeal to emotion",
  "red herring",
  "circular reasoning",
  "bandwagon",
  "appeal to authority",
] as const;
export type FallacyType = (typeof FALLACY_TYPES)[number];

export type Side = "for" | "against";
export type SideChoice = Side | "random";
export type Difficulty = "beginner" | "intermediate" | "champion";
export type OpponentStyle = "professor" | "challenger" | "diplomat" | "wit";
export type Language = "en" | "ta" | "hi";
export type Opener = "user" | "ai";
export type TimerSetting = 0 | 1 | 2 | 3;
export type MotionDifficulty = "Beginner" | "Intermediate" | "Advanced";

export const MOTION_CATEGORIES = [
  "Education",
  "Technology & AI",
  "Environment",
  "Society",
  "Economics",
  "Health",
  "Sports",
  "Ethics",
  "Fun & Light-hearted",
] as const;
export type MotionCategory = (typeof MOTION_CATEGORIES)[number];

export interface Motion {
  text: string;
  category: MotionCategory;
  difficulty: MotionDifficulty;
}

/** Choices made in the setup wizard. */
export interface DebateSettings {
  motion: string;
  motionFromLibrary: boolean;
  sideChoice: SideChoice;
  rounds: number;
  opener: Opener;
  timerMinutes: TimerSetting;
  difficulty: Difficulty;
  style: OpponentStyle;
  language: Language;
  coachMode: boolean;
  fallacyHunt: boolean;
}

export interface RoundScore {
  logic: number;
  evidence: number;
  rebuttal: number;
  clarity: number;
  fallaciesDetected: { type: string; quote: string }[];
  strongestLine: string | null;
  coachTip: string;
}

export interface FallacyCallout {
  guess: FallacyType;
  correct: boolean;
  actual: FallacyType | null;
}

/** One round = one user speech and one AI speech (order depends on who opens). */
export interface Round {
  number: number;
  userSpeech?: string;
  userOverTime?: boolean;
  aiSpeech?: string;
  aiPoints?: string[];
  includedFallacy?: { type: FallacyType; quote: string } | null;
  callout?: FallacyCallout;
  userScore?: RoundScore | null;
}

export interface DebateState {
  id: string;
  createdAt: string;
  settings: DebateSettings;
  /** Resolved side (random already picked). */
  userSide: Side;
  rounds: Round[];
  /** Round numbers in which the AI is asked to plant a fallacy (Fallacy Hunt). */
  fallacyRounds: number[];
  hintsUsed: number;
  hints: string[];
  status: "active" | "judging" | "done";
}

export interface SkillScores {
  logic: number;
  evidence: number;
  rebuttal: number;
  clarity: number;
  persuasion: number;
  structure: number;
}
export const SKILLS: (keyof SkillScores)[] = ["logic", "evidence", "rebuttal", "clarity", "persuasion", "structure"];

export type Winner = "user" | "ai" | "draw";
export type RankBadge = "Novice" | "Debater" | "Orator" | "Champion";
