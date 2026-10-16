import type { DebateSettings, FallacyType, RankBadge, Round, Side, SkillScores, Winner } from "@/types/debate";
import { SKILLS } from "@/types/debate";
import type { JudgeOutput } from "@/lib/schemas";
import { KEYS, load, save } from "@/lib/storage";

/** A finished debate, stored only in the browser. */
export interface DebateRecord {
  id: string;
  date: string;
  settings: DebateSettings;
  userSide: Side;
  rounds: Round[];
  judge: JudgeOutput;
  overall: number;
  rank: RankBadge;
  winner: Winner;
  endedEarly: boolean;
  fallacyStats: { planted: number; caught: number; wrongCalls: number; missed: FallacyType[] } | null;
}

const MAX_RECORDS = 50;

export function listRecords(): DebateRecord[] {
  const list = load<DebateRecord[]>(KEYS.history, []);
  return Array.isArray(list) ? list : [];
}

export function getRecord(id: string): DebateRecord | undefined {
  return listRecords().find((r) => r.id === id);
}

export function saveRecord(rec: DebateRecord): void {
  const list = listRecords().filter((r) => r.id !== rec.id);
  save(KEYS.history, [rec, ...list].slice(0, MAX_RECORDS));
}

export function deleteRecord(id: string): void {
  save(KEYS.history, listRecords().filter((r) => r.id !== id));
}

export function clearRecords(): void {
  save(KEYS.history, []);
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** Consecutive days (ending today or yesterday) with at least one debate. */
export function computeStreak(dates: string[], today: Date = new Date()): number {
  const days = new Set(dates.map((d) => dayKey(new Date(d))));
  const cursor = new Date(today);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function averageSkills(records: DebateRecord[]): SkillScores | null {
  if (!records.length) return null;
  const out = {} as SkillScores;
  for (const k of SKILLS) out[k] = Math.round((records.reduce((a, r) => a + r.judge.scores[k].score, 0) / records.length) * 10) / 10;
  return out;
}
