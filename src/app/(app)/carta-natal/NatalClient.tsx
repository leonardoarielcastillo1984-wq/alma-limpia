"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { NatalWheel, computeAspects, aspectColor, PLANET_GLYPH, SIGN_GLYPH } from "@/components/astro/NatalWheel";

interface PlanetPos {
  key: string; name: string; longitude: number; sign: string; signDegree: number;
}
interface Chart {
  positions: PlanetPos[];
  ascendant: PlanetPos | null;
  midheaven: PlanetPos | null;
  moonPhase: { name: string; illumination: number } | null;
  warnings: string[];
  engine: string;
}

// Rasgos simbólicos tradicionales por signo (texto de referencia, no predicción)
const SIGN_TRAITS: Record<string, string> = {
  Aries: "Iniciativa, coraje y autenticidad.",
  Tauro: "Calma, constancia y disfrute de lo simple.",
  "Géminis": "Curiosidad, palabra y versatilidad.",
  "Cáncer": "Emoción, sensibilidad y conexión.",
  Leo: "Carisma, presencia y expresión.",
  Virgo: "Detalle, servicio y orden interior.",
  Libra: "Armonía, vínculo y belleza.",
  Escorpio: "Intensidad, profundidad y transformación.",
  Sagitario: "Expansión, búsqueda y optimismo.",
  Capricornio: "Propósito, estructura y perseverancia.",
  Acuario: "Libertad, visión y originalidad.",
  Piscis: "Intuición, empatía y sueños.",
};

function EnergyRow({ glyph, title, text }: { glyph: string; title: string; text?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-plum/50 text-sm text-gold-soft">
        {glyph}
      </span>
      <div>
        <p className="text-sm font-medium text-ivory">{title}</p>
        {text && <p className="text-xs text-mist">{text}</p>}
      </div>
    </div>
  );
}

export function NatalClient({ initialData }: {
  initialData: { birthDate: string; birthTime: string; birthCity: string; birthCountry: string };
}) {
  const [form, setForm] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ chart: Chart; interpretation: string | null } | null>(null);
  const [tab, setTab] = useState<"resumen" | "planetas" | "aspectos">("resumen");

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ chart: Chart; interpretation: string | null }>(
        "/api/astrologia/carta-natal",
        {
          method: "POST",
          json: {
            birthDate: form.birthDate,
            birthTime: form.birthTime || undefined,
            birthCity: form.birthCity || undefined,
            birthCountry: form.birthCountry || undefined,
            interpret: true,
          },
        }
      );
      setResult(res);
    } catch {
      setError("No pudimos calcular la carta. Revisá la fecha y probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const { chart, interpretation } = result;
    const sun = chart.positions.find((p) => p.key === "sun");
    const moon = chart.positions.find((p) => p.key === "moon");
    const aspects = computeAspects(chart.positions);
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="flex gap-2">
          {(["resumen", "planetas", "aspectos"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`chip flex-1 capitalize ${tab === t ? "chip-active" : ""}`}>
              {t}
            </button>
          ))}
        </div>

        <NatalWheel
          planets={chart.positions}
          ascendant={chart.ascendant}
          aspects={aspects}
          className="mx-auto w-full max-w-[20rem] drop-shadow-[0_0_30px_rgba(180,140,242,0.35)]"
        />

        {chart.warnings.length > 0 && (
          <p className="rounded-xl border border-gold/25 bg-gold/5 p-3 text-xs text-gold-soft">{chart.warnings.join(" ")}</p>
        )}

        {tab === "resumen" && (
          <section className="card-mystic space-y-3 p-4">
            <h2 className="font-display text-lg text-ivory">Tu energía en resumen</h2>
            <EnergyRow glyph="☉" title={`Sol en ${sun?.sign ?? "—"}`} text={SIGN_TRAITS[sun?.sign ?? ""]} />
            <EnergyRow glyph="☽" title={`Luna en ${moon?.sign ?? "—"}`} text={SIGN_TRAITS[moon?.sign ?? ""]} />
            {chart.ascendant ? (
              <EnergyRow glyph="ASC" title={`Ascendente en ${chart.ascendant.sign}`} text={SIGN_TRAITS[chart.ascendant.sign]} />
            ) : (
              <p className="text-xs text-mist">Sin hora de nacimiento no calculamos el Ascendente.</p>
            )}
            {chart.moonPhase && (
              <p className="border-t border-gold/10 pt-3 text-xs text-mist">
                Fase lunar al nacer: {chart.moonPhase.name} ({Math.round(chart.moonPhase.illumination * 100)}% iluminada)
              </p>
            )}
          </section>
        )}

        {tab === "planetas" && (
          <section className="card-mystic divide-y divide-gold/10 px-4 py-2">
            {[...chart.positions, ...(chart.midheaven ? [{ ...chart.midheaven, key: "mc", name: "Medio Cielo" }] : [])].map((p) => (
              <div key={p.key} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2 text-mist">
                  <span className="w-5 text-center text-gold">{PLANET_GLYPH[p.key] ?? "✦"}</span>
                  {p.name}
                </span>
                <span className="flex items-center gap-2 text-ivory">
                  <span className="text-gold">{SIGN_GLYPH[p.sign]}</span>
                  {p.sign} {p.signDegree}°
                </span>
              </div>
            ))}
          </section>
        )}

        {tab === "aspectos" && (
          <section className="card-mystic divide-y divide-gold/10 px-4 py-2">
            {aspects.length === 0 && <p className="py-3 text-sm text-mist">No hay aspectos mayores dentro del orbe.</p>}
            {aspects.map((x, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-ivory">
                  {PLANET_GLYPH[x.a.key]} {x.a.name} – {PLANET_GLYPH[x.b.key]} {x.b.name}
                </span>
                <span className="text-xs" style={{ color: aspectColor(x.type) }}>
                  {x.type} · {x.orb}°
                </span>
              </div>
            ))}
          </section>
        )}

        {interpretation && (
          <section className="card-mystic p-5">
            <h2 className="mb-3 font-display text-lg text-gold-soft">Tu interpretación</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ivory/90">{interpretation}</p>
          </section>
        )}

        <button onClick={() => setResult(null)} className="btn-ghost w-full py-3 text-sm">
          Calcular otra carta
        </button>
        <p className="text-center text-[10px] text-mist/50">Motor: {chart.engine}</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={calculate} className="card-mystic space-y-4 p-5">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-mist/70">Fecha *</span>
          <input type="date" required value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-mist/70">Hora</span>
          <input type="time" value={form.birthTime} onChange={(e) => set("birthTime", e.target.value)} className="input" />
        </label>
      </div>
      <p className="text-[11px] text-mist/70">
        Sin la hora calculamos los planetas igual, pero no el Ascendente ni las casas.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-mist/70">Ciudad</span>
          <input value={form.birthCity} onChange={(e) => set("birthCity", e.target.value)} className="input" placeholder="Buenos Aires" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-mist/70">País</span>
          <input value={form.birthCountry} onChange={(e) => set("birthCountry", e.target.value)} className="input" placeholder="Argentina" />
        </label>
      </div>
      {error && <p className="text-sm text-rose">{error}</p>}
      <button type="submit" disabled={loading || !form.birthDate} className="btn-gold w-full py-3.5 disabled:opacity-50">
        {loading ? "Calculando posiciones…" : "Calcular mi carta"}
      </button>
      <p className="text-center text-[10px] text-mist/50">
        Posiciones calculadas con efemérides VSOP87 — verificables, no inventadas.
      </p>
    </form>
  );
}
