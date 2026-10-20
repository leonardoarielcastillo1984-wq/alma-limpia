import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { SuenosClient } from "./SuenosClient";

export const metadata = { title: "Diario de sueños — ALMA LIMPIA" };

export default async function SuenosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const entries = await prisma.journal.findMany({
    where: { userId: user.id, kind: "suenos" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="animate-fade-up space-y-6">
      <Link href="/mi-universo" className="inline-flex items-center gap-2 text-sm text-mist hover:text-ivory">
        <ArrowLeft size={16} /> Mi Universo
      </Link>
      <header>
        <h1 className="font-display text-3xl font-semibold text-gradient-gold">Diario de sueños</h1>
        <p className="mt-1 text-sm text-mist">Los sueños se olvidan rápido — anotalos al despertar</p>
      </header>
      <SuenosClient
        initialEntries={entries.map((e) => ({
          id: e.id,
          title: e.title,
          content: e.content,
          mood: e.mood,
          tags: e.tags,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
