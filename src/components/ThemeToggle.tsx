"use client";
import { useSyncExternalStore } from "react";
import { KEYS, saveString } from "@/lib/storage";

// The <html> class (set before paint) is the source of truth for the theme.
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const isLight = () => document.documentElement.classList.contains("light");

export function ThemeToggle() {
  const light = useSyncExternalStore(subscribe, isLight, () => false);
  function toggle() {
    const next = !light;
    document.documentElement.classList.toggle("light", next);
    document.documentElement.classList.toggle("dark", !next);
    saveString(KEYS.theme, next ? "light" : "dark");
    listeners.forEach((l) => l());
  }
  return (
    <button type="button" onClick={toggle} className="btn btn-ghost px-3" aria-label={light ? "Switch to dark mode" : "Switch to light mode"} title="Toggle theme">
      <span aria-hidden>{light ? "🌙" : "☀️"}</span>
    </button>
  );
}
