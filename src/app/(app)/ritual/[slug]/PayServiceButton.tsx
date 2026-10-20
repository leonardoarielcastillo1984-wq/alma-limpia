"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

/** Paywall para experiencias con pago directo (rituales, sin consulta previa). */
export function PayServiceButton({ serviceSlug, priceArs }: { serviceSlug: string; priceArs: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ initPoint: string }>("/api/pagos/checkout", {
        method: "POST",
        json: { type: "service", serviceSlug },
      });
      window.location.href = res.initPoint;
    } catch {
      setError("No pudimos iniciar el pago. Probá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {priceArs > 0 && (
        <button onClick={pay} disabled={loading} className="btn-gold w-full py-3.5 disabled:opacity-60">
          {loading ? "Abriendo pago…" : "Pagar y hacer el ritual"}
        </button>
      )}
      <button onClick={() => router.push("/creditos")} className="btn-ghost w-full py-3 text-sm">
        Usar créditos
      </button>
      {error && <p className="text-center text-xs text-rose">{error}</p>}
    </div>
  );
}
