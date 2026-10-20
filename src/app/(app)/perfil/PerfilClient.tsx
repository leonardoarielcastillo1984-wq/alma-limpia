"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface Props {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    isGuest: boolean;
    birthDate: Date | null;
    birthTime: string | null;
    birthCity: string | null;
    birthCountry: string | null;
    consentMemory: boolean;
    profile: { displayName: string | null } | null;
    preferences: {
      notificationsEnabled: boolean;
      reduceMotion: boolean;
      soundEnabled: boolean;
      deckPreference: string;
    } | null;
  };
}

export function PerfilClient({ user }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: user.profile?.displayName ?? user.name ?? "",
    birthDate: user.birthDate ? user.birthDate.toString().slice(0, 10) : "",
    birthTime: user.birthTime ?? "",
    birthCity: user.birthCity ?? "",
    birthCountry: user.birthCountry ?? "",
    consentMemory: user.consentMemory,
    notificationsEnabled: user.preferences?.notificationsEnabled ?? false,
    reduceMotion: user.preferences?.reduceMotion ?? false,
    soundEnabled: user.preferences?.soundEnabled ?? false,
    deckPreference: user.preferences?.deckPreference ?? "rider",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api("/api/me", { method: "PATCH", json: form });
      setMsg("Guardado ✨");
      router.refresh();
    } catch {
      setMsg("No pudimos guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function deleteAccount() {
    const ok = window.confirm(
      "¿Eliminar tu cuenta definitivamente? Se borran tu historial, diarios, cartas y créditos. No hay vuelta atrás."
    );
    if (!ok) return;
    try {
      await api("/api/me", { method: "DELETE" });
      router.push("/");
    } catch {
      setMsg("No pudimos eliminar la cuenta. Probá de nuevo.");
    }
  }

  async function exportData() {
    const data = await api("/api/me/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "alma-limpia-mis-datos.json";
    a.click();
  }

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-gradient-gold">Perfil</h1>
        {user.isGuest && (
          <p className="mt-2 rounded-xl border border-gold/30 bg-gold/5 p-3 text-sm text-gold-soft">
            Estás como invitada/o. Creá una cuenta para no perder tu historial.
          </p>
        )}
      </header>

      <form onSubmit={save} className="card-mystic space-y-4 p-5">
        <h2 className="font-display text-lg text-ivory">Tus datos</h2>

        <Field label="Nombre">
          <input
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha de nacimiento">
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Hora (opcional)">
            <input
              type="time"
              value={form.birthTime}
              onChange={(e) => set("birthTime", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <p className="-mt-2 text-[11px] text-mist/70">
          Sin la hora podemos calcular planetas, pero no tu ascendente ni tus casas.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Ciudad">
            <input
              value={form.birthCity}
              onChange={(e) => set("birthCity", e.target.value)}
              className="input"
              placeholder="Buenos Aires"
            />
          </Field>
          <Field label="País">
            <input
              value={form.birthCountry}
              onChange={(e) => set("birthCountry", e.target.value)}
              className="input"
              placeholder="Argentina"
            />
          </Field>
        </div>

        <h2 className="pt-2 font-display text-lg text-ivory">Preferencias</h2>

        <Toggle
          label="Recordar mi contexto en las consultas"
          hint="La guía usa tu historial para personalizar. Podés apagarlo cuando quieras."
          checked={form.consentMemory}
          onChange={(v) => set("consentMemory", v)}
        />
        <Toggle
          label="Recordatorios suaves"
          hint="Avisos de luna llena, tu carta del día y rituales que empezaste. Solo en este dispositivo."
          checked={form.notificationsEnabled}
          onChange={async (v) => {
            if (v && typeof Notification !== "undefined" && Notification.permission === "default") {
              const perm = await Notification.requestPermission();
              set("notificationsEnabled", perm === "granted");
              return;
            }
            if (v && typeof Notification !== "undefined" && Notification.permission === "denied") {
              setMsg("El navegador tiene las notificaciones bloqueadas. Habilitalas en la configuración del sitio.");
              return;
            }
            set("notificationsEnabled", v);
          }}
        />
        <Toggle
          label="Reducir animaciones"
          checked={form.reduceMotion}
          onChange={(v) => set("reduceMotion", v)}
        />
        <Toggle
          label="Sonidos sutiles"
          checked={form.soundEnabled}
          onChange={(v) => set("soundEnabled", v)}
        />

        <Field label="Mazo preferido">
          <select
            value={form.deckPreference}
            onChange={(e) => set("deckPreference", e.target.value)}
            className="input"
          >
            <option value="rider">Rider-Waite</option>
            <option value="marsella">Marsella</option>
          </select>
        </Field>

        {msg && <p className="text-sm text-gold">{msg}</p>}
        <button type="submit" disabled={saving} className="btn-gold w-full py-3 disabled:opacity-60">
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <section className="card-mystic space-y-3 p-5">
        <h2 className="font-display text-lg text-ivory">Tus datos, tuyos</h2>
        <button onClick={exportData} className="btn-ghost w-full py-2.5 text-sm">
          Exportar mis datos (JSON)
        </button>
        <button
          onClick={deleteAccount}
          className="w-full rounded-xl border border-rose/40 py-2.5 text-sm text-rose hover:bg-rose/10"
        >
          Eliminar mi cuenta
        </button>
        <p className="text-[11px] text-mist/70">
          La eliminación es inmediata y permanente: se borran tu historial, diarios, cartas y créditos.
        </p>
      </section>

      <section className="card-mystic space-y-2 p-5">
        <h2 className="font-display text-lg text-ivory">Tu suscripción</h2>
        <Link
          href="/membresia"
          className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold-soft hover:bg-gold/10"
        >
          <span>Membresía e historial de compras</span>
          <span>→</span>
        </Link>
      </section>

      <section className="card-mystic space-y-2 p-5">
        <h2 className="font-display text-lg text-ivory">Legal</h2>
        <div className="flex flex-col gap-1.5 text-sm">
          <Link href="/legal/privacidad" className="text-mist hover:text-gold">Política de privacidad</Link>
          <Link href="/legal/terminos" className="text-mist hover:text-gold">Términos y condiciones</Link>
          <Link href="/legal/reembolsos" className="text-mist hover:text-gold">Política de reembolsos</Link>
        </div>
      </section>

      <button onClick={logout} className="w-full py-3 text-sm text-mist hover:text-rose">
        Cerrar sesión
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-mist/70">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span>
        <span className="block text-sm text-ivory">{label}</span>
        {hint && <span className="block text-[11px] text-mist/70">{hint}</span>}
      </span>
      <span
        className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${
          checked ? "bg-violet" : "bg-cosmic border border-mist/30"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-ivory transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}
