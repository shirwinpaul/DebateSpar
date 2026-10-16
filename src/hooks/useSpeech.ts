"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* Minimal typings for the Web Speech API (not in TypeScript's DOM lib everywhere). */
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noopSubscribe = () => () => {};
/** Feature detection that is safe during SSR/hydration. */
function useSupported(check: () => boolean): boolean {
  return useSyncExternalStore(noopSubscribe, check, () => false);
}

/**
 * Voice input. `onText(full)` is called with the base text plus the live transcript so the
 * user sees words appear and can edit before submitting.
 */
export function useSpeechRecognition(lang: string, onText: (text: string) => void) {
  const supported = useSupported(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(
    (baseText: string) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;
      const rec = new Ctor();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      let finalText = "";
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript + " ";
          else interim += r[0].transcript;
        }
        const sep = baseText && !baseText.endsWith(" ") ? " " : "";
        onTextRef.current(baseText + sep + (finalText + interim).trimEnd());
      };
      rec.onerror = (e) => setError(e.error === "not-allowed" ? "Microphone access was blocked. Allow it in your browser settings." : "Voice input stopped. Please try again.");
      rec.onend = () => setListening(false);
      recRef.current = rec;
      setError(null);
      try {
        rec.start();
        setListening(true);
      } catch {
        setError("Voice input couldn't start.");
      }
    },
    [lang],
  );

  useEffect(() => () => recRef.current?.stop(), []);

  return { supported, listening, error, start, stop };
}

/** Read-aloud via speechSynthesis. */
export function useSpeechSynthesis() {
  const supported = useSupported(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback((id: string, text: string, lang: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    if (voice) u.voice = voice;
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    synth.speak(u);
  }, []);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return { supported, speakingId, speak, stop };
}
