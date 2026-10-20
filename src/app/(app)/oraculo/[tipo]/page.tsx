import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { checkAccess, QuotaError } from "@/server/engine/consultation";
import { OracleClient } from "./OracleClient";
import { PayServiceButton } from "../../ritual/[slug]/PayServiceButton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type OracleId = "pendulo" | "runas" | "iching" | "akashico";

const ORACLES: Record<string, { oracle: OracleId; serviceSlug: string; name: string; desc: string }> = {
  pendulo: { oracle: "pendulo", serviceSlug: "pendulo-virtual", name: "Péndulo", desc: "Respuestas sí/no simbólicas" },
  runas: { oracle: "runas", serviceSlug: "runas-nordicas", name: "Runas nórdicas", desc: "Tres runas para tu consulta" },
  iching: { oracle: "iching", serviceSlug: "i-ching", name: "I Ching", desc: "Un hexagrama para tu pregunta" },
  akasico: { oracle: "akashico", serviceSlug: "registros-akashicos", name: "Registros akáshicos", desc: "Un fragmento del registro de tu alma" },
};

export default async function OraclePage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const cfg = ORACLES[tipo];
  if (!cfg) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/");

  const service = await prisma.service.findUnique({ where: { slug: cfg.serviceSlug } });
  if (!service?.active) notFound();

  let access: string;
  try {
    access = (await checkAccess(user, cfg.serviceSlug)).mode;
  } catch (e) {
    if (!(e instanceof QuotaError)) throw e;
    access = "none";
  }

  if (access === "none") {
    return (
      <div className="animate-fade-up mx-auto max-w-md space-y-5 pt-8 text-center">
        <header className="relative">
          <Link
            href="/explorar/oraculo"
            aria-label="Volver"
            className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="mx-10 font-display text-3xl text-gold-soft">{cfg.name}</h1>
        </header>
        {service.priceArs === 0 ? (
          <div className="card-mystic p-5">
            <p className="text-sm text-ivory/85">Ya usaste tu consulta gratis de hoy. Volvé mañana 🌙</p>
          </div>
        ) : (
        <div className="card-mystic p-5">
          <p className="mb-4 text-sm text-ivory/85">
            Esta experiencia cuesta <b className="text-gold">$ {service.priceArs.toLocaleString("es-AR")}</b>
            {service.creditsCost > 0 && <> o <b className="text-gold">{service.creditsCost} créditos</b></>}.
          </p>
          <PayServiceButton serviceSlug={cfg.serviceSlug} priceArs={service.priceArs} />
        </div>
        )}
      </div>
    );
  }

  return <OracleClient oracle={cfg.oracle} name={cfg.name} desc={cfg.desc} />;
}
