import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

const schema = z.object({ serviceId: z.string().uuid() });

// POST /api/favoritos — toggle favorito (crea o borra)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { serviceId } = schema.parse(await req.json());
    const existing = await prisma.favorite.findUnique({
      where: { userId_serviceId: { userId: user.id, serviceId } },
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, fav: false });
    }
    await prisma.favorite.create({ data: { userId: user.id, serviceId } });
    return NextResponse.json({ ok: true, fav: true });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

// GET /api/favoritos — ids de servicios favoritos del usuario
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { serviceId: true },
  });
  return NextResponse.json({ serviceIds: favs.map((f) => f.serviceId) });
}
