"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Layers, Sparkles, Flame, HandHeart } from "lucide-react";
import { Particles } from "@/components/cosmic/Particles";
import { HeroSceneArt } from "@/components/art/MysticArt";
import { api } from "@/lib/api";

const PILLARS = [
  { label: "Tarot", icon: Layers },
  { label: "Astrología", icon: Sparkles },
  { label: "Rituales", icon: Flame },
  { label: "Guía espiritual", icon: HandHeart },
];

export function SplashClient() {
  const router = useRouter();
  const [mode, setMode] = useState<"landing" | "auth">("landing");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  async function enter(path: string) {
    setEntering(true);
    // breve animación de "entrada al universo"
    setTimeout(() => router.push(path), 900);
  }

  async function asGuest() {
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth/guest", { method: "POST" });
      await enter("/inicio");
    } catch {
      setError("No pudimos iniciar la sesión de invitado. Probá de nuevo.");
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      if (authMode === "register") {
        await api("/api/auth/register", {
          method: "POST",
          json: {
            name: fd.get("name"),
            email: fd.get("email"),
            password: fd.get("password"),
          },
        });
      } else {
        await api("/api/auth/login", {
          method: "POST",
          json: { email: fd.get("email"), password: fd.get("password") },
        });
      }
      await enter(authMode === "register" ? "/bienvenida" : "/inicio");
    } catch (err) {
      const msg = (err as Error).message;
      setError(
        msg === "EMAIL_TAKEN"
          ? "Ese email ya tiene cuenta. Iniciá sesión."
          : msg === "INVALID_CREDENTIALS"
            ? "Email o contraseña incorrectos."
            : "Algo salió mal. Probá de nuevo."
      );
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center justify-end overflow-hidden px-6 pb-8">
      <HeroSceneArt className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-night/90" />
      <Particles count={16} />

      <AnimatePresence mode="wait">
        {!entering ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.15, filter: "blur(8px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex w-full max-w-md flex-col items-center text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.9 }}
              className="text-6xl font-medium text-gold-soft drop-shadow-[0_0_24px_rgba(233,189,121,0.45)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Alma Limpia
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-3 max-w-[16rem] text-lg leading-snug text-ivory/90"
            >
              Un espacio para conectar con tu esencia
            </motion.p>

            {mode === "landing" ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.7 }}
                className="mt-8 flex w-full flex-col gap-3"
              >
                <button
                  onClick={() => enter("/inicio")}
                  className="btn-gold flex items-center justify-center gap-3 px-8 py-4 text-base"
                >
                  Comenzar mi camino <ArrowRight size={18} />
                </button>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <button onClick={() => setMode("auth")} className="text-gold-soft hover:text-gold">
                    Ya tengo cuenta
                  </button>
                  <span className="text-mist/40">·</span>
                  <button
                    onClick={asGuest}
                    disabled={loading}
                    className="text-mist hover:text-ivory disabled:opacity-50"
                  >
                    {loading ? "Entrando…" : "Entrar como invitada/o"}
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-2">
                  {PILLARS.map(({ label, icon: Icon }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-plum/40 text-gold-soft backdrop-blur">
                        <Icon size={18} strokeWidth={1.6} />
                      </span>
                      <span className="text-[11px] leading-tight text-ivory/85">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                onSubmit={onSubmit}
                className="card-mystic mt-8 w-full space-y-4 p-6 text-left"
              >
                <div className="flex gap-2 text-sm">
                  {(["register", "login"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAuthMode(m)}
                      className={`flex-1 rounded-full py-2 transition ${
                        authMode === m ? "bg-violet-deep text-ivory" : "text-mist hover:text-ivory"
                      }`}
                    >
                      {m === "register" ? "Crear cuenta" : "Ingresar"}
                    </button>
                  ))}
                </div>

                {authMode === "register" && (
                  <input
                    name="name"
                    required
                    minLength={2}
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-gold/25 bg-cosmic/60 px-4 py-3 text-ivory placeholder:text-mist/50 focus:border-gold/60 focus:outline-none"
                  />
                )}
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className="w-full rounded-xl border border-gold/25 bg-cosmic/60 px-4 py-3 text-ivory placeholder:text-mist/50 focus:border-gold/60 focus:outline-none"
                />
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Contraseña (mín. 8)"
                  className="w-full rounded-xl border border-gold/25 bg-cosmic/60 px-4 py-3 text-ivory placeholder:text-mist/50 focus:border-gold/60 focus:outline-none"
                />

                {error && <p className="text-sm text-rose">{error}</p>}

                <button type="submit" disabled={loading} className="btn-gold w-full py-3 disabled:opacity-60">
                  {loading ? "Un momento…" : authMode === "register" ? "Crear mi espacio" : "Ingresar"}
                </button>
                {authMode === "login" && (
                  <Link href="/recuperar" className="w-full text-center text-xs text-mist/80 hover:text-gold">
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setMode("landing")}
                  className="w-full text-sm text-mist hover:text-ivory"
                >
                  Volver
                </button>
              </motion.form>
            )}

            <p className="mt-6 max-w-xs text-[10px] leading-relaxed text-mist/60">
              Las lecturas son experiencias de autoconocimiento y reflexión. No reemplazan
              asesoramiento médico, psicológico, legal ni financiero.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="portal"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: [0, 1, 0.9] }}
            transition={{ duration: 0.9, ease: "easeIn" }}
            className="h-40 w-40 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(233,189,121,0.9), rgba(169,124,232,0.5) 50%, transparent 75%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
