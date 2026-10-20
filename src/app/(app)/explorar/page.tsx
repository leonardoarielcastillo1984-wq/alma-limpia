import Link from "next/link";
import { prisma } from "@/server/db";
import { CrescentMoon } from "@/components/cosmic/CrescentMoon";
import { UniverseArt } from "@/components/art/MysticArt";

const TAGLINES: Record<string, string> = {
  oraculo: "Tarot, runas y cartas",
  universo: "Astrología y carta astral",
  alma: "Registros akáshicos y propósito",
  energia: "Chakras y armonización",
  vinculos: "Amor y relaciones",
  rituales: "Lunas, sueños y manifestación",
};

export default async function ExplorarPage() {
  const categories = await prisma.serviceCategory.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: { _count: { select: { services: { where: { active: true } } } } },
  });

  return (
    <div className="animate-fade-up space-y-6">
      <header className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-plum/30">
          <CrescentMoon size={26} />
        </span>
        <h1 className="font-display text-3xl font-medium text-gold-soft">Alma Limpia</h1>
        <span className="w-10" />
      </header>

      <p className="text-center font-display text-xl text-ivory/90">Explora tu universo interior</p>

      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/explorar/${cat.slug}`} className="tile-art block aspect-[4/5]">
            <UniverseArt slug={cat.slug} className="absolute inset-x-0 top-1 h-[70%] w-full" />
            <div className="absolute inset-x-0 bottom-0 z-10 p-3 text-center">
              <h2 className="font-display text-xl font-semibold text-gold-soft">{cat.name}</h2>
              <p className="text-[11px] leading-tight text-ivory/80">{TAGLINES[cat.slug] ?? cat.tagline}</p>
              <p className="mt-1 text-[10px] text-lilac/70">{cat._count.services} experiencias</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
