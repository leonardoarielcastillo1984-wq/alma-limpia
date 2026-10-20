import Link from "next/link";
import { ChevronRight, Moon } from "lucide-react";
import { CrescentMoon } from "@/components/cosmic/CrescentMoon";
import { UniverseArt } from "@/components/art/MysticArt";
import { TarotCardBack, TarotCardFace } from "@/components/tarot/TarotCardArt";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { lunarCalendar } from "@/server/astrology/transits";
import { ShareButton } from "@/components/ShareButton";
import { MoonNotifier } from "./MoonNotifier";
import { PushSubscriber } from "./PushSubscriber";

export default async function InicioPage() {
  const user = await getCurrentUser();
  const name = user?.profile?.displayName ?? user?.name ?? "viajera";

  // Carta del día determinística por usuario+día (sin LLM, sin costo)
  const dailyCard = user
    ? await prisma.tarotCard.findFirst({
        where: { deck: { slug: "rider" } },
        orderBy: { order: "asc" },
        skip: Math.abs(hashCode(`${user.id}-${new Date().toISOString().slice(0, 10)}`)) % 78,
      })
    : null;

  // Próximo evento lunar (llena o nueva) dentro de ~10 días — mes actual + siguiente
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const days = [
    ...lunarCalendar(now.getUTCFullYear(), now.getUTCMonth()),
    ...lunarCalendar(now.getUTCMonth() === 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(), (now.getUTCMonth() + 1) % 12),
  ];
  const nextMoon = days.find(
    (d) => d.date >= todayStr && (d.phase === "Luna llena" || d.phase === "Luna nueva")
  );
  const moonDaysAway = nextMoon
    ? Math.round((new Date(`${nextMoon.date}T12:00:00Z`).getTime() - new Date(`${todayStr}T12:00:00Z`).getTime()) / 86400_000)
    : null;

  // Membresía activa: avisar si vence en 5 días o menos
  const membership = user
    ? await prisma.membership.findFirst({
        where: { userId: user.id, active: true, expiresAt: { gt: now } },
        orderBy: { createdAt: "desc" },
      })
    : null;
  const daysLeft = membership?.expiresAt
    ? Math.ceil((membership.expiresAt.getTime() - now.getTime()) / 86400_000)
    : null;

  return (
    <div className="animate-fade-up space-y-5">
      <header className="flex items-center gap-3 pt-1">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-plum/30">
          <CrescentMoon size={28} />
        </span>
        <div>
          <p className="text-xs text-mist">Bienvenida/o de nuevo</p>
          <h1 className="font-display text-3xl font-medium leading-tight text-gold-soft">{name}</h1>
        </div>
      </header>

      {/* Onboarding: completar datos de nacimiento */}
      {user && !user.birthDate && (
        <Link href="/bienvenida" className="card-mystic flex items-center gap-4 p-4 transition hover:border-gold/40">
          <Moon size={18} className="shrink-0 text-violet" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base text-ivory">Tu carta natal te está esperando</p>
            <p className="text-xs text-mist">Contanos cuándo y dónde naciste — toma 30 segundos.</p>
          </div>
          <ChevronRight size={16} className="text-gold-soft" />
        </Link>
      )}

      {/* Membresía por vencer */}
      {daysLeft !== null && daysLeft <= 5 && (
        <Link href="/membresia" className="card-mystic flex items-center gap-4 p-4 transition hover:border-gold/40">
          <Moon size={18} className="shrink-0 text-gold-soft" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base text-ivory">
              Tu membresía vence en {daysLeft} día{daysLeft === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-mist">Renová y seguí con tus lecturas ilimitadas.</p>
          </div>
          <ChevronRight size={16} className="text-gold-soft" />
        </Link>
      )}

      {/* Carta del día */}
      <div className="tile-art flex items-center gap-4 p-4">
        <Link href="/explorar/oraculo/tarot-del-dia" className="flex min-w-0 flex-1 items-center gap-4">
          <span className="relative z-10 h-28 w-[4.4rem] shrink-0 drop-shadow-[0_0_16px_rgba(233,189,121,0.35)]">
            {dailyCard ? (
              <TarotCardFace code={dailyCard.code} name={dailyCard.name} className="h-full w-full" />
            ) : (
              <TarotCardBack className="h-full w-full" />
            )}
          </span>
          <div className="relative z-10 min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-widest text-gold/80">Tu carta de hoy</p>
            <h2 className="font-display text-2xl leading-tight text-ivory">{dailyCard?.name ?? "La Estrella"}</h2>
            <p className="line-clamp-2 text-xs text-mist">{dailyCard?.uprightKeys ?? "esperanza, guía, renovación"}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-gold-soft">
              Hacer mi tirada <ChevronRight size={14} />
            </p>
          </div>
        </Link>
        <ShareButton
          title="Mi carta de hoy — ALMA LIMPIA"
          text={`Mi carta de hoy es ${dailyCard?.name ?? "La Estrella"} ✨`}
          path="/"
        />
      </div>

      {/* Accesos rápidos */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ivory">Tus universos</h2>
          <Link href="/explorar" className="text-xs text-violet hover:text-gold">Ver todos</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {QUICK.map((q) => (
            <Link key={q.slug} href={q.href} className="tile-art block aspect-[5/4]">
              <UniverseArt slug={q.slug} className="absolute inset-x-0 top-0 h-[72%] w-full" />
              <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 text-center">
                <p className="font-display text-lg text-gold-soft">{q.title}</p>
                <p className="text-[10px] text-ivory/75">{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Próxima luna */}
      {nextMoon && moonDaysAway !== null && moonDaysAway <= 10 && (
        <Link href="/explorar/rituales" className="card-mystic flex items-center gap-4 p-4 transition hover:border-gold/40">
          <span
            className="h-10 w-10 shrink-0 rounded-full border border-gold/30"
            style={{
              background: `radial-gradient(circle at 35% 35%, rgba(233,189,121,${0.3 + nextMoon.illumination * 0.7}), rgba(60,30,110,0.9))`,
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg text-ivory">
              {moonDaysAway === 0 ? `${nextMoon.phase} hoy` : `${nextMoon.phase} en ${moonDaysAway} día${moonDaysAway === 1 ? "" : "s"}`}
            </p>
            <p className="text-xs text-mist">
              {nextMoon.phase === "Luna llena" ? "Ideal para soltar y agradecer" : "Ideal para intencionar y comenzar"} · ver rituales
            </p>
          </div>
          <Moon size={16} className="text-gold-soft" />
        </Link>
      )}

      {/* Notificación diaria (si está habilitada en perfil) */}
      <MoonNotifier
        enabled={user?.preferences?.notificationsEnabled ?? false}
        title={nextMoon && moonDaysAway === 0 ? `${nextMoon.phase} — ALMA LIMPIA` : `Tu carta de hoy — ${dailyCard?.name ?? "La Estrella"}`}
        body={nextMoon && moonDaysAway === 0 ? `Hoy es ${nextMoon.phase.toLowerCase()} en ${nextMoon.sign}. Un buen día para un ritual.` : "Tu carta del día ya te está esperando."}
      />
      {/* Registro de suscripción Web Push (mismo opt-in) */}
      <PushSubscriber enabled={user?.preferences?.notificationsEnabled ?? false} />

      {/* Mensaje del día */}
      <section className="card-mystic p-5 text-center">
        <p className="text-[11px] uppercase tracking-widest text-violet">Mensaje para hoy</p>
        <p className="mt-2 font-display text-lg italic leading-relaxed text-ivory/90">
          “Lo que buscas afuera ya vive adentro tuyo. Hoy, escuchate con la misma
          generosidad con la que escuchás a otros.”
        </p>
      </section>
    </div>
  );
}

const QUICK = [
  { slug: "oraculo", href: "/explorar/oraculo", title: "El Oráculo", desc: "Tarot y oráculos" },
  { slug: "universo", href: "/carta-natal", title: "Carta astral", desc: "Tu cielo al nacer" },
  { slug: "alma", href: "/explorar/alma", title: "El Alma", desc: "Registros y propósito" },
  { slug: "rituales", href: "/explorar/rituales", title: "Los Rituales", desc: "Lunas y sueños" },
];

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
