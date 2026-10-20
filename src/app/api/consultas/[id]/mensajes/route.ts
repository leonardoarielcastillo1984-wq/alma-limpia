import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { tooMany } from "@/server/ratelimit";
import {
  buildSystemPrompt, getMemoryContext, runLlm, chargeCredits,
} from "@/server/engine/consultation";
import type { LlmMessage } from "@/server/llm";

const schema = z.object({ content: z.string().min(1).max(2000) });
const MAX_MESSAGES_PER_CONSULT = 40;

// POST /api/consultas/[id]/mensajes — envía mensaje del usuario y responde la guía
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;

  try {
    if (await tooMany(`user:${user.id}`, "mensaje", 60, 3600)) {
      return NextResponse.json({ error: "TOO_MANY" }, { status: 429 });
    }
    const { content } = schema.parse(await req.json());

    const consultation = await prisma.consultation.findFirst({
      where: { id, userId: user.id },
      include: { service: true, conversation: { include: { messages: { orderBy: { createdAt: "asc" } } } } },
    });
    if (!consultation?.conversation) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const convo = consultation.conversation;
    if (convo.messages.filter((m) => m.role === "USER").length >= MAX_MESSAGES_PER_CONSULT) {
      return NextResponse.json({ error: "LIMIT_REACHED" }, { status: 429 });
    }

    // Si la consulta está pagada por créditos y aún no se cobró, cobrar en el primer mensaje
    const meta = consultation.meta as { accessMode?: string } | null;
    if (meta?.accessMode === "credits" && !consultation.paid) {
      await chargeCredits(user.id, consultation.serviceId!);
    }

    await prisma.message.create({
      data: { conversationId: convo.id, role: "USER", content },
    });

    // Prompt: sistema + memoria (si consintió) + historial
    const system = await buildSystemPrompt(
      { kind: consultation.service?.kind ?? "CHAT", slug: consultation.service?.slug ?? "", name: consultation.service?.name ?? "Consulta" },
      user
    );
    const memory = await getMemoryContext(user, convo.id);
    const history: LlmMessage[] = convo.messages.map((m) => ({
      role: m.role === "GUIDE" ? "assistant" : m.role === "SYSTEM" ? "system" : "user",
      content: m.content,
    }));

    // Mensajes estructurados (tarot) se inyectan como contexto
    const cardContext = convo.messages
      .filter((m) => m.kind === "cards")
      .map((m) => ({ role: "system" as const, content: `Cartas reveladas en esta consulta: ${JSON.stringify(m.payload)}` }));

    const result = await runLlm(
      [{ role: "system", content: system }, ...memory, ...cardContext, ...history, { role: "user", content }],
      user.id,
      consultation.service?.slug ?? "chat"
    );

    const guideMsg = await prisma.message.create({
      data: {
        conversationId: convo.id, role: "GUIDE", content: result.text,
        tokensIn: result.tokensIn, tokensOut: result.tokensOut,
      },
    });

    await prisma.conversation.update({ where: { id: convo.id }, data: { updatedAt: new Date() } });

    // Respuesta progresiva: si el cliente pide stream, enviamos el texto
    // en chunks (efecto "la guía escribe") vía SSE.
    const wantsStream = req.headers.get("x-stream") === "1" || req.headers.get("accept")?.includes("text/event-stream");
    if (wantsStream) {
      const text = result.text;
      const msgId = guideMsg.id;
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const CHUNK = 6;
          for (let i = 0; i < text.length; i += CHUNK) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text.slice(i, i + CHUNK) })}\n\n`));
            await new Promise((r) => setTimeout(r, 24));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, id: msgId })}\n\n`));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return NextResponse.json({ ok: true, message: { id: guideMsg.id, content: result.text } });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    if ((e as { code?: string }).code === "PAYMENT_REQUIRED") {
      return NextResponse.json({ error: "PAYMENT_REQUIRED" }, { status: 402 });
    }
    console.error("mensajes POST", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

// GET /api/consultas/[id]/mensajes — historial
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await ctx.params;

  const consultation = await prisma.consultation.findFirst({
    where: { id, userId: user.id },
    include: {
      service: true,
      conversation: { include: { messages: { orderBy: { createdAt: "asc" } } } },
      tarotReading: true,
    },
  });
  if (!consultation?.conversation) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({
    consultation: {
      id: consultation.id,
      service: consultation.service,
      accessMode: (consultation.meta as { accessMode?: string })?.accessMode,
    },
    messages: consultation.conversation.messages,
    tarotReading: consultation.tarotReading,
  });
}
