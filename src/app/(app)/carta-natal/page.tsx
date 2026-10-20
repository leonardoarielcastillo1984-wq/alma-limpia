import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { NatalClient } from "./NatalClient";

export default async function CartaNatalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="animate-fade-up space-y-5">
      <header className="relative text-center">
        <Link
          href="/explorar/universo"
          aria-label="Volver"
          className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-3xl font-medium text-gold-soft">Carta astral</h1>
        <p className="mx-auto mt-1 max-w-xs text-xs text-mist">
          Tu mapa del cielo al nacer, calculado con efemérides reales.
        </p>
      </header>
      <NatalClient
        initialData={{
          birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : "",
          birthTime: user.birthTime ?? "",
          birthCity: user.birthCity ?? "",
          birthCountry: user.birthCountry ?? "",
        }}
      />
    </div>
  );
}
