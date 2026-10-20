// Rueda natal SVG dibujada con las longitudes calculadas (VSOP87). Nada inventado:
// posiciones y aspectos salen de los datos que recibe.

export interface WheelPlanet {
  key: string;
  name: string;
  longitude: number;
  sign: string;
  signDegree: number;
}

export interface Aspect {
  a: WheelPlanet;
  b: WheelPlanet;
  type: "Conjunción" | "Sextil" | "Cuadratura" | "Trígono" | "Oposición";
  orb: number;
}

export const PLANET_GLYPH: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
};

export const SIGN_GLYPH: Record<string, string> = {
  Aries: "♈", Tauro: "♉", "Géminis": "♊", "Cáncer": "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Escorpio: "♏", Sagitario: "♐", Capricornio: "♑", Acuario: "♒", Piscis: "♓",
};

const SIGNS = Object.keys(SIGN_GLYPH);

const ASPECT_DEFS: { type: Aspect["type"]; angle: number; orb: number; color: string }[] = [
  { type: "Conjunción", angle: 0, orb: 8, color: "#f3d9a7" },
  { type: "Sextil", angle: 60, orb: 5, color: "#7dd3fc" },
  { type: "Cuadratura", angle: 90, orb: 7, color: "#f87171" },
  { type: "Trígono", angle: 120, orb: 7, color: "#60a5fa" },
  { type: "Oposición", angle: 180, orb: 8, color: "#fb7185" },
];

export function computeAspects(planets: WheelPlanet[]): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let d = Math.abs(planets[i].longitude - planets[j].longitude) % 360;
      if (d > 180) d = 360 - d;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(d - def.angle);
        if (orb <= def.orb) {
          out.push({ a: planets[i], b: planets[j], type: def.type, orb: Math.round(orb * 10) / 10 });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

export function aspectColor(type: Aspect["type"]) {
  return ASPECT_DEFS.find((d) => d.type === type)?.color ?? "#fff";
}

export function NatalWheel({
  planets,
  ascendant,
  aspects,
  className = "",
}: {
  planets: WheelPlanet[];
  ascendant: WheelPlanet | null;
  aspects: Aspect[];
  className?: string;
}) {
  const cx = 150, cy = 150;
  const R_OUT = 140, R_SIGN = 116, R_PLANET = 92, R_INNER = 68;
  const base = ascendant ? ascendant.longitude : 0; // Asc a la izquierda (9 en punto)
  const pt = (lon: number, r: number) => {
    const th = ((180 + (lon - base)) * Math.PI) / 180;
    return { x: cx + r * Math.cos(th), y: cy - r * Math.sin(th) };
  };

  // separar planetas cercanos
  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const radius: Record<string, number> = {};
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    const close = prev && p.longitude - prev.longitude < 7;
    radius[p.key] = close && radius[prev.key] === R_PLANET ? R_PLANET - 14 : R_PLANET;
  });

  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Rueda de tu carta natal">
      <defs>
        <radialGradient id="nw-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3a1a66" />
          <stop offset="100%" stopColor="#140a2a" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R_OUT} fill="url(#nw-bg)" stroke="#e9bd79" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={R_SIGN - 12} fill="none" stroke="#e9bd79" strokeOpacity="0.6" />
      <circle cx={cx} cy={cy} r={R_INNER} fill="#160a2e" stroke="#e9bd79" strokeOpacity="0.4" />

      {/* signos */}
      {SIGNS.map((s, i) => {
        const start = i * 30;
        const a = pt(start, R_OUT);
        const b = pt(start, R_SIGN - 12);
        const g = pt(start + 15, R_SIGN + 2);
        return (
          <g key={s}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e9bd79" strokeOpacity="0.5" />
            <text x={g.x} y={g.y + 5} textAnchor="middle" fontSize="15" fill="#f3d9a7">{SIGN_GLYPH[s]}</text>
          </g>
        );
      })}

      {/* aspectos */}
      {aspects.filter((x) => x.type !== "Conjunción").map((x, i) => {
        const p1 = pt(x.a.longitude, R_INNER);
        const p2 = pt(x.b.longitude, R_INNER);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={aspectColor(x.type)} strokeOpacity="0.75" strokeWidth="1" />;
      })}

      {/* eje Asc-Desc */}
      {ascendant && (
        <g>
          <line x1={pt(base, R_OUT).x} y1={cy} x2={pt(base + 180, R_OUT).x} y2={cy} stroke="#d9c2ff" strokeOpacity="0.5" strokeDasharray="3 3" />
          <text x={cx - R_OUT - 2} y={cy - 4} textAnchor="end" fontSize="9" fill="#d9c2ff">ASC</text>
        </g>
      )}

      {/* planetas */}
      {planets.map((p) => {
        const r = radius[p.key] ?? R_PLANET;
        const pos = pt(p.longitude, r);
        const tick1 = pt(p.longitude, R_SIGN - 12);
        const tick2 = pt(p.longitude, R_SIGN - 18);
        return (
          <g key={p.key}>
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke="#f3d9a7" strokeWidth="1.5" />
            <circle cx={pos.x} cy={pos.y} r="9" fill="#1d0d3a" stroke="#e9bd79" strokeOpacity="0.6" />
            <text x={pos.x} y={pos.y + 4.5} textAnchor="middle" fontSize="12" fill="#f5efe7">{PLANET_GLYPH[p.key] ?? "•"}</text>
          </g>
        );
      })}
    </svg>
  );
}
