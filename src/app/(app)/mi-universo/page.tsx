import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Moon, Coins, Heart, PenLine, ChevronRight, Crown, Sparkles } from "lucide-react";
import { TarotFanArt } from "@/components/art/MysticArt";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { lunarCalendar } from "@/server/astrology/transits";

export default async function MiUniversoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [readings, journals, favs] = await Promise.all([
    prisma.tarotReading.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.journal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.favorite.findMany({ where: { userId: user.id }, include: { service: true }, take: 6 }),
  ]);

  // Fase lunar de hoy (cálculo astronómico server-side)
  const now = new Date();
  const todayLunar = lunarCalendar(now.getUTCFullYear(), now.getUTCMonth())
    .find((d) => d.date === now.toISOString().slice(0, 10));

  const p = user.profile;
  const credits = user.creditWallet?.balance ?? 0;
  const displayName = user.name ?? (user.isGuest ? "Alma viajera" : "Tu perfil");
  const signLine = [
    p?.sunSign && `Sol en ${p.sunSign}`,
    p?.moonSign && `Luna en ${p.moonSign}`,
  ].filter(Boolean).join(" · ");

  return (
    <div className="animate-fade-up space-y-5">
      <h1 className="text-center font-display text-3xl font-medium text-gold-soft">Mi Universo</h1>

      {/* Perfil */}
      <section className="card-mystic flex items-center gap-4 p-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-gold/60 bg-gradient-to-br from-plum to-violet-deep font-display text-2xl text-gold-soft shadow-[0_0_20px_rgba(233,189,121,0.25)]">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl leading-tight text-ivory">{displayName}</p>
          {signLine ? (
            <p className="text-xs text-mist">{signLine}</p>
          ) : (
            <Link href="/carta-natal" className="text-xs text-violet underline-offset-2 hover:underline">
              Calculá tu carta natal
            </Link>
          )}
          {p?.risingSign && <p className="text-xs text-mist">Ascendente en {p.risingSign}</p>}
        </div>
        <Link href="/creditos" className="flex flex-col items-center rounded-xl border border-gold/30 px-3 py-1.5">
          <Coins size={14} className="text-gold" />
          <span className="text-xs font-semibold text-gold">{credits}</span>
        </Link>
      </section>

      {/* Carta del día */}
      <Link
        href="/explorar/oraculo/tarot-del-dia"
        className="tile-art flex items-center gap-4 p-4"
      >
        <span className="relative z-10 h-16 w-20 shrink-0">
          <TarotFanArt className="h-full w-full scale-125" />
        </span>
        <div className="relative z-10 min-w-0 flex-1">
          <p className="font-display text-xl text-gold-soft">Tu carta del día</p>
          <p className="text-xs text-ivory/80">Un mensaje te espera hoy</p>
        </div>
        <ChevronRight size={18} className="relative z-10 text-gold-soft" />
      </Link>

      {/* Luna de hoy */}
      {todayLunar && (
        <Link
          href="/astrologia?modo=luna"
          className="card-mystic flex items-center gap-4 p-4 transition hover:border-gold/40"
        >
          <span
            className="h-10 w-10 shrink-0 rounded-full border border-gold/30"
            style={{
              background: `radial-gradient(circle at 35% 35%, rgba(233,189,121,${0.3 + todayLunar.illumination * 0.7}), rgba(60,30,110,0.9))`,
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg text-ivory">{todayLunar.phase}</p>
            <p className="text-xs text-mist">
              Luna en {todayLunar.sign} · {Math.round(todayLunar.illumination * 100)}% iluminada
            </p>
          </div>
          <ChevronRight size={18} className="text-gold-soft" />
        </Link>
      )}

      {/* Accesos */}
      <section className="grid grid-cols-2 gap-3">
        <Tile href="/mi-universo/diario" icon={<PenLine size={22} />} title="Diario espiritual" desc={`${journals.length} entradas`} />
        <Tile href="/mi-universo/suenos" icon={<Sparkles size={22} />} title="Diario de sueños" desc="Anotá al despertar" />
        <Tile href="/astrologia?modo=luna" icon={<Moon size={22} />} title="Calendario lunar" desc="Fases del mes" />
        <Tile href="/mi-universo/lecturas" icon={<BookOpen size={22} />} title="Mis consultas" desc={`${readings.length} lecturas`} />
        <Tile href="/mi-universo/favoritos" icon={<Heart size={22} />} title="Favoritos" desc={`${favs.length} guardados`} />
        <Tile href="/membresia" icon={<Crown size={22} />} title="Membresía" desc="Planes y compras" />
      </section>

      {/* Membresía */}
      <Link
        href="/creditos"
        className="flex items-center gap-4 rounded-2xl border border-gold/50 bg-gradient-to-r from-plum/70 via-violet-deep/70 to-plum/70 p-4 shadow-[0_0_24px_rgba(233,189,121,0.15)]"
      >
        <Crown size={30} className="shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg text-gold-soft">Créditos Alma Limpia</p>
          <p className="text-xs text-ivory/75">Accedé a lecturas completas y experiencias premium</p>
        </div>
        <ChevronRight size={18} className="text-gold-soft" />
      </Link>

      {/* Últimas lecturas */}
      {readings.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl text-ivory">Últimas lecturas</h2>
          <div className="space-y-2">
            {readings.map((r) => (
              <div key={r.id} className="card-mystic flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ivory">{r.spreadType}</p>
                  <p className="text-xs text-mist line-clamp-1">{r.question ?? "Sin pregunta"}</p>
                </div>
                <span className="text-xs text-mist/60">
                  {r.createdAt.toLocaleDateString("es-AR")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Tile({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="card-mystic flex flex-col items-center gap-2 p-4 text-center transition">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-plum/50 text-gold-soft">
        {icon}
      </span>
      <p className="font-display text-base leading-tight text-ivory">{title}</p>
      <p className="text-[11px] text-mist">{desc}</p>
    </Link>
  );
}
