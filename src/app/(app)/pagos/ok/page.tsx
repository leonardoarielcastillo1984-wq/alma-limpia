import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";

/** Tras un pago aprobado, resolvemos a dónde continuar según lo comprado. */
export default async function PagoOkPage() {
  const user = await getCurrentUser();

  const lastApproved = user
    ? await prisma.purchase.findFirst({
        where: { userId: user.id, status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: { service: { include: { category: true } } },
      })
    : null;

  let continueUrl = "/mi-universo";
  let continueLabel = "Ir a Mi Universo";
  let detail = "Tu compra quedó registrada. Ya está disponible.";

  if (lastApproved?.kind === "SERVICE" && lastApproved.service) {
    const svc = lastApproved.service;
    continueUrl =
      svc.category.slug === "rituales"
        ? `/ritual/${svc.slug}`
        : `/explorar/${svc.category.slug}/${svc.slug}`;
    continueLabel = `Comenzar: ${svc.name}`;
    detail = "Tu experiencia ya está desbloqueada.";
  } else if (lastApproved?.kind === "CREDITS") {
    continueUrl = "/creditos";
    continueLabel = "Ir a Mis Créditos";
    detail = "Los créditos ya están en tu billetera.";
  } else if (lastApproved?.kind === "MEMBERSHIP") {
    continueUrl = "/inicio";
    continueLabel = "Empezar a explorar";
    detail = "Tu membresía ya está activa — todas las experiencias están abiertas.";
  }

  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <div className="card-mystic max-w-sm space-y-4 p-8 text-center">
        <CheckCircle size={48} className="mx-auto text-gold" />
        <h1 className="font-display text-2xl text-gradient-gold">Pago confirmado</h1>
        <p className="text-sm text-mist">{detail}</p>
        <div className="space-y-2 pt-2">
          <Link href={continueUrl} className="btn-gold block px-8 py-3 text-sm">
            {continueLabel}
          </Link>
          <Link href="/mi-universo" className="block text-xs text-mist hover:text-ivory">
            Ir a Mi Universo
          </Link>
        </div>
      </div>
    </div>
  );
}
