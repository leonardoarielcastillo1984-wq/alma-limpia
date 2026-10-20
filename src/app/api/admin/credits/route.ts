import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

const schema = z.object({
  email: z.string().email().toLowerCase(),
  credits: z.number().int().min(1).max(1000),
  reason: z.string().max(200).default("ADMIN_GRANT"),
});

// POST /api/admin/credits — otorgar créditos a un usuario por email
export async function POST(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    const body = schema.parse(await req.json());
    const target = await prisma.user.findUnique({ where: { email: body.email } });
    if (!target) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.creditWallet.upsert({
        where: { userId: target.id },
        create: { userId: target.id, balance: body.credits },
        update: { balance: { increment: body.credits } },
      });
      await tx.creditTransaction.create({
        data: {
          userId: target.id, walletId: wallet.id, amount: body.credits,
          reason: body.reason, refId: admin.id,
          balance: wallet.balance ?? body.credits,
        },
      });
      await tx.auditLog.create({
        data: {
          actor: "admin", userId: admin.id, action: "credits.granted",
          entityType: "User", entityId: target.id,
          meta: { credits: body.credits, reason: body.reason },
        },
      });
      return wallet.balance ?? body.credits;
    });

    return NextResponse.json({ ok: true, balance: result });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("admin credits POST", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
