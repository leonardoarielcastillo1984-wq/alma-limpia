import { createHash, randomBytes } from "crypto";

/**
 * RNG verificable para tiradas de tarot.
 * - seed: se genera server-side, se guarda en la lectura.
 * - El orden del mazo sale de un Fisher-Yates con PRNG determinista (xmur3+mulberry32
 *   sobre la seed). Con la seed cualquiera puede reproducir la tirada exacta.
 */

export function newSeed(): string {
  return randomBytes(16).toString("hex");
}

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Devuelve índices de carta mezclados de forma determinista según la seed. */
export function shuffleDeck(cardCount: number, seed: string): number[] {
  const rand = mulberry32(xmur3(seed)());
  const idx = Array.from({ length: cardCount }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/** Orientación (derecha/invertida) también determinista por seed+posición. */
export function cardReversed(seed: string, position: number): boolean {
  const h = createHash("sha256").update(`${seed}:rev:${position}`).digest();
  return h[0] % 2 === 1;
}

export type SpreadType = "one" | "three" | "five" | "seven" | "celtic";

export const SPREAD_POSITIONS: Record<SpreadType, string[]> = {
  one: ["Tu guía de hoy"],
  three: ["Pasado reciente", "Presente", "Tendencia"],
  five: ["Situación", "Desafío", "Lo oculto", "Consejo", "Resultado probable"],
  seven: [
    "Vos", "La situación", "Obstáculo", "Lo que ayuda",
    "Pasado influyente", "Próximo paso", "Síntesis",
  ],
  celtic: [
    "Corazón del asunto", "Lo que cruza", "Raíz", "Pasado", "Corona",
    "Futuro cercano", "Vos misma/o", "Entorno", "Esperanzas y miedos", "Desenlace",
  ],
};

export function spreadCount(spread: SpreadType): number {
  return SPREAD_POSITIONS[spread]?.length ?? 3;
}
