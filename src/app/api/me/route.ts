import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

const patchSchema = z.object({
  displayName: z.string().max(80).optional(),
  birthDate: z.string().optional(),
  birthTime: z.string().optional(),
  birthCity: z.string().max(120).optional(),
  birthCountry: z.string().max(120).optional(),
  consentMemory: z.boolean().optional(),
  reduceMotion: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  deckPreference: z.string().optional(),
});

const SIGNS = [
  "Capricornio", "Acuario", "Piscis", "Aries", "Tauro", "Géminis",
  "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio",
];

function sunSign(d: Date) {
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  // aproximación estándar de fechas solares (para display; la carta real usa astronomia)
  const edges = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 23, 22];
  const idx = day >= edges[month - 1] ? month : month - 1;
  return SIGNS[idx % 12];
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const body = patchSchema.parse(await req.json());

    if (body.consentMemory !== undefined && body.consentMemory !== user.consentMemory) {
      await prisma.consentRecord.create({
        data: { userId: user.id, type: "MEMORY", granted: body.consentMemory },
      });
    }

    const birthDate = body.birthDate ? new Date(`${body.birthDate}T12:00:00Z`) : undefined;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.displayName ?? undefined,
        birthDate,
        birthTime: body.birthTime || null,
        birthCity: body.birthCity || null,
        birthCountry: body.birthCountry || null,
        consentMemory: body.consentMemory ?? undefined,
        profile: {
          upsert: {
            create: {
              displayName: body.displayName ?? null,
              sunSign: birthDate ? sunSign(birthDate) : null,
            },
            update: {
              displayName: body.displayName ?? undefined,
              sunSign: birthDate ? sunSign(birthDate) : undefined,
            },
          },
        },
        preferences: {
          upsert: {
            create: {
              reduceMotion: body.reduceMotion ?? false,
              soundEnabled: body.soundEnabled ?? false,
              deckPreference: body.deckPreference ?? "rider",
            },
            update: {
              reduceMotion: body.reduceMotion ?? undefined,
              soundEnabled: body.soundEnabled ?? undefined,
              notificationsEnabled: body.notificationsEnabled ?? undefined,
              deckPreference: body.deckPreference ?? undefined,
            },
          },
        },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    console.error("me PATCH", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

/**
 * DELETE /api/me — elimina la cuenta y todos sus datos.
 * Las relaciones onDelete: Cascade borran consultas, mensajes, tiradas,
 * diarios, cartas, reportes, billetera y preferencias.
 * Purchase, CreditTransaction, Subscription y Membership tienen relación
 * requerida sin cascade → hay que borrarlos antes o la FK bloquea la baja.
 * AuditLog.user es opcional → queda desvinculado (SetNull) como registro.
 */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.creditTransaction.deleteMany({ where: { userId: user.id } });
      await tx.purchase.deleteMany({ where: { userId: user.id } });
      await tx.subscription.deleteMany({ where: { userId: user.id } });
      await tx.membership.deleteMany({ where: { userId: user.id } });
      await tx.auditLog.create({
        data: { actor: "user", action: "account.deleted", entityType: "User", entityId: user.id },
      });
      await tx.user.delete({ where: { id: user.id } });
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("alma_session", "", { maxAge: 0, path: "/" });
    return res;
  } catch (e) {
    console.error("me DELETE", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
