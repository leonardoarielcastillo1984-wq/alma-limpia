import { prisma } from "./db";

/**
 * Rate limiting simple persistido en rate_limit_events.
 * Ventana deslizante por (key, action). Devuelve true si hay que BLOQUEAR.
 * Ej.: await tooMany(`ip:${ip}`, "login", 10, 60) → true tras 10 intentos/min.
 */
export async function tooMany(
  key: string,
  action: string,
  max: number,
  windowSec: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowSec * 1000);
  const count = await prisma.rateLimitEvent.count({
    where: { key, action, createdAt: { gte: since } },
  });
  if (count >= max) return true;
  // best-effort: si el insert falla, no bloqueamos al usuario
  await prisma.rateLimitEvent.create({ data: { key, action } }).catch(() => {});
  // Limpieza oportunista (~1% de las llamadas): sin cron, la tabla no crece sin límite
  if (Math.random() < 0.01) void pruneRateLimits().catch(() => {});
  return false;
}

/** IP del cliente tras proxy/CDN. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

/** Limpieza periódica (llamar desde cron o al pasar). */
export async function pruneRateLimits(olderThanDays = 2) {
  const before = new Date(Date.now() - olderThanDays * 86400_000);
  await prisma.rateLimitEvent.deleteMany({ where: { createdAt: { lt: before } } });
}
