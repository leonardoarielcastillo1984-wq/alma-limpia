import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { checkAccess, QuotaError } from "@/server/engine/consultation";

const schema = z.object({
  serviceSlug: z.string().min(1).max(120),
});

// POST /api/consultas — inicia una consulta (verifica acceso server-side)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const { serviceSlug } = schema.parse(await req.json());
    const access = await checkAccess(user, serviceSlug);
    const { service, mode } = access;

    const consultation = await prisma.consultation.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        status: "OPEN",
        paid: mode !== "credits",
        purchaseId: "purchaseId" in access ? access.purchaseId : null,
        meta: { accessMode: mode },
      },
    });
    const conversation = await prisma.conversation.create({
      data: {
        consultationId: consultation.id,
        userId: user.id,
        memoryEnabled: user.consentMemory,
      },
    });

    // Mensaje inicial de la guía según engineConfig del servicio
    const cfg = (service.engineConfig ?? {}) as { questions?: string[] };
    const opening =
      cfg.questions?.[0] ??
      `Hola 🌙 Soy tu guía de ALMA LIMPIA y estoy acá para acompañarte. Contame: ¿qué te trae a *${service.name}* hoy?`;
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "GUIDE", content: opening },
    });

    return NextResponse.json({
      ok: true,
      consultationId: consultation.id,
      conversationId: conversation.id,
      accessMode: mode,
      service: { slug: service.slug, name: service.name, kind: service.kind, engineConfig: service.engineConfig },
    });
  } catch (e) {
    if (e instanceof QuotaError) {
      return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 402 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    console.error("consultas POST", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
