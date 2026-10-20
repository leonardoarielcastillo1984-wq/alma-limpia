// Frentes y dorsos de cartas ilustrados (SVG propio, sin licencias externas).

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

const SUIT_TONE: Record<string, [string, string]> = {
  major: ["#5b2d96", "#1d0d3a"],
  wands: ["#7a3b5c", "#2a0f2a"],
  cups: ["#2f4a8c", "#120f3a"],
  swords: ["#3d4f7a", "#141530"],
  pentacles: ["#6b5a2a", "#22180c"],
};

function Emblem({ suit, n }: { suit: string; n: number }) {
  const g = "#f3d9a7";
  switch (suit) {
    case "wands":
      return (
        <g stroke={g} strokeWidth="3" strokeLinecap="round" fill="none">
          <line x1="60" y1="118" x2="60" y2="52" />
          <path d="M60 52 q-8 -10 0 -18 q8 8 0 18" fill="#f3b25a" stroke="none" />
          <path d="M60 70 l-10 -6 M60 86 l10 -6 M60 102 l-10 -6" strokeWidth="2" />
        </g>
      );
    case "cups":
      return (
        <g fill="none" stroke={g} strokeWidth="2.5">
          <path d="M40 60 h40 q0 30 -20 34 q-20 -4 -20 -34 Z" fill="#e9bd79" fillOpacity="0.25" />
          <line x1="60" y1="94" x2="60" y2="112" />
          <line x1="48" y1="114" x2="72" y2="114" />
          <path d="M52 52 q8 -10 16 0" strokeWidth="1.5" />
        </g>
      );
    case "swords":
      return (
        <g stroke={g} strokeWidth="2.5" fill="none" strokeLinecap="round">
          <line x1="60" y1="40" x2="60" y2="104" />
          <line x1="46" y1="104" x2="74" y2="104" />
          <line x1="60" y1="104" x2="60" y2="118" strokeWidth="4" />
          <path d="M60 40 l-4 8 h8 Z" fill={g} />
        </g>
      );
    case "pentacles":
      return (
        <g stroke={g} strokeWidth="2" fill="none">
          <circle cx="60" cy="80" r="26" fill="#e9bd79" fillOpacity="0.2" />
          <path d="M60 58 L73 98 L39 73 L81 73 L47 98 Z" />
        </g>
      );
    default: {
      // Arcanos mayores: alternar sol, luna, estrella, ojo
      const v = n % 4;
      if (v === 0)
        return (
          <g>
            <circle cx="60" cy="78" r="16" fill="#f3b25a" />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              return <line key={i} x1={60 + Math.cos(a) * 21} y1={78 + Math.sin(a) * 21} x2={60 + Math.cos(a) * 30} y2={78 + Math.sin(a) * 30} stroke={g} strokeWidth="2" />;
            })}
          </g>
        );
      if (v === 1)
        return (
          <g>
            <circle cx="60" cy="78" r="30" fill="#b48cf2" opacity="0.25" />
            <path d="M66 54 a24 24 0 1 0 0 48 a19 19 0 1 1 0 -48 Z" fill={g} />
          </g>
        );
      if (v === 2)
        return (
          <g fill={g}>
            <path d="M60 46 L66 72 L92 78 L66 84 L60 110 L54 84 L28 78 L54 72 Z" />
            <circle cx="36" cy="54" r="2" /><circle cx="86" cy="104" r="2" /><circle cx="88" cy="52" r="1.5" />
          </g>
        );
      return (
        <g fill="none" stroke={g} strokeWidth="2">
          <path d="M30 78 q30 -28 60 0 q-30 28 -60 0 Z" />
          <circle cx="60" cy="78" r="9" fill={g} />
          <path d="M60 40 v-6 M38 48 l-4 -4 M82 48 l4 -4" />
        </g>
      );
    }
  }
}

export function TarotCardFace({
  code,
  name,
  reversed = false,
  className = "",
}: {
  code: string;
  name: string;
  reversed?: boolean;
  className?: string;
}) {
  const [suit, num] = code.split("-");
  const n = Number(num) || 0;
  const [c1, c2] = SUIT_TONE[suit] ?? SUIT_TONE.major;
  const id = `tf-${code}`;
  const label = suit === "major" ? ROMAN[n] ?? String(n) : String(n);
  return (
    <svg viewBox="0 0 120 190" className={`${className} ${reversed ? "rotate-180" : ""}`} role="img" aria-label={name}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7e3b8" />
          <stop offset="100%" stopColor="#a8743d" />
        </linearGradient>
        <radialGradient id={`${id}-halo`} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#f3d9a7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f3d9a7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="116" height="186" rx="8" fill="#f1e2c2" />
      <rect x="6" y="6" width="108" height="178" rx="6" fill={`url(#${id}-bg)`} stroke={`url(#${id}-gold)`} strokeWidth="1.5" />
      <path d="M14 150 V44 a46 34 0 0 1 92 0 V150 Z" fill={`url(#${id}-halo)`} stroke="#e9bd79" strokeOpacity="0.5" />
      {[[22, 30], [98, 36], [20, 130], [100, 128], [60, 22]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="#f5efe7" opacity="0.8" />
      ))}
      <text x="60" y="20" textAnchor="middle" fontSize="10" fontFamily="Georgia, serif" fill="#f3d9a7">{label}</text>
      <g transform="translate(0 4)">
        <Emblem suit={suit} n={n} />
      </g>
      <rect x="10" y="156" width="100" height="24" rx="3" fill="#f1e2c2" />
      <text x="60" y="172" textAnchor="middle" fontSize={name.length > 16 ? 7.5 : 9} fontFamily="Georgia, serif" fill="#3a2410" letterSpacing="0.5">
        {name.toUpperCase()}
      </text>
    </svg>
  );
}

export function TarotCardBack({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 190" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tb-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a1a66" />
          <stop offset="100%" stopColor="#160a2e" />
        </linearGradient>
        <linearGradient id="tb-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7e3b8" />
          <stop offset="100%" stopColor="#a8743d" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="116" height="186" rx="8" fill="url(#tb-bg)" stroke="url(#tb-gold)" strokeWidth="2" />
      <rect x="8" y="8" width="104" height="174" rx="5" fill="none" stroke="#e9bd79" strokeOpacity="0.55" />
      <g transform="translate(60 95)" stroke="#e9bd79" fill="none">
        <circle r="30" strokeOpacity="0.8" />
        <circle r="22" strokeOpacity="0.5" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * 22.5 * Math.PI) / 180;
          return <line key={i} x1={Math.cos(a) * 22} y1={Math.sin(a) * 22} x2={Math.cos(a) * 30} y2={Math.sin(a) * 30} strokeOpacity="0.6" />;
        })}
        <path d="M6 -14 a14 14 0 1 0 0 28 a11 11 0 1 1 0 -28 Z" fill="#f3d9a7" stroke="none" />
      </g>
      <path d="M60 30 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" fill="#e9bd79" />
      <path d="M60 138 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" fill="#e9bd79" />
      <circle cx="22" cy="22" r="1.5" fill="#f5efe7" /><circle cx="98" cy="168" r="1.5" fill="#f5efe7" />
    </svg>
  );
}
