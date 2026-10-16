"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DebateSettings, Difficulty, Language, Opener, OpponentStyle, SideChoice, TimerSetting } from "@/types/debate";
import { DEFAULT_SETTINGS, DIFFICULTY_LABEL, LANGUAGE_LABEL, MOTION_MAX_CHARS, SIDE_LABEL, STYLE_LABEL, createDebate } from "@/lib/debate";
import { KEYS, load, save } from "@/lib/storage";
import { settingsSchema } from "@/lib/schemas";
import { ChoiceGroup, Toggle } from "./Choice";
import { MotionStep } from "./MotionStep";

const STEPS = ["Motion", "Your side", "Format", "Opponent", "Modes", "Ready"] as const;

/** Returns an error message for the step, or null if it's valid. */
export function validateStep(step: number, s: DebateSettings): string | null {
  if (step === 0) {
    const m = s.motion.trim();
    if (m.length < 10) return "Please enter a motion (at least 10 characters) or pick one from the library.";
    if (m.length > MOTION_MAX_CHARS) return `Motions can be at most ${MOTION_MAX_CHARS} characters.`;
  }
  if (step === 2 && (s.rounds < 2 || s.rounds > 7)) return "Choose between 2 and 7 rounds.";
  return null;
}

function loadSettings(): DebateSettings {
  const parsed = settingsSchema.safeParse(load(KEYS.settings, DEFAULT_SETTINGS));
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export function Wizard() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [s, setS] = useState<DebateSettings>(loadSettings);
  const [step, setStep] = useState<number>(() => Math.min(Math.max(load(KEYS.wizardStep, 0), 0), STEPS.length - 1));
  const [dir, setDir] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const preset = s.rounds === 3 ? "quick" : s.rounds === 5 ? "standard" : "custom";
  const [format, setFormat] = useState<"quick" | "standard" | "custom">(preset);

  useEffect(() => save(KEYS.settings, s), [s]);
  useEffect(() => save(KEYS.wizardStep, step), [step]);

  const update = (patch: Partial<DebateSettings>) => {
    setS((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  function goTo(n: number) {
    setDir(n > step ? 1 : -1);
    setStep(n);
    setError(null);
  }

  function next() {
    const err = validateStep(step, s);
    if (err) return setError(err);
    if (step < STEPS.length - 1) goTo(step + 1);
    else enterArena();
  }

  function enterArena() {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const err = validateStep(i, s);
      if (err) {
        goTo(i);
        setError(err);
        return;
      }
    }
    save(KEYS.current, createDebate({ ...s, motion: s.motion.trim() }));
    save(KEYS.wizardStep, 0);
    router.push("/arena");
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="spotlight min-h-[80vh]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-muted">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-elev-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Setup progress">
            <motion.div className="h-full bg-gold" animate={{ width: `${progress}%` }} transition={{ duration: reduce ? 0 : 0.3 }} />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.section
              key={step}
              custom={dir}
              initial={reduce ? false : { opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.22 }}
              aria-labelledby="step-title"
            >
              <h1 id="step-title" className="mb-4 font-display text-5xl tracking-wide">{STEPS[step]}</h1>

              {step === 0 && <MotionStep motion={s.motion} onChange={(motion, motionFromLibrary) => update({ motion, motionFromLibrary })} />}

              {step === 1 && (
                <ChoiceGroup<SideChoice>
                  label="Which side will you argue?"
                  value={s.sideChoice}
                  onChange={(sideChoice) => update({ sideChoice })}
                  options={[
                    { value: "for", title: "👍 For", desc: "Proposition: you support the motion." },
                    { value: "against", title: "👎 Against", desc: "Opposition: you oppose the motion." },
                    { value: "random", title: "🎲 Random", desc: "Let fate decide when the debate starts." },
                  ]}
                />
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <ChoiceGroup<"quick" | "standard" | "custom">
                    label="How long?"
                    value={format}
                    onChange={(f) => {
                      setFormat(f);
                      if (f === "quick") update({ rounds: 3 });
                      if (f === "standard") update({ rounds: 5 });
                    }}
                    options={[
                      { value: "quick", title: "⚡ Quick Spar", desc: "3 rounds" },
                      { value: "standard", title: "🏛️ Standard", desc: "5 rounds" },
                      { value: "custom", title: "🛠️ Custom", desc: "2 to 7 rounds" },
                    ]}
                  />
                  {format === "custom" && (
                    <div>
                      <label htmlFor="rounds" className="font-semibold">Rounds: <span className="text-gold">{s.rounds}</span></label>
                      <input id="rounds" type="range" min={2} max={7} value={s.rounds} onChange={(e) => update({ rounds: Number(e.target.value) })} className="mt-2 w-full accent-[var(--gold)]" />
                    </div>
                  )}
                  <ChoiceGroup<Opener>
                    label="Who opens?"
                    value={s.opener}
                    columns={2}
                    onChange={(opener) => update({ opener })}
                    options={[
                      { value: "user", title: "🎤 I open" },
                      { value: "ai", title: "🤖 AI opens" },
                    ]}
                  />
                  <ChoiceGroup<TimerSetting>
                    label="Turn timer"
                    value={s.timerMinutes}
                    columns={4}
                    onChange={(timerMinutes) => update({ timerMinutes })}
                    options={[
                      { value: 0, title: "Off" },
                      { value: 1, title: "1 min" },
                      { value: 2, title: "2 min" },
                      { value: 3, title: "3 min" },
                    ]}
                  />
                  <p className="text-sm text-muted">Each speech can be up to 400 words. If the timer runs out you can still submit, but the judge will know you ran over.</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <ChoiceGroup<Difficulty>
                    label="Difficulty"
                    value={s.difficulty}
                    onChange={(difficulty) => update({ difficulty })}
                    options={[
                      { value: "beginner", title: DIFFICULTY_LABEL.beginner, desc: "Simple arguments that leave openings." },
                      { value: "intermediate", title: DIFFICULTY_LABEL.intermediate, desc: "A solid, balanced opponent." },
                      { value: "champion", title: DIFFICULTY_LABEL.champion, desc: "Sharp rebuttals that see your counters coming." },
                    ]}
                  />
                  <ChoiceGroup<OpponentStyle>
                    label="Opponent style"
                    value={s.style}
                    columns={4}
                    onChange={(style) => update({ style })}
                    options={[
                      { value: "professor", title: STYLE_LABEL.professor, desc: "Logical and structured." },
                      { value: "challenger", title: STYLE_LABEL.challenger, desc: "Aggressive but respectful. Presses weak points." },
                      { value: "diplomat", title: STYLE_LABEL.diplomat, desc: "Calm. Finds common ground, then strikes." },
                      { value: "wit", title: STYLE_LABEL.wit, desc: "Light humour, still sharp." },
                    ]}
                  />
                  <ChoiceGroup<Language>
                    label="Debate language"
                    value={s.language}
                    onChange={(language) => update({ language })}
                    options={(Object.keys(LANGUAGE_LABEL) as Language[]).map((l) => ({ value: l, title: LANGUAGE_LABEL[l] }))}
                  />
                  <p className="text-sm text-muted">The AI speaks and judges in this language. The app&apos;s menus stay in English.</p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <Toggle checked={s.coachMode} onChange={(coachMode) => update({ coachMode })} title="🧑‍🏫 Coach Mode" desc="Get a short tip after each of your speeches." />
                  <Toggle checked={s.fallacyHunt} onChange={(fallacyHunt) => update({ fallacyHunt })} title="🕵️ Fallacy Hunt" desc="In some rounds the AI slips in one logical fallacy. Call it out correctly for bonus points." />
                </div>
              )}

              {step === 5 && (
                <dl className="card divide-y divide-line">
                  {[
                    ["Motion", s.motion, 0],
                    ["Your side", s.sideChoice === "random" ? "🎲 Random" : SIDE_LABEL[s.sideChoice], 1],
                    ["Format", `${s.rounds} rounds · ${s.opener === "user" ? "You open" : "AI opens"} · Timer: ${s.timerMinutes ? `${s.timerMinutes} min` : "Off"}`, 2],
                    ["Opponent", `${DIFFICULTY_LABEL[s.difficulty]} · ${STYLE_LABEL[s.style]} · ${LANGUAGE_LABEL[s.language]}`, 3],
                    ["Modes", [s.coachMode && "🧑‍🏫 Coach Mode", s.fallacyHunt && "🕵️ Fallacy Hunt"].filter(Boolean).join(" · ") || "None", 4],
                  ].map(([k, v, n]) => (
                    <div key={k as string} className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <dt className="text-sm text-muted">{k}</dt>
                        <dd className="font-semibold">{v}</dd>
                      </div>
                      <button type="button" className="text-sm text-prop underline" onClick={() => goTo(n as number)}>
                        Edit<span className="sr-only"> {k}</span>
                      </button>
                    </div>
                  ))}
                </dl>
              )}
            </motion.section>
          </AnimatePresence>

          <p role="alert" className="mt-4 min-h-6 text-opp">{error}</p>

          <div className="mt-2 flex justify-between gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => goTo(step - 1)} disabled={step === 0}>← Back</button>
            <button type="submit" className="btn btn-gold px-6">{step === STEPS.length - 1 ? "⚔️ Enter the Arena" : "Next →"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
