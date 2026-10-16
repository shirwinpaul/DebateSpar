"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FallacyCallout, FallacyType, Language, Side } from "@/types/debate";
import { FALLACY_TYPES } from "@/types/debate";
import { useTypewriter } from "@/hooks/useTypewriter";

interface Props {
  speaker: "user" | "ai";
  side: Side;
  round: number;
  text: string;
  language: Language;
  points?: string[];
  overTime?: boolean;
  typewriter?: boolean;
  coachTip?: string | null;
  /** Fallacy Hunt: show the call-out control on AI speeches. */
  callout?: { enabled: boolean; result?: FallacyCallout; onCall: (guess: FallacyType) => void };
  readAloud?: { supported: boolean; speaking: boolean; onToggle: () => void };
}

export function SpeechCard({ speaker, side, round, text, language, points, overTime, typewriter, coachTip, callout, readAloud }: Props) {
  const reduce = useReducedMotion();
  const tw = useTypewriter(text, !!typewriter);
  const tone = side === "for" ? "border-prop" : "border-opp";
  const isUser = speaker === "user";

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`card border-l-4 p-4 sm:p-5 ${tone} ${isUser ? "sm:mr-10" : "sm:ml-10"}`}
      aria-label={`${isUser ? "Your" : "AI opponent's"} speech, round ${round}`}
    >
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">
          {isUser ? "🎤 You" : "🤖 AI Opponent"} · Round {round}
          {overTime && <span className="ml-2 rounded bg-opp/15 px-1.5 py-0.5 text-xs text-opp normal-case">⏱ over time</span>}
        </h3>
        <div className="flex gap-2">
          {!tw.done && (
            <button type="button" onClick={tw.skip} className="btn btn-ghost min-h-9 px-2 py-1 text-xs">Skip ⏭</button>
          )}
          {readAloud?.supported && (
            <button type="button" onClick={readAloud.onToggle} className="btn btn-ghost min-h-9 px-2 py-1 text-xs" aria-pressed={readAloud.speaking}>
              {readAloud.speaking ? "⏹ Stop" : "🔊 Read aloud"}
            </button>
          )}
        </div>
      </header>

      <p lang={language} className="whitespace-pre-wrap text-lg leading-relaxed">
        {tw.visible}
        {!tw.done && <span className="ml-0.5 inline-block h-5 w-2 animate-pulse bg-gold align-middle" aria-hidden />}
      </p>

      {tw.done && points && points.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Main points">
          {points.map((p) => (
            <li key={p} lang={language} className="rounded-full bg-elev-2 px-3 py-1 text-xs font-semibold">{p}</li>
          ))}
        </ul>
      )}

      {coachTip && (
        <p className="mt-3 rounded-lg border border-gold/50 bg-gold/10 p-3 text-sm" lang={language}>
          <span className="font-bold">🧑‍🏫 Coach:</span> {coachTip}
        </p>
      )}

      {callout?.enabled && tw.done && <FallacyCalloutControl result={callout.result} onCall={callout.onCall} />}
    </motion.article>
  );
}

function FallacyCalloutControl({ result, onCall }: { result?: FallacyCallout; onCall: (g: FallacyType) => void }) {
  const [open, setOpen] = useState(false);
  const [guess, setGuess] = useState<FallacyType>(FALLACY_TYPES[0]);

  if (result) {
    return (
      <p role="status" className={`mt-3 rounded-lg p-3 text-sm ${result.correct ? "bg-green-600/15 text-green-700 dark:text-green-300" : "bg-opp/10"}`}>
        {result.correct
          ? `✅ Spot on! That was a ${result.actual} fallacy. +3 bonus points.`
          : result.actual
            ? `❌ Not quite. You said ${result.guess}, but the hidden fallacy was a ${result.actual}.`
            : `❌ No fallacy was planted in this speech. Keep hunting!`}
      </p>
    );
  }
  if (!open) {
    return (
      <button type="button" className="btn btn-ghost mt-3 text-sm" onClick={() => setOpen(true)}>🚩 Call out a fallacy</button>
    );
  }
  return (
    <form
      className="mt-3 flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onCall(guess);
      }}
    >
      <label htmlFor="fallacy-pick" className="text-sm font-semibold">Which fallacy?</label>
      <select id="fallacy-pick" className="input w-auto capitalize" value={guess} onChange={(e) => setGuess(e.target.value as FallacyType)}>
        {FALLACY_TYPES.map((f) => (
          <option key={f} value={f} className="capitalize">{f}</option>
        ))}
      </select>
      <button type="submit" className="btn btn-gold text-sm">🚩 Call it</button>
      <button type="button" className="btn btn-ghost text-sm" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  );
}
