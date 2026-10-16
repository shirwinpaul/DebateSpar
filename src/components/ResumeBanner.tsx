"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { KEYS } from "@/lib/storage";

const noop = () => () => {};
function hasActiveDebate(): boolean {
  try {
    const raw = localStorage.getItem(KEYS.current);
    return !!raw && JSON.parse(raw).status !== "done";
  } catch {
    return false;
  }
}

/** "Resume your debate?" prompt when a debate in progress is saved. */
export function ResumeBanner() {
  const active = useSyncExternalStore(noop, hasActiveDebate, () => false);
  if (!active) return null;
  return (
    <div className="card mt-5 flex flex-wrap items-center gap-3 border-gold/60 p-3" role="status">
      <span>⏸️ You have a debate in progress. Resume your debate?</span>
      <Link href="/arena" className="btn btn-gold">Resume</Link>
    </div>
  );
}
