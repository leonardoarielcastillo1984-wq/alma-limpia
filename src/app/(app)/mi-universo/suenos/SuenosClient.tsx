"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Entry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  tags: string[];
  createdAt: string;
}

const DREAM_TAGS = ["recurrente", "lúcido", "pesadilla", "premonitorio", "vuelo", "agua", "persecución", "casa"];

export function SuenosClient({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tags: [] as string[] });
  const [saving, setSaving] = useState(false);

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag].slice(0, 8),
    }));
  }

  async function save() {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      const res = await api<{ entry: Entry }>("/api/journal", {
        method: "POST",
        json: { kind: "suenos", title: form.title || null, content: form.content, tags: form.tags },
      });
      setEntries((e) => [res.entry, ...e]);
      setForm({ title: "", content: "", tags: [] });
      setWriting(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await api(`/api/journal?id=${id}`, { method: "DELETE" });
    setEntries((e) => e.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-4">
      {!writing ? (
        <button onClick={() => setWriting(true)} className="btn-gold w-full py-3.5">
          Anotar el sueño de anoche
        </button>
      ) : (
        <div className="card-mystic space-y-3 p-5">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Título o imagen principal (opcional)"
            className="input"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={6}
            placeholder="Contá el sueño con todo lo que recuerdes: lugares, personas, sensaciones, colores…"
            className="input resize-none"
            autoFocus
          />
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-widest text-mist/60">Símbolos / tipo</p>
            <div className="flex flex-wrap gap-2">
              {DREAM_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    form.tags.includes(t) ? "bg-violet text-ivory" : "bg-cosmic text-mist"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.content.trim()} className="btn-gold flex-1 py-2.5 text-sm disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar sueño"}
            </button>
            <button onClick={() => setWriting(false)} className="btn-ghost px-5 py-2.5 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {entries.map((e) => (
          <details key={e.id} className="card-mystic group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ivory">{e.title ?? "Sueño"}</p>
                <p className="text-xs text-mist">
                  {new Date(e.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
                  {e.tags.length > 0 && <span className="ml-2 text-violet">{e.tags.join(" · ")}</span>}
                </p>
              </div>
              <span className="text-gold/50 transition group-open:rotate-90">›</span>
            </summary>
            <div className="mt-3 border-t border-gold/10 pt-3">
              <p className="whitespace-pre-line text-sm leading-relaxed text-mist">{e.content}</p>
              <button onClick={() => remove(e.id)} className="mt-3 text-xs text-rose/70 hover:text-rose">
                Eliminar entrada
              </button>
            </div>
          </details>
        ))}
        {entries.length === 0 && (
          <p className="py-8 text-center text-sm text-mist">
            Todavía no anotaste sueños. Escribirlos apenas te despertás ayuda a recordarlos cada vez mejor.
          </p>
        )}
      </div>
    </div>
  );
}
