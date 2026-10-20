import Link from "next/link";
import { CrescentMoon } from "@/components/cosmic/CrescentMoon";

export const metadata = { title: "Sin conexión — ALMA LIMPIA" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <CrescentMoon size={72} />
      <h1 className="mt-6 font-display text-3xl text-ivory">Estás en modo eclipse</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-mist">
        No hay conexión a internet en este momento. Tus datos guardados siguen
        disponibles; volvé a intentarlo cuando se restablezca la señal.
      </p>
      <Link href="/inicio" className="btn-violet mt-8 px-8 py-3">
        Reintentar
      </Link>
    </main>
  );
}
