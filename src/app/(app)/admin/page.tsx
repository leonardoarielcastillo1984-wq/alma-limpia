import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) redirect("/inicio");

  const [users, consultas, revenue, services, usage, promos, prompts, purchases, userRows, consultaRows, aiLogs] = await Promise.all([
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
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true, name: true, email: true, isGuest: true, role: true, status: true, createdAt: true,
        _count: { select: { consultations: true, purchases: true, journals: true } },
      },
    }),
    prisma.consultation.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true, status: true, paid: true, title: true, meta: true, createdAt: true,
        user: { select: { name: true, email: true } },
        service: { select: { name: true } },
        conversation: { select: { messages: { where: { role: "USER" }, orderBy: { createdAt: "asc" }, take: 1, select: { content: true, createdAt: true } } } },
      },
    }),
    prisma.aiUsageLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, serviceSlug: true, provider: true, model: true,
        tokensIn: true, tokensOut: true, costMicroUsd: true, latencyMs: true, status: true, createdAt: true,
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
      usuarios={userRows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isGuest: u.isGuest,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        consultas: u._count.consultations,
        compras: u._count.purchases,
        diario: u._count.journals,
      }))}
      consultasDetalle={consultaRows.map((c) => {
        const meta = (c.meta ?? {}) as { accessMode?: string; oracle?: string };
        const firstMsg = c.conversation?.messages[0];
        return {
          id: c.id,
          date: c.createdAt.toISOString(),
          userName: c.user.name,
          userEmail: c.user.email,
          service: c.service?.name ?? meta.oracle ?? "Consulta",
          status: c.status,
          paid: c.paid,
          accessMode: meta.accessMode ?? null,
          title: c.title ?? null,
          firstMessage: firstMsg?.content ?? null,
        };
      })}
      motor={aiLogs.map((l) => ({
        id: l.id,
        date: l.createdAt.toISOString(),
        service: l.serviceSlug,
        model: l.model,
        tokens: l.tokensIn + l.tokensOut,
        costUsd: l.costMicroUsd / 1_000_000,
        latencyMs: l.latencyMs,
        status: l.status,
      }))}
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
