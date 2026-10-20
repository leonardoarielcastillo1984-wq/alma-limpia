"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { NumberArt } from "@/components/art/MysticArt";

interface Results {
  lifePath: number;
  destiny: number;
  soul: number;
  personality: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
  masters: string[];
}
interface Report {
  results: Results;
  compat: { score: number; diff: number } | null;
  interpretation: string | null;
}

// Arquetipos tradicionales de la numerología pitagórica (referencia simbólica)
const ARCHETYPE: Record<number, [string, string]> = {
  1: ["El pionero", "Tu esencia está conectada con la iniciativa, la independencia y el coraje de abrir caminos."],
  2: ["El mediador", "Tu esencia está conectada con la sensibilidad, la cooperación y el arte de unir."],
  3: ["El creador", "Tu esencia está conectada con la expresión, la alegría y la comunicación."],
  4: ["El constructor", "Tu esencia está conectada con la constancia, el orden y las bases firmes."],
  5: ["El aventurero", "Tu esencia está conectada con la libertad, el cambio y la experiencia."],
  6: ["El protector", "Tu esencia está conectada con el cuidado, la armonía y la responsabilidad amorosa."],
  7: ["El buscador espiritual", "Tu esencia está conectada con la sabiduría, la introspección y la búsqueda de respuestas profundas."],
  8: ["El realizador", "Tu esencia está conectada con el poder personal, la abundancia y la concreción."],
  9: ["El humanitario", "Tu esencia está conectada con la compasión, el cierre de ciclos y el servicio."],
  11: ["El inspirador", "Número maestro: intuición elevada, visión y sensibilidad para inspirar a otros."],
  22: ["El maestro constructor", "Número maestro: capacidad de materializar grandes visiones."],
  33: ["El maestro sanador", "Número maestro: amor compasivo y guía para los demás."],
};

export function NumerologyClient({
  mode,
  initialName,
  initialBirthDate,
}: {
  mode: "personal" | "compat";
  initialName: string;
  initialBirthDate: string;
}) {
  const [name, setName] = useState(initialName);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [partnerName, setPartnerName] = useState("");
  const [partnerBirthDate, setPartnerBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  function downloadReport() {
    if (!report) return;
    const r = report.results;
    const lines = [
      "ALMA LIMPIA — Informe numerológico",
      `Para: ${name} · Nacimiento: ${birthDate}`,
      "",
      `Camino de vida: ${r.lifePath}`,
      `Alma: ${r.soul}`,
      `Personalidad: ${r.personality}`,
      `Destino: ${r.destiny}`,
      `Año personal: ${r.personalYear}`,
      `Mes personal: ${r.personalMonth}`,
      `Día personal: ${r.personalDay}`,
      r.masters.length ? `Números maestros: ${r.masters.join(", ")}` : "",
      "",
      report.interpretation ? `Tu lectura:\n${report.interpretation}` : "",
      "",
      "Generado por ALMA LIMPIA — símbolos para reflexionar.",
    ].filter(Boolean).join("\n");
    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mi-numerologia.txt";
    a.click();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ report: Report }>("/api/numerology", {
        method: "POST",
        json: {
          name,
          birthDate,
          ...(mode === "compat" ? { partnerName, partnerBirthDate } : {}),
          interpret: true,
        },
      });
      setReport(res.report);
    } catch {
      setError("No pudimos calcular. Revisá los datos y probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (report && mode === "compat" && report.compat) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="flex items-center justify-center gap-3">
          <Person label="Vos" name={name} n={report.results.lifePath} />
          <Heart size={40} className="fill-rose/70 text-rose drop-shadow-[0_0_14px_rgba(216,139,203,0.8)]" />
          <Person label="Tu persona" name={partnerName} />
        </div>
        <div className="text-center">
          <p className="font-display text-6xl font-semibold text-gold-soft">{report.compat.score}%</p>
          <p className="text-sm text-ivory/80">Conexión numerológica</p>
          <p className="mt-1 text-[11px] text-mist/70">
            Según la diferencia entre caminos de vida (tradición pitagórica)
          </p>
        </div>
        {report.interpretation && (
          <section className="card-mystic p-5">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ivory/90">{report.interpretation}</p>
          </section>
        )}
        <button onClick={() => setReport(null)} className="btn-ghost w-full py-3 text-sm">Calcular otra</button>
      </motion.div>
    );
  }

  if (report) {
    const r = report.results;
    const [title, desc] = ARCHETYPE[r.lifePath] ?? ["", ""];
    const rows: [string, number][] = [
      ["Camino de vida", r.lifePath],
      ["Número del alma", r.soul],
      ["Número de personalidad", r.personality],
      ["Número de destino", r.destiny],
      ["Año personal", r.personalYear],
      ["Mes personal", r.personalMonth],
      ["Día personal", r.personalDay],
    ];
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <section className="tile-art p-5 text-center">
          <div className="relative z-10">
            <p className="font-display text-xl text-ivory">Tu camino de vida</p>
            <NumberArt n={r.lifePath} className="mx-auto h-40" />
            <p className="font-display text-2xl text-gold-soft">{title}</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-ivory/80">{desc}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg text-ivory">Tus números personales</h2>
          <div className="space-y-2">
            {rows.map(([label, n]) => (
              <div key={label} className="row-mystic">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-plum/50 text-xs text-gold-soft">✦</span>
                <span className="flex-1 text-sm text-ivory">{label}</span>
                <span className="font-display text-xl text-gold">{n}</span>
              </div>
            ))}
          </div>
          {r.masters.length > 0 && (
            <p className="mt-2 text-xs text-violet">Números maestros: {r.masters.map((m) => m.split(":")[1]).join(", ")}</p>
          )}
        </section>

        {report.interpretation && (
          <section className="card-mystic p-5">
            <h2 className="mb-3 font-display text-lg text-gold-soft">Tu lectura</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ivory/90">{report.interpretation}</p>
          </section>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={downloadReport} className="btn-violet py-3 text-sm">
            Descargar informe
          </button>
          <button onClick={() => setReport(null)} className="btn-ghost py-3 text-sm">
            Calcular de nuevo
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "compat" && (
        <div className="flex items-center justify-center gap-3 py-2">
          <Person label="Vos" name={name} />
          <Heart size={36} className="fill-rose/60 text-rose" />
          <Person label="Tu persona" name={partnerName} />
        </div>
      )}
      <div className="card-mystic space-y-3 p-5">
        <p className="text-xs uppercase tracking-widest text-mist/70">{mode === "compat" ? "Vos" : "Tus datos"}</p>
        <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo de nacimiento" className="input" />
        <input required type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="input" />
      </div>
      {mode === "compat" && (
        <div className="card-mystic space-y-3 p-5">
          <p className="text-xs uppercase tracking-widest text-mist/70">Tu persona</p>
          <input required minLength={2} value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Su nombre completo" className="input" />
          <input required type="date" value={partnerBirthDate} onChange={(e) => setPartnerBirthDate(e.target.value)} className="input" />
        </div>
      )}
      {error && <p className="text-sm text-rose">{error}</p>}
      <button type="submit" disabled={loading} className="btn-gold flex w-full items-center justify-center gap-2 py-3.5 disabled:opacity-50">
        {loading ? "Calculando…" : mode === "compat" ? "Ver compatibilidad" : "Calcular mis números"}
        {!loading && <ChevronRight size={18} />}
      </button>
      <p className="text-center text-[10px] text-mist/50">
        Cálculo pitagórico determinístico — la guía solo interpreta los números.
      </p>
    </form>
  );
}

function Person({ label, name, n }: { label: string; name: string; n?: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/60 bg-gradient-to-br from-plum to-violet-deep font-display text-3xl text-gold-soft shadow-[0_0_22px_rgba(233,189,121,0.3)]">
        {name ? name.charAt(0).toUpperCase() : "?"}
      </span>
      <p className="mt-1 text-sm text-ivory">{label}</p>
      {n !== undefined && <p className="text-[11px] text-mist">Camino {n}</p>}
    </div>
  );
}
