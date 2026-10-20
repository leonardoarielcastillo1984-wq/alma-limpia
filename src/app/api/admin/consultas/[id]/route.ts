import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

/**
 * GET /api/admin/consultas/[id] — devuelve la conversación completa de una
 * consulta (lo que preguntó la persona y lo que respondió la guía).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const { id } = await ctx.params;

  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        conversation: {
          select: {
            messages: {
              orderBy: { createdAt: "asc" },
              select: { id: true, role: true, content: true, kind: true, createdAt: true },
            },
          },
        },
      },
    });
    if (!consultation) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({
      ok: true,
      messages: (consultation.conversation?.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        kind: m.kind,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("admin consultas GET", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
