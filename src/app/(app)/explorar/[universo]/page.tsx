import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/server/db";
import { CatalogList } from "./CatalogList";

export default async function UniversoPage({
  params,
}: {
  params: Promise<{ universo: string }>;
}) {
  const { universo } = await params;
  const category = await prisma.serviceCategory.findUnique({
    where: { slug: universo },
    include: { services: { where: { active: true }, orderBy: { order: "asc" } } },
  });
  if (!category || !category.active) notFound();

  return (
    <div className="animate-fade-up space-y-5">
      <header className="relative text-center">
        <Link
          href="/explorar"
          aria-label="Volver a Explorar"
          className="absolute left-0 top-2 flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-4xl font-medium text-gold-soft">{category.name}</h1>
        <p className="mx-auto mt-1 max-w-[16rem] text-sm text-ivory/80">{category.tagline}</p>
      </header>

      <CatalogList
        categorySlug={category.slug}
        items={category.services.map((s) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          shortDesc: s.shortDesc,
          kind: s.kind,
          priceArs: s.priceArs,
          creditsCost: s.creditsCost,
          freeDaily: s.freeDaily,
        }))}
      />
    </div>
  );
}
