import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { checkAccess, chargeCredits, QuotaError } from "@/server/engine/consultation";

/**
 * GET /api/rituales/[slug] — contenido del ritual + estado del usuario
 * (si ya lo guardó o completó). El acceso se verifica en la página;
 * acá solo devolvemos datos + acceso disponible.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { slug } = await ctx.params;

  const ritual = await prisma.ritual.findUnique({
    where: { slug },
    include: { savedBy: { where: { userId: user.id } } },
  });
  if (!ritual || !ritual.active) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const service = await prisma.service.findUnique({ where: { slug } });
  let access: "free" | "purchase" | "credits" | "membership" | "none" = "none";
  if (service) {
    try {
      const a = await checkAccess(user, slug);
      access = a.mode;
    } catch {
      access = "none";
    }
  }

  const saved = ritual.savedBy[0] ?? null;
  return NextResponse.json({
    ritual: {
      slug: ritual.slug,
      name: ritual.name,
      category: ritual.category,
      description: ritual.description,
      steps: ritual.steps,
      safeVariant: ritual.safeVariant,
      durationMin: ritual.durationMin,
    },
    service: service ? { priceArs: service.priceArs, freeDaily: service.freeDaily, active: service.active } : null,
    access,
    saved: saved ? { doneAt: saved.doneAt, notes: saved.notes } : null,
  });
}

const postSchema = z.object({
  action: z.enum(["save", "complete"]),
  notes: z.string().max(2000).optional(),
});

/**
 * POST /api/rituales/[slug] — guardar ritual o marcarlo completado.
 * Al completar: si el acceso fue por compra, consume la compra
 * (crea la consulta espejo que la marca como usada); si fue por créditos, cobra.
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { slug } = await ctx.params;

  try {
    const body = postSchema.parse(await req.json());
    const ritual = await prisma.ritual.findUnique({ where: { slug } });
    if (!ritual || !ritual.active) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const service = await prisma.service.findUnique({ where: { slug } });

    if (body.action === "complete" && service) {
      // Verificar acceso vigente y consumir según el modo
      let access;
      try {
        access = await checkAccess(user, slug);
      } catch (e) {
        if (e instanceof QuotaError) {
          return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 402 });
        }
        throw e;
      }

      if (access.mode === "purchase" && access.purchaseId) {
        await prisma.consultation.create({
          data: {
            userId: user.id,
            serviceId: service.id,
            purchaseId: access.purchaseId,
            meta: { accessMode: "purchase", ritual: true },
          },
        });
      } else if (access.mode === "credits") {
        await chargeCredits(user.id, service.id);
      }
    }

    const saved = await prisma.ritualSaved.upsert({
      where: { userId_ritualId: { userId: user.id, ritualId: ritual.id } },
      update: {
        ...(body.action === "complete" ? { doneAt: new Date() } : {}),
        notes: body.notes ?? undefined,
      },
      create: {
        userId: user.id,
        ritualId: ritual.id,
        doneAt: body.action === "complete" ? new Date() : null,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ ok: true, saved });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("ritual POST", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
