"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Moon, Sparkles, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

type Step = 0 | 1 | 2;

const input =
  "w-full rounded-xl border border-gold/25 bg-cosmic/60 px-4 py-3 text-ivory placeholder:text-mist/50 focus:border-gold/60 focus:outline-none";

export function BienvenidaClient({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialName ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initialName);

  async function save(data: Record<string, string>) {
    setLoading(true);
    setError(null);
    try {
      await api("/api/me", { method: "PATCH", json: data });
      return true;
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function stepName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = new FormData(e.currentTarget).get("name") as string;
    setName(n);
    if (await save({ displayName: n })) setStep(1);
  }

  async function stepBirth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await save({
      birthDate: fd.get("birthDate") as string,
      birthTime: (fd.get("birthTime") as string) || "",
      birthCity: fd.get("birthCity") as string,
      birthCountry: fd.get("birthCountry") as string,
    });
    if (ok) setStep(2);
  }

  const dots = (
    <div className="mb-8 flex justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? "bg-gold" : "bg-mist/20"}`} />
      ))}
    </div>
  );

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-2 py-8">
      {dots}

      {step === 0 && (
        <form onSubmit={stepName} className="space-y-5 text-center">
          <Moon size={36} className="mx-auto text-gold-soft" />
          <h1 className="font-display text-2xl text-gold-soft">¿Cómo te llamás?</h1>
          <p className="text-sm text-mist">Tu universo empieza con tu nombre.</p>
          <input name="name" required minLength={2} defaultValue={name} placeholder="Tu nombre" className={input} />
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gold w-full py-3 disabled:opacity-60">
            {loading ? "Guardando…" : "Continuar"}
          </button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={stepBirth} className="space-y-5">
          <div className="text-center">
            <Sparkles size={36} className="mx-auto text-gold-soft" />
            <h1 className="mt-2 font-display text-2xl text-gold-soft">Tus datos de nacimiento</h1>
            <p className="mt-1 text-sm text-mist">
              Hora y ciudad precisas me dan tu ascendente y las casas. Podés completarlo después.
            </p>
          </div>
          <label className="block text-xs uppercase tracking-widest text-mist">
            Fecha de nacimiento
            <input name="birthDate" type="date" required className={`${input} mt-1`} />
          </label>
          <label className="block text-xs uppercase tracking-widest text-mist">
            Hora (opcional — mejora la carta)
            <input name="birthTime" type="time" className={`${input} mt-1`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs uppercase tracking-widest text-mist">
              Ciudad
              <input name="birthCity" required placeholder="Buenos Aires" className={`${input} mt-1`} />
            </label>
            <label className="block text-xs uppercase tracking-widest text-mist">
              País
              <input name="birthCountry" required placeholder="Argentina" className={`${input} mt-1`} />
            </label>
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gold w-full py-3 disabled:opacity-60">
            {loading ? "Calculando tu cielo…" : "Ver mi carta natal"}
          </button>
          <button type="button" onClick={() => setStep(2)} className="w-full text-sm text-mist hover:text-ivory">
            Lo hago después
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-5 text-center">
          <Sparkles size={36} className="mx-auto text-gold-soft" />
          <h1 className="font-display text-2xl text-gold-soft">
            Bienvenida/o{name ? `, ${name}` : ""}
          </h1>
          <p className="text-sm leading-relaxed text-mist">
            Tu espacio está listo. Tu carta natal ya se calculó — es tuya, gratis.
            Explorá oráculos, rituales y tu diario.
          </p>
          <Link href="/carta-natal" className="btn-gold inline-flex w-full items-center justify-center gap-2 py-3">
            Mi carta natal <ArrowRight size={16} />
          </Link>
          <Link href="/inicio" className="block text-sm text-mist hover:text-ivory">
            Ir a mi universo
          </Link>
          <button onClick={() => router.push("/inicio")} className="hidden" />
        </div>
      )}
    </div>
  );
}
