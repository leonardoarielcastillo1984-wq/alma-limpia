import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { MembresiaClient } from "./MembresiaClient";

export const metadata = { title: "Membresía — ALMA LIMPIA" };

export default async function MembresiaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [membership, purchases] = await Promise.all([
    prisma.membership.findFirst({
      where: { userId: user.id, active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchase.findMany({
      where: { userId: user.id },
      include: { service: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-gradient-gold">Membresía</h1>
        <p className="mt-1 text-sm text-mist">Acceso ilimitado a tus experiencias.</p>
      </header>
      <MembresiaClient
        activePlan={membership?.planCode ?? null}
        expiresAt={membership?.expiresAt?.toISOString() ?? null}
        purchases={purchases.map((p) => ({
          id: p.id, kind: p.kind, amountArs: p.amountArs, status: p.status,
          createdAt: p.createdAt.toISOString(),
          service: p.service ? { name: p.service.name } : null,
          metadata: p.metadata as Record<string, unknown> | null,
        }))}
      />
    </div>
  );
}
