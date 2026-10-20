import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

const schema = z.object({
  priceArs: z.number().int().min(0).optional(),
  creditsCost: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  freeDaily: z.boolean().optional(),
  name: z.string().max(160).optional(),
  shortDesc: z.string().max(300).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const { id } = await ctx.params;

  try {
    const body = schema.parse(await req.json());
    const service = await prisma.service.update({ where: { id }, data: body });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actor: "admin",
        action: "service.update",
        entityType: "Service",
        entityId: id,
        meta: body,
      },
    });
    return NextResponse.json({ ok: true, service });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
