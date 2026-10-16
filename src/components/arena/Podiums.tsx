import type { OpponentStyle, Side } from "@/types/debate";
import { Avatar, Podium } from "@/components/illustrations";
import { SIDE_SHORT, STYLE_LABEL } from "@/lib/debate";

const AI_VARIANT: Record<OpponentStyle, number> = { professor: 4, challenger: 5, diplomat: 6, wit: 7 };

function Stand({ who, side, label, sub, active, variant }: { who: string; side: Side; label: string; sub: string; active: boolean; variant: number }) {
  const tone = side === "for" ? "prop" : "opp";
  return (
    <div className={`flex items-center gap-3 sm:flex-col sm:gap-1 sm:text-center ${active ? "" : "opacity-70"} transition-opacity`}>
      <div className="relative">
        <Avatar side={tone} variant={variant} className={`h-14 w-14 sm:h-24 sm:w-24 ${active ? "drop-shadow-[0_0_14px_var(--gold)]" : ""}`} />
        <Podium side={tone} className="hidden w-28 sm:block" />
      </div>
      <div>
        <p className="font-display text-2xl tracking-wide">{who}</p>
        <p className={`text-sm font-semibold ${tone === "prop" ? "text-prop" : "text-opp"}`}>{label}</p>
        <p className="text-xs text-muted">{sub}</p>
      </div>
    </div>
  );
}

export function Podiums({ userSide, style, turn }: { userSide: Side; style: OpponentStyle; turn: "user" | "ai" | "judge" }) {
  const aiSide: Side = userSide === "for" ? "against" : "for";
  const user = <Stand who="You" side={userSide} label={SIDE_SHORT[userSide]} sub={turn === "user" ? "🎤 Your turn" : " "} active={turn === "user"} variant={0} />;
  const ai = <Stand who="AI Opponent" side={aiSide} label={SIDE_SHORT[aiSide]} sub={STYLE_LABEL[style]} active={turn === "ai"} variant={AI_VARIANT[style]} />;
  // Proposition always stands on the left.
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
      {userSide === "for" ? user : ai}
      <span className="hidden self-center font-display text-4xl text-gold sm:block" aria-hidden>VS</span>
      {userSide === "for" ? ai : user}
    </div>
  );
}
