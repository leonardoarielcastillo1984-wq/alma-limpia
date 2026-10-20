import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { createSession } from "@/server/auth";
import { tooMany, clientIp } from "@/server/ratelimit";

// Ingreso como invitado: crea un User isGuest sin email.
// Desde perfil puede "reclamar" la cuenta con email+password después.
export async function POST(req: Request) {
  try {
    if (await tooMany(`ip:${clientIp(req)}`, "guest", 10, 3600)) {
      return NextResponse.json({ error: "TOO_MANY" }, { status: 429 });
    }
    const user = await prisma.user.create({
      data: {
        isGuest: true,
        profile: { create: {} },
        preferences: { create: {} },
        creditWallet: { create: {} },
      },
    });
    await createSession({ sub: user.id, role: "USER", guest: true });
    return NextResponse.json({ ok: true, user: { id: user.id, guest: true } });
  } catch (e) {
    console.error("guest error", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
