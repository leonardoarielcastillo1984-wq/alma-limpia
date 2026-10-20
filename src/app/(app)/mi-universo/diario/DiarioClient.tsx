"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Entry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  createdAt: string;
}

const MOODS = ["🌕 plena", "✨ inspirada", "🌊 sensible", "🔥 intensa", "🌱 tranquila", "🌧️ melancólica"];

export function DiarioClient({ prompt, initialEntries }: { prompt: string; initialEntries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", mood: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const visible = search.trim()
    ? entries.filter((e) =>
        `${e.title ?? ""} ${e.content}`.toLowerCase().includes(search.trim().toLowerCase())
      )
    : entries;

  async function save() {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      const res = await api<{ entry: Entry }>("/api/journal", {
        method: "POST",
        json: { ...form, title: form.title || null, mood: form.mood || null },
      });
      setEntries((e) => [res.entry, ...e]);
      setForm({ title: "", content: "", mood: "" });
      setWriting(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {!writing ? (
        <button onClick={() => setWriting(true)} className="btn-gold w-full py-3.5">
          Escribir hoy
        </button>
      ) : (
        <div className="card-mystic space-y-3 p-5">
          <p className="font-display text-sm italic text-violet">{prompt}</p>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título (opcional)"
            className="input"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={6}
            placeholder="Escribí sin filtro…"
            className="input resize-none"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setForm((f) => ({ ...f, mood: f.mood === m ? "" : m }))}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  form.mood === m ? "bg-violet text-ivory" : "bg-cosmic text-mist"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.content.trim()} className="btn-gold flex-1 py-2.5 text-sm disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button onClick={() => setWriting(false)} className="btn-ghost px-5 py-2.5 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {entries.length > 2 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en tus entradas…"
          className="input w-full py-2.5 text-sm"
        />
      )}

      <div className="space-y-3">
        {visible.map((e) => (
          <details key={e.id} className="card-mystic group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <div>
                <p className="font-medium text-ivory">{e.title ?? "Entrada"}</p>
                <p className="text-xs text-mist">
                  {new Date(e.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
                  {e.mood && <span className="ml-2">{e.mood}</span>}
                </p>
              </div>
              <span className="text-gold/50 transition group-open:rotate-90">›</span>
            </summary>
            <p className="mt-3 whitespace-pre-line border-t border-gold/10 pt-3 text-sm leading-relaxed text-mist">
              {e.content}
            </p>
          </details>
        ))}
        {visible.length === 0 && entries.length > 0 && (
          <p className="py-6 text-center text-sm text-mist">Nada coincide con “{search}”.</p>
        )}
        {entries.length === 0 && (
          <p className="card-mystic p-6 text-center text-sm text-mist">
            Todavía no escribiste nada. Tu primera entrada te espera.
          </p>
        )}
      </div>
    </div>
  );
}
