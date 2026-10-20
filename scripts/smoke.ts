/**
 * Smoke test de flujos críticos — corre con `npx tsx scripts/smoke.ts`.
 * Ejercita los módulos puros del servidor (sin DB ni red):
 * oráculos, numerología, astrología (tránsitos/luna/horóscopo), rate limit helpers.
 */
import assert from "node:assert/strict";
import { drawPendulum, drawRunes, drawIChing, drawAkashic } from "../src/server/oracles/index";
import { computeNumerology, compatibility } from "../src/server/numerology/index";
import { skyAt, findAspects, dailyHoroscope, lunarCalendar } from "../src/server/astrology/transits";
import { computeNatalChart } from "../src/server/astrology/natal";
import { clientIp } from "../src/server/ratelimit";

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

// ---------- Oráculos ----------
check("péndulo devuelve respuesta simbólica", () => {
  const r = drawPendulum("seed-1");
  assert.ok(["sí", "no", "tal vez", "reformulá"].includes(r.answer));
  assert.ok(r.swing.length > 10);
});
check("péndulo es determinístico por seed", () => {
  assert.deepEqual(drawPendulum("s"), drawPendulum("s"));
});
check("runas devuelve 3 runas distintas", () => {
  const r = drawRunes("seed-2");
  assert.equal(r.length, 3);
  assert.ok(new Set(r.map((x) => x.name)).size === 3);
  assert.ok(r.every((x) => x.glyph && x.meaning));
});
check("i-ching devuelve hexagrama con 6 líneas y nombre", () => {
  const r = drawIChing("seed-3");
  assert.equal(r.lines.length, 6);
  assert.ok(r.name.length > 0 && r.hexagramNumber >= 1);
});
check("i-ching mapea a número King Wen real", () => {
  const r = drawIChing("a");
  assert.ok(r.hexagramNumber >= 1 && r.hexagramNumber <= 64);
});
check("sorteo akáshico devuelve sala, símbolo y fragmento", () => {
  const r = drawAkashic("seed-4");
  assert.ok(r.hall && r.symbol && r.fragment && r.theme);
  assert.deepEqual(drawAkashic("x"), drawAkashic("x"));
});

// ---------- Numerología ----------
check("computeNumerology devuelve todos los números", () => {
  const r = computeNumerology("Test Name", "1990-05-15", new Date("2025-06-15T12:00:00Z"));
  assert.ok(r.lifePath >= 1 && r.lifePath <= 33);
  assert.ok(r.personalMonth >= 1 && r.personalDay >= 1);
});
check("compatibility entre 20 y 100", () => {
  const s = compatibility(7, 4);
  assert.ok(s.score >= 20 && s.score <= 100);
});

// ---------- Astrología ----------
check("skyAt devuelve 10 posiciones planetarias", () => {
  const sky = skyAt(new Date("2025-06-15T12:00:00Z"));
  assert.equal(sky.positions.length, 10); // sol, luna, 7 planetas VSOP87, plutón
});
check("carta natal: el sol está en Géminis para 15-jun", () => {
  const c = computeNatalChart({ birthDate: new Date("1990-06-15T12:00:00Z"), hasTime: false });
  assert.equal(c.positions.find((p) => p.key === "sun")?.sign, "Géminis");
});
check("findAspects detecta conjunción", () => {
  const a = [{ key: "sun", name: "Sol", longitude: 45, sign: "Tauro", signDegree: 15, retrograde: false }];
  const b = [{ key: "moon", name: "Luna", longitude: 47, sign: "Tauro", signDegree: 17, retrograde: false }];
  const aspects = findAspects(a, b);
  assert.equal(aspects[0].type, "conjunction");
});
check("horóscopo diario determinístico por signo+fecha", () => {
  const d = new Date("2025-06-15T12:00:00Z");
  const h1 = dailyHoroscope("Aries", d);
  const h2 = dailyHoroscope("Aries", d);
  assert.deepEqual(h1, h2);
  assert.ok(h1.lucky.number >= 1);
});
check("calendario lunar tiene los días del mes", () => {
  const days = lunarCalendar(2025, 5); // junio
  assert.equal(days.length, 30);
  assert.ok(days.every((d) => d.phase && d.sign));
});

// ---------- Rate limit helpers ----------
check("clientIp extrae de x-forwarded-for", () => {
  const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
  assert.equal(clientIp(req), "1.2.3.4");
});

console.log(`\n${passed} checks pasados`);
process.exit(process.exitCode ?? 0);
