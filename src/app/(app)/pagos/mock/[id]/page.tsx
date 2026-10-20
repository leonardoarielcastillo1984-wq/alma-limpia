"use client";

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

/**
 * Página de checkout SIMULADO — solo existe en ALMA_PAYMENTS_MODE=mock.
 * En producción (live) MP redirige a su checkout real y esta ruta no se usa.
 */
export default function MockCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  use(params);
  const search = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const ref = search.get("ref") ?? "";
  const paymentId = search.get("pay") ?? `${Date.now()}`;

  async function simulate(approved: boolean) {
    setLoading(true);
    try {
      // Simula el webhook de MP directamente (mock mode omite firma)
      await api(`/api/pagos/webhook?type=payment&data.id=${paymentId}&ref=${encodeURIComponent(ref)}`, {
        method: "POST",
        json: { type: "payment", data: { id: paymentId } },
      });
      router.push(approved ? "/pagos/ok" : "/pagos/fallo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <div className="card-mystic w-full max-w-sm space-y-6 p-8 text-center">
        <p className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
          MODO DEMO — no es un pago real
        </p>
        <h1 className="font-display text-2xl text-gradient-gold">Checkout simulado</h1>
        <p className="text-sm text-mist">
          Esto reemplaza a Mercado Pago mientras no haya credenciales configuradas.
        </p>
        <div className="space-y-3">
          <button onClick={() => simulate(true)} disabled={loading} className="btn-gold w-full py-3 disabled:opacity-50">
            Simular pago aprobado
          </button>
          <button onClick={() => simulate(false)} disabled={loading} className="btn-ghost w-full py-3 text-sm">
            Simular rechazo
          </button>
        </div>
      </div>
    </div>
  );
}
