import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";

export default async function MensajesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      consultation: { include: { service: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    take: 30,
  });

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-gradient-gold">Mensajes</h1>
        <p className="mt-1 text-sm text-mist">Tus conversaciones con la guía</p>
      </header>

      {conversations.length === 0 ? (
        <div className="card-mystic flex flex-col items-center gap-4 p-10 text-center">
          <MessageCircle size={36} className="text-violet/60" />
          <p className="text-mist">Todavía no tenés conversaciones.</p>
          <Link href="/explorar" className="btn-violet px-6 py-2.5 text-sm">
            Explorar servicios
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/consulta/${c.consultationId}`}
              className="card-mystic flex items-center gap-4 p-4 transition"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-deep to-cosmic">
                <MoonIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ivory">
                  {c.consultation.service?.name ?? "Consulta"}
                </p>
                <p className="truncate text-sm text-mist">
                  {c.messages[0]?.content ?? "Sin mensajes aún"}
                </p>
              </div>
              <span className="text-xs text-mist/60">
                {c.updatedAt.toLocaleDateString("es-AR")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MoonIcon() {
  return <span className="text-lg">🌙</span>;
}
