import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PagoFalloPage() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <div className="card-mystic max-w-sm space-y-4 p-8 text-center">
        <XCircle size={48} className="mx-auto text-rose" />
        <h1 className="font-display text-2xl text-ivory">El pago no se completó</h1>
        <p className="text-sm text-mist">
          No se hizo ningún cargo. Podés intentarlo de nuevo cuando quieras.
        </p>
        <Link href="/explorar" className="btn-ghost inline-block px-8 py-3 text-sm">
          Volver a explorar
        </Link>
      </div>
    </div>
  );
}
