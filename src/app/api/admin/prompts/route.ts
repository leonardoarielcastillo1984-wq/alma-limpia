import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) return null;
  return user;
}

// GET /api/admin/prompts — plantillas de prompt
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const prompts = await prisma.promptTemplate.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ prompts });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  system: z.string().min(10).max(8000),
  active: z.boolean().optional(),
});

// PATCH /api/admin/prompts — actualizar contenido/estado de un prompt
export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const body = patchSchema.parse(await req.json());
    const prompt = await prisma.promptTemplate.update({
      where: { id: body.id },
      data: { system: body.system, active: body.active ?? true },
    });
    await prisma.auditLog.create({
      data: {
        actor: "admin", userId: admin.id, action: "prompt.updated",
        entityType: "PromptTemplate", entityId: prompt.id,
        meta: { key: prompt.key },
      },
    });
    return NextResponse.json({ ok: true, prompt });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("admin prompts PATCH", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
