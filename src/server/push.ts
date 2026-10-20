/**
 * Web Push — suscripciones persistidas en push_subscriptions.
 * Envs: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto: o URL).
 * Sin credenciales → modo mock (no envía, solo loguea).
 */
import webpush from "web-push";
import { prisma } from "./db";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export function pushEnabled(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

if (pushEnabled()) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:hola@almalimpia.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

/** Envía una notificación a todas las suscripciones del usuario.
 * Limpia endpoints muertos (404/410). Devuelve cuántas se enviaron. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!pushEnabled() || subs.length === 0) {
    if (subs.length > 0) console.info(`[push:mock] → ${userId} | ${payload.title}`);
    return 0;
  }
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload)
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          // Endpoint muerto → eliminar suscripción
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        } else {
          console.error("[push] send fail", code, (e as Error).message);
        }
      }
    })
  );
  return sent;
}

/** Envío masivo a usuarios con recordatorios activos (para el cron diario). */
export async function sendPushBroadcast(payload: PushPayload): Promise<{ users: number; sent: number }> {
  const prefs = await prisma.userPreference.findMany({
    where: { notificationsEnabled: true },
    select: { userId: true },
  });
  const userIds = prefs.map((p) => p.userId);
  const subs = userIds.length
    ? await prisma.pushSubscription.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true },
        distinct: ["userId"],
      })
    : [];
  let sent = 0;
  for (const { userId } of subs) {
    sent += await sendPushToUser(userId, payload);
  }
  return { users: subs.length, sent };
}
