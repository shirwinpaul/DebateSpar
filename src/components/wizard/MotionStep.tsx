"use client";
import { useMemo, useState } from "react";
import { MOTIONS, randomMotion } from "@/data/motions";
import { MOTION_CATEGORIES, type MotionCategory, type MotionDifficulty } from "@/types/debate";
import { MOTION_MAX_CHARS } from "@/lib/debate";

export function MotionStep({ motion, onChange }: { motion: string; onChange: (text: string, fromLibrary: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<MotionCategory | "all">("all");
  const [diff, setDiff] = useState<MotionDifficulty | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOTIONS.filter(
      (m) => (cat === "all" || m.category === cat) && (diff === "all" || m.difficulty === diff) && (!q || m.text.toLowerCase().includes(q)),
    );
  }, [query, cat, diff]);

  const diffColor: Record<MotionDifficulty, string> = { Beginner: "text-green-700 dark:text-green-400", Intermediate: "text-gold", Advanced: "text-opp" };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="motion" className="block font-semibold">Type your own motion</label>
        <input
          id="motion"
          className="input mt-2 text-lg"
          maxLength={MOTION_MAX_CHARS}
          value={motion}
          onChange={(e) => onChange(e.target.value, false)}
          placeholder="This House believes…"
          aria-describedby="motion-count"
        />
        <p id="motion-count" className="mt-1 text-right text-xs text-muted">{motion.length}/{MOTION_MAX_CHARS}</p>
      </div>

      <div className="flex items-center gap-3 text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" /> or pick from the Motion Library <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <label className="sr-only" htmlFor="m-search">Search motions</label>
        <input id="m-search" type="search" className="input" placeholder="🔍 Search motions" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="sr-only" htmlFor="m-cat">Category</label>
        <select id="m-cat" className="input" value={cat} onChange={(e) => setCat(e.target.value as MotionCategory | "all")}>
          <option value="all">All categories</option>
          {MOTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="sr-only" htmlFor="m-diff">Difficulty</label>
        <select id="m-diff" className="input" value={diff} onChange={(e) => setDiff(e.target.value as MotionDifficulty | "all")}>
          <option value="all">All levels</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onChange(randomMotion(filtered.length ? filtered : MOTIONS).text, true)}
        >
          🎲 Random motion
        </button>
      </div>

      <ul className="max-h-80 space-y-2 overflow-y-auto pr-1" aria-label="Motion library">
        {filtered.length === 0 && <li className="text-muted">No motions match. Try another search.</li>}
        {filtered.map((m) => {
          const selected = m.text === motion;
          return (
            <li key={m.text}>
              <button
                type="button"
                onClick={() => onChange(m.text, true)}
                aria-pressed={selected}
                className={`card w-full p-3 text-left transition ${selected ? "border-gold ring-2 ring-gold" : "hover:border-gold/60"}`}
              >
                <span className="block font-medium">{m.text}</span>
                <span className="mt-1 block text-xs text-muted">
                  {m.category} · <span className={diffColor[m.difficulty]}>{m.difficulty}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
