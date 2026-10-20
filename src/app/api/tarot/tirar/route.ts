import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import {
  newSeed, shuffleDeck, cardReversed, spreadCount, SPREAD_POSITIONS, type SpreadType,
} from "@/server/engine/tarot";

const schema = z.object({
  consultationId: z.string().uuid(),
  spread: z.enum(["one", "three", "five", "seven", "celtic"]),
  question: z.string().max(500).optional(),
  deckSlug: z.string().default("rider"),
});

/**
 * POST /api/tarot/tirar
 * Selección REAL server-side: mezcla determinista por seed (verificable),
 * cartas reales del mazo en DB, orientación por seed+posición.
 * El LLM después interpreta ESTAS cartas — nunca inventadas.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const { consultationId, spread, question, deckSlug } = schema.parse(await req.json());

    const consultation = await prisma.consultation.findFirst({
      where: { id: consultationId, userId: user.id },
      include: { tarotReading: true },
    });
    if (!consultation) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (consultation.tarotReading) {
      return NextResponse.json({ error: "ALREADY_DRAWN", reading: consultation.tarotReading }, { status: 409 });
    }

    const deck = await prisma.tarotDeck.findUnique({
      where: { slug: deckSlug },
      include: { cards: { orderBy: { order: "asc" } } },
    });
    if (!deck || deck.cards.length === 0) {
      return NextResponse.json({ error: "DECK_NOT_FOUND" }, { status: 500 });
    }

    const seed = newSeed();
    const count = spreadCount(spread as SpreadType);
    const order = shuffleDeck(deck.cards.length, seed);
    const picked = order.slice(0, count).map((idx, pos) => {
      const card = deck.cards[idx];
      const reversed = cardReversed(seed, pos);
      return {
        cardId: card.id,
        code: card.code,
        name: card.name,
        arcana: card.arcana,
        imageUrl: card.imageUrl,
        position: pos,
        positionName: SPREAD_POSITIONS[spread as SpreadType][pos],
        reversed,
        keywords: reversed ? card.reversedKeys : card.uprightKeys,
      };
    });

    const reading = await prisma.tarotReading.create({
      data: {
        userId: user.id,
        consultationId: consultation.id,
        serviceId: consultation.serviceId,
        spreadType: spread,
        question: question ?? null,
        seed,
        cards: picked,
      },
    });

    // Las cartas quedan en el historial de la conversación como mensaje estructurado
    const convo = await prisma.conversation.findUnique({ where: { consultationId: consultation.id } });
    if (convo) {
      await prisma.message.create({
        data: {
          conversationId: convo.id,
          role: "SYSTEM",
          kind: "cards",
          content: `Tirada ${spread}: ${picked.map((c) => `${c.name}${c.reversed ? " (invertida)" : ""}`).join(", ")}`,
          payload: { readingId: reading.id, spread, question, cards: picked },
        },
      });
    }

    return NextResponse.json({ ok: true, reading: { id: reading.id, seed, spread, cards: picked } });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("tarot tirar", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
