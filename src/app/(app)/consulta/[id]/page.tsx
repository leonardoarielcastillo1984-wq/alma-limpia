import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { ConsultaClient } from "./ConsultaClient";

export default async function ConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const consultation = await prisma.consultation.findFirst({
    where: { id, userId: user.id },
    include: {
      service: { include: { category: true } },
      conversation: { include: { messages: { orderBy: { createdAt: "asc" } } } },
      tarotReading: true,
    },
  });
  if (!consultation?.conversation) notFound();

  return (
    <ConsultaClient
      consultation={{
        id: consultation.id,
        serviceName: consultation.service?.name ?? "Consulta",
        serviceKind: consultation.service?.kind ?? "CHAT",
        serviceSlug: consultation.service?.slug ?? "",
        categorySlug: consultation.service?.category.slug ?? "",
        engineConfig: (consultation.service?.engineConfig ?? {}) as Record<string, unknown>,
      }}
      initialMessages={consultation.conversation.messages.map((m) => ({
        id: m.id,
        role: m.role as "USER" | "GUIDE" | "SYSTEM",
        kind: m.kind,
        content: m.content,
        payload: m.payload,
      }))}
      tarotReading={
        consultation.tarotReading
          ? {
              id: consultation.tarotReading.id,
              spread: consultation.tarotReading.spreadType,
              cards: consultation.tarotReading.cards as unknown[],
              interpretation: consultation.tarotReading.interpretation,
            }
          : null
      }
    />
  );
}
