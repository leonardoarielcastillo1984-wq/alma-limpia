import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { tooMany, clientIp } from "@/server/ratelimit";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(100),
});

/**
 * POST /api/auth/reset — valida el token (1 uso, ≤1h) y cambia la contraseña.
 */
export async function POST(req: Request) {
  try {
    if (await tooMany(`ip:${clientIp(req)}`, "reset", 10, 3600)) {
      return NextResponse.json({ error: "TOO_MANY" }, { status: 429 });
    }
    const { token, password } = schema.parse(await req.json());

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "TOKEN_INVALID" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Invalidar otros tokens abiertos del mismo usuario
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("reset error", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
