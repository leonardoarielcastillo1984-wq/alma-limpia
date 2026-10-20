import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) redirect("/inicio");

  const [users, consultas, revenue, services, usage, promos, prompts] = await Promise.all([
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
    />
  );
}
