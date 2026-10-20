import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { DiarioClient } from "./DiarioClient";

const PROMPTS = [
  "¿Qué emoción fue más fuerte hoy y de dónde venía?",
  "¿Qué te gustaría soltar esta noche?",
  "¿Qué aprendió tu cuerpo hoy?",
  "Escribí una frase que tu yo del futuro necesite leer.",
  "¿A qué le dijiste que sí hoy, y a qué le dijiste que no?",
];

export default async function DiarioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const entries = await prisma.journal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  return (
    <div className="animate-fade-up space-y-6">
      <Link href="/mi-universo" className="inline-flex items-center gap-2 text-sm text-mist hover:text-ivory">
        <ArrowLeft size={16} /> Mi Universo
      </Link>
      <header>
        <h1 className="font-display text-3xl font-semibold text-gradient-gold">Diario</h1>
        <p className="mt-1 text-sm text-mist">Tu escritura, solo para vos</p>
      </header>

      <DiarioClient prompt={prompt} initialEntries={entries.map((e) => ({
        id: e.id,
        title: e.title,
        content: e.content,
        mood: e.mood,
        createdAt: e.createdAt.toISOString(),
      }))} />
    </div>
  );
}
