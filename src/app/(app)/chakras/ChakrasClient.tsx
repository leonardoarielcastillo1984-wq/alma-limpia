"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export interface ChakraInfo {
  key: string;
  name: string;
  sanskrit: string;
  color: string;
  element: string;
  symbolism: string;
  questions: string[];
  exercise: string;
  y: number; // posición vertical en la figura (0-100)
}

export const CHAKRAS: ChakraInfo[] = [
  {
    key: "corona", name: "Corona", sanskrit: "Sahasrara", color: "#c084fc", element: "Consciencia",
    symbolism: "La conexión con lo que te supera: propósito, sentido, espiritualidad.",
    questions: ["¿Siento que lo que hago tiene sentido?", "¿Me permito momentos de silencio y contemplación?"],
    exercise: "Sentate 2 minutos en silencio, mirada suave al frente. Sin buscar nada: solo estar.",
    y: 6,
  },
  {
    key: "tercer-ojo", name: "Tercer ojo", sanskrit: "Ajna", color: "#818cf8", element: "Luz",
    symbolism: "La intuición y la capacidad de ver más allá de lo evidente.",
    questions: ["¿Escucho mi intuición o la tapo con ruido?", "¿Qué 'sé' sin saber cómo lo sé?"],
    exercise: "Cerrá los ojos y llevá la atención al entrecejo. Respirá 10 veces imaginando una luz violeta ahí.",
    y: 20,
  },
  {
    key: "garganta", name: "Garganta", sanskrit: "Vishuddha", color: "#38bdf8", element: "Éter",
    symbolism: "La expresión: decir lo que sentís y escuchar de verdad.",
    questions: ["¿Hay algo que callo y me pesa?", "¿Cuándo fue la última vez que dije la verdad entera?"],
    exercise: "Escribí una frase que no te animás a decir. No hace falta enviarla: ponerla en palabras ya alivia.",
    y: 35,
  },
  {
    key: "corazon", name: "Corazón", sanskrit: "Anahata", color: "#4ade80", element: "Aire",
    symbolism: "El amor que das y recibís, la compasión, el perdón.",
    questions: ["¿Me trato con la misma ternura que trato a otros?", "¿Hay alguien a quien deba un perdón — incluida yo?"],
    exercise: "Mano al pecho. Tres respiraciones largas pensando en alguien que querés, y una en vos.",
    y: 48,
  },
  {
    key: "plexo", name: "Plexo solar", sanskrit: "Manipura", color: "#facc15", element: "Fuego",
    symbolism: "La confianza, la voluntad, el 'yo puedo'.",
    questions: ["¿Dónde siento que pierdo mi poder?", "¿Qué haría si confiara un 10% más en mí?"],
    exercise: "Posturate firme, hombros atrás, 30 segundos. El cuerpo le avisa a la mente que puede.",
    y: 60,
  },
  {
    key: "sacro", name: "Sacro", sanskrit: "Svadhisthana", color: "#fb923c", element: "Agua",
    symbolism: "La creatividad, el placer, el fluir emocional.",
    questions: ["¿Cuándo fue la última vez que hice algo solo por gusto?", "¿Me permito sentir sin juzgar?"],
    exercise: "Hacé 5 minutos de algo creativo sin objetivo: dibujar, moverte, cantar. Lo que salga, está bien.",
    y: 73,
  },
  {
    key: "raiz", name: "Raíz", sanskrit: "Muladhara", color: "#f43f5e", element: "Tierra",
    symbolism: "La seguridad, el cuerpo, lo concreto: casa, trabajo, necesidades básicas.",
    questions: ["¿Mis necesidades básicas están cubiertas y ordenadas?", "¿Dónde siento inseguridad material?"],
    exercise: "Pisá firme el piso, sentí los pies. Respirá nombrando 5 cosas concretas que te sostienen hoy.",
    y: 87,
  },
];

export function ChakrasClient() {
  const [selected, setSelected] = useState<ChakraInfo | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  return (
    <div className="animate-fade-up mx-auto max-w-md">
      <header className="mb-4 flex items-center gap-3 border-b border-violet/15 pb-4">
        <Link
          href="/explorar/energia"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 text-center">
          <h1 className="font-display text-2xl text-gold-soft">Los siete chakras</h1>
          <p className="text-[11px] text-mist/80">Tocá cada punto de luz para explorarlo</p>
        </div>
        <span className="w-9" />
      </header>

      <div className="relative flex justify-center">
        {/* Figura */}
        <div className="relative h-[430px] w-40">
          {/* silueta */}
          <div className="absolute left-1/2 top-0 h-12 w-12 -translate-x-1/2 rounded-full border border-violet/30 bg-gradient-to-b from-plum/60 to-transparent" />
          <div className="absolute left-1/2 top-10 h-[360px] w-20 -translate-x-1/2 rounded-[45%] border border-violet/20 bg-gradient-to-b from-plum/30 via-violet-deep/20 to-plum/40" />
          {/* columna */}
          <div className="absolute left-1/2 top-8 h-[370px] w-0.5 -translate-x-1/2 bg-gradient-to-b from-violet/10 via-violet/30 to-violet/10" />
          {/* chakras */}
          {CHAKRAS.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelected(c)}
              aria-label={`Chakra ${c.name}`}
              className="group absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ top: `${c.y}%` }}
            >
              <span
                className="block h-7 w-7 rounded-full border-2 transition-transform group-hover:scale-125"
                style={{
                  background: c.color,
                  borderColor: done.has(c.key) ? "#e9bd79" : "rgba(245,239,231,0.5)",
                  boxShadow: `0 0 18px ${c.color}, 0 0 34px ${c.color}55`,
                }}
              />
              {done.has(c.key) && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[9px] text-ink">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Panel */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card-mystic ml-4 max-h-[430px] flex-1 overflow-y-auto p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-5 w-5 rounded-full"
                  style={{ background: selected.color, boxShadow: `0 0 12px ${selected.color}` }}
                />
                <div>
                  <h2 className="font-display text-lg leading-tight text-ivory">{selected.name}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-mist/70">
                    {selected.sanskrit} · {selected.element}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-ivory/85">{selected.symbolism}</p>

              <h3 className="mt-4 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-gold/80">
                <Sparkles size={11} /> Para reflexionar
              </h3>
              <ul className="mt-1.5 space-y-1 text-xs text-mist">
                {selected.questions.map((q, i) => (
                  <li key={i}>✦ {q}</li>
                ))}
              </ul>

              <div className="mt-4 rounded-lg border border-violet/20 bg-violet/5 p-3">
                <p className="text-[10px] uppercase tracking-widest text-lilac">Ejercicio sugerido</p>
                <p className="mt-1 text-xs leading-relaxed text-ivory/85">{selected.exercise}</p>
              </div>

              <button
                onClick={() => {
                  setDone((d) => new Set(d).add(selected.key));
                  setSelected(null);
                }}
                className="btn-violet mt-4 w-full py-2 text-xs"
              >
                Explorado ✓
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-mist/70">
        {done.size === CHAKRAS.length
          ? "✨ Recorriste los siete chakras. Tu energía, en un solo mapa."
          : `${done.size} de ${CHAKRAS.length} chakras explorados. Esto es simbólico y reflexivo, no un diagnóstico.`}
      </p>
    </div>
  );
}
