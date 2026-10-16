"use client";

/** Circular countdown. Turns crimson in the last 15s and shows "Time!" at zero. */
export function TimerRing({ left, total }: { left: number; total: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const frac = total ? left / total : 0;
  const low = left <= 15;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="relative h-14 w-14 shrink-0" role="timer" aria-label={left ? `${mm} minutes ${ss} seconds left` : "Time is up"}>
      <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--bg-elev-2)" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={low ? "var(--opp)" : "var(--gold)"}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${low ? "text-opp" : ""}`}>
        {left ? `${mm}:${ss}` : "Time!"}
      </span>
    </div>
  );
}
