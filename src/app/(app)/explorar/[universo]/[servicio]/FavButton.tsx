"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";

export function FavButton({ serviceId, initialFav }: { serviceId: string; initialFav: boolean }) {
  const [fav, setFav] = useState(initialFav);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api<{ fav: boolean }>("/api/favoritos", {
        method: "POST",
        json: { serviceId },
      });
      setFav(res.fav);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
      className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-plum/40"
    >
      <Heart
        size={20}
        className={fav ? "fill-rose text-rose drop-shadow-[0_0_8px_rgba(216,139,203,0.7)]" : "text-ivory/60"}
      />
    </button>
  );
}
