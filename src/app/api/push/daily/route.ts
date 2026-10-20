import { NextResponse } from "next/server";
import { sendPushBroadcast } from "@/server/push";
import { lunarCalendar } from "@/server/astrology/transits";

/**
 * GET /api/push/daily?key=<ALMA_CRON_SECRET>
 * Disparo diario (cron externo o Vercel Cron): notifica a usuarios con
 * recordatorios activos. Hoy: luna llena/nueva si corresponde; si no, carta del día.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.ALMA_CRON_SECRET;
  if (!secret || url.searchParams.get("key") !== secret) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const days = lunarCalendar(now.getUTCFullYear(), now.getUTCMonth());
  const today = days.find((d) => d.date === todayStr);

  const isMoonEvent = today && (today.phase === "Luna llena" || today.phase === "Luna nueva");
  const payload = isMoonEvent
    ? {
        title: `${today.phase} — ALMA LIMPIA`,
        body: `Hoy es ${today.phase.toLowerCase()} en ${today.sign}. Un buen día para un ritual.`,
        url: "/explorar/rituales",
        tag: "luna",
      }
    : {
        title: "Tu carta del día — ALMA LIMPIA",
        body: "Ya está tu tirada de hoy esperándote.",
        url: "/inicio",
        tag: "carta",
      };

  const result = await sendPushBroadcast(payload);
  return NextResponse.json({ ok: true, ...result, mode: isMoonEvent ? "luna" : "carta" });
}
