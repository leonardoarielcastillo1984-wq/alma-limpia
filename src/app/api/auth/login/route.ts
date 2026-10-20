import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { createSession } from "@/server/auth";
import { tooMany, clientIp } from "@/server/ratelimit";

const schema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    if (await tooMany(`ip:${clientIp(req)}`, "login", 10, 60)) {
      return NextResponse.json({ error: "TOO_MANY" }, { status: 429 });
    }
    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    if (!user || !user.passwordHash || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    await createSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      guest: user.isGuest,
    });
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    console.error("login error", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
