"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export function RecuperarClient() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const email = new FormData(e.currentTarget).get("email") as string;
      await api("/api/auth/forgot", { method: "POST", json: { email } });
      setSent(true);
    } catch {
      setError("No pudimos procesar tu pedido. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-2xl text-gold-soft">Recuperar acceso</h1>
      {sent ? (
        <div className="card-mystic mt-5 p-6 text-center">
          <p className="text-sm text-ivory/90">
            Si ese email tiene una cuenta, te enviamos un enlace para crear una nueva contraseña.
            Revisá tu bandeja (y spam).
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-gold-soft hover:text-gold">
            ← Volver al inicio
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <p className="text-sm text-mist">
            Escribí el email de tu cuenta y te enviamos un enlace para recuperar el acceso.
          </p>
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-xl border border-gold/25 bg-cosmic/60 px-4 py-3 text-ivory placeholder:text-mist/50 focus:border-gold/60 focus:outline-none"
          />
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gold w-full py-3 disabled:opacity-60">
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>
          <Link href="/" className="block text-center text-sm text-mist hover:text-ivory">
            Volver
          </Link>
        </form>
      )}
    </div>
  );
}
