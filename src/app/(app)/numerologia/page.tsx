import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { NumerologyClient } from "./NumerologyClient";

export default async function NumerologiaPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const { modo } = await searchParams;
  const mode = modo === "compatibilidad" ? "compat" : "personal";

  return (
    <div className="animate-fade-up space-y-5">
      <header className="relative text-center">
        <Link
          href="/explorar"
          aria-label="Volver"
          className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full text-ivory/80 hover:bg-plum/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-3xl font-medium text-gold-soft">
          {mode === "compat" ? "Compatibilidad" : "Numerología"}
        </h1>
      </header>
      <NumerologyClient
        mode={mode}
        initialName={user.name ?? ""}
        initialBirthDate={user.birthDate ? user.birthDate.toISOString().slice(0, 10) : ""}
      />
    </div>
  );
}
