"use client";
import { useRef } from "react";
import type { Language } from "@/types/debate";
import { countWords } from "@/lib/words";
import { LANGUAGE_BCP47, SPEECH_MAX_WORDS } from "@/lib/debate";
import { useSpeechRecognition } from "@/hooks/useSpeech";
import { TimerRing } from "./TimerRing";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  language: Language;
  timer: { total: number; left: number } | null;
  hints: { remaining: number; loading: boolean; onHint: () => void };
  onEndEarly: (() => void) | null;
}

export function InputPanel({ value, onChange, onSubmit, disabled, language, timer, hints, onEndEarly }: Props) {
  const words = countWords(value);
  const over = words > SPEECH_MAX_WORDS;
  const voice = useSpeechRecognition(LANGUAGE_BCP47[language], onChange);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = !disabled && words > 0 && !over;

  function submit() {
    if (!canSubmit) return;
    if (voice.listening) voice.stop();
    onSubmit();
  }

  return (
    <div className="no-print sticky bottom-0 z-20 -mx-4 border-t border-line bg-bg/95 px-4 pb-3 pt-3 backdrop-blur">
      <div className="flex items-start gap-3">
        {timer && <TimerRing left={timer.left} total={timer.total} />}
        <div className="flex-1">
          <label htmlFor="speech" className="sr-only">Your speech</label>
          <textarea
            id="speech"
            ref={areaRef}
            lang={language}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl/Cmd + Enter submits; plain Enter adds a new line.
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={4}
            placeholder={disabled ? "Wait for your turn…" : "Make your argument… (Ctrl + Enter to submit)"}
            className="input min-h-28 resize-y text-base leading-relaxed sm:text-lg"
            aria-describedby="word-count"
            disabled={disabled}
          />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span id="word-count" aria-live="polite" className={over ? "font-bold text-opp" : "text-muted"}>
              {words}/{SPEECH_MAX_WORDS} words{over ? ". Please shorten your speech." : ""}
            </span>
            {timer && timer.left === 0 && <span className="text-opp">⏱ Time&apos;s up! You can still submit. The judge will note it.</span>}
            {voice.listening && <span className="text-gold" role="status">🔴 Listening… speak now</span>}
            {voice.error && <span className="text-opp" role="alert">{voice.error}</span>}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {voice.supported ? (
          <button
            type="button"
            className={`btn ${voice.listening ? "btn-gold" : "btn-ghost"}`}
            onClick={() => (voice.listening ? voice.stop() : voice.start(value))}
            disabled={disabled}
            aria-pressed={voice.listening}
          >
            🎤 {voice.listening ? "Stop" : "Voice"}
          </button>
        ) : (
          <span className="text-xs text-muted" title="Voice input works in Google Chrome and Microsoft Edge.">
            🎤 Voice input works in Chrome or Edge
          </span>
        )}
        <button type="button" className="btn btn-ghost" onClick={hints.onHint} disabled={disabled || hints.remaining <= 0 || hints.loading}>
          💡 {hints.loading ? "Thinking…" : `Hint (${hints.remaining} left)`}
        </button>
        {onEndEarly && (
          <button type="button" className="btn btn-ghost" onClick={onEndEarly}>🏳️ End debate early</button>
        )}
        <button type="button" className="btn btn-gold ml-auto px-6" onClick={submit} disabled={!canSubmit}>
          Submit speech ➤
        </button>
      </div>
    </div>
  );
}
