"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock, Flame } from "lucide-react";
import { api } from "@/lib/api";
import { CrescentMoon } from "@/components/cosmic/CrescentMoon";

interface Props {
  slug: string;
  name: string;
  description: string | null;
  steps: { t: string; d: string }[];
  safeVariant: { nota?: string };
  durationMin: number;
  alreadyDone: boolean;
  savedNotes: string;
}

export function RitualClient({
  slug, name, description, steps, safeVariant, durationMin, alreadyDone, savedNotes,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(-1); // -1 = intro
  const [notes, setNotes] = useState(savedNotes);
  const [done, setDone] = useState(alreadyDone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = steps.length;
  const onLast = step === total - 1;

  async function complete() {
    setSaving(true);
    setError(null);
    try {
      await api(`/api/rituales/${slug}`, {
        method: "POST",
        json: { action: "complete", notes: notes.trim() || undefined },
      });
      setDone(true);
      setStep(total); // pantalla de cierre
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      setError(
        status === 402
          ? "Esta experiencia requiere pago o créditos."
          : "No pudimos guardar. Probá de nuevo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveOnly() {
    setSaving(true);
    try {
      await api(`/api/rituales/${slug}`, {
        method: "POST",
        json: { action: "save", notes: notes.trim() || undefined },
      });
      router.push("/mi-universo");
    } catch {
      setError("No pudimos guardar. Probá de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up mx-auto flex min-h-[calc(100dvh-9rem)] max-w-md flex-col">
      <header className="mb-5 flex items-center gap-3 border-b border-violet/15 pb-4">
        <Link
          href={`/explorar/rituales/${slug}`}
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate font-display text-2xl text-gold-soft">{name}</h1>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-mist/80">
            <Clock size={11} /> ~{durationMin} min
            {step >= 0 && step < total && ` · paso ${step + 1} de ${total}`}
          </p>
        </div>
        <span className="w-9" />
      </header>

      <AnimatePresence mode="wait">
        {step === -1 && (
          <motion.section
            key="intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-1 flex-col items-center justify-center text-center"
          >
            <span className="flex h-24 w-24 items-center justify-center rounded-full border border-gold/40 bg-gradient-to-br from-plum to-violet-deep shadow-[0_0_40px_rgba(233,189,121,0.25)]">
              <Flame size={40} className="text-gold" />
            </span>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory/85">{description}</p>
            <div className="card-mystic mt-6 w-full p-4 text-left">
              <h2 className="mb-2 font-display text-base text-gold-soft">Qué vas a hacer</h2>
              <ul className="space-y-1.5 text-xs text-mist">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gold">{i + 1}.</span> {s.t}
                  </li>
                ))}
              </ul>
              {safeVariant.nota && (
                <p className="mt-3 rounded-lg border border-violet/20 bg-violet/5 p-2.5 text-[11px] text-lilac">
                  ✦ {safeVariant.nota}
                </p>
              )}
            </div>
            <button onClick={() => setStep(0)} className="btn-violet mt-6 w-full py-3.5">
              Comenzar el ritual
            </button>
          </motion.section>
        )}

        {step >= 0 && step < total && (
          <motion.section
            key={`step-${step}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-1 flex-col"
          >
            {/* progreso */}
            <div className="mb-6 flex gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-gold" : "bg-violet/20"
                  }`}
                />
              ))}
            </div>

            <div className="card-mystic flex-1 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-gold/70">Paso {step + 1}</p>
              <h2 className="mt-1 font-display text-2xl text-ivory">{steps[step].t}</h2>
              <p className="mt-4 text-sm leading-relaxed text-ivory/90">{steps[step].d}</p>
            </div>

            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="btn-ghost flex-1 py-3 text-sm">
                  Atrás
                </button>
              )}
              <button
                onClick={() => (onLast ? setStep(total) : setStep(step + 1))}
                className="btn-violet flex-[2] py-3"
              >
                {onLast ? "Reflexión final" : "Siguiente"}
              </button>
            </div>
          </motion.section>
        )}

        {step === total && !done && (
          <motion.section
            key="reflect"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 flex-col"
          >
            <div className="card-mystic flex-1 space-y-4 p-6">
              <h2 className="font-display text-2xl text-gold-soft">Reflexión final</h2>
              <p className="text-sm text-mist">
                ¿Qué te dejó este ritual? Anotarlo ayuda a que quede. (Opcional)
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Escribí lo que sentiste, pensaste o imaginaste…"
                className="input w-full resize-none"
              />
              {error && <p className="text-xs text-rose">{error}</p>}
            </div>
            <div className="mt-5 space-y-2">
              <button onClick={complete} disabled={saving} className="btn-gold w-full py-3.5 disabled:opacity-60">
                {saving ? "Guardando…" : "Completar ritual"}
              </button>
              <button onClick={saveOnly} disabled={saving} className="btn-ghost w-full py-3 text-sm">
                Guardar para después
              </button>
            </div>
          </motion.section>
        )}

        {step === total && done && (
          <motion.section
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 flex-col items-center justify-center text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.15 }}
              className="flex h-24 w-24 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-br from-gold/20 to-violet-deep shadow-[0_0_50px_rgba(233,189,121,0.4)]"
            >
              <Check size={44} className="text-gold" />
            </motion.span>
            <h2 className="mt-6 font-display text-3xl text-ivory">Ritual completado</h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-mist">
              Quedó guardado en tu universo. Podés volver a hacerlo cuando el ciclo lo pida.
            </p>
            <CrescentMoon size={36} className="mt-6 opacity-60" />
            <div className="mt-8 w-full space-y-2">
              <Link href="/mi-universo" className="btn-violet block w-full py-3.5">
                Volver a Mi Universo
              </Link>
              <Link href="/explorar/rituales" className="btn-ghost block w-full py-3 text-sm">
                Ver más rituales
              </Link>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
