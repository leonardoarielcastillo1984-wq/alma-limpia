import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { computeNatalChart } from "@/server/astrology/natal";
import { skyAt, findAspects, sunSignOf, dailyHoroscope, lunarCalendar } from "@/server/astrology/transits";

/**
 * GET /api/astrologia?modo=transitos|horoscopo|luna[&mes=YYYY-MM]
 * - transitos: posiciones del cielo hoy + aspectos vs tu carta natal
 * - horoscopo: mensaje diario por tu signo solar (determinístico)
 * - luna: calendario lunar del mes actual
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const url = new URL(req.url);
  const modo = url.searchParams.get("modo") ?? "horoscopo";

  try {
    if (modo === "horoscopo") {
      // Signo del usuario si tiene carta; si no, del sol de hoy
      const natal = await prisma.astrologyChart.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
      let sign = (natal?.data as { positions?: { key: string; sign: string }[] })?.positions?.find((p) => p.key === "sun")?.sign;
      if (!sign && user.birthDate) {
        sign = sunSignOf(computeNatalChart({ birthDate: user.birthDate, hasTime: false }));
      }
      if (!sign) sign = "Aries";
      return NextResponse.json({ horoscopo: dailyHoroscope(sign) });
    }

    if (modo === "transitos") {
      const natal = await prisma.astrologyChart.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
      if (!natal) return NextResponse.json({ error: "NO_NATAL", message: "Calculá tu carta natal primero." }, { status: 400 });
      const sky = skyAt();
      const natalPositions = (natal.data as { positions: { key: string; name: string; longitude: number; sign: string; signDegree: number }[] }).positions;
      const aspects = findAspects(sky.positions, natalPositions).slice(0, 12);
      return NextResponse.json({
        sky: sky.positions.map((p) => ({ key: p.key, name: p.name, sign: p.sign, signDegree: p.signDegree })),
        aspects: aspects.map((a) => ({
          transito: a.planetA,
          natal: a.planetB,
          type: a.type,
          orb: a.orb,
        })),
      });
    }

    if (modo === "luna") {
      const now = new Date();
      const mesParam = url.searchParams.get("mes"); // "YYYY-MM"
      let y = now.getUTCFullYear(), m = now.getUTCMonth();
      if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
        const [yy, mm] = mesParam.split("-").map(Number);
        y = yy; m = mm - 1;
      }
      return NextResponse.json({ days: lunarCalendar(y, m), year: y, month: m + 1 });
    }

    return NextResponse.json({ error: "INVALID_MODE" }, { status: 400 });
  } catch (e) {
    console.error("astrologia GET", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

const postSchema = z.object({
  modo: z.literal("sinastria"),
  partnerName: z.string().max(80).optional(),
  partnerBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * POST /api/astrologia — sinastría entre tu carta y otra fecha de nacimiento.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = postSchema.parse(await req.json());
    const natal = await prisma.astrologyChart.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    if (!natal) return NextResponse.json({ error: "NO_NATAL" }, { status: 400 });

    const partnerChart = computeNatalChart({
      birthDate: new Date(`${body.partnerBirthDate}T12:00:00Z`),
      hasTime: false,
    });
    const natalPositions = (natal.data as { positions: { key: string; name: string; longitude: number; sign: string; signDegree: number }[] }).positions;
    const aspects = findAspects(partnerChart.positions, natalPositions).slice(0, 14);

    return NextResponse.json({
      partner: {
        name: body.partnerName ?? null,
        sun: sunSignOf(partnerChart),
        positions: partnerChart.positions.map((p) => ({ key: p.key, name: p.name, sign: p.sign, signDegree: p.signDegree })),
      },
      aspects: aspects.map((a) => ({ planetaA: a.planetA, planetaB: a.planetB, type: a.type, orb: a.orb })),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("astrologia POST", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
