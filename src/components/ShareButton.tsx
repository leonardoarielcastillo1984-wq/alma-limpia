"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton({ title, text, path }: { title: string; text: string; path: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${path}`;
    const data = { title, text, url };
    try {
      if (navigator.share && navigator.canShare?.(data) !== false) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // usuario canceló o API no disponible
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      title="Compartir"
      className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 text-mist transition hover:border-gold/50 hover:text-gold-soft"
    >
      {copied ? <Check size={15} className="text-gold" /> : <Share2 size={15} />}
    </button>
  );
}
