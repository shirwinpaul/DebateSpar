"use client";
import { useState } from "react";
import Link from "next/link";
import { SKILLS } from "@/types/debate";
import { averageSkills, clearRecords, computeStreak, deleteRecord, listRecords, type DebateRecord } from "@/lib/history";
import { DIFFICULTY_LABEL, SIDE_SHORT } from "@/lib/debate";
import { rankFor } from "@/lib/scoring";
import { ScoreLine, SkillBars } from "@/components/charts";
import { Modal } from "@/components/Modal";

const WINNER: Record<DebateRecord["winner"], string> = { user: "🏆 You", ai: "🤖 AI", draw: "🤝 Draw" };

export function ProgressView() {
  const [records, setRecords] = useState<DebateRecord[]>(listRecords);
  const [confirmClear, setConfirmClear] = useState(false);

  const streak = computeStreak(records.map((r) => r.date));
  const avg = averageSkills(records);
  const chronological = [...records].reverse();
  const overTime = chronological.map((r, i) => ({ label: `#${i + 1}`, value: r.overall }));
  const best = records.reduce((m, r) => Math.max(m, r.overall), 0);
  const weakest = avg ? SKILLS.reduce((w, k) => (avg[k] < avg[w] ? k : w), SKILLS[0]) : null;

  function onDelete(id: string) {
    deleteRecord(id);
    setRecords(listRecords());
  }

  return (
    <div className="spotlight">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
        <h1 className="font-display text-5xl tracking-wide">📈 My Progress</h1>

        {records.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-lg">No debates yet. Your history will appear here.</p>
            <p className="mt-1 text-sm text-muted">🔒 Saved only in this browser.</p>
            <Link href="/setup" className="btn btn-gold mt-4">⚔️ Start your first debate</Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card p-5">
                <p className="text-sm text-muted">Streak</p>
                <p className="font-display text-5xl">🔥 {streak} <span className="text-2xl">day{streak === 1 ? "" : "s"}</span></p>
                <p className="text-xs text-muted">Debate on consecutive days to grow it.</p>
              </div>
              <div className="card p-5">
                <p className="text-sm text-muted">Debates</p>
                <p className="font-display text-5xl">{records.length}</p>
                <p className="text-xs text-muted">Wins: {records.filter((r) => r.winner === "user").length}</p>
              </div>
              <div className="card p-5">
                <p className="text-sm text-muted">Best score</p>
                <p className="font-display text-5xl">{best} <span className="text-2xl">{rankFor(best).emoji}</span></p>
                <p className="text-xs text-muted">{rankFor(best).badge}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <section className="card p-5">
                <ScoreLine data={overTime} title="Overall score over time (0–100)" yMax={100} unit="Overall" />
              </section>
              <section className="card p-5">
                {avg && <SkillBars data={SKILLS.map((k) => ({ skill: k, score: avg[k] }))} title="Average per skill (0–10)" />}
                {weakest && <p className="mt-2 text-sm">🎯 Skill to work on: <b className="capitalize text-gold">{weakest}</b></p>}
              </section>
            </div>

            <section className="card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-3xl tracking-wide">Past debates</h2>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setConfirmClear(true)}>🗑️ Clear all</button>
              </div>
              <ul className="divide-y divide-line">
                {records.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{r.settings.motion}</p>
                      <p className="text-xs text-muted">
                        {new Date(r.date).toLocaleDateString()} · {SIDE_SHORT[r.userSide]} · {DIFFICULTY_LABEL[r.settings.difficulty]} · Winner: {WINNER[r.winner]}
                      </p>
                    </div>
                    <span className="font-display text-3xl text-gold">{r.overall}</span>
                    <Link href={`/results?id=${encodeURIComponent(r.id)}`} className="btn btn-ghost text-sm">Open</Link>
                    <button type="button" className="btn btn-ghost text-sm" onClick={() => onDelete(r.id)} aria-label={`Delete debate: ${r.settings.motion}`}>Delete</button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear all history?">
        <p className="text-muted">This permanently deletes every saved debate from this browser.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn btn-gold" onClick={() => { clearRecords(); setRecords([]); setConfirmClear(false); }}>Yes, clear all</button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmClear(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
