import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { createPreference, paymentsMode } from "@/server/payments/mercadopago";
import { tooMany } from "@/server/ratelimit";
import { MEMBERSHIP_PLANS } from "@/server/payments/plans";

const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("service"), serviceSlug: z.string(), coupon: z.string().max(40).optional() }),
  z.object({ type: z.literal("credits"), pack: z.enum(["p10", "p25", "p60"]) }),
  z.object({ type: z.literal("membership"), plan: z.enum(["LUNA", "ESTRELLA", "COSMOS"]) }),
]);

const CREDIT_PACKS = {
  p10: { credits: 10, priceArs: 3000, title: "10 créditos ALMA LIMPIA" },
  p25: { credits: 25, priceArs: 6500, title: "25 créditos ALMA LIMPIA" },
  p60: { credits: 60, priceArs: 13000, title: "60 créditos ALMA LIMPIA" },
};


// POST /api/pagos/checkout — crea preferencia MP (o mock) + Purchase PENDING
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    if (await tooMany(`user:${user.id}`, "checkout", 10, 3600)) {
      return NextResponse.json({ error: "TOO_MANY" }, { status: 429 });
    }
    const body = schema.parse(await req.json());

    let title: string, amount: number, meta: Prisma.InputJsonObject, serviceId: string | null = null;

    if (body.type === "service") {
      const service = await prisma.service.findUnique({ where: { slug: body.serviceSlug } });
      if (!service || !service.active || service.priceArs <= 0) {
        return NextResponse.json({ error: "SERVICE_NOT_FOUND" }, { status: 404 });
      }
      title = service.name;
      amount = service.priceArs;
      serviceId = service.id;
      meta = { serviceSlug: service.slug };

      // Cupón opcional
      if (body.coupon) {
        const promo = await prisma.promotion.findUnique({ where: { code: body.coupon.toUpperCase() } });
        const now = new Date();
        const valid =
          promo && promo.active &&
          (!promo.validFrom || promo.validFrom <= now) &&
          (!promo.validUntil || promo.validUntil >= now) &&
          (!promo.maxUses || promo.usedCount < promo.maxUses) &&
          (!promo.serviceId || promo.serviceId === service.id);
        if (!valid) {
          return NextResponse.json({ error: "INVALID_COUPON" }, { status: 400 });
        }
        if (promo.kind === "PERCENT") {
          amount = Math.max(0, Math.round(amount * (1 - promo.value / 100)));
        } else if (promo.kind === "FIXED") {
          amount = Math.max(0, amount - promo.value);
        }
        meta = { ...meta, coupon: promo.code };
      }
    } else if (body.type === "membership") {
      const plan = MEMBERSHIP_PLANS[body.plan];
      title = plan.title;
      amount = plan.priceArs;
      meta = { plan: body.plan };
    } else {
      const pack = CREDIT_PACKS[body.pack];
      title = pack.title;
      amount = pack.priceArs;
      meta = { credits: pack.credits, pack: body.pack };
    }

    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        serviceId,
        kind: body.type === "credits" ? "CREDITS" : body.type === "membership" ? "MEMBERSHIP" : "SERVICE",
        amountArs: amount,
        status: "PENDING",
        metadata: meta,
      },
    });

    const pref = await createPreference({
      title,
      unitPrice: amount,
      quantity: 1,
      externalReference: `alma_${purchase.id}`,
      payerEmail: user.email ?? undefined,
    });

    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { mpPreferenceId: pref.id },
    });

    return NextResponse.json({
      ok: true,
      purchaseId: purchase.id,
      initPoint: pref.initPoint,
      mode: paymentsMode(),
    });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    console.error("checkout", e);
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
