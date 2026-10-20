"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Sparkles, Star } from "lucide-react";
import { api } from "@/lib/api";

export interface Purchase {
  id: string;
  kind: string;
  amountArs: number;
  status: string;
  createdAt: string;
  service?: { name: string } | null;
  metadata?: Record<string, unknown> | null;
}

const PLANS = [
  {
    code: "LUNA" as const, name: "Luna", price: 19000,
    perks: ["Consultas ilimitadas con la guía", "Lecturas simbólicas ilimitadas", "Tu historial siempre disponible"],
    icon: Sparkles,
  },
  {
    code: "ESTRELLA" as const, name: "Estrella", price: 29000,
    perks: ["Todo lo de Luna", "Tarot semanal incluido", "Prioridad en las respuestas"],
    icon: Star,
  },
  {
    code: "COSMOS" as const, name: "Cosmos", price: 45000, popular: true,
    perks: ["Todo lo de Estrella", "Carta natal con interpretación", "Sinastría mensual"],
    icon: Crown,
  },
];

export function MembresiaClient({ activePlan, expiresAt, purchases }: {
  activePlan: string | null;
  expiresAt: string | null;
  purchases: Purchase[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: string) {
    setLoading(plan);
    setError(null);
    try {
      const res = await api<{ initPoint: string }>("/api/pagos/checkout", {
        method: "POST",
        json: { type: "membership", plan },
      });
      router.push(res.initPoint);
    } catch {
      setError("No pudimos iniciar el pago. Probá de nuevo.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {activePlan ? (
        <div className="card-mystic border-gold/50 p-5 text-center shadow-gold">
          <Crown size={28} className="mx-auto text-gold" />
          <p className="mt-2 font-display text-xl text-gold-soft">Membresía {activePlan} activa</p>
          {expiresAt && (
            <p className="text-xs text-mist">
              Vence el {new Date(expiresAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
            </p>
          )}
        </div>
      ) : null}

      <div className="grid gap-4">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const isActive = activePlan === p.code;
          return (
            <div
              key={p.code}
              className={`card-mystic p-5 ${p.popular && !isActive ? "border-gold/50 shadow-gold" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold/25 to-violet-deep">
                    <Icon size={20} className="text-gold" />
                  </span>
                  <div>
                    <p className="font-display text-lg text-ivory">Membresía {p.name}</p>
                    <p className="font-display text-2xl font-semibold text-gold">
                      $ {p.price.toLocaleString("es-AR")}
                      <span className="text-xs font-normal text-mist">/mes</span>
                    </p>
                  </div>
                </div>
                {isActive && (
                  <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-medium text-gold">Actual</span>
                )}
              </div>
              <ul className="mt-4 space-y-1.5">
                {p.perks.map((x) => (
                  <li key={x} className="flex gap-2 text-sm text-ivory/85">
                    <span className="text-gold">✦</span> {x}
                  </li>
                ))}
              </ul>
              {!isActive && (
                <button
                  onClick={() => subscribe(p.code)}
                  disabled={!!loading}
                  className={`mt-4 w-full py-3 text-sm disabled:opacity-60 ${p.popular ? "btn-gold" : "btn-violet"}`}
                >
                  {loading === p.code ? "Abriendo pago…" : activePlan ? `Cambiar a ${p.name}` : `Elegir ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-center text-sm text-rose">{error}</p>}
      <p className="text-center text-[11px] text-mist/60">
        Pagos procesados por Mercado Pago · Se renueva cada 30 días
      </p>

      {purchases.length > 0 && (
        <section className="pt-2">
          <h2 className="mb-3 font-display text-lg text-ivory">Historial de compras</h2>
          <div className="space-y-2">
            {purchases.map((p) => (
              <div key={p.id} className="row-mystic items-center justify-between py-3">
                <div>
                  <p className="text-sm text-ivory">
                    {p.service?.name ??
                      (p.kind === "CREDITS" ? `${p.metadata?.credits ?? ""} créditos` : `Membresía ${String(p.metadata?.plan ?? "")}`)}
                  </p>
                  <p className="text-[10px] text-mist/60">
                    {new Date(p.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gold-soft">$ {p.amountArs.toLocaleString("es-AR")}</p>
                  <p className={`text-[10px] ${p.status === "APPROVED" ? "text-emerald-400" : p.status === "PENDING" ? "text-amber-400" : "text-rose/70"}`}>
                    {p.status === "APPROVED" ? "Aprobada" : p.status === "PENDING" ? "Pendiente" : "Rechazada"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
