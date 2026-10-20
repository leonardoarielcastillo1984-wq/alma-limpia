"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, MoonStar, MessageCircle, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/mi-universo", label: "Mi Universo", icon: MoonStar },
  { href: "/mensajes", label: "Mensajes", icon: MessageCircle },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-violet/20 bg-gradient-to-b from-[#1c0e38]/90 to-[#0d0620]/95 backdrop-blur-xl"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-1 flex-col items-center gap-1 py-3"
            >
              {active && (
                <span className="absolute -top-px h-0.5 w-10 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent" />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.5}
                className={
                  active
                    ? "text-gold drop-shadow-[0_0_8px_rgba(233,189,121,0.7)]"
                    : "text-lilac/60 transition group-hover:text-ivory"
                }
              />
              <span
                className={`text-[10px] tracking-wide ${
                  active ? "text-gold" : "text-mist/60 group-hover:text-ivory"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
