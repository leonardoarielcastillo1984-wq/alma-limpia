import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { CreditosClient } from "./CreditosClient";

export default async function CreditosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });

  return (
    <div className="animate-fade-up space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-gradient-gold">Créditos</h1>
        <p className="mt-1 text-sm text-mist">
          Saldo actual: <strong className="text-gold">{wallet?.balance ?? 0} créditos</strong>
        </p>
      </header>
      <CreditosClient />
    </div>
  );
}
