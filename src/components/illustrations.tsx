/** Original SVG illustrations — abstract, no real people, no logos. */
type P = { className?: string };

export function GavelIcon({ className }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g fill="var(--gold)">
        <rect x="14" y="10" width="26" height="12" rx="3" transform="rotate(-35 27 16)" />
        <rect x="27" y="22" width="6" height="32" rx="3" transform="rotate(-35 30 38)" />
        <rect x="8" y="52" width="30" height="6" rx="2" />
      </g>
    </svg>
  );
}

export function TrophyIcon({ className }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M18 8h28v12a14 14 0 0 1-28 0z" fill="var(--gold)" />
      <path d="M18 12H9a9 9 0 0 0 10 12M46 12h9a9 9 0 0 1-10 12" fill="none" stroke="var(--gold)" strokeWidth="4" />
      <rect x="28" y="33" width="8" height="12" fill="var(--gold)" />
      <rect x="18" y="46" width="28" height="8" rx="2" fill="var(--gold)" />
    </svg>
  );
}

/** Stylised avatar: a rounded figure with a side-coloured badge. `variant` changes the look. */
export function Avatar({ side, variant = 0, className }: P & { side: "prop" | "opp"; variant?: number }) {
  const c = side === "prop" ? "var(--prop)" : "var(--opp)";
  const skin = ["#f1c9a5", "#c98e62", "#8d5a3b", "#e8b48a"][variant % 4];
  const isBot = variant >= 4;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="48" fill="var(--bg-elev-2)" stroke={c} strokeWidth="3" />
      <path d="M18 92a32 30 0 0 1 64 0" fill={c} />
      {isBot ? (
        <>
          <rect x="30" y="22" width="40" height="36" rx="10" fill="#cfd8ea" />
          <rect x="36" y="34" width="10" height="8" rx="3" fill={c} />
          <rect x="54" y="34" width="10" height="8" rx="3" fill={c} />
          <rect x="40" y="48" width="20" height="3" rx="1.5" fill="#55607a" />
          <line x1="50" y1="22" x2="50" y2="12" stroke="#cfd8ea" strokeWidth="3" />
          <circle cx="50" cy="10" r="4" fill="var(--gold)" />
        </>
      ) : (
        <>
          <circle cx="50" cy="40" r="17" fill={skin} />
          <path d="M33 38a17 17 0 0 1 34 0c-6-6-28-6-34 0z" fill="#2b2b38" />
          <circle cx="44" cy="42" r="2" fill="#222" />
          <circle cx="56" cy="42" r="2" fill="#222" />
          <path d="M44 49q6 4 12 0" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      <circle cx="50" cy="78" r="5" fill="var(--gold)" />
    </svg>
  );
}

export function Podium({ side, className }: P & { side: "prop" | "opp" }) {
  const c = side === "prop" ? "var(--prop)" : "var(--opp)";
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden>
      <path d="M10 10h100l-8 48H18z" fill="var(--bg-elev-2)" stroke={c} strokeWidth="3" />
      <rect x="10" y="4" width="100" height="8" rx="3" fill={c} />
      <circle cx="60" cy="32" r="9" fill="none" stroke="var(--gold)" strokeWidth="3" />
    </svg>
  );
}

/** Hero arena: two podiums under spotlights. */
export function ArenaIllustration({ className }: P) {
  return (
    <svg viewBox="0 0 400 220" className={className} role="img" aria-label="Two debate podiums facing each other under spotlights">
      <defs>
        <radialGradient id="spotL" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="var(--prop)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--prop)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="spotR" cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor="var(--opp)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--opp)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <polygon points="70,0 110,0 160,200 20,200" fill="url(#spotL)" />
      <polygon points="290,0 330,0 380,200 240,200" fill="url(#spotR)" />
      <ellipse cx="200" cy="205" rx="190" ry="12" fill="var(--bg-elev-2)" />
      <g transform="translate(40 70)">
        <circle cx="50" cy="20" r="18" fill="var(--prop)" opacity="0.9" />
        <path d="M22 70a28 28 0 0 1 56 0z" fill="var(--prop)" opacity="0.9" />
        <path d="M0 70h100l-10 60H10z" fill="var(--bg-elev)" stroke="var(--prop)" strokeWidth="3" />
        <text x="50" y="108" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--prop)">FOR</text>
      </g>
      <g transform="translate(260 70)">
        <rect x="32" y="2" width="36" height="34" rx="9" fill="var(--opp)" opacity="0.9" />
        <rect x="40" y="14" width="7" height="6" rx="2" fill="var(--bg)" />
        <rect x="53" y="14" width="7" height="6" rx="2" fill="var(--bg)" />
        <path d="M22 70a28 28 0 0 1 56 0z" fill="var(--opp)" opacity="0.9" />
        <path d="M0 70h100l-10 60H10z" fill="var(--bg-elev)" stroke="var(--opp)" strokeWidth="3" />
        <text x="50" y="108" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--opp)">AGAINST</text>
      </g>
      <g transform="translate(176 90)">
        <text x="24" y="40" textAnchor="middle" fontSize="38" fontWeight="800" fill="var(--gold)">VS</text>
      </g>
    </svg>
  );
}
