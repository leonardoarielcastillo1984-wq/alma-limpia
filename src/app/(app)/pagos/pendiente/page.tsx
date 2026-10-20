import Link from "next/link";
import { Clock } from "lucide-react";

export default function PagoPendientePage() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <div className="card-mystic max-w-sm space-y-4 p-8 text-center">
        <Clock size={48} className="mx-auto text-violet" />
        <h1 className="font-display text-2xl text-ivory">Pago en proceso</h1>
        <p className="text-sm text-mist">
          Mercado Pago está procesando tu pago. Te lo acreditamos apenas se confirme.
        </p>
        <Link href="/mi-universo" className="btn-ghost inline-block px-8 py-3 text-sm">
          Ir a Mi Universo
        </Link>
      </div>
    </div>
  );
}
