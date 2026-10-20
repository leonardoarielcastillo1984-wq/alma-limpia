import { prisma } from "../db";
import type { User } from "@prisma/client";
import type { LlmMessage } from "../llm";
import { getLlmProvider } from "../llm";

export class QuotaError extends Error {
  code = "PAYMENT_REQUIRED";
}

/**
 * Verifica si el usuario puede iniciar una consulta para el servicio:
 * - servicio activo
 * - freeDaily y dentro del límite → gratis
 * - si no: requiere créditos o compra aprobada previa
 */
export async function checkAccess(user: User, serviceSlug: string) {
  const service = await prisma.service.findUnique({
    where: { slug: serviceSlug },
    include: { category: true },
  });
  if (!service || !service.active) throw new QuotaError();

  // Gratis por día
  if (service.freeDaily || service.priceArs === 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usedToday = await prisma.consultation.count({
      where: { userId: user.id, serviceId: service.id, createdAt: { gte: today } },
    });
    if (usedToday < Math.max(service.freeLimitPerDay, 1)) {
      return { service, mode: "free" as const };
    }
  }

  // Compra aprobada del servicio que todavía no se usó en ninguna consulta
  if (service.priceArs > 0) {
    const approved = await prisma.purchase.findMany({
      where: { userId: user.id, serviceId: service.id, kind: "SERVICE", status: "APPROVED" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (approved.length > 0) {
      const used = await prisma.consultation.findMany({
        where: { purchaseId: { in: approved.map((p) => p.id) } },
        select: { purchaseId: true },
      });
      const usedIds = new Set(used.map((c) => c.purchaseId));
      const available = approved.find((p) => !usedIds.has(p.id));
      if (available) return { service, mode: "purchase" as const, purchaseId: available.id };
    }
  }

  // Créditos
  if (service.creditsCost > 0) {
    const wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });
    if (wallet && wallet.balance >= service.creditsCost) {
      return { service, mode: "credits" as const };
    }
  }

  // Membresía activa cubre servicios conversacionales
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
  });
  if (membership && (service.kind === "CHAT" || service.kind === "READING")) {
    return { service, mode: "membership" as const };
  }

  throw new QuotaError();
}

/** Descuenta créditos tras consulta exitosa (modo 'credits'). */
export async function chargeCredits(userId: string, serviceId: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.creditsCost <= 0) return;
  await prisma.$transaction(async (tx) => {
    const wallet = await tx.creditWallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < service.creditsCost) throw new QuotaError();
    const balance = wallet.balance - service.creditsCost;
    await tx.creditWallet.update({ where: { userId }, data: { balance } });
    await tx.creditTransaction.create({
      data: { userId, walletId: wallet.id, amount: -service.creditsCost, reason: "SERVICE_SPEND", refId: serviceId, balance },
    });
    await tx.consultation.updateMany({
      where: { userId, serviceId, paid: false },
      data: { paid: true },
    });
  });
}

const INTENT_GUIDE = `

Cómo responder (esto es lo más importante):
- Leé la intención detrás de las palabras. Una pregunta casi nunca es solo lo que dice: "¿me va a llamar?" suele esconder "¿le importo?", "¿vale la pena esperar?" o "¿cómo suelto esto?". Intuí qué necesita saber o sentir de verdad y orientá la respuesta hacia ahí. Podés nombrarlo con tacto ("siento que lo que de verdad te preguntás es..."), sin afirmarlo como certeza.
- Que se sienta escrito solo para esta persona: usá su nombre, retomá sus palabras exactas, sus datos y lo que salió en el sorteo. Nada que pudiera servirle a cualquiera; evitá frases genéricas de horóscopo.
- Dale algo concreto y revelador en esta respuesta — un insight que la haga pensar "esto es exactamente lo que me pasa". Y dejá a la vista una capa más profunda que todavía no abriste (un símbolo, un matiz, una conexión) que dé ganas de seguir.
- Cerrá siempre con una pregunta abierta y específica sobre lo que contó, o una invitación concreta a profundizar ese punto. Nunca un "¿algo más?" genérico.
- La persona vive en el hemisferio sur (Argentina): si mencionás estaciones, marzo-mayo es otoño, junio-agosto invierno, septiembre-noviembre primavera, diciembre-febrero verano.
- Límites que nunca cruzás: no generes miedo, urgencia ni desgracias para retener; no prometas resultados; no presiones a comprar ni a volver. Si notás angustia real, priorizá el cuidado por sobre la lectura. Que quiera seguir porque se siente vista y comprendida, no por ansiedad.`;

type UserWithProfile = User & {
  profile?: { displayName?: string | null; sunSign?: string | null; moonSign?: string | null } | null;
};

/** Construye el prompt de sistema para el servicio + contexto del usuario. */
export async function buildSystemPrompt(service: { kind: string; slug: string; name: string }, user: UserWithProfile) {
  const keyMap: Record<string, string> = {
    TAROT: "tarot", CHAT: "chat", READING: "reading", NATAL: "natal", NUMEROLOGY: "numerology",
  };
  const key = keyMap[service.kind] ?? "chat";
  const prompt = await prisma.promptTemplate.findFirst({
    where: { key, active: true },
    orderBy: { version: "desc" },
  });

  let system = prompt?.system ?? "Sos la guía espiritual de ALMA LIMPIA.";
  system += INTENT_GUIDE;
  system += `\n\nServicio actual: "${service.name}".`;

  const u = user;
  const bits: string[] = [];
  const displayName = user.profile?.displayName || u.name;
  if (displayName) bits.push(`Nombre: ${displayName}`);
  if (u.birthDate) {
    let born = `Nació el ${u.birthDate.toISOString().slice(0, 10)}`;
    if (u.birthTime) born += ` a las ${u.birthTime}`;
    if (u.birthCity) born += ` en ${u.birthCity}${u.birthCountry ? `, ${u.birthCountry}` : ""}`;
    bits.push(born);
  }
  if (user.profile?.sunSign) bits.push(`Sol en ${user.profile.sunSign}`);
  if (user.profile?.moonSign) bits.push(`Luna en ${user.profile.moonSign}`);
  if (bits.length) {
    system += `\n\nSobre la persona: ${bits.join(". ")}.`;
    system += ` Usá estos datos con naturalidad, como lo haría una guía que ya la conoce — sin listarlos de vuelta salvo que sea relevante.`;
  }

  return system;
}

/** Trae memoria conversacional si el usuario consintió. */
export async function getMemoryContext(user: User, currentConversationId: string): Promise<LlmMessage[]> {
  if (!user.consentMemory) return [];
  const last = await prisma.message.findMany({
    where: {
      conversation: { userId: user.id, id: { not: currentConversationId } },
      role: "USER",
    },
    include: {
      conversation: {
        select: { consultation: { select: { service: { select: { name: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  if (!last.length) return [];
  const seen = new Set<string>();
  const items = last
    .map((m) => {
      const svc = m.conversation.consultation.service?.name ?? "consulta";
      return `en ${svc}: "${m.content.slice(0, 90)}"`;
    })
    .filter((s) => !seen.has(s) && (seen.add(s), true))
    .slice(0, 8);
  return [
    {
      role: "system",
      content: `La persona consintió memoria entre consultas. Usala como lo haría una guía que ya la conoce: de forma natural, sin citarla textual ni anunciarla ("como me contaste de tu trabajo..."). Temas que trajo antes — ${items.join(" | ")}`,
    },
  ];
}

/**
 * Últimas tiradas de oráculos guardadas en el diario de la persona.
 * Es SU propio diario — no depende del consent de memoria entre conversaciones.
 * Sirve para que la guía mantenga coherencia con lo que ya le salió antes.
 */
export async function getOracleHistory(user: User, limit = 4): Promise<string[]> {
  const draws = await prisma.journal.findMany({
    where: { userId: user.id, kind: "oraculo" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { title: true, content: true, createdAt: true },
  });
  return draws.map((d) => {
    const fecha = d.createdAt.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    const summary = d.content.split("\n")[0].slice(0, 140);
    return `${fecha} — ${d.title ?? "tirada"} → ${summary}`;
  });
}

/** Corre el LLM y registra uso. */
export async function runLlm(messages: LlmMessage[], userId: string, serviceSlug: string) {
  const provider = getLlmProvider();
  const result = await provider.chat(messages);
  await prisma.aiUsageLog.create({
    data: {
      userId, serviceSlug, provider: result.provider, model: result.model,
      tokensIn: result.tokensIn, tokensOut: result.tokensOut, latencyMs: result.latencyMs,
    },
  });
  return result;
}
