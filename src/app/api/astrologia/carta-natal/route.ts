import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { computeNatalChart } from "@/server/astrology/natal";
import { geocode } from "@/server/astrology/geocode";
import { buildSystemPrompt, runLlm } from "@/server/engine/consultation";

const schema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  birthCity: z.string().max(120).optional(),
  birthCountry: z.string().max(120).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  interpret: z.boolean().default(true),
});

// POST /api/astrologia/carta-natal — cálculo astronómico real + interpretación opcional
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());

    // Instante UTC: usamos mediodía local aprox si no hay hora
    const timePart = body.birthTime ? `${body.birthTime}:00` : "12:00:00";
    const birthInstant = new Date(`${body.birthDate}T${timePart}Z`);

    const geo = body.lat != null && body.lon != null
      ? { lat: body.lat, lon: body.lon }
      : geocode(body.birthCity, body.birthCountry);

    const chart = computeNatalChart({
      birthDate: birthInstant,
      lat: geo?.lat ?? null,
      lon: geo?.lon ?? null,
      hasTime: !!body.birthTime,
    });

    let interpretation: string | null = null;
    if (body.interpret) {
      const system = await buildSystemPrompt(
        { kind: "NATAL", slug: "carta-natal", name: "Carta natal" },
        user
      );
      const posText = chart.positions
        .map((p) => `${p.name}: ${p.sign} ${p.signDegree}°`)
        .join(". ");
      const ascMc = [
        chart.ascendant ? `Ascendente: ${chart.ascendant.sign}` : "Ascendente: no calculado (falta hora/lugar)",
        chart.midheaven ? `Medio Cielo: ${chart.midheaven.sign}` : null,
      ].filter(Boolean).join(". ");

      const result = await runLlm(
        [
          { role: "system", content: system },
          {
            role: "user",
            content: `Interpretá esta carta natal calculada astronómicamente (VSOP87):
Posiciones: ${posText}. ${ascMc}.
Fase lunar al nacer: ${chart.moonPhase?.name} (${Math.round((chart.moonPhase?.illumination ?? 0) * 100)}% iluminada).
${chart.warnings.join(" ")}

Escribí una interpretación cálida organizada por tríada (Sol/Luna/Asc si existe) y luego los planetas por áreas de vida. No inventes posiciones que no estén listadas.`,
          },
        ],
        user.id,
        "carta-natal"
      );
      interpretation = result.text;
    }

    // Persistir
    const saved = await prisma.astrologyChart.create({
      data: {
        userId: user.id,
        kind: "natal",
        birthDate: birthInstant,
        birthTime: body.birthTime ?? null,
        hasTime: !!body.birthTime,
        city: body.birthCity ?? null,
        country: body.birthCountry ?? null,
        lat: geo?.lat ?? null,
        lng: geo?.lon ?? null,
        data: {
          positions: chart.positions,
          ascendant: chart.ascendant,
          midheaven: chart.midheaven,
          moonPhase: chart.moonPhase,
          julianDay: chart.julianDay,
          warnings: chart.warnings,
          engine: chart.engine,
        } as unknown as Prisma.InputJsonValue,
        report: interpretation,
      },
    });

    // Actualizar firma astral del perfil
    const sun = chart.positions.find((p) => p.key === "sun");
    const moon = chart.positions.find((p) => p.key === "moon");
    if (sun) {
      await prisma.profile.update({
        where: { userId: user.id },
        data: {
          sunSign: sun.sign,
          moonSign: moon?.sign ?? null,
          risingSign: chart.ascendant?.sign ?? null,
        },
      });
    }

    return NextResponse.json({ ok: true, chartId: saved.id, chart, interpretation });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("carta-natal", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
