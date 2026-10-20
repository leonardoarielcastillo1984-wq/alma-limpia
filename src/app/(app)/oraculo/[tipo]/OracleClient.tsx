"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface Rune {
  glyph: string; name: string; meaning: string; reversed: boolean; reversedMeaning?: string;
}
interface IChingLine { yang: boolean; moving: boolean }
interface Result {
  seed?: string;
  answer?: string;
  swing?: string;
  runes?: Rune[];
  lines?: IChingLine[];
  hexagramNumber?: number;
  name?: string;
  judgment?: string;
  changedHexagramNumber?: number;
  hall?: string;
  symbol?: string;
  fragment?: string;
  theme?: string;
}

type Step = "form" | "analyzing" | "result";
type Oracle = "pendulo" | "runas" | "iching" | "akashico";

// Qué pide cada oráculo antes de "analizar" — hace la experiencia sentirse real
const AREAS = [
  "amor y vínculos", "trabajo y proyectos", "dinero y recursos",
  "salud y energía", "familia y hogar", "espíritu y camino",
];

const STAGES: Record<Oracle, string[]> = {
  pendulo: [
    "Me concentro en tu pregunta…",
    "El péndulo empieza a moverse…",
    "Leyendo la oscilación…",
  ],
  runas: [
    "Dejo caer las runas sobre el paño…",
    "Tres runas te eligieron…",
    "Leyendo sus vínculos entre sí…",
  ],
  iching: [
    "Formando las seis líneas…",
    "Marcando las líneas móviles…",
    "Consultando el Libro de las Mutaciones…",
  ],
  akashico: [
    "Pronunciando tu nombre ante el registro…",
    "El salón de los registros se abre…",
    "Buscando el fragmento que te corresponde…",
  ],
};

// Prefijo del título de diario que corresponde a cada oráculo
const TITLE_PREFIX: Record<Oracle, string> = {
  pendulo: "Péndulo",
  runas: "Runas",
  iching: "I Ching",
  akashico: "Registro akáshico",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function OracleClient({ oracle, name, desc }: { oracle: Oracle; name: string; desc: string }) {
  const [step, setStep] = useState<Step>("form");
  const [question, setQuestion] = useState("");
  const [area, setArea] = useState("");
  const [querent, setQuerent] = useState("");
  const [birth, setBirth] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [lastDraw, setLastDraw] = useState<{ title: string; createdAt: string } | null>(null);

  // Tu diario recuerda la última tirada de este mismo oráculo
  useEffect(() => {
    api<{ entries: { title: string | null; createdAt: string }[] }>("/api/journal?kind=oraculo")
      .then((r) => {
        const e = r.entries.find((x) => x.title?.startsWith(TITLE_PREFIX[oracle]));
        if (e?.title) setLastDraw({ title: e.title, createdAt: e.createdAt });
      })
      .catch(() => {});
  }, [oracle]);

  // Cicla las etapas de análisis mientras dura el paso
  useEffect(() => {
    if (step !== "analyzing") return;
    setStage(0);
    const t = setInterval(() => setStage((s) => s + 1), 900);
    return () => clearInterval(t);
  }, [step]);

  const needsArea = oracle === "runas";
  const needsQuerent = oracle === "akashico";
  const questionRequired = oracle === "pendulo" || oracle === "iching";

  const valid =
    (!questionRequired || question.trim().length >= 4) &&
    (!needsArea || !!area) &&
    (!needsQuerent || (querent.trim().length >= 3 && !!birth));

  async function draw() {
    setError(null);
    setResult(null);
    setInterpretation(null);
    setStep("analyzing");

    const context =
      oracle === "akashico"
        ? `Nombre: ${querent.trim()}. Nació el ${birth}.`
        : oracle === "runas" && area
          ? `Área de consulta: ${area}.`
          : undefined;

    try {
      const [res] = await Promise.all([
        api<{ result: Result; interpretation: string | null }>("/api/oraculos", {
          method: "POST",
          json: { oracle, question: question.trim() || undefined, context, interpret: true },
        }),
        sleep(2700), // el análisis nunca dura menos que sus etapas
      ]);
      setResult(res.result);
      setInterpretation(res.interpretation);
      setStep("result");
    } catch (e) {
      setError(
        (e as { status?: number }).status === 402
          ? "Ya usaste esta consulta. Para hacer otra, volvé a la página del servicio."
          : "No pudimos hacer el sorteo. Probá de nuevo."
      );
      setStep("form");
    }
  }

  function reset() {
    setStep("form");
    setResult(null);
    setInterpretation(null);
    setError(null);
  }

  const stageText = STAGES[oracle][Math.min(stage, STAGES[oracle].length - 1)];

  return (
    <div className="animate-fade-up mx-auto max-w-md">
      <header className="mb-5 flex items-center gap-3 border-b border-violet/15 pb-4">
        <Link
          href={oracle === "akashico" ? "/explorar/alma" : "/explorar/oraculo"}
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 text-center">
          <h1 className="font-display text-2xl text-gold-soft">{name}</h1>
          <p className="text-[11px] text-mist/80">{desc}</p>
        </div>
        <span className="w-9" />
      </header>

      <AnimatePresence mode="wait">
        {/* PASO 1 — el oráculo pide tus datos */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card-mystic space-y-4 p-4"
          >
            {lastDraw && (
              <p className="rounded-lg border border-gold/15 bg-gold/5 px-3 py-2 text-center text-[11px] text-gold/80">
                Tu diario recuerda —{" "}
                {new Date(lastDraw.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}:{" "}
                {lastDraw.title}
              </p>
            )}
            {needsQuerent && (
              <>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-mist/70">
                    Tu nombre completo
                  </label>
                  <input
                    value={querent}
                    onChange={(e) => setQuerent(e.target.value)}
                    maxLength={80}
                    placeholder="Como figura en tu registro…"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-mist/70">
                    Tu fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    value={birth}
                    onChange={(e) => setBirth(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </>
            )}

            {needsArea && (
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-mist/70">
                  ¿Sobre qué área consultás?
                </label>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setArea(a)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        area === a
                          ? "border-gold/60 bg-gold/15 text-gold-soft"
                          : "border-violet/25 text-mist hover:border-violet/50"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-mist/70">
                {questionRequired
                  ? oracle === "pendulo"
                    ? "Tu pregunta de sí o no"
                    : "Contame tu situación"
                  : oracle === "akashico"
                    ? "¿Qué querés que te muestre tu registro? (opcional)"
                    : "Tu pregunta (opcional)"}
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={
                  oracle === "pendulo"
                    ? "Algo que se responda con sí o no…"
                    : oracle === "iching"
                      ? "Qué está pasando y qué necesitás saber…"
                      : oracle === "akashico"
                        ? "Un vínculo, un patrón que se repite, tu propósito…"
                        : "Concentrate en lo que querés preguntar…"
                }
                className="input w-full resize-none"
              />
            </div>

            <button onClick={draw} disabled={!valid} className="btn-violet w-full py-3.5 disabled:opacity-60">
              {oracle === "pendulo" && "Consultar el péndulo"}
              {oracle === "runas" && "Lanzar las runas"}
              {oracle === "iching" && "Arrojar las monedas"}
              {oracle === "akashico" && "Abrir mi registro"}
            </button>
            {error && <p className="text-center text-xs text-rose">{error}</p>}
          </motion.div>
        )}

        {/* PASO 2 — el análisis se siente real */}
        {step === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-10 flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
              className="relative flex h-24 w-24 items-center justify-center rounded-full border border-gold/25"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="h-10 w-10 rounded-full bg-gradient-to-b from-gold to-violet/60 shadow-[0_0_30px_rgba(233,189,121,0.5)]"
              />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.p
                key={stageText}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="font-display text-lg text-ivory/90"
              >
                {stageText}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {/* PASO 3 — la revelación */}
        {step === "result" && result && (
          <motion.section
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            {oracle === "pendulo" && result.answer && (
              <div className="card-mystic p-6 text-center">
                <p
                  className={`font-display text-4xl ${
                    result.answer === "sí"
                      ? "text-emerald-400"
                      : result.answer === "no"
                        ? "text-rose"
                        : "text-gold-soft"
                  }`}
                >
                  {result.answer === "sí" ? "Sí" : result.answer === "no" ? "No" : result.answer === "tal vez" ? "Tal vez" : "Reformulá"}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-mist">{result.swing}</p>
              </div>
            )}

            {oracle === "runas" && result.runes && (
              <div className="grid grid-cols-3 gap-3">
                {result.runes.map((r, i) => (
                  <div key={i} className={`card-mystic p-4 text-center ${r.reversed ? "opacity-80" : ""}`}>
                    <p className={`font-display text-4xl ${r.reversed ? "rotate-180 text-rose" : "text-gold-soft"}`}>
                      {r.glyph}
                    </p>
                    <p className="mt-2 text-xs font-medium text-ivory">{r.name}</p>
                    <p className="mt-1 text-[10px] leading-tight text-mist">
                      {r.reversed ? r.reversedMeaning ?? "energía bloqueada" : r.meaning}
                    </p>
                    {r.reversed && <p className="mt-1 text-[9px] text-rose/70">invertida</p>}
                  </div>
                ))}
              </div>
            )}

            {oracle === "iching" && result.lines && (
              <div className="card-mystic p-6">
                <div className="mb-4 flex flex-col items-center gap-2">
                  {[...result.lines].reverse().map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {l.yang ? (
                        <span className="h-3 w-24 rounded-sm bg-gold shadow-[0_0_10px_rgba(233,189,121,0.4)]" />
                      ) : (
                        <span className="flex w-24 gap-3">
                          <span className="h-3 flex-1 rounded-sm bg-gold shadow-[0_0_10px_rgba(233,189,121,0.4)]" />
                          <span className="h-3 flex-1 rounded-sm bg-gold shadow-[0_0_10px_rgba(233,189,121,0.4)]" />
                        </span>
                      )}
                      {l.moving && <span className="text-[9px] text-rose">●</span>}
                    </div>
                  ))}
                </div>
                <p className="text-center font-display text-2xl text-ivory">
                  {result.hexagramNumber}. {result.name}
                </p>
                <p className="mt-2 text-center text-xs leading-relaxed text-mist">{result.judgment}</p>
                {result.changedHexagramNumber && (
                  <p className="mt-2 text-center text-[11px] text-gold/80">
                    Con líneas móviles → se transforma en el hexagrama {result.changedHexagramNumber}
                  </p>
                )}
              </div>
            )}

            {oracle === "akashico" && result.hall && (
              <div className="card-mystic relative overflow-hidden p-6">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-deep/20 via-transparent to-transparent" />
                <div className="relative z-10 text-center">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-violet">El registro se abre en</p>
                  <p className="mt-1 font-display text-xl text-gold-soft">{result.hall}</p>
                  <div className="mx-auto my-4 h-px w-16 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                  <p className="font-display text-2xl text-ivory">{result.symbol}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-widest text-gold/80">{result.theme}</p>
                  <div className="mt-4 rounded-xl border border-gold/20 bg-plum/30 p-4">
                    <p className="font-display text-sm italic leading-relaxed text-ivory/90">
                      {result.fragment}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {interpretation && (
              <div className="card-mystic p-5">
                <h2 className="mb-2 font-display text-lg text-gold-soft">La guía interpreta</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ivory/90">
                  {interpretation}
                </p>
              </div>
            )}

            <p className="text-center text-[10px] text-mist/60">
              Sorteo verificable · seed {result.seed?.slice(0, 8)} · queda en tu diario
            </p>

            <button
              onClick={reset}
              className="btn-ghost mx-auto flex items-center gap-2 px-6 py-2.5 text-xs"
            >
              <RefreshCw size={13} /> Nueva consulta
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
