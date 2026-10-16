"use client";
import { useEffect, useState } from "react";

/** Counts down once per second from `seconds` while `active`; restarts when `resetKey` changes. */
export function useCountdown(seconds: number, active: boolean, resetKey: unknown): number {
  const [state, setState] = useState({ key: resetKey, left: seconds });
  // Reset during render when the key changes (avoids an extra effect pass).
  if (state.key !== resetKey) setState({ key: resetKey, left: seconds });

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setState((s) => ({ ...s, left: Math.max(0, s.left - 1) })), 1000);
    return () => clearInterval(id);
  }, [active, resetKey]);

  return state.key === resetKey ? state.left : seconds;
}
