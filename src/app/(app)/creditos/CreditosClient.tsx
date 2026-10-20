"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { api } from "@/lib/api";

const PACKS = [
  { id: "p10", credits: 10, price: 3000, tag: "Para probar" },
  { id: "p25", credits: 25, price: 6500, tag: "Popular", popular: true },
  { id: "p60", credits: 60, price: 13000, tag: "Mejor valor" },
] as const;

export function CreditosClient() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(pack: string) {
    setLoading(pack);
    setError(null);
    try {
      const res = await api<{ initPoint: string; mode: string }>("/api/pagos/checkout", {
        method: "POST",
        json: { type: "credits", pack },
      });
      router.push(res.initPoint);
    } catch {
      setError("No pudimos iniciar el pago. Probá de nuevo.");
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-4">
      {PACKS.map((p) => (
        <div
          key={p.id}
          className={`card-mystic flex items-center justify-between p-5 ${
            "popular" in p && p.popular ? "border-gold/50 shadow-gold" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold/25 to-violet-deep">
              <Coins className="text-gold" size={22} />
            </div>
            <div>
              <p className="font-semibold text-ivory">{p.credits} créditos</p>
              <p className="text-xs text-mist">{p.tag}</p>
            </div>
          </div>
          <button
            onClick={() => buy(p.id)}
            disabled={!!loading}
            className="btn-gold px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {loading === p.id ? "…" : `$${p.price.toLocaleString("es-AR")}`}
          </button>
        </div>
      ))}
      {error && <p className="text-center text-sm text-rose">{error}</p>}
      <p className="text-center text-[11px] leading-relaxed text-mist/60">
        Pagos procesados por Mercado Pago. Nunca guardamos datos de tu tarjeta.
      </p>
    </div>
  );
}
