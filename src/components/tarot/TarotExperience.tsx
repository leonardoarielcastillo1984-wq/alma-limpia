"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { TarotCardBack, TarotCardFace } from "@/components/tarot/TarotCardArt";
import { MoonCandlesArt } from "@/components/art/MysticArt";

export interface DrawnCard {
  cardId: string;
  code: string;
  name: string;
  arcana: string;
  position: number;
  positionName: string;
  reversed: boolean;
  keywords: string;
}

interface Props {
  consultationId: string;
  spread: string;
  deck?: string;
  onDrawn: (cards: DrawnCard[], seed: string) => void;
}

type Stage = "ask" | "shuffle" | "pick" | "reveal";

/**
 * Experiencia de tarot interactiva.
 * IMPORTANTE: la selección real la hace el servidor (RNG verificable por seed).
 * El cliente elige posiciones "al azar visual" — pero las cartas que salen son
 * las que devolvió el API; el abanico es la ceremonia, no el mecanismo.
 */
export function TarotExperience({ consultationId, spread, deck = "rider", onDrawn }: Props) {
  const [stage, setStage] = useState<Stage>("ask");
  const [question, setQuestion] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const needed = { one: 1, three: 3, five: 5, seven: 7, celtic: 10 }[spread] ?? 3;
  const fanCount = 15; // dorso del mazo visible en abanico

  function pick(i: number) {
    if (picked.includes(i) || loading) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === needed) draw();
  }

  async function draw() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ reading: { seed: string; cards: DrawnCard[] } }>(
        "/api/tarot/tirar",
        {
          method: "POST",
          json: {
            consultationId,
            spread,
            question: question.trim() || undefined,
            deckSlug: deck,
          },
        }
      );
      setCards(res.reading.cards);
      setStage("reveal");
      setRevealed(0);
      // Guardar seed para el callback al final
      (window as unknown as { __almaSeed?: string }).__almaSeed = res.reading.seed;
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      setError(
        status === 409
          ? "Ya hiciste la tirada de esta consulta. Abrí una nueva para otra lectura."
          : "No pudimos tirar las cartas. Probá de nuevo."
      );
      setPicked([]);
    } finally {
      setLoading(false);
    }
  }

  function nextReveal() {
    const seed = (window as unknown as { __almaSeed?: string }).__almaSeed ?? "";
    onDrawn(cards, seed);
  }

  const step = stage === "ask" ? 1 : stage === "reveal" ? 3 : 2;
  const allRevealed = cards.length > 0 && revealed >= cards.length;
  const small = cards.length > 5;

  return (
    <div className="flex min-h-[60dvh] flex-col items-center px-1 py-2">
      <Stepper step={step} />

      <AnimatePresence mode="wait">
        {stage === "ask" && (
          <motion.div
            key="ask"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 w-full max-w-md space-y-5 text-center"
          >
            <TarotCardBack className="mx-auto h-36 drop-shadow-[0_0_24px_rgba(233,189,121,0.35)]" />
            <h2 className="font-display text-2xl text-gold-soft">Tu intención</h2>
            <p className="text-sm leading-relaxed text-ivory/80">
              Tomate un momento. Respirá. Si querés, escribí la pregunta o el tema
              que querés mirar hoy — también podés dejar que las cartas hablen solas.
            </p>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="¿Qué querés explorar? (opcional)"
              className="input resize-none"
            />
            <button onClick={() => setStage("shuffle")} className="btn-gold w-full py-3.5">
              Estoy lista/o
            </button>
          </motion.div>
        )}

        {stage === "shuffle" && (
          <motion.div
            key="shuffle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-10 text-center"
            onAnimationComplete={() => setTimeout(() => setStage("pick"), 1800)}
          >
            <div className="relative mx-auto h-48 w-32">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0"
                  animate={{ x: [0, i % 2 ? 22 : -22, 0], rotate: [0, i % 2 ? 4 : -4, 0] }}
                  transition={{ repeat: 2, duration: 0.6, ease: "easeInOut" }}
                  style={{ zIndex: 3 - i }}
                >
                  <TarotCardBack className="h-full w-full" />
                </motion.div>
              ))}
            </div>
            <p className="mt-8 font-display text-xl text-ivory/90">Barajando tu energía…</p>
            <p className="mt-2 text-xs text-mist/60">La selección de cartas es aleatoria y verificable.</p>
          </motion.div>
        )}

        {stage === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 w-full text-center">
            <p className="mx-auto max-w-[17rem] text-base text-ivory/90">
              Concentrate en tu consulta y elegí {needed} carta{needed > 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-xs text-gold/80">{picked.length} de {needed}</p>

            {error && <p className="mt-3 text-sm text-rose">{error}</p>}

            {/* Abanico */}
            <div className="relative mx-auto mt-6 h-64 w-full max-w-md overflow-visible">
              {Array.from({ length: fanCount }).map((_, i) => {
                const t = i / (fanCount - 1);
                const angle = -40 + t * 80;
                const isPicked = picked.includes(i);
                return (
                  <motion.button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={loading}
                    initial={{ opacity: 0, y: 60, rotate: 0 }}
                    animate={{ opacity: isPicked ? 0 : 1, y: isPicked ? -90 : 0, rotate: angle }}
                    transition={{ delay: i * 0.025, type: "spring", stiffness: 240, damping: 22 }}
                    whileHover={{ y: -18 }}
                    whileTap={{ scale: 0.96 }}
                    className="absolute left-1/2 top-4 h-44 w-28 drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]"
                    style={{ marginLeft: -56, transformOrigin: "50% 160%" }}
                    aria-label={`Carta ${i + 1}`}
                  >
                    <TarotCardBack className="h-full w-full" />
                  </motion.button>
                );
              })}
            </div>

            <div className="relative mx-auto mt-2 max-w-sm overflow-hidden rounded-2xl border border-gold/25 bg-plum/40 px-5 py-4 text-sm text-ivory/85 backdrop-blur">
              {loading
                ? "Las cartas están saliendo…"
                : "Elegí las cartas que más te llamen la atención. No hay una elección correcta."}
            </div>
            <MoonCandlesArt className="mx-auto -mt-1 h-24 opacity-80" />
          </motion.div>
        )}

        {stage === "reveal" && cards.length > 0 && (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 w-full text-center">
            <h2 className="font-display text-2xl text-gold-soft">Tu lectura</h2>

            {/* Cartas boca abajo que se dan vuelta */}
            <div className={`mt-4 flex flex-wrap justify-center ${small ? "gap-1.5" : "gap-3"}`}>
              {cards.map((c, i) => {
                const shown = i < revealed;
                return (
                  <div key={c.cardId + i} className="text-center" style={{ perspective: 800 }}>
                    <motion.div
                      animate={{ rotateY: shown ? 0 : 180 }}
                      initial={{ rotateY: 180 }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className={small ? "h-28 w-[4.4rem]" : "h-40 w-[6.3rem]"}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {shown ? (
                        <TarotCardFace code={c.code} name={c.name} reversed={c.reversed} className="h-full w-full drop-shadow-[0_0_16px_rgba(233,189,121,0.35)]" />
                      ) : (
                        <TarotCardBack className="h-full w-full" />
                      )}
                    </motion.div>
                    <p className={`mt-1 font-display uppercase tracking-wide text-gold-soft ${small ? "text-[8px]" : "text-[10px]"}`}>
                      {c.positionName}
                    </p>
                  </div>
                );
              })}
            </div>

            {!allRevealed ? (
              <button onClick={() => setRevealed((r) => r + 1)} className="btn-violet mt-6 px-8 py-3 text-sm">
                {revealed === 0 ? "Revelar primera carta" : `Revelar ${cards[revealed].positionName.toLowerCase()}`}
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3 text-left">
                <h3 className="text-center font-display text-xl text-ivory">Una mirada a tu camino</h3>
                <div className="space-y-2">
                  {cards.map((c, i) => (
                    <div key={c.cardId + "r" + i} className="row-mystic">
                      <span className="thumb h-14 w-10 shrink-0">
                        <TarotCardFace code={c.code} name={c.name} reversed={c.reversed} className="h-full w-full" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base text-gold-soft">{c.positionName}</p>
                        <p className="text-sm text-ivory">
                          {c.name}
                          {c.reversed && <span className="ml-1 text-xs text-rose">(invertida)</span>}
                        </p>
                        <p className="truncate text-xs text-mist">{c.keywords}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={nextReveal} className="btn-gold mt-2 w-full py-3.5">
                  Ir a la interpretación
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Tu intención", "Seleccioná", "Lectura"];
  return (
    <div className="flex w-full max-w-xs items-start justify-between">
      {labels.map((l, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={l} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <span className={`absolute right-1/2 top-3 h-px w-full ${n <= step ? "bg-gold/70" : "bg-mist/25"}`} />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                active ? "bg-gold text-night shadow-[0_0_12px_rgba(233,189,121,0.7)]" : done ? "bg-gold/70 text-night" : "border border-mist/40 bg-night text-mist"
              }`}
            >
              {n}
            </span>
            <span className={`mt-1 text-[10px] ${active ? "text-gold-soft" : "text-mist/70"}`}>{l}</span>
          </div>
        );
      })}
    </div>
  );
}
