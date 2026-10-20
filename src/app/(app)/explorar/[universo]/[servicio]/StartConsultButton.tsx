"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function StartConsultButton({
  serviceSlug,
  label = "Comenzar",
  canPay = false,
}: {
  serviceSlug: string;
  label?: string;
  canPay?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPayment, setNeedsPayment] = useState(false);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ consultationId: string }>("/api/consultas", {
        method: "POST",
        json: { serviceSlug },
      });
      router.push(`/consulta/${res.consultationId}`);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 402) {
        setNeedsPayment(true);
      } else if (err.status === 401) {
        router.push("/");
      } else {
        setError("No pudimos empezar. Probá de nuevo.");
      }
      setLoading(false);
    }
  }

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

  if (needsPayment) {
    return (
      <div className="w-full space-y-2">
        <p className="text-center text-xs text-mist">Esta experiencia requiere pago o créditos.</p>
        {canPay && (
          <button onClick={pay} disabled={loading} className="btn-gold w-full py-3.5 disabled:opacity-60">
            {loading ? "Abriendo pago…" : "Pagar y comenzar"}
          </button>
        )}
        <button onClick={() => router.push("/creditos")} className="btn-ghost w-full py-3 text-sm">
          Cargar créditos
        </button>
        {error && <p className="text-center text-xs text-rose">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <button onClick={start} disabled={loading} className="btn-violet w-full py-3.5 disabled:opacity-60">
        {loading ? "Abriendo…" : label}
      </button>
      {error && <p className="mt-2 text-center text-xs text-rose">{error}</p>}
    </div>
  );
}
