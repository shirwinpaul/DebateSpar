"use client";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsDialog } from "./SettingsDialog";
import { GavelIcon } from "./illustrations";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl tracking-wider sm:text-3xl">
          <GavelIcon className="h-7 w-7" />
          Debate<span className="text-gold">Dojo</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/progress" className="btn btn-ghost px-3 text-sm" aria-label="My Progress">
            <span aria-hidden>📈</span><span className="hidden sm:inline">My Progress</span>
          </Link>
          <button type="button" className="btn btn-ghost px-3" onClick={() => setOpen(true)} aria-label="Settings">⚙️</button>
          <ThemeToggle />
        </div>
      </nav>
      <SettingsDialog open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
