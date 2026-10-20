import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) return null;
  return user;
}

// GET /api/admin/promotions — lista de promociones
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const promos = await prisma.promotion.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ promos });
}

const postSchema = z.object({
  code: z.string().min(3).max(40).toUpperCase(),
  kind: z.enum(["PERCENT", "FIXED", "CREDITS", "FREE_SERVICE"]),
  value: z.number().int().min(1).max(100000),
  serviceId: z.string().uuid().optional(),
  maxUses: z.number().int().min(1).optional(),
  validUntil: z.string().optional(), // ISO date
});

// POST /api/admin/promotions — crear cupón
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const body = postSchema.parse(await req.json());
    const promo = await prisma.promotion.create({
      data: {
        code: body.code,
        kind: body.kind,
        value: body.value,
        serviceId: body.serviceId,
        maxUses: body.maxUses,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
      },
    });
    await prisma.auditLog.create({
      data: { actor: "admin", userId: admin.id, action: "promotion.created", entityType: "Promotion", entityId: promo.id, meta: { code: promo.code } },
    });
    return NextResponse.json({ ok: true, promo });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    const code = (e as { code?: string }).code;
    if (code === "P2002") return NextResponse.json({ error: "CODE_TAKEN" }, { status: 409 });
    console.error("admin promotions POST", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
