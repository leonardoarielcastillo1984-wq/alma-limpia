// Ilustraciones SVG propias de ALMA LIMPIA (sin assets externos).
// Cada pieza usa viewBox 0 0 200 160 y escala al contenedor.

type ArtProps = { className?: string };

const GOLD = "#e9bd79";
const GOLD_SOFT = "#f3d9a7";
const LILAC = "#d9c2ff";

function Defs() {
  return (
    <defs>
      <linearGradient id="al-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f7e3b8" />
        <stop offset="55%" stopColor="#e9bd79" />
        <stop offset="100%" stopColor="#a8743d" />
      </linearGradient>
      <linearGradient id="al-card" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4b2585" />
        <stop offset="100%" stopColor="#1d0d3a" />
      </linearGradient>
      <radialGradient id="al-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f3d9a7" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#b48cf2" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#b48cf2" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="al-moon" cx="40%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#fbecc8" />
        <stop offset="60%" stopColor="#e9bd79" />
        <stop offset="100%" stopColor="#b98548" />
      </radialGradient>
      <linearGradient id="al-flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff4d6" />
        <stop offset="60%" stopColor="#f3b25a" />
        <stop offset="100%" stopColor="#d9762b" />
      </linearGradient>
    </defs>
  );
}

function Sparkles({ pts }: { pts: [number, number, number][] }) {
  return (
    <g>
      {pts.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 3 === 0 ? GOLD_SOFT : LILAC} opacity={0.5 + (i % 4) * 0.12} />
      ))}
    </g>
  );
}

const STARS: [number, number, number][] = [
  [18, 20, 1.2], [44, 12, 0.8], [170, 18, 1.1], [186, 44, 0.8], [14, 70, 0.9],
  [150, 10, 0.7], [100, 8, 0.9], [190, 90, 0.7], [8, 110, 0.8], [130, 28, 0.6],
];

function CardBack({ x, y, rot, w = 46, h = 74 }: { x: number; y: number; rot: number; w?: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="5" fill="url(#al-card)" stroke="url(#al-gold)" strokeWidth="1.6" />
      <rect x={-w / 2 + 4} y={-h / 2 + 4} width={w - 8} height={h - 8} rx="3" fill="none" stroke={GOLD} strokeOpacity="0.55" strokeWidth="0.8" />
      <circle r="9" fill="none" stroke={GOLD} strokeWidth="1" />
      <path d="M0 -14 L2.5 -2.5 L14 0 L2.5 2.5 L0 14 L-2.5 2.5 L-14 0 L-2.5 -2.5 Z" fill={GOLD} opacity="0.85" />
      <path d="M-4 -24 a5 5 0 1 0 6 0 a4 4 0 1 1 -6 0" fill={GOLD_SOFT} opacity="0.8" />
    </g>
  );
}

export function TarotFanArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <Defs />
      <circle cx="100" cy="80" r="70" fill="url(#al-glow)" />
      <Sparkles pts={STARS} />
      <CardBack x={62} y={86} rot={-22} />
      <CardBack x={86} y={78} rot={-8} />
      <CardBack x={114} y={78} rot={8} />
      <CardBack x={138} y={86} rot={22} />
      <ellipse cx="100" cy="140" rx="60" ry="5" fill="#000" opacity="0.35" />
    </svg>
  );
}

const ZODIAC = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

export function ZodiacWheelArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <Defs />
      <circle cx="100" cy="80" r="72" fill="url(#al-glow)" opacity="0.8" />
      <Sparkles pts={STARS} />
      <g transform="translate(100 80)">
        <circle r="58" fill="none" stroke="url(#al-gold)" strokeWidth="1.8" />
        <circle r="44" fill="none" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1" />
        <circle r="22" fill="none" stroke={GOLD} strokeOpacity="0.5" strokeWidth="0.8" />
        {ZODIAC.map((g, i) => {
          const a = (i * 30 - 90) * (Math.PI / 180);
          const a2 = (i * 30 - 75) * (Math.PI / 180);
          return (
            <g key={g}>
              <line x1={Math.cos(a) * 44} y1={Math.sin(a) * 44} x2={Math.cos(a) * 58} y2={Math.sin(a) * 58} stroke={GOLD} strokeOpacity="0.6" strokeWidth="0.8" />
              <text x={Math.cos(a2) * 51} y={Math.sin(a2) * 51 + 3} textAnchor="middle" fontSize="9" fill={GOLD_SOFT}>{g}</text>
            </g>
          );
        })}
        <path d="M0 -40 L14 26 L-36 -12 L36 -12 L-14 26 Z" fill="none" stroke={LILAC} strokeOpacity="0.7" strokeWidth="0.8" />
        <circle r="7" fill="url(#al-moon)" />
      </g>
    </svg>
  );
}

function MeditatorPath() {
  return (
    <path
      d="M100 34 a10 11 0 1 1 0.01 0 Z M100 56 c-14 0 -22 8 -24 22 l-4 18 c-10 4 -30 10 -34 18 c4 6 22 6 40 2 l22 -2 l22 2 c18 4 36 4 40 -2 c-4 -8 -24 -14 -34 -18 l-4 -18 c-2 -14 -10 -22 -24 -22 Z"
    />
  );
}

export function MeditatorArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <Defs />
      <circle cx="100" cy="70" r="66" fill="url(#al-glow)" />
      <circle cx="100" cy="70" r="46" fill="none" stroke={GOLD} strokeOpacity="0.35" strokeWidth="0.8" />
      <Sparkles pts={STARS} />
      <g fill="#1b0b36" stroke={LILAC} strokeOpacity="0.6" strokeWidth="1.2">
        <MeditatorPath />
      </g>
      <circle cx="100" cy="30" r="2.4" fill={GOLD_SOFT} />
    </svg>
  );
}

const CHAKRA_COLORS = ["#c084fc", "#818cf8", "#38bdf8", "#4ade80", "#facc15", "#fb923c", "#f43f5e"];

export function ChakraArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <Defs />
      <circle cx="100" cy="80" r="70" fill="url(#al-glow)" opacity="0.7" />
      <Sparkles pts={STARS} />
      <g fill="#1b0b36" stroke={LILAC} strokeOpacity="0.5" strokeWidth="1">
        <MeditatorPath />
      </g>
      {CHAKRA_COLORS.map((c, i) => (
        <g key={c}>
          <circle cx="100" cy={26 + i * 13} r="7" fill={c} opacity="0.25" />
          <circle cx="100" cy={26 + i * 13} r="3.6" fill={c} />
        </g>
      ))}
    </svg>
  );
}

function Heart({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 8 C-12 -2 -14 -12 -7 -16 C-3 -18 0 -15 0 -12 C0 -15 3 -18 7 -16 C14 -12 12 -2 0 8 Z"
      fill={fill}
    />
  );
}

export function HeartsArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <Defs />
      <circle cx="100" cy="78" r="70" fill="url(#al-glow)" />
      <Sparkles pts={STARS} />
      <Heart x={84} y={88} s={3.2} fill="#d88bcb" />
      <Heart x={116} y={84} s={3} fill="#f0a6d8" />
      <Heart x={84} y={88} s={2.2} fill="#f7c6e6" />
      <path d="M60 120 q40 -30 80 0" fill="none" stroke={GOLD} strokeOpacity="0.5" strokeWidth="1" />
    </svg>
  );
}

function Candle({ x, h }: { x: number; h: number }) {
  return (
    <g>
      <ellipse cx={x} cy={136 - h - 10} rx="10" ry="14" fill="url(#al-glow)" />
      <rect x={x - 5} y={136 - h} width="10" height={h} rx="2" fill="#efe1c6" />
      <path d={`M${x} ${136 - h - 12} c4 5 3 9 0 11 c-3 -2 -4 -6 0 -11 Z`} fill="url(#al-flame)" />
    </g>
  );
}

export function MoonCandlesArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <Defs />
      <Sparkles pts={STARS} />
      <circle cx="110" cy="52" r="40" fill="url(#al-glow)" />
      <mask id="al-cres">
        <rect width="200" height="160" fill="black" />
        <circle cx="110" cy="52" r="28" fill="white" />
        <circle cx="122" cy="44" r="25" fill="black" />
      </mask>
      <circle cx="110" cy="52" r="28" fill="url(#al-moon)" mask="url(#al-cres)" />
      <Candle x={70} h={26} />
      <Candle x={90} h={38} />
      <Candle x={130} h={30} />
      <path d="M150 136 l8 -18 l8 18 Z" fill="#b48cf2" opacity="0.7" />
      <rect x="40" y="136" width="130" height="4" rx="2" fill="#2a1450" />
    </svg>
  );
}

export function PortalArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <Defs />
      <Sparkles pts={STARS} />
      <path d="M60 150 V70 a40 46 0 0 1 80 0 V150 Z" fill="url(#al-glow)" stroke="url(#al-gold)" strokeWidth="2" />
      <path d="M72 150 V74 a28 34 0 0 1 56 0 V150" fill="none" stroke={GOLD} strokeOpacity="0.5" />
      <path d="M100 96 a5 6 0 1 1 0.01 0 Z M100 108 c-6 0 -9 4 -9 12 l2 30 h14 l2 -30 c0 -8 -3 -12 -9 -12 Z" fill="#1b0b36" />
    </svg>
  );
}

export function NumberArt({ n = 7, className = "" }: ArtProps & { n?: number }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <Defs />
      <circle cx="100" cy="80" r="62" fill="url(#al-glow)" />
      <circle cx="100" cy="80" r="44" fill="none" stroke="url(#al-gold)" strokeWidth="1.6" />
      <Sparkles pts={STARS} />
      <text x="100" y="98" textAnchor="middle" fontSize="54" fontFamily="Georgia, serif" fill="url(#al-gold)">{n}</text>
    </svg>
  );
}

export function CrystalArt({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <Defs />
      <circle cx="100" cy="86" r="60" fill="url(#al-glow)" />
      <Sparkles pts={STARS} />
      <g stroke={LILAC} strokeWidth="1" strokeOpacity="0.8">
        <path d="M100 30 L122 70 L112 130 L88 130 L78 70 Z" fill="#7b4fd0" fillOpacity="0.7" />
        <path d="M100 30 L100 130 M78 70 L122 70" fill="none" />
        <path d="M70 90 L82 76 L90 130 L66 130 Z" fill="#b48cf2" fillOpacity="0.55" />
        <path d="M130 90 L118 76 L110 130 L134 130 Z" fill="#b48cf2" fillOpacity="0.55" />
      </g>
    </svg>
  );
}

/** Escena completa del splash: cielo, luna, montañas, lago y silueta meditando. */
export function HeroSceneArt({ className = "" }: ArtProps) {
  const stars: [number, number, number][] = Array.from({ length: 46 }, (_, i) => [
    (i * 83) % 400,
    (i * 47) % 300,
    0.5 + ((i * 7) % 5) * 0.25,
  ]);
  return (
    <svg viewBox="0 0 400 640" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#120828" />
          <stop offset="35%" stopColor="#2e1458" />
          <stop offset="58%" stopColor="#5b2d84" />
          <stop offset="72%" stopColor="#a8618f" />
          <stop offset="80%" stopColor="#e2a487" />
          <stop offset="86%" stopColor="#3a1a5c" />
          <stop offset="100%" stopColor="#0d0620" />
        </linearGradient>
        <radialGradient id="hs-moonglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbecc8" stopOpacity="0.7" />
          <stop offset="40%" stopColor="#e9bd79" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#b48cf2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hs-moon" cx="38%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#fff3d6" />
          <stop offset="60%" stopColor="#efc98a" />
          <stop offset="100%" stopColor="#b98548" />
        </radialGradient>
        <radialGradient id="hs-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe7b8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffb98a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hs-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c98a8a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#120828" stopOpacity="1" />
        </linearGradient>
        <mask id="hs-cres">
          <rect width="400" height="640" fill="black" />
          <circle cx="110" cy="120" r="58" fill="white" />
          <circle cx="136" cy="102" r="52" fill="black" />
        </mask>
        <radialGradient id="hs-figglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f3d9a7" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#b48cf2" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="640" fill="url(#hs-sky)" />
      <g>
        {stars.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={i % 4 === 0 ? "#f3d9a7" : "#f5efe7"} opacity={0.35 + (i % 5) * 0.12}>
            <animate attributeName="opacity" values="0.2;1;0.2" dur={`${3 + (i % 5)}s`} begin={`${(i % 7) * 0.4}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>

      {/* nebulosa */}
      <ellipse cx="300" cy="200" rx="180" ry="70" fill="#b48cf2" opacity="0.12" />
      <ellipse cx="80" cy="300" rx="160" ry="50" fill="#d88bcb" opacity="0.1" />

      {/* luna */}
      <circle cx="110" cy="120" r="120" fill="url(#hs-moonglow)" />
      <circle cx="110" cy="120" r="58" fill="url(#hs-moon)" mask="url(#hs-cres)" />

      {/* sol poniente */}
      <circle cx="200" cy="500" r="70" fill="url(#hs-sun)" />

      {/* montañas */}
      <path d="M0 470 L60 420 L110 450 L170 390 L230 445 L290 400 L350 440 L400 415 L400 520 L0 520 Z" fill="#3b1c63" opacity="0.85" />
      <path d="M0 500 L50 470 L100 490 L150 455 L210 495 L270 465 L330 492 L400 470 L400 525 L0 525 Z" fill="#241042" />

      {/* lago */}
      <rect y="520" width="400" height="120" fill="url(#hs-water)" />
      <g stroke="#ffd9a8" strokeOpacity="0.5" strokeWidth="1.2">
        <line x1="175" y1="535" x2="225" y2="535" />
        <line x1="160" y1="550" x2="240" y2="550" />
        <line x1="185" y1="566" x2="215" y2="566" />
      </g>

      {/* figura meditando sobre roca */}
      <circle cx="200" cy="470" r="44" fill="url(#hs-figglow)" />
      <path d="M150 520 q50 -20 100 0 Z" fill="#160a2c" />
      <path
        transform="translate(200 470) scale(0.42) translate(-100 -80)"
        d="M100 34 a10 11 0 1 1 0.01 0 Z M100 56 c-14 0 -22 8 -24 22 l-4 18 c-10 4 -30 10 -34 18 c4 6 22 6 40 2 l22 -2 l22 2 c18 4 36 4 40 -2 c-4 -8 -24 -14 -34 -18 l-4 -18 c-2 -14 -10 -22 -24 -22 Z"
        fill="#140826"
      />

      {/* árboles laterales */}
      <path d="M0 640 V430 l14 30 l-8 0 l18 34 l-10 0 l22 40 l-14 0 l24 46 V640 Z" fill="#0e061e" />
      <path d="M400 640 V420 l-16 32 l9 0 l-20 36 l11 0 l-24 42 l15 0 l-26 50 V640 Z" fill="#0e061e" />
    </svg>
  );
}

/** Ilustración por universo (slug de categoría). */
export function UniverseArt({ slug, className = "" }: { slug: string; className?: string }) {
  switch (slug) {
    case "oraculo": return <TarotFanArt className={className} />;
    case "universo": return <ZodiacWheelArt className={className} />;
    case "alma": return <PortalArt className={className} />;
    case "energia": return <MeditatorArt className={className} />;
    case "vinculos": return <HeartsArt className={className} />;
    case "rituales": return <MoonCandlesArt className={className} />;
    default: return <CrystalArt className={className} />;
  }
}

/** Miniatura por tipo de servicio y slug. */
export function ServiceArt({ kind, slug, className = "" }: { kind: string; slug: string; className?: string }) {
  if (slug.includes("amor") || slug.includes("compatib") || slug.includes("sinastria")) return <HeartsArt className={className} />;
  if (slug.includes("chakra") || slug.includes("aura") || slug.includes("medita") || slug.includes("respira")) return <ChakraArt className={className} />;
  if (slug.includes("luna") || slug.includes("ritual") || slug.includes("sueno")) return <MoonCandlesArt className={className} />;
  if (slug.includes("cristal")) return <CrystalArt className={className} />;
  if (slug.includes("akash") || slug.includes("vidas") || slug.includes("alma")) return <PortalArt className={className} />;
  switch (kind) {
    case "TAROT": return <TarotFanArt className={className} />;
    case "NATAL": return <ZodiacWheelArt className={className} />;
    case "NUMEROLOGY": return <NumberArt className={className} />;
    case "RITUAL": return <MoonCandlesArt className={className} />;
    case "TEST": return <ChakraArt className={className} />;
    case "CHAT": return <MeditatorArt className={className} />;
    default: return <CrystalArt className={className} />;
  }
}
