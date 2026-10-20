"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Send, ArrowLeft, Mic, MicOff } from "lucide-react";
import { TarotExperience } from "@/components/tarot/TarotExperience";
import { TarotCardFace } from "@/components/tarot/TarotCardArt";
import { CrescentMoon } from "@/components/cosmic/CrescentMoon";

interface Msg {
  id: string;
  role: "USER" | "GUIDE" | "SYSTEM";
  kind: string;
  content: string;
  payload?: unknown;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface CardPick {
  cardId: string;
  code: string;
  name: string;
  positionName: string;
  reversed: boolean;
  keywords: string;
}

interface Props {
  consultation: {
    id: string;
    serviceName: string;
    serviceKind: string;
    serviceSlug: string;
    categorySlug: string;
    engineConfig: Record<string, unknown>;
  };
  initialMessages: Msg[];
  tarotReading: {
    id: string;
    spread: string;
    cards: unknown[];
    interpretation: string | null;
  } | null;
}

export function ConsultaClient({ consultation, initialMessages, tarotReading }: Props) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [phase, setPhase] = useState<"chat" | "tarot">(
    // Si el servicio es TAROT y todavía no hay tirada, arrancamos en experiencia tarot
    consultation.serviceKind === "TAROT" && !tarotReading ? "tarot" : "chat"
  );
  const [reading, setReading] = useState<CardPick[] | null>(
    tarotReading ? (tarotReading.cards as CardPick[]) : null
  );
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const spread = (consultation.engineConfig.spread as string | undefined) ?? "three";

  // Preguntas sugeridas según el servicio (o genéricas por kind)
  const defaultQs: Record<string, string[]> = {
    TAROT: ["¿Qué tengo que ver de esta situación?", "¿Qué me conviene soltar?", "¿Qué energía me acompaña?"],
    CHAT: ["¿Por dónde empiezo?", "Siento que algo se repite en mi vida…", "Necesito claridad sobre un vínculo"],
    READING: ["¿Qué simboliza esto para mí?", "¿Qué parte de mí habla acá?", "¿Cómo lo aplico a mi vida?"],
  };
  const suggestions = (
    (consultation.engineConfig.questions as string[] | undefined) ??
    defaultQs[consultation.serviceKind] ??
    defaultQs.CHAT
  ).slice(0, 3);
  const showSuggestions = suggestions.length > 0 && messages.length <= 1 && !reading && phase === "chat";

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return; // navegador sin soporte: el micrófono no se muestra
    const rec = new Ctor();
    rec.lang = "es-AR";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      const text = Array.from(ev.results).map((r) => r[0].transcript).join("");
      setInput(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }
  const voiceSupported =
    typeof window !== "undefined" &&
    !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function askGuide(content: string) {
    // Envía el mensaje del usuario y consume la respuesta de la guía
    // como stream progresivo (efecto "escribe de a poco").
    const streamId = `stream-${Date.now()}`;
    setMessages((m) => [...m, { id: streamId, role: "GUIDE", kind: "text", content: "" }]);
    try {
      const res = await fetch(`/api/consultas/${consultation.id}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-stream": "1" },
        body: JSON.stringify({ content }),
        credentials: "same-origin",
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data.error ?? `HTTP ${res.status}`) as Error & { status?: number };
        err.status = res.status;
        throw err;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const payload = JSON.parse(line.slice(5)) as { delta?: string; done?: boolean; id?: string };
            if (payload.delta) {
              const d = payload.delta;
              setMessages((m) => m.map((x) => (x.id === streamId ? { ...x, content: x.content + d } : x)));
            }
            if (payload.done && payload.id) {
              setMessages((m) => m.map((x) => (x.id === streamId ? { ...x, id: payload.id! } : x)));
            }
          } catch { /* chunk parcial */ }
        }
      }
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      setMessages((m) =>
        m.map((x) =>
          x.id === streamId
            ? {
                ...x,
                content:
                  status === 402
                    ? "Para seguir necesitás créditos o pago. Podés cargar desde tu perfil."
                    : status === 429
                      ? "Llegamos al límite de esta consulta. Podés abrir una nueva cuando quieras."
                      : "Tuve un problema técnico. Probemos de nuevo en un momento.",
              }
            : x
        )
      );
    } finally {
      setSending(false);
    }
  }

  async function send(e?: React.FormEvent, quick?: string) {
    e?.preventDefault();
    const content = (quick ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "USER", kind: "text", content }]);
    await askGuide(content);
  }

  async function onTarotDrawn(cards: CardPick[], seed: string) {
    setReading(cards);
    setPhase("chat");
    setMessages((m) => [
      ...m,
      {
        id: `cards-${Date.now()}`,
        role: "SYSTEM",
        kind: "cards",
        content: `Elegiste: ${cards.map((c) => c.name + (c.reversed ? " ↺" : "")).join(", ")}`,
        payload: { cards, seed },
      },
    ]);
    // Pedir interpretación automática — las cartas ya están en el historial del server
    setSending(true);
    await askGuide(
      "Ya elegí mis cartas. Interpretalas para mí, por favor — conectalas entre sí y con lo que venga de mi pregunta."
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      {/* Header */}
      <header className="mb-4 flex items-center gap-3 border-b border-violet/15 pb-3">
        <Link
          href={`/explorar/${consultation.categorySlug}/${consultation.serviceSlug}`}
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
        >
          <ArrowLeft size={20} />
        </Link>
        {phase === "tarot" ? (
          <h1 className="flex-1 pr-9 text-center font-display text-2xl text-gold-soft">{consultation.serviceName}</h1>
        ) : (
          <>
            <GuideAvatar size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl leading-tight text-ivory">Tu guía espiritual</h1>
              <p className="flex items-center gap-1.5 truncate text-[11px] text-mist/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {consultation.serviceName} · en línea
              </p>
            </div>
            {consultation.serviceKind === "TAROT" && !reading && (
              <button onClick={() => setPhase("tarot")} className="btn-ghost px-4 py-1.5 text-xs">
                Elegir cartas
              </button>
            )}
          </>
        )}
      </header>

      <AnimatePresence mode="wait">
        {phase === "tarot" && consultation.serviceKind === "TAROT" ? (
          <motion.div
            key="tarot"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex-1"
          >
            <TarotExperience
              consultationId={consultation.id}
              spread={spread}
              deck={(consultation.engineConfig.deck as string | undefined) ?? "rider"}
              onDrawn={onTarotDrawn}
            />
          </motion.div>
        ) : (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col">
            {/* Mensajes */}
            <div className="flex-1 space-y-4 overflow-y-auto pb-4">
              {messages
                .filter((m) => m.role !== "SYSTEM" || m.kind === "cards")
                .map((m) => (
                  <ChatBubble key={m.id} msg={m} />
                ))}
              {sending && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Preguntas sugeridas */}
            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pb-3">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(undefined, q)}
                    disabled={sending}
                    className="rounded-full border border-violet/30 bg-plum/30 px-3.5 py-1.5 text-xs text-lilac transition hover:border-gold/40 hover:text-gold-soft"
                  >
                    ✦ {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={send}
              className="sticky bottom-20 flex items-center gap-2 rounded-full border border-violet/30 bg-[#1a0d33]/90 py-1.5 pl-5 pr-1.5 backdrop-blur"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Escuchando…" : "Escribí tu mensaje…"}
                maxLength={2000}
                className="flex-1 bg-transparent text-sm text-ivory placeholder:text-mist/50 focus:outline-none"
              />
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  aria-label={listening ? "Dejar de dictar" : "Dictar mensaje"}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                    listening ? "bg-rose/20 text-rose" : "text-mist hover:text-gold"
                  }`}
                >
                  {listening ? <MicOff size={17} /> : <Mic size={17} />}
                </button>
              )}
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="btn-violet flex h-10 w-10 shrink-0 items-center justify-center disabled:opacity-50"
                aria-label="Enviar"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatBubble({ msg }: { msg: Msg }) {
  if (msg.role === "SYSTEM" && msg.kind === "cards") {
    const cards = (msg.payload as { cards?: CardPick[] })?.cards ?? [];
    return (
      <div className="card-mystic mx-auto w-full max-w-md p-4">
        <p className="mb-3 text-center text-xs uppercase tracking-widest text-gold/80">
          Tus cartas
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {cards.map((c, i) => (
            <div key={i} className="text-center">
              <TarotCardFace code={c.code} name={c.name} reversed={c.reversed} className="mx-auto h-24 w-[3.8rem]" />
              <p className="mt-1 max-w-[70px] text-[10px] leading-tight text-mist">
                {c.name}
                {c.reversed && <span className="text-rose"> ↺</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isUser = msg.role === "USER";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <GuideAvatar size="sm" />}
      <div
        className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-md bg-gradient-to-br from-[#c4a3f7] to-[#8a5fe0] text-white shadow-[0_4px_18px_rgba(180,140,242,0.3)]"
            : "rounded-bl-md border border-violet/20 bg-[#24123f]/85 text-ivory/95"
        }`}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

function GuideAvatar({ size }: { size: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-11 w-11" : "h-7 w-7";
  return (
    <span
      className={`${dim} flex shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gradient-to-br from-[#6b3aa8] to-[#22103f] shadow-[0_0_14px_rgba(233,189,121,0.25)]`}
    >
      <CrescentMoon size={size === "lg" ? 26 : 16} />
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 text-mist">
      <GuideAvatar size="sm" />
      <div className="flex gap-1.5 rounded-2xl rounded-bl-md border border-violet/20 bg-[#24123f]/85 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-twinkle rounded-full bg-gold"
            style={{ animationDelay: `${i * 0.25}s`, animationDuration: "1.2s" }}
          />
        ))}
      </div>
      <span className="text-[11px]">la guía está escribiendo…</span>
    </div>
  );
}
