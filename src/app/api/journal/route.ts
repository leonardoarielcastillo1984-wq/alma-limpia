import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

const schema = z.object({
  kind: z.enum(["diario", "suenos", "manifestacion", "emocional"]).default("diario"),
  title: z.string().max(160).nullish(),
  content: z.string().min(1).max(20000),
  mood: z.string().max(60).nullish(),
  tags: z.array(z.string().max(40)).max(8).optional(),
});

// GET /api/journal?kind=diario&q=texto — listar entradas del usuario
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "diario";
  const q = url.searchParams.get("q")?.trim();
  const entries = await prisma.journal.findMany({
    where: {
      userId: user.id,
      kind,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
              { tags: { has: q.toLowerCase() } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const entry = await prisma.journal.create({
      data: { userId: user.id, ...body },
    });
    return NextResponse.json({ ok: true, entry });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  await prisma.journal.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
