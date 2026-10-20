import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import { createSession } from "@/server/auth";
import { tooMany, clientIp } from "@/server/ratelimit";
import { sendMail, emailTemplates } from "@/server/email";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  try {
    if (await tooMany(`ip:${clientIp(req)}`, "register", 5, 3600)) {
      return NextResponse.json({ error: "TOO_MANY" }, { status: 429 });
    }
    const body = schema.parse(await req.json());

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        profile: { create: { displayName: body.name } },
        preferences: { create: {} },
        creditWallet: { create: {} },
        consentRecords: {
          create: [
            { type: "TERMS", granted: true },
            { type: "PRIVACY", granted: true },
          ],
        },
      },
    });

    await createSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      guest: false,
    });
// Bienvenida (best-effort — si SMTP falta, solo se loguea)
    void sendMail(body.email, "Bienvenida/o a ALMA LIMPIA 🌙", emailTemplates.welcome(body.name));

    
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_INPUT", issues: e.issues }, { status: 400 });
    }
    console.error("register error", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
