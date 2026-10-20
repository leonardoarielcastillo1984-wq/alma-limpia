import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getPaymentStatus, paymentsMode, verifyWebhookSignature } from "@/server/payments/mercadopago";
import { sendMail, emailTemplates } from "@/server/email";

/**
 * POST /api/pagos/webhook — notificación de Mercado Pago.
 * - Verifica firma HMAC (en modo live).
 * - Idempotente: Payment.providerEventId es @unique; si ya existe, 200 y chau.
 * - El estado real se consulta a MP, nunca se confía en el body.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "";
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  let body: { type?: string; data?: { id?: string }; action?: string } = {};
  try {
    body = await req.json();
  } catch {
    // MP a veces manda body vacío en pings
  }
  const paymentId = body.data?.id ?? dataId;
  const type = body.type ?? url.searchParams.get("type") ?? "";

  if (type !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!verifyWebhookSignature(xSignature, xRequestId, String(paymentId))) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  try {
    const providerEventId = `mp_${paymentId}`;

    // Idempotencia: si ya procesamos este evento, listo
    const existing = await prisma.payment.findUnique({ where: { providerEventId } });
    if (existing) return NextResponse.json({ ok: true, duplicate: true });

    const status =
      paymentsMode() === "mock"
        ? { status: "approved", externalReference: url.searchParams.get("ref"), amount: 0 }
        : await getPaymentStatus(paymentId);

    const ref = status.externalReference ?? "";
    const purchaseId = ref.startsWith("alma_") ? ref.slice(5) : null;
    const purchase = purchaseId
      ? await prisma.purchase.findUnique({ where: { id: purchaseId } })
      : null;
    if (!purchase) return NextResponse.json({ ok: true, unmatched: true });

    await prisma.payment.create({
      data: {
        purchaseId: purchase.id,
        provider: "mercadopago",
        providerEventId,
        providerRef: String(paymentId),
        status: status.status,
        amountArs: status.amount || purchase.amountArs,
        raw: body as object,
      },
    });

    if (status.status === "approved" && purchase.status !== "APPROVED") {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { mpPaymentId: String(paymentId) },
      });
      await fulfillPurchase(
        purchase.id, purchase.userId, purchase.kind,
        purchase.metadata as Record<string, unknown>
      );
      // Email de confirmación (best-effort)
      const buyer = await prisma.user.findUnique({ where: { id: purchase.userId }, select: { email: true, name: true } });
      if (buyer?.email) {
        const meta = (purchase.metadata ?? {}) as { credits?: number; plan?: string };
        const item =
          purchase.kind === "CREDITS" ? `${meta.credits ?? 0} créditos`
          : purchase.kind === "MEMBERSHIP" ? `Membresía ${meta.plan ?? ""}`
          : "Tu experiencia";
        void sendMail(buyer.email, "Compra confirmada — ALMA LIMPIA ✨", emailTemplates.purchase(buyer.name ?? "viajera/o", item, `$ ${purchase.amountArs.toLocaleString("es-AR")}`));
      }
    } else if (["rejected", "cancelled", "refunded"].includes(status.status)) {
      await prisma.purchase.update({ where: { id: purchase.id }, data: { status: "REJECTED" } });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("webhook pagos", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}

async function fulfillPurchase(
  purchaseId: string,
  userId: string,
  kind: string,
  meta: Record<string, unknown>
) {
  await prisma.$transaction(async (tx) => {
    await tx.purchase.update({ where: { id: purchaseId }, data: { status: "APPROVED" } });

    if (kind === "CREDITS") {
      const credits = Number(meta.credits ?? 0);
      const wallet = await tx.creditWallet.upsert({
        where: { userId },
        create: { userId, balance: credits },
        update: { balance: { increment: credits } },
      });
      await tx.creditTransaction.create({
        data: {
          userId, walletId: wallet.id, amount: credits,
          reason: "PURCHASE", refId: purchaseId,
          balance: wallet.balance ?? credits,
        },
      });
    }

    if (kind === "MEMBERSHIP") {
      const plan = String(meta.plan ?? "LUNA");
      const expiresAt = new Date(Date.now() + 30 * 86400_000);
      // Desactivar membresías anteriores y crear la nueva
      await tx.membership.updateMany({ where: { userId, active: true }, data: { active: false } });
      const membership = await tx.membership.create({
        data: { userId, planCode: plan, active: true, expiresAt },
      });
      await tx.subscription.create({
        data: { userId, planCode: plan, status: "ACTIVE", renewsAt: expiresAt },
      });
      await tx.auditLog.create({
        data: {
          actor: "webhook",
          action: "membership.activated",
          entityType: "Membership",
          entityId: membership.id,
          meta: { userId, plan, expiresAt },
        },
      });
    }

    // Contar uso del cupón aplicado (si hubo)
    const coupon = meta.coupon as string | undefined;
    if (coupon) {
      await tx.promotion.updateMany({
        where: { code: coupon },
        data: { usedCount: { increment: 1 } },
      });
    }

    await tx.auditLog.create({
      data: {
        actor: "webhook",
        action: "purchase.fulfilled",
        entityType: "Purchase",
        entityId: purchaseId,
        meta: { userId, kind },
      },
    });
  });
}
