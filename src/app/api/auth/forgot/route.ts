import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/server/db";
import { tooMany, clientIp } from "@/server/ratelimit";
import { sendMail, emailTemplates } from "@/server/email";

const schema = z.object({ email: z.string().email().toLowerCase() });

/**
 * POST /api/auth/forgot — genera un token de reset (1h) y lo envía por email.
 * Respuesta siempre ok para no filtrar si el email existe.
 */
export async function POST(req: Request) {
  try {
    if (await tooMany(`ip:${clientIp(req)}`, "forgot", 5, 3600)) {
      return NextResponse.json({ error: "TOO_MANY" }, { status: 429 });
    }
    const { email } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email, status: "ACTIVE" } });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600_000) },
      });
      const url = `${process.env.ALMA_APP_URL ?? ""}/recuperar/${token}`;
      void sendMail(email, "Recuperá tu acceso — ALMA LIMPIA", emailTemplates.resetPassword(user.name ?? "viajera/o", url));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("forgot error", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
