import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, Heart, UserRound } from "lucide-react";
import { ChakraArt, ServiceArt } from "@/components/art/MysticArt";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { StartConsultButton } from "./StartConsultButton";
import { FavButton } from "./FavButton";

const KIND_LABEL: Record<string, string> = {
  TAROT: "Experiencia de tarot interactiva",
  CHAT: "Conversación con la guía",
  READING: "Lectura simbólica",
  NATAL: "Cálculo astronómico real",
  NUMEROLOGY: "Numerología pitagórica",
  RITUAL: "Ritual guiado paso a paso",
  TEST: "Test simbólico",
};

export default async function ServicioPage({
  params,
}: {
  params: Promise<{ universo: string; servicio: string }>;
}) {
  const { universo, servicio } = await params;
  const service = await prisma.service.findUnique({
    where: { slug: servicio },
    include: { category: true },
  });
  if (!service || !service.active || service.category.slug !== universo) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/");

  const isFav = !!(await prisma.favorite.findUnique({
    where: { userId_serviceId: { userId: user.id, serviceId: service.id } },
    select: { id: true },
  }));

  const cfg = (service.engineConfig ?? {}) as { durationMin?: number; questions?: string[] };
  const slug = service.slug;
  const isChakra = /chakra|aura|armoniza/.test(slug);
  const isAlma = service.category.slug === "alma";
  const isNumCompat = service.kind === "NUMEROLOGY";
  const isCompat = /compatib|sinastria/.test(slug);

  const priceLabel =
    service.priceArs > 0
      ? `$ ${service.priceArs.toLocaleString("es-AR")}`
      : service.creditsCost > 0
        ? `${service.creditsCost} créditos`
        : "Gratis";

  const ctaLabel = isChakra
    ? "Armonizar mi energía"
    : isAlma
      ? "Comenzar conexión"
      : service.kind === "TAROT"
        ? "Elegir mis cartas"
        : "Comenzar";

  const steps = isAlma
    ? ["Propósito del alma", "Historias simbólicas como espejo", "Aprendizajes y patrones", "Guía para tu presente"]
    : service.kind === "TAROT"
      ? ["Compartís tu intención", "Elegís tus cartas — azar verificable", "Recibís tu lectura", "La conversás con tu guía"]
      : ["Te hago unas preguntas para conocerte", "Exploramos juntas/os lo que traés", "Recibís una interpretación personalizada", "Queda guardada en Mi Universo"];

  return (
    <div className="animate-fade-up space-y-5">
      <header className="relative text-center">
        <Link
          href={`/explorar/${universo}`}
          aria-label={`Volver a ${service.category.name}`}
          className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="absolute right-0 top-1">
          <FavButton serviceId={service.id} initialFav={isFav} />
        </div>
        <h1 className="mx-10 font-display text-3xl font-medium leading-tight text-gold-soft">{service.name}</h1>
        <p className="mt-1 text-xs text-lilac/80">
          {KIND_LABEL[service.kind] ?? service.kind}
          {cfg.durationMin && (
            <span className="ml-2 inline-flex items-center gap-1">
              <Clock size={11} /> ~{cfg.durationMin} min
            </span>
          )}
        </p>
      </header>

      {/* Hero ilustrado */}
      {isCompat ? (
        <section className="flex items-center justify-center gap-4 py-2">
          <Avatar label="Vos" />
          <Heart size={44} className="fill-rose/70 text-rose drop-shadow-[0_0_16px_rgba(216,139,203,0.8)]" />
          <Avatar label="Tu persona" />
        </section>
      ) : (
        <section className="tile-art relative aspect-[5/4]">
          {isChakra ? (
            <ChakraArt className="absolute inset-0 h-full w-full" />
          ) : (
            <ServiceArt kind={service.kind} slug={slug} className="absolute inset-0 h-full w-full" />
          )}
          <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-center">
            <p className="font-display text-2xl text-gold-soft">{service.shortDesc ?? service.name}</p>
          </div>
        </section>
      )}

      {service.description && (
        <p className="text-center text-sm leading-relaxed text-ivory/85">{service.description}</p>
      )}

      {/* Bloque contextual */}
      {isChakra ? (
        <section className="card-mystic divide-y divide-gold/10 px-4 py-1">
          {CHAKRAS.map(([name, meaning, color]) => (
            <div key={name} className="flex items-center gap-3 py-2.5">
              <span className="h-7 w-7 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 14px ${color}` }} />
              <div>
                <p className="text-sm font-medium text-ivory">{name}</p>
                <p className="text-[11px] text-mist">{meaning}</p>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="space-y-2">
          {steps.map((s, i) => (
            <div key={s} className="row-mystic py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-plum/50 text-xs text-gold-soft">
                {i + 1}
              </span>
              <span className="text-sm text-ivory/90">{s}</span>
            </div>
          ))}
        </section>
      )}

      {cfg.questions && cfg.questions.length > 0 && (
        <section className="card-mystic p-4">
          <h2 className="mb-2 font-display text-lg text-ivory">Te va a preguntar</h2>
          <ul className="space-y-1 text-sm text-mist">
            {cfg.questions.map((q, i) => (
              <li key={i}>✦ {q}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Precio + CTA */}
      <section className="card-mystic space-y-3 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-widest text-mist/70">Inversión</span>
          <span className="font-display text-2xl font-semibold text-gold">
            {priceLabel}
            {service.freeDaily && <span className="ml-2 text-xs font-normal text-violet">1 gratis por día</span>}
          </span>
        </div>
        {service.kind === "NATAL" ? (
          <Link href="/carta-natal" className="btn-violet block w-full py-3.5 text-center">
            Calcular mi carta
          </Link>
        ) : service.kind === "RITUAL" ? (
          <Link href={`/ritual/${slug}`} className="btn-violet block w-full py-3.5 text-center">
            Comenzar el ritual
          </Link>
        ) : service.kind === "TEST" ? (
          <Link href="/chakras" className="btn-violet block w-full py-3.5 text-center">
            Explorar mis chakras
          </Link>
        ) : slug === "pendulo-virtual" || slug === "runas-nordicas" || slug === "i-ching" ? (
          <Link
            href={`/oraculo/${slug === "pendulo-virtual" ? "pendulo" : slug === "runas-nordicas" ? "runas" : "iching"}`}
            className="btn-violet block w-full py-3.5 text-center"
          >
            Hacer el sorteo
          </Link>
        ) : slug === "registros-akashicos" ? (
          <Link href="/oraculo/akasico" className="btn-violet block w-full py-3.5 text-center">
            Abrir mi registro
          </Link>
        ) : ["horoscopo-diario", "horoscopo-semanal", "horoscopo-mensual"].includes(slug) ? (
          <Link href="/astrologia?modo=horoscopo" className="btn-violet block w-full py-3.5 text-center">
            Ver mi horóscopo
          </Link>
        ) : slug === "transitos" ? (
          <Link href="/astrologia?modo=transitos" className="btn-violet block w-full py-3.5 text-center">
            Ver mis tránsitos
          </Link>
        ) : slug === "sinastria" || slug === "compatibilidad-astrologica" ? (
          <Link href="/astrologia?modo=sinastria" className="btn-violet block w-full py-3.5 text-center">
            Calcular sinastría
          </Link>
        ) : slug === "calendario-astrologico" ? (
          <Link href="/astrologia?modo=luna" className="btn-violet block w-full py-3.5 text-center">
            Ver calendario
          </Link>
        ) : isNumCompat ? (
          <Link
            href={slug.includes("compatib") ? "/numerologia?modo=compatibilidad" : "/numerologia"}
            className="btn-violet block w-full py-3.5 text-center"
          >
            {slug.includes("compatib") ? "Ver compatibilidad" : "Calcular mis números"}
          </Link>
        ) : (
          <StartConsultButton serviceSlug={slug} label={ctaLabel} canPay={service.priceArs > 0} />
        )}
      </section>

      <p className="px-2 text-center text-[11px] leading-relaxed text-mist/70">
        Te acompaña la guía espiritual de ALMA LIMPIA durante toda la experiencia.
        Las lecturas son símbolos para reflexionar, no predicciones ni asesoramiento profesional.
      </p>
    </div>
  );
}

const CHAKRAS: [string, string, string][] = [
  ["Corona", "Conexión espiritual", "#c084fc"],
  ["Tercer ojo", "Intuición", "#818cf8"],
  ["Garganta", "Expresión", "#38bdf8"],
  ["Corazón", "Amor", "#4ade80"],
  ["Plexo solar", "Confianza", "#facc15"],
  ["Sacro", "Creatividad", "#fb923c"],
  ["Raíz", "Seguridad", "#f43f5e"],
];

function Avatar({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-gold/60 bg-gradient-to-br from-plum to-violet-deep shadow-[0_0_24px_rgba(233,189,121,0.3)]">
        <UserRound size={40} className="text-gold-soft" />
      </span>
      <p className="mt-1 text-sm text-ivory">{label}</p>
    </div>
  );
}
