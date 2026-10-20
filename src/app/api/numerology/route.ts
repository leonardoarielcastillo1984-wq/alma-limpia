import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { computeNumerology, compatibility } from "@/server/numerology";
import { buildSystemPrompt, runLlm } from "@/server/engine/consultation";

const schema = z.object({
  name: z.string().min(2).max(120),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partnerName: z.string().max(120).optional(),
  partnerBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  interpret: z.boolean().default(true),
});

// POST /api/numerology — cálculo determinístico + interpretación LLM opcional
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const results = computeNumerology(body.name, body.birthDate);

    let compat: { score: number; diff: number } | null = null;
    if (body.partnerName && body.partnerBirthDate) {
      const p = computeNumerology(body.partnerName, body.partnerBirthDate);
      compat = compatibility(results.lifePath, p.lifePath);
    }

    let interpretation: string | null = null;
    if (body.interpret) {
      const system = await buildSystemPrompt({ kind: "NUMEROLOGY", slug: "numerologia", name: "Numerología" }, user);
      const result = await runLlm(
        [
          { role: "system", content: system },
          {
            role: "user",
            content: `Interpretá estos números ya calculados (tradición pitagórica) para ${body.name}:
${JSON.stringify(results)}${compat ? `\nCompatibilidad con ${body.partnerName}: score ${compat.score}` : ""}
Escribí una lectura cálida y útil, sección por número. No cambies los valores.`,
          },
        ],
        user.id,
        "numerologia"
      );
      interpretation = result.text;
    }

    const report = await prisma.numerologyReport.create({
      data: {
        userId: user.id,
        name: body.name,
        birthDate: new Date(`${body.birthDate}T12:00:00Z`),
        results: { ...results, compatibility: compat },
        report: interpretation,
      },
    });

    return NextResponse.json({ ok: true, report: { id: report.id, results, compat, interpretation } });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("numerology", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
