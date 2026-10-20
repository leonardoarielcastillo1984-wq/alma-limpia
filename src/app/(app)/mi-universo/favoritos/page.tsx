import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";

export default async function FavoritosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const favs = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { service: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-fade-up space-y-6">
      <Link href="/mi-universo" className="inline-flex items-center gap-2 text-sm text-mist hover:text-ivory">
        <ArrowLeft size={16} /> Mi Universo
      </Link>
      <header>
        <h1 className="font-display text-3xl font-semibold text-gradient-gold">Favoritos</h1>
      </header>

      {favs.length === 0 ? (
        <div className="card-mystic flex flex-col items-center gap-4 p-10 text-center">
          <Heart size={32} className="text-violet/50" />
          <p className="text-sm text-mist">Marcá servicios con el corazón para encontrarlos acá.</p>
          <Link href="/explorar" className="btn-violet px-6 py-2.5 text-sm">Explorar</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favs.map((f) => (
            <Link
              key={f.id}
              href={`/explorar/${f.service.category.slug}/${f.service.slug}`}
              className="card-mystic flex items-center justify-between p-4"
            >
              <div>
                <p className="font-medium text-ivory">{f.service.name}</p>
                <p className="text-xs text-mist">{f.service.category.name}</p>
              </div>
              <Heart size={16} className="fill-rose text-rose" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
