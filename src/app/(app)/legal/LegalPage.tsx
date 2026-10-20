import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up mx-auto max-w-md space-y-6 pb-8">
      <header className="flex items-center gap-3 border-b border-violet/15 pb-4">
        <Link
          href="/perfil"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-ivory">{title}</h1>
          <p className="text-[11px] text-mist/60">Actualizado: {updated}</p>
        </div>
      </header>
      <div className="space-y-6">{children}</div>
      <nav className="flex flex-wrap gap-3 border-t border-violet/15 pt-4 text-xs text-mist">
        <Link href="/legal/privacidad" className="hover:text-gold">Privacidad</Link>
        <Link href="/legal/terminos" className="hover:text-gold">Términos</Link>
        <Link href="/legal/reembolsos" className="hover:text-gold">Reembolsos</Link>
      </nav>
    </div>
  );
}
