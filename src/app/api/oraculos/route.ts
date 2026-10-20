import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { drawPendulum, drawRunes, drawIChing, drawAkashic } from "@/server/oracles";
import {
  buildSystemPrompt, chargeCredits, checkAccess, getMemoryContext, getOracleHistory, QuotaError, runLlm,
} from "@/server/engine/consultation";

const SERVICE_SLUG = {
  pendulo: "pendulo-virtual",
  runas: "runas-nordicas",
  iching: "i-ching",
  akashico: "registros-akashicos",
} as const;

const schema = z.object({
  oracle: z.enum(["pendulo", "runas", "iching", "akashico"]),
  question: z.string().max(500).optional(),
  // Datos del consultante que el módulo pide (nombre, fecha, área) — enriquecen la lectura
  context: z.string().max(300).optional(),
  interpret: z.boolean().default(true),
});

/**
 * POST /api/oraculos — sorteo real server-side + interpretación opcional.
 * El resultado del sorteo es determinístico por seed y nunca se inventa.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const access = await checkAccess(user, SERVICE_SLUG[body.oracle]);
    const seed = crypto.randomUUID();
    const question = body.question?.trim() || undefined;
    const context = body.context?.trim() || undefined;

    let result: Record<string, unknown>;
    let summary: string;

    if (body.oracle === "pendulo") {
      const r = drawPendulum(seed);
      result = { seed, ...r };
      summary = `Péndulo → "${r.answer}" (${r.swing})${question ? `. Pregunta: ${question}` : ""}`;
    } else if (body.oracle === "runas") {
      const runes = drawRunes(seed, 3);
      result = { seed, runes };
      summary = `Runas → ${runes.map((r) => `${r.name}${r.reversed ? " invertida" : ""}`).join(", ")}`;
    } else if (body.oracle === "akashico") {
      const a = drawAkashic(seed);
      result = { seed, ...a };
      summary = `Registro akáshico → ${a.hall}; símbolo: ${a.symbol}; tema: ${a.theme}`;
    } else {
      const hex = drawIChing(seed);
      result = { seed, ...hex };
      summary = `I Ching → hexagrama ${hex.hexagramNumber} "${hex.name}"${hex.changedHexagramNumber ? ` → cambia a ${hex.changedHexagramNumber}` : ""}`;
    }

    // Interpretación de la guía (opcional)
    let interpretation: string | null = null;
    if (body.interpret) {
      const serviceName =
        body.oracle === "pendulo" ? "Péndulo" : body.oracle === "runas" ? "Runas nórdicas" : body.oracle === "akashico" ? "Registros akáshicos" : "I Ching";
      const system = await buildSystemPrompt(
        { kind: "READING", slug: body.oracle, name: serviceName },
        user
      );
      const memory = await getMemoryContext(user, "");
      const history = await getOracleHistory(user);
      try {
        const llm = await runLlm(
          [
            { role: "system", content: system },
            ...memory,
            {
              role: "user",
              content: `Sorteo real ya hecho: ${summary}. ${question ? `La persona preguntó: "${question}".` : ""} ${context ? `Datos que compartió: ${context}.` : ""} ${history.length ? `Sus tiradas anteriores (su diario): ${history.join(" | ")}. Si conecta con algo de antes, mencionalo con naturalidad ("la última vez que abriste tu registro..."), sin repetir datos ni forzarlo.` : ""} Interpretá este resultado — no cambies el sorteo, interpretá EXACTAMENTE lo que salió, conectándolo con lo que te contó.`,
            },
          ],
          user.id,
          body.oracle
        );
        interpretation = llm.text;
      } catch (e) {
        // El LLM puede fallar (red, cuota, modelo) — el sorteo es real e igualmente válido
        console.error("oraculos interpret", e);
      }
    }

    // Guardar como entrada de diario simbólico (visible en Mi Universo)
    await prisma.journal.create({
      data: {
        userId: user.id,
        kind: "oraculo",
        title: `${body.oracle === "pendulo" ? "Péndulo" : body.oracle === "runas" ? "Runas" : body.oracle === "akashico" ? "Registro akáshico" : "I Ching"}${question ? `: ${question.slice(0, 60)}` : ""}`,
        content: `${summary}\n\n${interpretation ?? ""}`,
      },
    });

    await prisma.consultation.create({
      data: {
        userId: user.id,
        serviceId: access.service.id,
        status: "DONE",
        paid: access.mode !== "credits",
        purchaseId: "purchaseId" in access ? access.purchaseId : null,
        meta: { accessMode: access.mode, oracle: body.oracle, seed },
      },
    });
    if (access.mode === "credits") await chargeCredits(user.id, access.service.id);

    return NextResponse.json({ ok: true, result, interpretation });
  } catch (e) {
    if (e instanceof QuotaError) return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 402 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("oraculos POST", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
