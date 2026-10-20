"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Moon, Sun, Users } from "lucide-react";
import { api } from "@/lib/api";

type Modo = "horoscopo" | "transitos" | "luna" | "sinastria";

interface Props { modo: string; hasBirthData: boolean }

interface Horoscopo { sign: string; date: string; title: string; body: string; lucky: { color: string; number: number; hour: string } }
interface SkyPos { key: string; name: string; sign: string; signDegree: number }
interface Transito { transito: string; natal: string; type: string; orb: number }
interface LunarDay { date: string; phase: string; illumination: number; sign: string }
interface Sinastria {
  partner: { name: string | null; sun: string; positions: SkyPos[] };
  aspects: { planetaA: string; planetaB: string; type: string; orb: number }[];
}

const TYPE_LABEL: Record<string, string> = {
  conjunction: "conjunción", opposition: "oposición", trine: "trígono", square: "cuadratura", sextile: "sextil",
};
const TYPE_ICON: Record<string, string> = {
  conjunction: "☌", opposition: "☍", trine: "△", square: "□", sextile: "⚹",
};

export function AstrologiaClient({ modo, hasBirthData }: Props) {
  const [tab, setTab] = useState<Modo>(modo as Modo);
  return (
    <div className="animate-fade-up mx-auto max-w-md">
      <header className="mb-4 flex items-center gap-3 border-b border-violet/15 pb-4">
        <Link
          href="/explorar/universo"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-center font-display text-2xl text-gold-soft">El Universo</h1>
        <span className="w-9" />
      </header>

      <div className="mb-5 grid grid-cols-4 gap-1.5">
        {(
          [
            { k: "horoscopo", label: "Hoy", icon: Sun },
            { k: "transitos", label: "Tránsitos", icon: Sun },
            { k: "sinastria", label: "Sinastría", icon: Users },
            { k: "luna", label: "Luna", icon: Moon },
          ] as { k: Modo; label: string; icon: typeof Sun }[]
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`rounded-xl py-2 text-[11px] transition ${
              tab === t.k ? "bg-violet text-white" : "bg-plum/30 text-mist hover:text-ivory"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "horoscopo" && <HoroscopoTab hasBirthData={hasBirthData} />}
      {tab === "transitos" && <TransitosTab />}
      {tab === "sinastria" && <SinastriaTab />}
      {tab === "luna" && <LunaTab />}
    </div>
  );
}

function HoroscopoTab({ hasBirthData }: { hasBirthData: boolean }) {
  const [data, setData] = useState<Horoscopo | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api<{ horoscopo: Horoscopo }>("/api/astrologia?modo=horoscopo")
      .then((r) => setData(r.horoscopo))
      .catch(() => setErr("No pudimos cargar tu horóscopo."));
  }, []);

  if (err) return <p className="text-center text-sm text-rose">{err}</p>;
  if (!data) return <Loading label="Leyendo tu cielo…" />;

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="card-mystic p-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold/70">{data.date}</p>
        <h2 className="mt-1 font-display text-3xl text-ivory">{data.sign}</h2>
        <div className="my-4 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <h3 className="font-display text-xl text-gold-soft">{data.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-ivory/90">{data.body}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { k: "Color", v: data.lucky.color },
          { k: "Número", v: String(data.lucky.number) },
          { k: "Hora", v: data.lucky.hour },
        ].map((x) => (
          <div key={x.k} className="card-mystic p-3">
            <p className="text-[10px] uppercase tracking-widest text-mist/70">{x.k}</p>
            <p className="mt-1 font-display text-lg text-gold-soft">{x.v}</p>
          </div>
        ))}
      </div>
      {!hasBirthData && (
        <p className="text-center text-[11px] text-mist/70">
          Agregá tu fecha de nacimiento en Perfil para un horóscopo de tu signo real.
        </p>
      )}
    </motion.section>
  );
}

function TransitosTab() {
  const [sky, setSky] = useState<SkyPos[] | null>(null);
  const [aspects, setAspects] = useState<Transito[]>([]);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api<{ sky: SkyPos[]; aspects: Transito[] }>("/api/astrologia?modo=transitos")
      .then((r) => { setSky(r.sky); setAspects(r.aspects); })
      .catch((e) => {
        const err = e as Error & { status?: number };
        setErr(err.status === 400 ? "Necesitás tu carta natal calculada primero." : "No pudimos leer los tránsitos.");
      });
  }, []);

  if (err) return (
    <div className="card-mystic p-5 text-center">
      <p className="text-sm text-mist">{err}</p>
      <Link href="/carta-natal" className="btn-violet mt-4 inline-block px-6 py-2.5 text-sm">Calcular mi carta</Link>
    </div>
  );
  if (!sky) return <Loading label="Mirando el cielo de hoy…" />;

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="card-mystic p-4">
        <h2 className="mb-3 font-display text-lg text-gold-soft">Cielo de hoy</h2>
        <div className="flex flex-wrap gap-2">
          {sky.filter((p) => p.key !== "asc" && p.key !== "mc").map((p) => (
            <span key={p.key} className="rounded-full border border-violet/25 bg-plum/30 px-3 py-1 text-xs text-ivory/90">
              {p.name} en {p.sign} {p.signDegree.toFixed(0)}°
            </span>
          ))}
        </div>
      </div>
      {aspects.length > 0 && (
        <div className="card-mystic p-4">
          <h2 className="mb-3 font-display text-lg text-gold-soft">Tránsitos sobre tu carta</h2>
          <ul className="space-y-2">
            {aspects.map((a, i) => (
              <li key={i} className="row-mystic items-center justify-between py-2">
                <span className="text-sm text-ivory/90">
                  {a.transito} <span className="text-gold">{TYPE_ICON[a.type]}</span> {TYPE_LABEL[a.type]} {a.natal} natal
                </span>
                <span className="text-[10px] text-mist/60">orb {a.orb}°</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
}

function SinastriaTab() {
  const [form, setForm] = useState({ partnerName: "", partnerBirthDate: "" });
  const [data, setData] = useState<Sinastria | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null); setData(null);
    try {
      const res = await api<Sinastria>("/api/astrologia", {
        method: "POST",
        json: { modo: "sinastria", partnerName: form.partnerName || undefined, partnerBirthDate: form.partnerBirthDate },
      });
      setData(res);
    } catch (e) {
      const err = e as Error & { status?: number };
      setErr(err.status === 400 ? "Necesitás tu carta natal calculada primero." : "No pudimos calcular la sinastría.");
    } finally { setLoading(false); }
  }

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <form onSubmit={go} className="card-mystic space-y-3 p-5">
        <h2 className="font-display text-lg text-gold-soft">Dos cartas en diálogo</h2>
        <p className="text-xs text-mist">Ingresá la fecha de la otra persona para ver sus aspectos con tu carta.</p>
        <input
          value={form.partnerName}
          onChange={(e) => setForm((f) => ({ ...f, partnerName: e.target.value }))}
          placeholder="Su nombre (opcional)"
          className="input w-full"
        />
        <input
          type="date"
          required
          value={form.partnerBirthDate}
          onChange={(e) => setForm((f) => ({ ...f, partnerBirthDate: e.target.value }))}
          className="input w-full"
        />
        <button type="submit" disabled={loading || !form.partnerBirthDate} className="btn-violet w-full py-3 disabled:opacity-60">
          {loading ? "Calculando…" : "Ver sinastría"}
        </button>
        {err && <p className="text-center text-xs text-rose">{err}</p>}
      </form>

      {data && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="card-mystic p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-mist/70">Su sol</p>
            <p className="mt-1 font-display text-3xl text-gold-soft">
              {data.partner.name ? `${data.partner.name} — ` : ""}{data.partner.sun}
            </p>
          </div>
          {data.aspects.length > 0 && (
            <div className="card-mystic p-4">
              <h3 className="mb-2 font-display text-lg text-gold-soft">Aspectos entre cartas</h3>
              <ul className="space-y-2">
                {data.aspects.map((a, i) => (
                  <li key={i} className="row-mystic items-center justify-between py-2">
                    <span className="text-sm text-ivory/90">
                      {a.planetaA} <span className="text-gold">{TYPE_ICON[a.type]}</span> {TYPE_LABEL[a.type]} {a.planetaB}
                    </span>
                    <span className="text-[10px] text-mist/60">orb {a.orb}°</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </motion.section>
  );
}

function LunaTab() {
  const [days, setDays] = useState<LunarDay[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api<{ days: LunarDay[] }>("/api/astrologia?modo=luna")
      .then((r) => setDays(r.days))
      .catch(() => setErr("No pudimos cargar el calendario lunar."));
  }, []);

  if (err) return <p className="text-center text-sm text-rose">{err}</p>;
  if (!days) return <Loading label="Levantando la luna…" />;

  const today = new Date().toISOString().slice(0, 10);
  const fases = days.filter((d, i) => i === 0 || d.phase !== days[i - 1].phase);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="card-mystic p-4">
        <h2 className="mb-3 font-display text-lg text-gold-soft">Próximas fases</h2>
        <ul className="space-y-2">
          {fases.slice(0, 6).map((d) => (
            <li key={d.date} className={`row-mystic items-center justify-between py-2 ${d.date === today ? "border-gold/50" : ""}`}>
              <span className="text-sm text-ivory/90">{d.phase}</span>
              <span className="text-xs text-mist">{d.date.slice(5).split("-").reverse().join("/")}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card-mystic p-4">
        <h2 className="mb-3 font-display text-lg text-gold-soft">Todo el mes</h2>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
          {["D","L","M","M","J","V","S"].map((d) => (
            <span key={d} className="py-1 font-medium text-mist/50">{d}</span>
          ))}
          {days.map((d) => (
            <div
              key={d.date}
              title={`${d.phase} · Luna en ${d.sign}`}
              className={`flex flex-col items-center rounded-lg py-1.5 ${
                d.date === today ? "bg-gold/20 ring-1 ring-gold/50" : ""
              }`}
            >
              <span className="text-mist">{Number(d.date.slice(8))}</span>
              <span
                className="mt-0.5 h-1.5 w-1.5 rounded-full"
                style={{ background: `rgba(233,189,121,${0.25 + d.illumination * 0.75})` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] text-mist/60">
          La luz de cada punto muestra la iluminación de la luna ese día.
        </p>
      </div>
    </motion.section>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-mist">
      <span className="h-2 w-2 animate-twinkle rounded-full bg-gold" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
