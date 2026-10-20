"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ServiceArt } from "@/components/art/MysticArt";

export interface CatalogItem {
  id: string;
  slug: string;
  name: string;
  shortDesc: string | null;
  kind: string;
  priceArs: number;
  creditsCost: number;
  freeDaily: boolean;
}

const KIND_LABEL: Record<string, string> = {
  TAROT: "Tarot",
  READING: "Oráculos",
  NATAL: "Astrología",
  NUMEROLOGY: "Numerología",
  RITUAL: "Rituales",
  TEST: "Tests",
  CHAT: "Guía",
};

function price(s: CatalogItem) {
  if (s.priceArs > 0) return `$ ${s.priceArs.toLocaleString("es-AR")}`;
  if (s.creditsCost > 0) return `${s.creditsCost} créditos`;
  return "Gratis";
}

export function CatalogList({ categorySlug, items }: { categorySlug: string; items: CatalogItem[] }) {
  const kinds = useMemo(() => Array.from(new Set(items.map((i) => i.kind))), [items]);
  const [filter, setFilter] = useState<string>("ALL");
  const visible = filter === "ALL" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="space-y-4">
      {kinds.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button onClick={() => setFilter("ALL")} className={`chip shrink-0 ${filter === "ALL" ? "chip-active" : ""}`}>
            Todos
          </button>
          {kinds.map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={`chip shrink-0 ${filter === k ? "chip-active" : ""}`}>
              {KIND_LABEL[k] ?? k}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        {visible.map((s) => (
          <Link key={s.id} href={`/explorar/${categorySlug}/${s.slug}`} className="row-mystic">
            <span className="thumb h-14 w-14 shrink-0">
              <ServiceArt kind={s.kind} slug={s.slug} className="h-full w-full scale-125" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg leading-tight text-ivory">{s.name}</p>
              {s.shortDesc && <p className="truncate text-xs text-mist">{s.shortDesc}</p>}
              <p className="mt-0.5 text-sm font-semibold text-gold">
                {price(s)}
                {s.freeDaily && <span className="ml-2 text-[10px] font-normal text-violet">· 1 gratis por día</span>}
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-mist/60" />
          </Link>
        ))}
      </div>
    </div>
  );
}
