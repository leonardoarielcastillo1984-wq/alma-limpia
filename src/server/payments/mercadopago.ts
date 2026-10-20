import crypto from "crypto";

/**
 * Mercado Pago — adapter con modo mock.
 * ALMA_PAYMENTS_MODE=mock → crea preferencias falsas locales y un endpoint
 * de test para simular el webhook. En producción usa el SDK oficial.
 */

export interface MpPreferenceInput {
  title: string;
  unitPrice: number; // ARS
  quantity: number;
  externalReference: string; // ej: alma_purchaseId
  payerEmail?: string;
}

export interface MpPreference {
  id: string;
  initPoint: string; // URL a checkout
}

export function paymentsMode(): "mock" | "live" {
  return process.env.ALMA_PAYMENTS_MODE === "live" && process.env.MP_ACCESS_TOKEN
    ? "live"
    : "mock";
}

export async function createPreference(input: MpPreferenceInput): Promise<MpPreference> {
  if (paymentsMode() === "mock") {
    const id = `mock_pref_${crypto.randomBytes(8).toString("hex")}`;
    return {
      id,
      initPoint: `/pagos/mock/${id}?ref=${encodeURIComponent(input.externalReference)}`,
    };
  }

  // Live mode — SDK oficial (solo si hay credenciales reales)
  const { MercadoPagoConfig, Preference } = await import("mercadopago");
  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
  const pref = new Preference(client);
  const base = process.env.ALMA_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const result = await pref.create({
    body: {
      items: [
        {
          id: input.externalReference,
          title: input.title,
          quantity: input.quantity,
          unit_price: input.unitPrice,
          currency_id: "ARS",
        },
      ],
      external_reference: input.externalReference,
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      back_urls: {
        success: `${base}/pagos/ok`,
        failure: `${base}/pagos/fallo`,
        pending: `${base}/pagos/pendiente`,
      },
      auto_return: "approved",
      notification_url: `${base}/api/pagos/webhook`,
    },
  });
  return { id: result.id!, initPoint: result.init_point! };
}

/** Verifica la firma x-signature del webhook de MP (v1). */
export function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || paymentsMode() === "mock") return paymentsMode() === "mock";
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=") as [string, string])
  );
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return hmac === parts.v1;
}

/** Consulta el estado real del pago en MP (server-side, nunca confiar en el front). */
export async function getPaymentStatus(paymentId: string): Promise<{
  status: string;
  externalReference: string | null;
  amount: number;
}> {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`MP payment ${res.status}`);
  const data = (await res.json()) as {
    status: string;
    external_reference?: string;
    transaction_amount: number;
  };
  return {
    status: data.status,
    externalReference: data.external_reference ?? null,
    amount: data.transaction_amount,
  };
}
