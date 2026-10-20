import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) redirect("/inicio");

  const [users, consultas, revenue, services, usage, promos, prompts, purchases] = await Promise.all([
    prisma.user.count(),
    prisma.consultation.count(),
    prisma.purchase.aggregate({ _sum: { amountArs: true }, where: { status: "APPROVED" } }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
      select: { id: true, slug: true, name: true, priceArs: true, creditsCost: true, freeDaily: true, active: true, category: { select: { name: true } } },
    }),
    prisma.aiUsageLog.aggregate({ _sum: { tokensIn: true, tokensOut: true }, _count: true }),
    prisma.promotion.findMany({ orderBy: { code: "asc" } }),
    prisma.promptTemplate.findMany({ orderBy: [{ key: "asc" }, { version: "desc" }] }),
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true, kind: true, amountArs: true, status: true, mpPaymentId: true, metadata: true,
        createdAt: true, updatedAt: true,
        user: { select: { name: true, email: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  return (
    <AdminClient
      stats={{
        users,
        consultas,
        revenue: revenue._sum.amountArs ?? 0,
        aiCalls: usage._count,
        tokensIn: usage._sum.tokensIn ?? 0,
        tokensOut: usage._sum.tokensOut ?? 0,
      }}
      services={services}
      promos={promos}
      prompts={prompts}
      purchases={purchases.map((p) => {
        const meta = (p.metadata ?? {}) as { plan?: string; credits?: number; coupon?: string };
        return {
          id: p.id,
          date: p.createdAt.toISOString(),
          paidAt: p.status === "APPROVED" ? p.updatedAt.toISOString() : null,
          userName: p.user.name,
          userEmail: p.user.email,
          kind: p.kind,
          item:
            p.kind === "MEMBERSHIP" ? `Membresía ${meta.plan ?? ""}`.trim()
            : p.kind === "CREDITS" ? `${meta.credits ?? 0} créditos`
            : p.service?.name ?? "Servicio",
          coupon: meta.coupon ?? null,
          amountArs: p.amountArs,
          status: p.status,
          mpPaymentId: p.mpPaymentId,
        };
      })}
    />
  );
}
