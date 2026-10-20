/**
 * Numerología pitagórica — cálculos determinísticos y verificables.
 * El LLM interpreta estos resultados; nunca los inventa.
 *
 * Tabla pitagórica: A,J,S=1  B,K,T=2  C,L,U=3  D,M,V=4
 *                   E,N,W=5  F,O,X=6  G,P,Y=7  H,Q,Z=8  I,R=9
 */

const TABLE: Record<string, number> = {};
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((ch, i) => {
  TABLE[ch] = (i % 9) + 1;
});

const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const MASTER = new Set([11, 22, 33]);

export function reduce(n: number, keepMaster = true): number {
  while (n > 9) {
    if (keepMaster && MASTER.has(n)) return n;
    n = String(n).split("").reduce((a, d) => a + Number(d), 0);
  }
  return n;
}

function letterValue(ch: string): number {
  const c = ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  return TABLE[c] ?? 0;
}

function sumLetters(name: string, filter?: (ch: string) => boolean): number {
  return name
    .split("")
    .filter((c) => letterValue(c) > 0)
    .filter((c) => (filter ? filter(c.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()) : true))
    .reduce((a, c) => a + letterValue(c), 0);
}

function dsum(dateStr: string): number {
  return dateStr.replace(/\D/g, "").split("").reduce((a, d) => a + Number(d), 0);
}

export interface NumerologyResults {
  tradition: "pythagorean";
  lifePath: number;        // fecha de nacimiento completa
  destiny: number;         // nombre completo
  soul: number;            // vocales del nombre
  personality: number;     // consonantes del nombre
  personalYear: number;    // día+mes nac + año actual
  personalMonth: number;
  personalDay: number;
  masters: string[];       // números maestros detectados
}

export function computeNumerology(
  fullName: string,
  birthDateISO: string, // "YYYY-MM-DD"
  today = new Date()
): NumerologyResults {
  const [y, m, d] = birthDateISO.split("-").map(Number);
  if (!y || !m || !d) throw new Error("INVALID_DATE");

  const lifePath = reduce(dsum(birthDateISO));
  const destiny = reduce(sumLetters(fullName));
  const soul = reduce(sumLetters(fullName, (c) => VOWELS.has(c)));
  const personality = reduce(sumLetters(fullName, (c) => !VOWELS.has(c)));

  const personalYear = reduce(d + m + today.getUTCFullYear());
  const personalMonth = reduce(personalYear + (today.getUTCMonth() + 1));
  const personalDay = reduce(personalMonth + today.getUTCDate());

  const masters: string[] = [];
  const raw = { lifePath: dsum(birthDateISO), destiny: sumLetters(fullName), soul: sumLetters(fullName, (c) => VOWELS.has(c)) };
  for (const [k, v] of Object.entries(raw)) {
    const r = reduce(v);
    if (MASTER.has(r)) masters.push(`${k}:${r}`);
  }

  return {
    tradition: "pythagorean",
    lifePath, destiny, soul, personality,
    personalYear, personalMonth, personalDay,
    masters,
  };
}

/** Compatibilidad numerológica: diferencia de caminos de vida. */
export function compatibility(lp1: number, lp2: number) {
  const diff = Math.abs(reduce(lp1) - reduce(lp2));
  const score = Math.max(20, 100 - diff * 12);
  return { score, diff };
}
