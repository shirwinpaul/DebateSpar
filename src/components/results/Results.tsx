"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { animate, motion, useReducedMotion } from "framer-motion";
import { SKILLS } from "@/types/debate";
import { getRecord, listRecords, type DebateRecord } from "@/lib/history";
import { rankFor, roundAverage } from "@/lib/scoring";
import { DIFFICULTY_LABEL, LANGUAGE_LABEL, SIDE_LABEL, STYLE_LABEL, opposite } from "@/lib/debate";
import { startDebateFrom } from "@/lib/session";
import { ScoreLine, SkillRadar } from "@/components/charts";
import { TrophyIcon } from "@/components/illustrations";

function loadRecord(): DebateRecord | null {
  const id = new URLSearchParams(window.location.search).get("id");
  return (id ? getRecord(id) : listRecords()[0]) ?? null;
}

function AnimatedNumber({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) return;
    const c = animate(0, value, { duration: 1.4, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => c.stop();
  }, [value, reduce]);
  return <span>{reduce ? value : shown}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 font-display text-3xl tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

export function Results() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [rec] = useState<DebateRecord | null>(loadRecord);

  // Confetti when the user wins (skipped for reduced motion).
  useEffect(() => {
    if (!rec || rec.winner !== "user" || reduce) return;
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.3 }, colors: ["#f5c542", "#4aa5ff", "#ff5c77"] });
    });
    return () => {
      cancelled = true;
    };
  }, [rec, reduce]);

  // The report includes the full transcript: open collapsed sections before printing.
  useEffect(() => {
    const open = () => document.querySelectorAll("details").forEach((d) => (d.open = true));
    window.addEventListener("beforeprint", open);
    return () => window.removeEventListener("beforeprint", open);
  }, []);

  if (!rec) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-5xl">No results yet</h1>
        <p className="mt-2 text-muted">Finish a debate to see your verdict here.</p>
        <Link href="/setup" className="btn btn-gold mt-6">⚔️ Start a debate</Link>
      </div>
    );
  }

  const s = rec.settings;
  const j = rec.judge;
  const rank = rankFor(rec.overall);
  const lang = s.language;
  const banner = {
    user: { text: "🏆 You win!", cls: "from-gold/30 to-transparent text-gold" },
    ai: { text: "🤖 The AI wins this one", cls: "from-opp/25 to-transparent text-opp" },
    draw: { text: "🤝 It's a draw", cls: "from-prop/25 to-transparent text-prop" },
  }[rec.winner];
  const radar = SKILLS.map((k) => ({ skill: k, score: j.scores[k].score }));
  const perRound = rec.rounds.filter((r) => r.userScore).map((r) => ({ label: `R${r.number}`, value: Math.round(roundAverage(r.userScore!) * 10) / 10 }));

  function rematch(switchSides: boolean) {
    const sideChoice = switchSides ? opposite(rec!.userSide) : rec!.userSide;
    startDebateFrom({ ...s, sideChoice });
    router.push("/arena");
  }

  return (
    <div className="spotlight">
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
        {/* Print header */}
        <div className="print-only">
          <h1 className="text-2xl font-bold">DebateDojo: Debate Report</h1>
          <p>{new Date(rec.date).toLocaleString()}</p>
        </div>

        <motion.header
          initial={reduce ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card overflow-hidden bg-gradient-to-b p-6 text-center ${banner.cls}`}
        >
          <TrophyIcon className="mx-auto h-14 w-14" />
          <h1 className="mt-2 font-display text-5xl tracking-wide sm:text-6xl">{banner.text}</h1>
          <p className="mt-1 text-fg">“{s.motion}”</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-fg">
            <div>
              <p className="text-sm text-muted">Overall score</p>
              <p className="font-display text-7xl leading-none"><AnimatedNumber value={rec.overall} /><span className="text-3xl text-muted">/100</span></p>
            </div>
            <motion.div
              initial={reduce ? false : { scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 220, damping: 12 }}
              className="rounded-2xl border-2 border-gold bg-elev px-5 py-3"
            >
              <p className="text-4xl" aria-hidden>{rank.emoji}</p>
              <p className="font-display text-3xl tracking-wide">{rank.badge}</p>
            </motion.div>
          </div>
          {rec.endedEarly && <p className="mt-3 text-sm text-muted">Debate ended early. Judged on completed rounds.</p>}
        </motion.header>

        <div className="no-print flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-gold" onClick={() => rematch(false)}>🔁 Rematch</button>
          <button type="button" className="btn btn-ghost" onClick={() => rematch(true)}>🔄 Switch sides</button>
          <Link href="/setup" className="btn btn-ghost" onClick={() => localStorage.setItem("dd.wizardStep", "0")}>🆕 New debate</Link>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>📄 Download report</button>
        </div>

        <Section title="Settings">
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            <li><b>Your side:</b> {SIDE_LABEL[rec.userSide]}</li>
            <li><b>Rounds:</b> {rec.rounds.filter((r) => r.userSpeech).length} of {s.rounds}</li>
            <li><b>Opponent:</b> {DIFFICULTY_LABEL[s.difficulty]} · {STYLE_LABEL[s.style]}</li>
            <li><b>Language:</b> {LANGUAGE_LABEL[s.language]}</li>
            <li><b>Modes:</b> {[s.coachMode && "Coach Mode", s.fallacyHunt && "Fallacy Hunt"].filter(Boolean).join(", ") || "None"}</li>
            <li><b>Timer:</b> {s.timerMinutes ? `${s.timerMinutes} min` : "Off"}</li>
          </ul>
        </Section>

        <Section title="⚖️ Verdict">
          <p lang={lang}>{j.verdictReason}</p>
        </Section>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="card p-5"><SkillRadar data={radar} title="Your six skills (0–10)" /></section>
          <section className="card p-5">
            {perRound.length > 0 ? <ScoreLine data={perRound} title="Score per round (0–10)" yMax={10} unit="Round score" /> : <p className="text-muted">No per-round scores.</p>}
          </section>
        </div>

        <Section title="📊 Score breakdown">
          <ul className="space-y-2">
            {SKILLS.map((k) => (
              <li key={k} className="flex gap-3">
                <span className="w-24 shrink-0 font-semibold capitalize">{k}</span>
                <span className="w-12 shrink-0 font-bold text-gold">{j.scores[k].score}/10</span>
                <span className="text-muted" lang={lang}>{j.scores[k].reason}</span>
              </li>
            ))}
          </ul>
        </Section>

        <div className="grid gap-5 md:grid-cols-2">
          <Section title="🌟 Best moment">
            <p className="text-sm text-muted">Round {j.bestMoment.round}</p>
            <blockquote className="my-2 border-l-4 border-gold pl-3 italic" lang={lang}>“{j.bestMoment.quote}”</blockquote>
            <p lang={lang}>{j.bestMoment.whyItWorked}</p>
          </Section>
          <Section title="🔧 Weakest moment">
            <p className="text-sm text-muted">Round {j.weakestMoment.round}</p>
            <blockquote className="my-2 border-l-4 border-opp pl-3 italic" lang={lang}>“{j.weakestMoment.quote}”</blockquote>
            <p lang={lang}><b>Try instead:</b> {j.weakestMoment.whatToDoInstead}</p>
          </Section>
        </div>

        <Section title="💭 Missed arguments">
          <ul className="list-disc space-y-1 pl-5" lang={lang}>{j.missedArguments.map((a) => <li key={a}>{a}</li>)}</ul>
        </Section>

        <Section title="🧩 Fallacies">
          {j.fallacySummary.length ? (
            <ul className="space-y-2" lang={lang}>
              {j.fallacySummary.map((f) => <li key={f.type + f.explanation}><b className="capitalize">{f.type}:</b> {f.explanation}</li>)}
            </ul>
          ) : (
            <p className="text-muted">No fallacies spotted in your speeches. Nice and clean!</p>
          )}
        </Section>

        {rec.fallacyStats && (
          <Section title="🕵️ Fallacy Hunt">
            <p>
              You caught <b className="text-gold">{rec.fallacyStats.caught}</b> of <b>{rec.fallacyStats.planted}</b> planted fallacies
              {rec.fallacyStats.wrongCalls ? `, with ${rec.fallacyStats.wrongCalls} wrong call(s)` : ""}. Bonus: +{Math.min(rec.fallacyStats.caught * 3, 9)} points.
            </p>
            {rec.fallacyStats.missed.length > 0 && <p className="mt-1 text-muted">Missed: <span className="capitalize">{rec.fallacyStats.missed.join(", ")}</span></p>}
          </Section>
        )}

        <Section title="🎯 3 tips">
          <ol className="list-decimal space-y-1 pl-5" lang={lang}>{j.tips.map((t) => <li key={t}>{t}</li>)}</ol>
        </Section>

        <Section title="🧑‍⚖️ Judge's comment">
          <p lang={lang}>{j.judgeComment}</p>
        </Section>

        <section className="card p-5">
          <details open={false} className="group">
            <summary className="cursor-pointer font-display text-3xl tracking-wide">📜 Full transcript</summary>
            <ol className="mt-4 space-y-4">
              {rec.rounds.map((r) => {
                const user = r.userSpeech && (
                  <div key="u" className={`border-l-4 pl-3 ${rec.userSide === "for" ? "border-prop" : "border-opp"}`}>
                    <p className="text-sm font-bold">🎤 You{r.userOverTime ? " (over time)" : ""}</p>
                    <p className="whitespace-pre-wrap" lang={lang}>{r.userSpeech}</p>
                  </div>
                );
                const ai = r.aiSpeech && (
                  <div key="a" className={`border-l-4 pl-3 ${rec.userSide === "for" ? "border-opp" : "border-prop"}`}>
                    <p className="text-sm font-bold">🤖 AI Opponent</p>
                    <p className="whitespace-pre-wrap" lang={lang}>{r.aiSpeech}</p>
                    {r.aiPoints && <p className="mt-1 text-xs text-muted" lang={lang}>Main points: {r.aiPoints.join(" · ")}</p>}
                  </div>
                );
                return (
                  <li key={r.number} className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-gold">Round {r.number}</p>
                    {s.opener === "user" ? [user, ai] : [ai, user]}
                  </li>
                );
              })}
            </ol>
          </details>
        </section>
      </div>
    </div>
  );
}
