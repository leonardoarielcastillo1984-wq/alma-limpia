import { notFound, redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { checkAccess, QuotaError } from "@/server/engine/consultation";
import { RitualClient } from "./RitualClient";
import { PayServiceButton } from "./PayServiceButton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function RitualPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const ritual = await prisma.ritual.findUnique({
    where: { slug },
    include: { savedBy: { where: { userId: user.id } } },
  });
  const service = await prisma.service.findUnique({ where: { slug } });
  if (!ritual || !ritual.active || !service?.active) notFound();

  let access: string;
  try {
    access = (await checkAccess(user, slug)).mode;
  } catch (e) {
    if (!(e instanceof QuotaError)) throw e;
    access = "none";
  }

  if (access === "none") {
    return (
      <div className="animate-fade-up mx-auto max-w-md space-y-5 pt-8 text-center">
        <header className="relative">
          <Link
            href={`/explorar/rituales/${slug}`}
            aria-label="Volver"
            className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="mx-10 font-display text-3xl text-gold-soft">{ritual.name}</h1>
        </header>
        <p className="text-sm text-mist">{ritual.description}</p>
        <div className="card-mystic p-5">
          <p className="mb-4 text-sm text-ivory/85">
            Este ritual cuesta <b className="text-gold">$ {service.priceArs.toLocaleString("es-AR")}</b>
            {service.creditsCost > 0 && <> o <b className="text-gold">{service.creditsCost} créditos</b></>}.
          </p>
          <PayServiceButton serviceSlug={slug} priceArs={service.priceArs} />
        </div>
      </div>
    );
  }

  const saved = ritual.savedBy[0] ?? null;
  return (
    <RitualClient
      slug={ritual.slug}
      name={ritual.name}
      description={ritual.description}
      steps={ritual.steps as { t: string; d: string }[]}
      safeVariant={ritual.safeVariant as { nota?: string }}
      durationMin={ritual.durationMin}
      alreadyDone={!!saved?.doneAt}
      savedNotes={saved?.notes ?? ""}
    />
  );
}
