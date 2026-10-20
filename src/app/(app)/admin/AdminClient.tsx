"use client";

import { useMemo, useState } from "react";
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

interface UsuarioRow {
  id: string;
  name: string | null;
  email: string | null;
  isGuest: boolean;
  role: string;
  status: string;
  createdAt: string;
  consultas: number;
  compras: number;
  diario: number;
}

interface ConsultaRow {
  id: string;
  date: string;
  userName: string | null;
  userEmail: string | null;
  service: string;
  status: string;
  paid: boolean;
  accessMode: string | null;
  title: string | null;
  firstMessage: string | null;
}

interface MotorRow {
  id: string;
  date: string;
  service: string | null;
  model: string;
  tokens: number;
  costUsd: number;
  latencyMs: number;
  status: string;
}

interface PurchaseRow {
  id: string;
  date: string;
  paidAt: string | null;
  userName: string | null;
  userEmail: string | null;
  kind: string;
  item: string;
  coupon: string | null;
  amountArs: number;
  status: string;
  mpPaymentId: string | null;
}

interface PromptRow {
  id: string;
  key: string;
  version: number;
  system: string;
  active: boolean;
}

type Tab = "pagos" | "usuarios" | "consultas" | "motor" | "servicios" | "promos" | "creditos" | "prompts";

export function AdminClient({
  stats, services, promos, prompts, purchases, usuarios, consultasDetalle, motor,
}: {
  stats: Stats;
  services: ServiceRow[];
  promos: PromoRow[];
  prompts: PromptRow[];
  purchases: PurchaseRow[];
  usuarios: UsuarioRow[];
  consultasDetalle: ConsultaRow[];
  motor: MotorRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pagos");
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

      {/* KPIs — cada tarjeta abre su detalle */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Usuarias/os" value={stats.users.toLocaleString("es-AR")} onClick={() => setTab("usuarios")} active={tab === "usuarios"} />
        <Kpi label="Consultas" value={stats.consultas.toLocaleString("es-AR")} onClick={() => setTab("consultas")} active={tab === "consultas"} />
        <Kpi label="Ingresos" value={`$${stats.revenue.toLocaleString("es-AR")}`} onClick={() => setTab("pagos")} active={tab === "pagos"} />
        <Kpi label="Llamadas del motor" value={stats.aiCalls.toLocaleString("es-AR")} onClick={() => setTab("motor")} active={tab === "motor"} />
      </div>
      <div className="card-mystic p-4 text-xs text-mist">
        Tokens: {(stats.tokensIn + stats.tokensOut).toLocaleString("es-AR")} totales
        ({stats.tokensIn.toLocaleString("es-AR")} in / {stats.tokensOut.toLocaleString("es-AR")} out)
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["pagos", "Pagos"],
            ["usuarios", "Usuarios"],
            ["consultas", "Consultas"],
            ["motor", "Motor IA"],
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

      {tab === "pagos" && <PagosTab purchases={purchases} />}
      {tab === "usuarios" && <UsuariosTab usuarios={usuarios} />}
      {tab === "consultas" && <ConsultasTab consultas={consultasDetalle} />}
      {tab === "motor" && <MotorTab motor={motor} />}
      {tab === "promos" && <PromosTab promos={promos} services={services} onDone={() => router.refresh()} />}
      {tab === "creditos" && <CreditosTab onMsg={setMsg} />}
      {tab === "prompts" && <PromptsTab prompts={prompts} onDone={() => router.refresh()} />}
    </div>
  );
}

/* ---------- Pagos ---------- */
const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Aprobado", PENDING: "Pendiente", REJECTED: "Rechazado", REFUNDED: "Reembolsado",
};
const STATUS_CLASS: Record<string, string> = {
  APPROVED: "bg-emerald-500/15 text-emerald-300",
  PENDING: "bg-gold/15 text-gold",
  REJECTED: "bg-rose/15 text-rose",
  REFUNDED: "bg-violet/20 text-violet",
};
const KIND_LABEL: Record<string, string> = {
  SERVICE: "Servicio", MEMBERSHIP: "Membresía", CREDITS: "Créditos", GIFT: "Regalo",
};
const fmtArs = (n: number) => `$ ${n.toLocaleString("es-AR")}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

function PagosTab({ purchases }: { purchases: PurchaseRow[] }) {
  const [status, setStatus] = useState("APPROVED");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const fromT = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toT = to ? new Date(`${to}T23:59:59`).getTime() : null;
    return purchases.filter((p) => {
      if (status && p.status !== status) return false;
      if (kind && p.kind !== kind) return false;
      const t = new Date(p.date).getTime();
      if (fromT && t < fromT) return false;
      if (toT && t > toT) return false;
      if (needle) {
        const hay = `${p.userName ?? ""} ${p.userEmail ?? ""} ${p.item} ${p.mpPaymentId ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [purchases, status, kind, q, from, to]);

  const approved = useMemo(() => rows.filter((p) => p.status === "APPROVED"), [rows]);
  const total = approved.reduce((s, p) => s + p.amountArs, 0);
  const buyers = new Set(approved.map((p) => p.userEmail ?? p.id)).size;

  const byItem = useMemo(() => {
    const m = new Map<string, { count: number; total: number }>();
    for (const p of approved) {
      const cur = m.get(p.item) ?? { count: 0, total: 0 };
      m.set(p.item, { count: cur.count + 1, total: cur.total + p.amountArs });
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [approved]);

  function exportCsv() {
    const head = ["Fecha", "Usuario", "Email", "Tipo", "Detalle", "Cupón", "Monto ARS", "Estado", "ID Mercado Pago"];
    const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((p) =>
      [fmtDate(p.date), p.userName, p.userEmail, KIND_LABEL[p.kind] ?? p.kind, p.item, p.coupon, p.amountArs, STATUS_LABEL[p.status] ?? p.status, p.mpPaymentId]
        .map(esc).join(";")
    );
    const blob = new Blob(["\uFEFF" + [head.map(esc).join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pagos-alma-limpia-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Cobrado (filtro)" value={fmtArs(total)} />
        <Kpi label="Pagos aprobados" value={approved.length.toLocaleString("es-AR")} />
        <Kpi label="Compradores" value={buyers.toLocaleString("es-AR")} />
      </div>

      <div className="card-mystic grid grid-cols-2 gap-2 p-3 sm:grid-cols-5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre, email, servicio…" className="input col-span-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input text-sm">
          <option value="">Todos los estados</option>
          <option value="APPROVED">Aprobados</option>
          <option value="PENDING">Pendientes</option>
          <option value="REJECTED">Rechazados</option>
          <option value="REFUNDED">Reembolsados</option>
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="input text-sm">
          <option value="">Todos los tipos</option>
          <option value="SERVICE">Servicios</option>
          <option value="MEMBERSHIP">Membresías</option>
          <option value="CREDITS">Créditos</option>
        </select>
        <button onClick={exportCsv} disabled={!rows.length} className="btn-gold py-2 text-xs disabled:opacity-50">
          Exportar CSV
        </button>
        <label className="col-span-1 flex items-center gap-2 text-[11px] text-mist sm:col-span-2">
          Desde <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input flex-1 py-1.5 text-sm" />
        </label>
        <label className="col-span-1 flex items-center gap-2 text-[11px] text-mist sm:col-span-2">
          Hasta <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input flex-1 py-1.5 text-sm" />
        </label>
      </div>

      {byItem.length > 0 && (
        <div className="card-mystic p-3">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-mist/70">Cobrado por servicio</p>
          <div className="space-y-1">
            {byItem.map(([item, v]) => (
              <div key={item} className="flex justify-between text-xs">
                <span className="text-ivory">{item} <span className="text-mist/60">×{v.count}</span></span>
                <span className="text-gold">{fmtArs(v.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((p) => (
          <div key={p.id} className="card-mystic flex items-start gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ivory">{p.item}</p>
              <p className="truncate text-[11px] text-mist">
                {p.userName ?? "Sin nombre"} · {p.userEmail ?? "invitado"}
              </p>
              <p className="text-[10px] text-mist/60">
                {fmtDate(p.date)} · {KIND_LABEL[p.kind] ?? p.kind}
                {p.coupon && ` · cupón ${p.coupon}`}
                {p.mpPaymentId && ` · MP #${p.mpPaymentId}`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-medium text-gold">{fmtArs(p.amountArs)}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${STATUS_CLASS[p.status] ?? "bg-plum/30 text-mist"}`}>
                {STATUS_LABEL[p.status] ?? p.status}
              </span>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="py-6 text-center text-xs text-mist/60">No hay pagos con estos filtros.</p>}
        {purchases.length >= 1000 && (
          <p className="text-center text-[10px] text-mist/50">Se muestran los últimos 1.000 movimientos.</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Usuarios ---------- */
function UsuariosTab({ usuarios }: { usuarios: UsuarioRow[] }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (tipo === "registrados" && u.isGuest) return false;
      if (tipo === "invitados" && !u.isGuest) return false;
      if (tipo === "compradores" && u.compras === 0) return false;
      if (needle && !`${u.name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [usuarios, q, tipo]);

  const registrados = usuarios.filter((u) => !u.isGuest).length;
  const compradores = usuarios.filter((u) => u.compras > 0).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Registradas/os" value={registrados.toLocaleString("es-AR")} />
        <Kpi label="Invitadas/os" value={(usuarios.length - registrados).toLocaleString("es-AR")} />
        <Kpi label="Con compras" value={compradores.toLocaleString("es-AR")} />
      </div>
      <div className="card-mystic grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre o email…" className="input col-span-2 text-sm sm:col-span-1" />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input text-sm">
          <option value="">Todos</option>
          <option value="registrados">Solo registrados</option>
          <option value="invitados">Solo invitados</option>
          <option value="compradores">Con compras</option>
        </select>
        <p className="col-span-2 self-center text-right text-[11px] text-mist/60 sm:col-span-1">{rows.length} usuarios</p>
      </div>
      <div className="space-y-2">
        {rows.map((u) => (
          <div key={u.id} className="card-mystic flex items-start gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ivory">
                {u.name ?? "Sin nombre"}
                {u.role !== "USER" && <span className="ml-2 rounded-full bg-violet/20 px-2 py-0.5 text-[10px] text-violet">{u.role.toLowerCase()}</span>}
                {u.isGuest && <span className="ml-2 rounded-full bg-plum/40 px-2 py-0.5 text-[10px] text-mist">invitada/o</span>}
              </p>
              <p className="truncate text-[11px] text-mist">{u.email ?? "sin email"} · se unió {fmtDate(u.createdAt).slice(0, 8)}</p>
              <p className="text-[10px] text-mist/60">
                {u.consultas} consulta{u.consultas === 1 ? "" : "s"} · {u.compras} compra{u.compras === 1 ? "" : "s"} · {u.diario} entrada{u.diario === 1 ? "" : "s"} de diario
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${u.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose/15 text-rose"}`}>
              {u.status === "ACTIVE" ? "activa/o" : u.status.toLowerCase()}
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="py-6 text-center text-xs text-mist/60">No hay usuarios con estos filtros.</p>}
      </div>
    </div>
  );
}

/* ---------- Consultas ---------- */
const ACCESS_LABEL: Record<string, string> = {
  free: "gratis", purchase: "compra", credits: "créditos", membership: "membresía", admin: "admin",
};

function ConsultasTab({ consultas }: { consultas: ConsultaRow[] }) {
  const [q, setQ] = useState("");
  const [solo, setSolo] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return consultas.filter((c) => {
      if (solo === "pagas" && !c.paid) return false;
      if (solo === "gratis" && c.paid) return false;
      if (needle) {
        const hay = `${c.userName ?? ""} ${c.userEmail ?? ""} ${c.service} ${c.firstMessage ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [consultas, q, solo]);

  const pagas = consultas.filter((c) => c.paid).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Consultas (últimas 300)" value={consultas.length.toLocaleString("es-AR")} />
        <Kpi label="Pagas / del día" value={pagas.toLocaleString("es-AR")} />
      </div>
      <div className="card-mystic grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar persona, servicio o pregunta…" className="input col-span-2 text-sm sm:col-span-2" />
        <select value={solo} onChange={(e) => setSolo(e.target.value)} className="input text-sm">
          <option value="">Todas</option>
          <option value="pagas">Solo pagas</option>
          <option value="gratis">Solo gratis/día</option>
        </select>
      </div>
      <div className="space-y-2">
        {rows.map((c) => (
          <div key={c.id} className="card-mystic p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ivory">{c.service}</p>
                <p className="truncate text-[11px] text-mist">{c.userName ?? "Sin nombre"} · {c.userEmail ?? "invitada/o"}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${c.paid ? "bg-emerald-500/15 text-emerald-300" : "bg-plum/40 text-mist"}`}>
                  {c.accessMode ? (ACCESS_LABEL[c.accessMode] ?? c.accessMode) : c.status.toLowerCase()}
                </span>
                <p className="mt-1 text-[10px] text-mist/60">{fmtDate(c.date)}</p>
              </div>
            </div>
            {c.firstMessage && (
              <p className="mt-2 line-clamp-3 rounded-lg bg-plum/20 px-3 py-2 text-xs italic text-ivory/85">
                “{c.firstMessage}”
              </p>
            )}
          </div>
        ))}
        {rows.length === 0 && <p className="py-6 text-center text-xs text-mist/60">No hay consultas con estos filtros.</p>}
      </div>
    </div>
  );
}

/* ---------- Motor IA ---------- */
function MotorTab({ motor }: { motor: MotorRow[] }) {
  const totalTokens = motor.reduce((s, m) => s + m.tokens, 0);
  const totalCost = motor.reduce((s, m) => s + m.costUsd, 0);
  const errores = motor.filter((m) => m.status !== "ok").length;

  const byService = useMemo(() => {
    const m = new Map<string, { calls: number; tokens: number }>();
    for (const l of motor) {
      const k = l.service ?? "general";
      const cur = m.get(k) ?? { calls: 0, tokens: 0 };
      m.set(k, { calls: cur.calls + 1, tokens: cur.tokens + l.tokens });
    }
    return [...m.entries()].sort((a, b) => b[1].tokens - a[1].tokens);
  }, [motor]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Tokens (últimas 200)" value={totalTokens.toLocaleString("es-AR")} />
        <Kpi label="Costo est. USD" value={`$${totalCost.toFixed(2)}`} />
        <Kpi label="Errores" value={errores.toLocaleString("es-AR")} />
      </div>
      {byService.length > 0 && (
        <div className="card-mystic p-3">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-mist/70">Uso por servicio</p>
          <div className="space-y-1">
            {byService.map(([s, v]) => (
              <div key={s} className="flex justify-between text-xs">
                <span className="text-ivory">{s} <span className="text-mist/60">×{v.calls}</span></span>
                <span className="text-gold">{v.tokens.toLocaleString("es-AR")} tok</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        {motor.map((l) => (
          <div key={l.id} className="card-mystic flex items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ivory">{l.service ?? "general"}</p>
              <p className="truncate text-[10px] text-mist/60">
                {fmtDate(l.date)} · {l.model} · {l.latencyMs} ms
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-gold">{l.tokens.toLocaleString("es-AR")} tok · ${l.costUsd.toFixed(4)}</p>
              <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] ${l.status === "ok" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose/15 text-rose"}`}>
                {l.status}
              </span>
            </div>
          </div>
        ))}
        {motor.length === 0 && <p className="py-6 text-center text-xs text-mist/60">Todavía no hay llamadas registradas.</p>}
      </div>
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

function Kpi({ label, value, onClick, active }: { label: string; value: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card-mystic p-4 text-center transition ${onClick ? "cursor-pointer hover:border-gold/40" : ""} ${active ? "border-gold/50 bg-gold/5" : ""}`}
    >
      <p className="font-display text-2xl font-semibold text-gold">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-mist/70">{label}</p>
    </button>
  );
}
