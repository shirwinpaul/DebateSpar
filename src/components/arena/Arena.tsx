"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DebateState, FallacyType } from "@/types/debate";
import type { HintRequest, JudgeOutput, RoundOutput } from "@/lib/schemas";
import { AI_CONFIG } from "@/config/ai";
import { KEYS, load, loadString, remove, save, saveString } from "@/lib/storage";
import { callApi } from "@/lib/api";
import { LANGUAGE_BCP47, createDebate, opposite } from "@/lib/debate";
import { DRAFT_KEY } from "@/lib/session";
import { addUserSpeech, applyRoundOutput, buildHintRequest, buildJudgeRequest, buildRoundRequest, canEndEarly, currentRoundNumber, nextTurn } from "@/lib/engine";
import { checkCallout } from "@/lib/scoring";
import { buildRecord } from "@/lib/finalize";
import { saveRecord } from "@/lib/history";
import { useCountdown } from "@/hooks/useCountdown";
import { useSpeechSynthesis } from "@/hooks/useSpeech";
import { Modal } from "@/components/Modal";
import { GavelIcon } from "@/components/illustrations";
import { Podiums } from "./Podiums";
import { SpeechCard } from "./SpeechCard";
import { InputPanel } from "./InputPanel";
import { ErrorBanner, type ArenaError } from "./ErrorBanner";

type Busy = null | "ai" | "judge" | "hint";
type PendingAction = "ai" | "judge" | "hint";

function loadDebate(): DebateState | null {
  const d = load<DebateState | null>(KEYS.current, null);
  return d && d.status !== "done" && Array.isArray(d.rounds) ? d : null;
}

export function Arena() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [debate, setDebate] = useState<DebateState | null>(loadDebate);
  const [draft, setDraft] = useState(() => loadString(DRAFT_KEY));
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<(ArenaError & { action: PendingAction }) | null>(null);
  const [unsafe, setUnsafe] = useState<{ reason: string; suggested?: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [banner, setBanner] = useState<number | null>(() => (loadDebate()?.rounds.length ? null : 1));
  const [typewriterFor, setTypewriterFor] = useState<number | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const inFlight = useRef(false);
  const feedEnd = useRef<HTMLDivElement>(null);
  const tts = useSpeechSynthesis();

  // Autosave so a refresh never loses the debate or the typed speech.
  useEffect(() => {
    if (debate) save(KEYS.current, debate);
  }, [debate]);
  useEffect(() => saveString(DRAFT_KEY, draft), [draft]);

  useEffect(() => {
    if (banner === null) return;
    const t = setTimeout(() => setBanner(null), reduce ? 400 : 1300);
    return () => clearTimeout(t);
  }, [banner, reduce]);

  const roundsLen = debate?.rounds.length ?? 0;
  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [roundsLen, busy, reduce]);

  const turn = debate ? nextTurn(debate) : "user";
  const timerTotal = (debate?.settings.timerMinutes ?? 0) * 60;
  const turnKey = `${debate?.id}-${roundsLen}-${turn}`;
  const timeLeft = useCountdown(timerTotal, turn === "user" && timerTotal > 0 && !busy, turnKey);

  /* ---------------- AI actions (one user action = one call, guarded against duplicates) ---------------- */

  const fail = (e: { kind: ArenaError["kind"]; message: string; retryAfter?: number }, action: PendingAction) =>
    setError({ ...e, at: Date.now(), action });

  const runJudge = useCallback(
    async (d: DebateState, endedEarly: boolean) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setBusy("judge");
      setError(null);
      const res = await callApi<JudgeOutput>("/api/judge", buildJudgeRequest(d, endedEarly));
      inFlight.current = false;
      setBusy(null);
      if (!res.ok) return fail(res.error, "judge");
      const record = buildRecord(d, res.data, endedEarly);
      saveRecord(record);
      remove(KEYS.current);
      remove(DRAFT_KEY);
      router.push(`/results?id=${encodeURIComponent(record.id)}`);
    },
    [router],
  );

  const runRound = useCallback(
    async (d: DebateState) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setBusy("ai");
      setError(null);
      setHint(null);
      const res = await callApi<RoundOutput>("/api/round", buildRoundRequest(d));
      inFlight.current = false;
      setBusy(null);
      if (!res.ok) return fail(res.error, "ai");
      if (!res.data.motionSafety.allowed) {
        setUnsafe({ reason: res.data.motionSafety.reason || "This motion isn't one we can debate.", suggested: res.data.motionSafety.suggestedMotion || undefined });
        return;
      }
      const next = applyRoundOutput(d, res.data);
      setDebate(next);
      // The new AI speech is always in the last round.
      setTypewriterFor(next.rounds.length);
      setLiveMessage(`AI opponent says: ${res.data.aiSpeech}`);
      const t = nextTurn(next);
      if (t === "user" && next.settings.opener === "ai") setBanner(next.rounds.length);
      if (t === "user" && next.settings.opener === "user") setBanner(next.rounds.length + 1);
    },
    [],
  );

  // AI opens: start round 1 automatically once (ref-guarded so React StrictMode can't double-call).
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!debate || autoStarted.current) return;
    if (debate.settings.opener !== "ai" || debate.rounds.length !== 0) return;
    // Deferred + cancelled on cleanup, so StrictMode's mount/unmount/mount still makes exactly one call.
    const t = setTimeout(() => {
      autoStarted.current = true;
      void runRound(debate);
    }, 0);
    return () => clearTimeout(t);
  }, [debate, runRound]);

  function submitSpeech() {
    if (!debate || turn !== "user" || busy) return;
    const overTime = timerTotal > 0 && timeLeft === 0;
    const next = addUserSpeech(debate, draft, overTime);
    setDebate(next);
    setDraft("");
    setLiveMessage("Your speech was submitted.");
    if (nextTurn(next) === "judge") void runJudge(next, false);
    else void runRound(next);
  }

  async function getHint() {
    if (!debate || debate.hintsUsed >= AI_CONFIG.maxHints || inFlight.current) return;
    inFlight.current = true;
    setBusy("hint");
    setError(null);
    const res = await callApi<{ hint: string }>("/api/hint", buildHintRequest(debate) satisfies HintRequest);
    inFlight.current = false;
    setBusy(null);
    if (!res.ok) return fail(res.error, "hint");
    setHint(res.data.hint);
    setDebate({ ...debate, hintsUsed: debate.hintsUsed + 1, hints: [...debate.hints, res.data.hint] });
  }

  function retry() {
    if (!debate || !error) return;
    const action = error.action;
    setError(null);
    if (action === "hint") void getHint();
    else if (action === "judge") void runJudge(debate, nextTurn(debate) !== "judge");
    else void runRound(debate);
  }

  function callFallacy(roundIdx: number, guess: FallacyType) {
    if (!debate) return;
    const rounds = debate.rounds.slice();
    const r = rounds[roundIdx];
    if (r.callout) return;
    rounds[roundIdx] = { ...r, callout: checkCallout(guess, r.includedFallacy) };
    setDebate({ ...debate, rounds });
  }

  function restartWith(motionText: string) {
    if (!debate) return;
    const settings = { ...debate.settings, motion: motionText, motionFromLibrary: false };
    save(KEYS.settings, settings);
    const fresh = createDebate(settings);
    autoStarted.current = false;
    setUnsafe(null);
    setDebate(fresh);
    setBanner(1);
  }

  /* ---------------- Render ---------------- */

  if (!debate) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <GavelIcon className="mx-auto h-16 w-16" />
        <h1 className="mt-4 font-display text-5xl">No debate in progress</h1>
        <p className="mt-2 text-muted">Set up a new debate to enter the arena.</p>
        <Link href="/setup" className="btn btn-gold mt-6">⚔️ Start a debate</Link>
      </div>
    );
  }

  const s = debate.settings;
  const aiSide = opposite(debate.userSide);
  const roundNo = currentRoundNumber(debate);
  const lang = LANGUAGE_BCP47[s.language];

  // Flatten rounds into speeches in the order they were given.
  const speeches = debate.rounds.flatMap((r, idx) => {
    const user = r.userSpeech
      ? [<SpeechCard key={`u${r.number}`} speaker="user" side={debate.userSide} round={r.number} text={r.userSpeech} language={s.language} overTime={r.userOverTime}
          coachTip={s.coachMode ? r.userScore?.coachTip : null} />]
      : [];
    const ai = r.aiSpeech
      ? [<SpeechCard key={`a${r.number}`} speaker="ai" side={aiSide} round={r.number} text={r.aiSpeech} language={s.language} points={r.aiPoints}
          typewriter={typewriterFor === r.number}
          readAloud={{ supported: tts.supported, speaking: tts.speakingId === `a${r.number}`, onToggle: () => (tts.speakingId === `a${r.number}` ? tts.stop() : tts.speak(`a${r.number}`, r.aiSpeech!, lang)) }}
          callout={s.fallacyHunt ? { enabled: true, result: r.callout, onCall: (g) => callFallacy(idx, g) } : undefined} />]
      : [];
    return s.opener === "user" ? [...user, ...ai] : [...ai, ...user];
  });

  return (
    <div className="spotlight">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-4xl flex-col px-4">
        {/* Motion pinned at the top */}
        <div className="sticky top-[57px] z-10 -mx-4 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gold">Round {roundNo} of {s.rounds}</p>
            <p className="text-xs text-muted">{s.coachMode && "🧑‍🏫 Coach"} {s.fallacyHunt && "🕵️ Fallacy Hunt"}</p>
          </div>
          <h1 className="font-semibold leading-snug sm:text-lg">“{s.motion}”</h1>
        </div>

        <div className="py-4">
          <Podiums userSide={debate.userSide} style={s.style} turn={busy === "ai" ? "ai" : turn} />
        </div>

        <section aria-label="Debate transcript" className="flex-1 space-y-4 pb-4">
          {speeches.length === 0 && !busy && (
            <p className="card p-6 text-center text-muted">
              {s.opener === "user" ? "🎤 You open the debate. Make your first argument below." : "The AI is about to open…"}
            </p>
          )}
          {speeches}

          {busy === "ai" && (
            <div className="card flex items-center gap-3 p-4" role="status">
              <span className="flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-2.5 w-2.5 rounded-full bg-opp" animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                ))}
              </span>
              Opponent is preparing a rebuttal…
            </div>
          )}

          {hint && (
            <div className="card border-gold/60 p-4" role="status">
              <p className="text-sm font-bold">💡 Hint</p>
              <p lang={s.language}>{hint}</p>
            </div>
          )}

          {error && <ErrorBanner error={error} onRetry={retry} onDismiss={() => setError(null)} />}

          {turn === "ai" && !busy && !error && debate.rounds.length > 0 && (
            <button type="button" className="btn btn-gold" onClick={() => runRound(debate)}>▶️ Continue: get the opponent&apos;s reply</button>
          )}

          {turn === "judge" && !busy && (
            <div className="card p-5 text-center">
              <p className="font-display text-3xl">All rounds complete!</p>
              <button type="button" className="btn btn-gold mt-3 px-6" onClick={() => runJudge(debate, false)}>⚖️ Hear the verdict</button>
            </div>
          )}
          <div ref={feedEnd} />
        </section>

        {turn === "user" && (
          <InputPanel
            value={draft}
            onChange={setDraft}
            onSubmit={submitSpeech}
            disabled={!!busy}
            language={s.language}
            timer={timerTotal ? { total: timerTotal, left: timeLeft } : null}
            hints={{ remaining: AI_CONFIG.maxHints - debate.hintsUsed, loading: busy === "hint", onHint: getHint }}
            onEndEarly={canEndEarly(debate) ? () => setConfirmEnd(true) : null}
          />
        )}
        {turn !== "user" && canEndEarly(debate) && turn !== "judge" && !busy && (
          <div className="pb-4">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmEnd(true)}>🏳️ End debate early</button>
          </div>
        )}
      </div>

      {/* Screen-reader announcement of new speeches (the visible card types out). */}
      <p className="sr-only" aria-live="polite">{liveMessage}</p>

      {/* Round transition */}
      <AnimatePresence>
        {banner !== null && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          >
            <motion.span
              className="font-display text-8xl tracking-widest text-gold drop-shadow-[0_0_30px_rgba(0,0,0,0.6)] sm:text-9xl"
              initial={reduce ? false : { scale: 0.5, letterSpacing: "0.5em" }}
              animate={{ scale: 1, letterSpacing: "0.1em" }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
            >
              ROUND {banner}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Judging overlay */}
      {busy === "judge" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/90 backdrop-blur" role="status">
          <motion.div animate={reduce ? undefined : { rotate: [0, -25, 0] }} transition={{ repeat: Infinity, duration: 0.9 }}>
            <GavelIcon className="h-20 w-20" />
          </motion.div>
          <p className="mt-4 font-display text-4xl">The judge is deliberating…</p>
        </div>
      )}

      <Modal open={confirmEnd} onClose={() => setConfirmEnd(false)} title="End debate early?">
        <p className="text-muted">The judge will score the rounds you&apos;ve completed so far.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn btn-gold" onClick={() => { setConfirmEnd(false); void runJudge(debate, true); }}>🏳️ Yes, go to judging</button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmEnd(false)}>Keep debating</button>
        </div>
      </Modal>

      <Modal open={!!unsafe} onClose={() => router.push("/setup")} title="Let's pick another motion">
        <p>🙏 {unsafe?.reason}</p>
        {unsafe?.suggested && (
          <p className="mt-3 text-muted">How about: <span className="font-semibold text-fg">“{unsafe.suggested}”</span></p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {unsafe?.suggested && (
            <button type="button" className="btn btn-gold" onClick={() => restartWith(unsafe.suggested!)}>Use this motion</button>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => { save(KEYS.wizardStep, 0); remove(KEYS.current); router.push("/setup"); }}>Back to setup</button>
        </div>
      </Modal>
    </div>
  );
}
