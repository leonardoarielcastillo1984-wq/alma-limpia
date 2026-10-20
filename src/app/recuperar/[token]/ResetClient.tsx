"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export function ResetClient({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const confirm = fd.get("confirm") as string;
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth/reset", { method: "POST", json: { token, password } });
      setDone(true);
    } catch {
      setError("El enlace venció o ya fue usado. Pedí uno nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-2xl text-gold-soft">Nueva contraseña</h1>
      {done ? (
        <div className="card-mystic mt-5 p-6 text-center">
          <p className="text-sm text-ivory/90">Tu contraseña ya cambió. Podés entrar de nuevo.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-gold-soft hover:text-gold">
            Ir a ingresar →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Nueva contraseña (mín. 8)"
            className="w-full rounded-xl border border-gold/25 bg-cosmic/60 px-4 py-3 text-ivory placeholder:text-mist/50 focus:border-gold/60 focus:outline-none"
          />
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            placeholder="Repetí la contraseña"
            className="w-full rounded-xl border border-gold/25 bg-cosmic/60 px-4 py-3 text-ivory placeholder:text-mist/50 focus:border-gold/60 focus:outline-none"
          />
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gold w-full py-3 disabled:opacity-60">
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
          <Link href="/recuperar" className="block text-center text-sm text-mist hover:text-ivory">
            Pedir otro enlace
          </Link>
        </form>
      )}
    </div>
  );
}
