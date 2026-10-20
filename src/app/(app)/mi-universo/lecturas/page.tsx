import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";

interface StoredCard {
  name: string;
  positionName: string;
  reversed: boolean;
}

export default async function LecturasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const readings = await prisma.tarotReading.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { service: { select: { name: true } } },
    take: 50,
  });

  return (
    <div className="animate-fade-up space-y-6">
      <Link href="/mi-universo" className="inline-flex items-center gap-2 text-sm text-mist hover:text-ivory">
        <ArrowLeft size={16} /> Mi Universo
      </Link>
      <header>
        <h1 className="font-display text-3xl font-semibold text-gradient-gold">Mis lecturas</h1>
        <p className="mt-1 text-sm text-mist">Historial de tiradas verificables</p>
      </header>

      {readings.length === 0 ? (
        <p className="card-mystic p-8 text-center text-sm text-mist">
          Todavía no hiciste tiradas.{" "}
          <Link href="/explorar/oraculo/tarot-del-dia" className="text-violet underline">
            Probá la carta del día →
          </Link>
        </p>
      ) : (
        <div className="space-y-4">
          {readings.map((r) => {
            const cards = (r.cards as unknown as StoredCard[]) ?? [];
            return (
              <details key={r.id} className="card-mystic group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between">
                  <div>
                    <p className="font-medium text-ivory">
                      {r.service?.name ?? r.spreadType}
                    </p>
                    <p className="text-xs text-mist">
                      {r.createdAt.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
                      {r.question && ` · “${r.question.slice(0, 50)}${r.question.length > 50 ? "…" : ""}”`}
                    </p>
                  </div>
                  <span className="text-gold/50 transition group-open:rotate-90">›</span>
                </summary>
                <div className="mt-4 space-y-2 border-t border-gold/10 pt-4">
                  {cards.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-mist">{c.positionName}</span>
                      <span className="text-ivory">
                        {c.name} {c.reversed && <span className="text-rose">(invertida)</span>}
                      </span>
                    </div>
                  ))}
                  {r.interpretation && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mist">
                      {r.interpretation}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-[10px] text-mist/40">
                    seed: {r.seed} · verificable
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
