import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

// POST /api/push — registrar o actualizar una suscripción push
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = subSchema.parse(await req.json());
    await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      create: {
        userId: user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: req.headers.get("user-agent")?.slice(0, 200),
      },
      update: { userId: user.id, p256dh: body.keys.p256dh, auth: body.keys.auth },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("push subscribe", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

// DELETE /api/push — quitar suscripción
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { endpoint } = await req.json().catch(() => ({})) as { endpoint?: string };
  await prisma.pushSubscription.deleteMany({ where: { endpoint: endpoint ?? "", userId: user.id } });
  return NextResponse.json({ ok: true });
}
