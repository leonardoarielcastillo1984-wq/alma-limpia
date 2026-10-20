/**
 * Tránsitos, sinastría, horóscopo y luna — sobre el motor VSOP87 de natal.ts.
 * Reutilizamos computeNatalChart: una "carta" de cualquier instante da las
 * posiciones del cielo en ese momento (transiting sky).
 */
import { computeNatalChart, type NatalChart, type PlanetPos } from "./natal";

export interface Aspect {
  planetA: string; // clave: "sun", "moon", …
  planetB: string;
  type: "conjunction" | "opposition" | "trine" | "square" | "sextile";
  orb: number;
  applying: boolean;
}

const ASPECT_ANGLES: { type: Aspect["type"]; angle: number; orbMax: number }[] = [
  { type: "conjunction", angle: 0, orbMax: 8 },
  { type: "sextile", angle: 60, orbMax: 5 },
  { type: "square", angle: 90, orbMax: 7 },
  { type: "trine", angle: 120, orbMax: 7 },
  { type: "opposition", angle: 180, orbMax: 8 },
];

function sep(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 540) % 360 - 180);
  return Math.min(d, 360 - d);
}

/** Aspectos entre dos listas de posiciones (ej. cielo actual vs carta natal). */
export function findAspects(a: PlanetPos[], b: PlanetPos[]): Aspect[] {
  const out: Aspect[] = [];
  for (const pa of a) {
    for (const pb of b) {
      const angle = sep(pa.longitude, pb.longitude);
      for (const asp of ASPECT_ANGLES) {
        const orb = Math.abs(angle - asp.angle);
        if (orb <= asp.orbMax) {
          out.push({
            planetA: pa.key,
            planetB: pb.key,
            type: asp.type,
            orb: Math.round(orb * 10) / 10,
            applying: true, // simplificación: no calculamos velocidad
          });
          break;
        }
      }
    }
  }
  // Los más cerrados primero
  return out.sort((x, y) => x.orb - y.orb);
}

/** Cielo de "ahora" o de una fecha dada (para tránsitos). */
export function skyAt(date = new Date()): NatalChart {
  return computeNatalChart({ birthDate: date, hasTime: false });
}

/** Signo solar a partir de la carta (el Sol es la primera posición). */
export function sunSignOf(chart: NatalChart): string {
  return chart.positions.find((p) => p.key === "sun")?.sign ?? "";
}

// ---------- Horóscopo diario determinístico ----------
const DAILY_AREAS: Record<string, { title: string; body: string }[]> = {
  Aries: [
    { title: "Energía", body: "Tu ímpetu natural se potencia hoy: canalizalo en algo concreto antes del mediodía." },
    { title: "Vínculos", body: "La franqueza directa te sirve, pero medí el tono: hoy la verdad sin filtro puede morder." },
  ],
  Tauro: [
    { title: "Recursos", body: "Día para ordenar lo material: un gasto chico revisado hoy evita uno grande mañana." },
    { title: "Cuerpo", body: "El placer sensorial te recarga: comé rico, caminá, tocá algo lindo." },
  ],
  Géminis: [
    { title: "Mente", body: "Las ideas te vienen en ráfaga: anotalas. Una conversación casual trae la pista que buscabas." },
    { title: "Vínculos", body: "Hoy escuchás más de lo que hablás y eso te devuelve información valiosa." },
  ],
  Cáncer: [
    { title: "Emociones", body: "La sensibilidad está alta: no la escondas, usala como brújula para lo que necesitás." },
    { title: "Hogar", body: "Un gesto en tu espacio (ordenar, cocinar, llamar a alguien) reordena tu interior." },
  ],
  Leo: [
    { title: "Brillo", body: "El reconocimiento llega cuando te animás a mostrar lo que hacés sin pedir permiso." },
    { title: "Creatividad", body: "Jugá con algo creativo hoy: el placer de crear es tu combustible." },
  ],
  Virgo: [
    { title: "Orden", body: "Lo que ordenás afuera ordena adentro: una tarea chica pendiente se resuelve fácil hoy." },
    { title: "Salud", body: "Tu cuerpo pide rutina amable: dormir bien y comer a horario hacen más que cualquier ritual." },
  ],
  Libra: [
    { title: "Vínculos", body: "El equilibrio no es dar lo mismo: es estar genuina/o. Una charla pendiente se destraba." },
    { title: "Decisiones", body: "Hoy decidís mejor si te escuchás a vos antes de preguntar afuera." },
  ],
  Escorpio: [
    { title: "Profundidad", body: "Lo que evitás mirar pide atención. Mirarlo un rato ya cambia su peso." },
    { title: "Vínculos", body: "La intensidad es tu idioma, pero hoy elijo la calma: observá antes de actuar." },
  ],
  Sagitario: [
    { title: "Horizonte", body: "Una idea grande te entusiasma: escribila antes de que pase. Después la evaluás." },
    { title: "Aprendizaje", body: "Hoy aprendés algo que no esperabas de alguien que subestimabas." },
  ],
  Capricornio: [
    { title: "Trabajo", body: "Un paso concreto hacia tu meta pesa más que diez planes. Hacelo hoy." },
    { title: "Descanso", body: "La productividad también se agota: tu cuerpo pide una pausa sin culpa." },
  ],
  Acuario: [
    { title: "Originalidad", body: "Tu forma distinta de ver las cosas es un regalo: compartila sin suavizarla." },
    { title: "Comunidad", body: "Un grupo o amiga/o te necesita o te trae algo: abrite al encuentro." },
  ],
  Piscis: [
    { title: "Intuición", body: "Eso que sentís sin poder explicar tiene información real: prestale atención." },
    { title: "Límites", body: "Soñar es tuyo, pero hoy ponele nombre y horario a algo concreto." },
  ],
};

/** Horóscopo diario determinístico por signo + fecha (mismo texto todo el día). */
export function dailyHoroscope(sign: string, date = new Date()): { sign: string; date: string; title: string; body: string; lucky: { color: string; number: number; hour: string } } {
  const daySeed = `${sign}-${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
  let h = 0;
  for (const c of daySeed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pool = DAILY_AREAS[sign] ?? DAILY_AREAS.Aries;
  const pick = pool[h % pool.length];
  const colors = ["violeta", "dorado", "blanco", "verde agua", "rosa", "celeste"];
  const hours = ["9h", "11h", "15h", "17h", "19h", "21h"];
  return {
    sign,
    date: date.toISOString().slice(0, 10),
    title: pick.title,
    body: pick.body,
    lucky: {
      color: colors[h % colors.length],
      number: (h % 99) + 1,
      hour: hours[h % hours.length],
    },
  };
}

// ---------- Luna ----------
export interface LunarDay {
  date: string;         // YYYY-MM-DD
  phase: string;        // nombre de la fase
  illumination: number; // 0-1
  sign: string;         // signo de la luna
}

const MOON_PHASES = ["Luna nueva", "Cuarto creciente", "Luna llena", "Cuarto menguante"];

/** Calendario lunar del mes (fase + signo por día). */
export function lunarCalendar(year: number, month0: number): LunarDay[] {
  const days = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const out: LunarDay[] = [];
  for (let d = 1; d <= days; d++) {
    const chart = skyAt(new Date(Date.UTC(year, month0, d, 12, 0, 0)));
    const moon = chart.positions.find((p) => p.key === "moon")!;
    out.push({
      date: `${year}-${String(month0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      phase: chart.moonPhase?.name ?? MOON_PHASES[0],
      illumination: chart.moonPhase?.illumination ?? 0,
      sign: moon.sign,
    });
  }
  return out;
}
