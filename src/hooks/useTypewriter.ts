"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Reveal `text` progressively. Returns the visible text, whether it's done, and a skip function. */
export function useTypewriter(text: string, enabled: boolean, charsPerTick = 3, tickMs = 18) {
  const reduce = useReducedMotion();
  const animate = enabled && !reduce;
  const [state, setState] = useState({ text, shown: animate ? 0 : text.length });
  if (state.text !== text) setState({ text, shown: animate ? 0 : text.length });

  const done = state.shown >= text.length;

  useEffect(() => {
    if (!animate || done) return;
    const id = setInterval(() => setState((s) => ({ ...s, shown: Math.min(s.text.length, s.shown + charsPerTick) })), tickMs);
    return () => clearInterval(id);
  }, [animate, done, charsPerTick, tickMs]);

  return {
    visible: text.slice(0, state.shown),
    done,
    skip: () => setState((s) => ({ ...s, shown: s.text.length })),
  };
}
