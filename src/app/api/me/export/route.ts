import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const [profile, conversations, readings, charts, journals, purchases, wallet] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId: user.id } }),
      prisma.conversation.findMany({
        where: { userId: user.id },
        include: { messages: true },
      }),
      prisma.tarotReading.findMany({ where: { userId: user.id } }),
      prisma.astrologyChart.findMany({ where: { userId: user.id } }),
      prisma.journal.findMany({ where: { userId: user.id } }),
      prisma.purchase.findMany({ where: { userId: user.id } }),
      prisma.creditWallet.findUnique({ where: { userId: user.id } }),
    ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      birthDate: user.birthDate,
      birthTime: user.birthTime,
      birthCity: user.birthCity,
      birthCountry: user.birthCountry,
      createdAt: user.createdAt,
    },
    profile,
    conversations,
    tarotReadings: readings,
    astrologyCharts: charts,
    journals,
    purchases,
    creditWallet: wallet,
  });
}
