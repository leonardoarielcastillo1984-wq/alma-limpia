"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Stats {
  users: number;
  consultas: number;
  revenue: number;
  aiCalls: number;
  tokensIn: number;
  tokensOut: number;
}

interface ServiceRow {
  id: string;
  slug: string;
  name: string;
  priceArs: number;
  creditsCost: number;
  freeDaily: boolean;
  active: boolean;
  category: { name: string };
}

interface PromoRow {
  id: string;
  code: string;
  kind: string;
  value: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}

interface PromptRow {
  id: string;
  key: string;
  version: number;
  system: string;
  active: boolean;
}

export function AdminClient({
  stats, services, promos, prompts,
}: {
  stats: Stats;
  services: ServiceRow[];
  promos: PromoRow[];
  prompts: PromptRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"servicios" | "promos" | "creditos" | "prompts">("servicios");
  const [editing, setEditing] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function savePrice(id: string) {
    try {
      await api(`/api/admin/services/${id}`, {
        method: "PATCH",
        json: { priceArs: Number(price) },
      });
      setEditing(null);
      setMsg("Precio actualizado");
      router.refresh();
    } catch {
      setMsg("Error al guardar");
    }
  }

  async function toggle(id: string, active: boolean) {
    await api(`/api/admin/services/${id}`, { method: "PATCH", json: { active: !active } });
    router.refresh();
  }

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-gradient-gold">Panel Admin</h1>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Usuarias/os" value={stats.users.toLocaleString("es-AR")} />
        <Kpi label="Consultas" value={stats.consultas.toLocaleString("es-AR")} />
        <Kpi label="Ingresos" value={`$${stats.revenue.toLocaleString("es-AR")}`} />
        <Kpi label="Llamadas del motor" value={stats.aiCalls.toLocaleString("es-AR")} />
      </div>
      <div className="card-mystic p-4 text-xs text-mist">
        Tokens: {(stats.tokensIn + stats.tokensOut).toLocaleString("es-AR")} totales
        ({stats.tokensIn.toLocaleString("es-AR")} in / {stats.tokensOut.toLocaleString("es-AR")} out)
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {(
          [
            ["servicios", "Servicios"],
            ["promos", "Promos"],
            ["creditos", "Créditos"],
            ["prompts", "Prompts"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 text-xs transition ${
              tab === k ? "bg-violet text-white" : "bg-plum/30 text-mist hover:text-ivory"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm text-gold">{msg}</p>}

      {tab === "servicios" && (
        <section>
          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="card-mystic flex items-center gap-3 p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ivory">{s.name}</p>
                  <p className="text-[11px] text-mist/60">
                    {s.category.name} · {s.slug}
                  </p>
                </div>
                {s.freeDaily && (
                  <span className="rounded-full bg-violet/20 px-2 py-0.5 text-[10px] text-violet">
                    gratis/día
                  </span>
                )}
                {editing === s.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input w-24 py-1.5 text-sm"
                      autoFocus
                    />
                    <button onClick={() => savePrice(s.id)} className="text-xs text-gold">OK</button>
                    <button onClick={() => setEditing(null)} className="text-xs text-mist">×</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditing(s.id); setPrice(String(s.priceArs)); }}
                    className="shrink-0 text-gold/90"
                  >
                    ${s.priceArs.toLocaleString("es-AR")}
                  </button>
                )}
                <button
                  onClick={() => toggle(s.id, s.active)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] ${
                    s.active ? "bg-emerald-500/15 text-emerald-300" : "bg-rose/15 text-rose"
                  }`}
                >
                  {s.active ? "activo" : "off"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "promos" && <PromosTab promos={promos} services={services} onDone={() => router.refresh()} />}
      {tab === "creditos" && <CreditosTab onMsg={setMsg} />}
      {tab === "prompts" && <PromptsTab prompts={prompts} onDone={() => router.refresh()} />}
    </div>
  );
}

/* ---------- Promociones ---------- */
function PromosTab({ promos, services, onDone }: { promos: PromoRow[]; services: ServiceRow[]; onDone: () => void }) {
  const [form, setForm] = useState({ code: "", kind: "PERCENT", value: "", serviceId: "", maxUses: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      await api("/api/admin/promotions", {
        method: "POST",
        json: {
          code: form.code,
          kind: form.kind,
          value: Number(form.value),
          serviceId: form.serviceId || undefined,
          maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        },
      });
      setForm({ code: "", kind: "PERCENT", value: "", serviceId: "", maxUses: "" });
      onDone();
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      setErr(status === 409 ? "Ese código ya existe." : "No se pudo crear. Revisá los datos.");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card-mystic space-y-3 p-4">
        <h3 className="font-display text-base text-ivory">Nuevo cupón</h3>
        <div className="grid grid-cols-2 gap-3">
          <input required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="CÓDIGO" className="input text-sm" />
          <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))} className="input text-sm">
            <option value="PERCENT">% descuento</option>
            <option value="FIXED">$ fijo</option>
            <option value="CREDITS">Créditos</option>
            <option value="FREE_SERVICE">Servicio gratis</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input required type="number" min={1} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="Valor" className="input text-sm" />
          <input type="number" min={1} value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} placeholder="Máx. usos (opcional)" className="input text-sm" />
        </div>
        <select value={form.serviceId} onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))} className="input text-sm">
          <option value="">Válido para todos los servicios</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {err && <p className="text-xs text-rose">{err}</p>}
        <button type="submit" disabled={saving} className="btn-gold w-full py-2.5 text-sm disabled:opacity-60">
          {saving ? "Creando…" : "Crear cupón"}
        </button>
      </form>

      <div className="space-y-2">
        {promos.map((p) => (
          <div key={p.id} className="row-mystic items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium text-ivory">{p.code}</p>
              <p className="text-[10px] text-mist/60">
                {p.kind === "PERCENT" ? `${p.value}%` : p.kind === "FIXED" ? `$${p.value}` : p.kind === "CREDITS" ? `${p.value} créditos` : "servicio gratis"}
                {p.maxUses ? ` · ${p.usedCount}/${p.maxUses}` : ` · ${p.usedCount} usos`}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] ${p.active ? "bg-emerald-500/15 text-emerald-300" : "bg-rose/15 text-rose"}`}>
              {p.active ? "activo" : "off"}
            </span>
          </div>
        ))}
        {promos.length === 0 && <p className="text-center text-xs text-mist/60">Todavía no hay cupones.</p>}
      </div>
    </div>
  );
}

/* ---------- Créditos ---------- */
function CreditosTab({ onMsg }: { onMsg: (m: string | null) => void }) {
  const [form, setForm] = useState({ email: "", credits: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function grant(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr(null); onMsg(null);
    try {
      const res = await api<{ balance: number }>("/api/admin/credits", {
        method: "POST",
        json: {
          email: form.email,
          credits: Number(form.credits),
          reason: form.reason || "ADMIN_GRANT",
        },
      });
      onMsg(`✓ ${form.credits} créditos a ${form.email} (saldo: ${res.balance})`);
      setForm({ email: "", credits: "", reason: "" });
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      setErr(status === 404 ? "No existe usuario con ese email." : "No se pudo otorgar.");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={grant} className="card-mystic space-y-3 p-4">
      <h3 className="font-display text-base text-ivory">Otorgar créditos</h3>
      <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email de la persona" className="input text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <input required type="number" min={1} max={1000} value={form.credits} onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))} placeholder="Cantidad" className="input text-sm" />
        <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Motivo (opcional)" className="input text-sm" />
      </div>
      {err && <p className="text-xs text-rose">{err}</p>}
      <button type="submit" disabled={saving} className="btn-gold w-full py-2.5 text-sm disabled:opacity-60">
        {saving ? "Otorgando…" : "Otorgar créditos"}
      </button>
    </form>
  );
}

/* ---------- Prompts ---------- */
function PromptsTab({ prompts, onDone }: { prompts: PromptRow[]; onDone: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(id: string) {
    setSaving(true);
    try {
      await api("/api/admin/prompts", { method: "PATCH", json: { id, system: content } });
      setEditing(null);
      onDone();
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-3">
      {prompts.map((p) => (
        <div key={p.id} className="card-mystic p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ivory">
              {p.key} <span className="text-[10px] text-mist/60">v{p.version}</span>
            </p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${p.active ? "bg-emerald-500/15 text-emerald-300" : "bg-rose/15 text-rose"}`}>
              {p.active ? "activo" : "off"}
            </span>
          </div>
          {editing === p.id ? (
            <div className="space-y-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="input w-full resize-y text-xs"
              />
              <div className="flex gap-2">
                <button onClick={() => save(p.id)} disabled={saving} className="btn-gold flex-1 py-2 text-xs disabled:opacity-60">
                  {saving ? "Guardando…" : "Guardar"}
                </button>
                <button onClick={() => setEditing(null)} className="btn-ghost flex-1 py-2 text-xs">Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <p className="line-clamp-3 whitespace-pre-line text-xs text-mist">{p.system}</p>
              <button
                onClick={() => { setEditing(p.id); setContent(p.system); }}
                className="mt-2 text-xs text-gold hover:underline"
              >
                Editar prompt
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-mystic p-4 text-center">
      <p className="font-display text-2xl font-semibold text-gold">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-mist/70">{label}</p>
    </div>
  );
}
