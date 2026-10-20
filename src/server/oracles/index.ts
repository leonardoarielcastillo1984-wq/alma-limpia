/**
 * Oráculos simbólicos: péndulo, runas nórdicas, I Ching.
 * Sorteo determinístico por seed (verificable igual que el tarot).
 */

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

// ---------- Péndulo ----------
export interface PendulumResult {
  answer: "sí" | "no" | "tal vez" | "reformulá";
  swing: string; // descripción del movimiento
}
const PENDULUM: PendulumResult[] = [
  { answer: "sí", swing: "El péndulo gira en círculos amplios y constantes: la energía responde sí." },
  { answer: "no", swing: "El péndulo oscila de atrás hacia adelante y se aquieta: la respuesta simbólica es no." },
  { answer: "tal vez", swing: "El péndulo titubea, cruza direcciones: la energía no está definida. Dale tiempo a la pregunta." },
  { answer: "reformulá", swing: "El péndulo apenas se mueve: quizá la pregunta no fue clara. Probá formularla de otro modo." },
];

export function drawPendulum(seed: string): PendulumResult {
  const r = mulberry32(seedFrom(seed))();
  return PENDULUM[Math.floor(r * PENDULUM.length)];
}

// ---------- Runas (Elder Futhark, 24) ----------
export interface Rune {
  glyph: string;
  name: string;
  meaning: string;
  reversed: boolean;
  reversedMeaning?: string;
}
const RUNES: { glyph: string; name: string; meaning: string; reversed?: string }[] = [
  { glyph: "ᚠ", name: "Fehu", meaning: "abundancia, energía que circula, recursos", reversed: "pérdida, avaricia, energía estancada" },
  { glyph: "ᚢ", name: "Uruz", meaning: "fuerza vital, salud, coraje para cambiar", reversed: "debilidad, miedo al cambio" },
  { glyph: "ᚦ", name: "Thurisaz", meaning: "defensa, reacción, umbral de decisión", reversed: "impulsividad, peligro evitable" },
  { glyph: "ᚨ", name: "Ansuz", meaning: "comunicación, mensajes, sabiduría recibida", reversed: "malentendidos, engaño, ruido" },
  { glyph: "ᚱ", name: "Raidho", meaning: "viaje, movimiento, camino correcto", reversed: "demora, desvío del camino" },
  { glyph: "ᚲ", name: "Kenaz", meaning: "antorcha, claridad, conocimiento que revela", reversed: "oscuridad, confusión, visión nublada" },
  { glyph: "ᚷ", name: "Gebo", meaning: "don, intercambio equilibrado, generosidad" },
  { glyph: "ᚹ", name: "Hagalaz", meaning: "disrupción natural, lo que no controlás" },
  { glyph: "ᚾ", name: "Nauthiz", meaning: "necesidad, restricción que enseña", reversed: "privación excesiva, victimización" },
  { glyph: "ᛁ", name: "Isa", meaning: "hielo, pausa, quietud necesaria" },
  { glyph: "ᛃ", name: "Jera", meaning: "cosecha, ciclos, recompensa al esfuerzo" },
  { glyph: "ᛇ", name: "Eihwaz", meaning: "resistencia, protección, paciencia del tejo" },
  { glyph: "ᛈ", name: "Perthro", meaning: "misterio, azar, lo oculto que se revela", reversed: "secreto dañino, azar en contra" },
  { glyph: "ᛉ", name: "Algiz", meaning: "protección, guía superior, instinto", reversed: "vulnerabilidad, bajar la guardia" },
  { glyph: "ᛊ", name: "Sowilo", meaning: "sol, éxito, energía vital ganadora" },
  { glyph: "ᛏ", name: "Tiwaz", meaning: "justicia, honor, sacrificio por lo correcto", reversed: "injusticia, sacrificio inútil" },
  { glyph: "ᛒ", name: "Berkana", meaning: "nacimiento, renovación, crecimiento tierno", reversed: "estancamiento, abandono de lo nuevo" },
  { glyph: "ᛖ", name: "Ehwaz", meaning: "alianza, trabajo en equipo, avance confiado", reversed: "desconfianza, desunión" },
  { glyph: "ᛗ", name: "Mannaz", meaning: "humanidad, vínculos, el yo en relación", reversed: "aislamiento, autoengaño" },
  { glyph: "ᛚ", name: "Laguz", meaning: "agua, intuición, fluir con la vida", reversed: "confusión, intuición bloqueada" },
  { glyph: "ᛜ", name: "Ingwaz", meaning: "gestación, potencial guardado que madura" },
  { glyph: "ᛞ", name: "Dagaz", meaning: "amanecer, claridad súbita, nuevo día" },
  { glyph: "ᛟ", name: "Othala", meaning: "herencia, hogar, lo que te pertenece", reversed: "desarraigo, pérdida de herencia" },
];

export function drawRunes(seed: string, count = 3): Rune[] {
  const rng = mulberry32(seedFrom(seed));
  const idx = [...RUNES.keys()];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, count).map((i) => {
    const r = RUNES[i];
    const reversed = rng() < 0.3;
    return {
      glyph: r.glyph,
      name: r.name,
      meaning: r.meaning,
      reversed,
      reversedMeaning: r.reversed,
    };
  });
}

// ---------- I Ching: hexagramas (6 líneas, yin/yang + móviles) ----------
export interface IChingLine { yang: boolean; moving: boolean }
export interface IChingResult {
  lines: IChingLine[]; // de abajo (índice 0) hacia arriba
  hexagramNumber: number;
  name: string;
  judgment: string;
  changedHexagramNumber?: number;
}

// Las 8 triadas básicas del Ba Gua
const TRIGRAMS = [
  { name: "Cielo", lines: [true, true, true] },
  { name: "Lago", lines: [true, true, false] },
  { name: "Fuego", lines: [true, false, true] },
  { name: "Trueno", lines: [true, false, false] },
  { name: "Viento", lines: [false, true, true] },
  { name: "Agua", lines: [false, true, false] },
  { name: "Montaña", lines: [false, false, true] },
  { name: "Tierra", lines: [false, false, false] },
];

// Los 64 hexagramas (secuencia King Wen) — clave "trigramaInferior-trigramaSuperior"
const HEX_NAMES: Record<string, { n: number; name: string; judgment: string }> = {
  "Cielo-Cielo": { n: 1, name: "Lo Creativo", judgment: "El momento pide acción firme y principios claros." },
  "Tierra-Tierra": { n: 2, name: "Lo Receptivo", judgment: "Rendite al flujo: sostener es también una fuerza." },
  "Trueno-Agua": { n: 3, name: "La Dificultad Inicial", judgment: "El comienzo es caótico; ordenate despacio." },
  "Agua-Montaña": { n: 4, name: "La Necedad Juvenil", judgment: "Aprendé preguntando; la humildad ilumina." },
  "Cielo-Agua": { n: 5, name: "La Espera", judgment: "No fuerces: lo tuyo llega si te mantenés firme." },
  "Agua-Cielo": { n: 6, name: "El Conflicto", judgment: "Buscá mediación, no victoria total." },
  "Agua-Tierra": { n: 7, name: "El Ejército", judgment: "Organizá tus recursos con disciplina." },
  "Tierra-Agua": { n: 8, name: "La Solidaridad", judgment: "Unite a los que comparten tu rumbo." },
  "Cielo-Viento": { n: 9, name: "El Poder de lo Pequeño", judgment: "Los pequeños cuidados frenan grandes males." },
  "Lago-Cielo": { n: 10, name: "El Paso", judgment: "Andá con cuidado: pisar la cola del tigre exige tacto." },
  "Cielo-Tierra": { n: 11, name: "La Paz", judgment: "Cielo y tierra conversan: tiempo fértil." },
  "Tierra-Cielo": { n: 12, name: "El Estancamiento", judgment: "La quietud también enseña. Revisate." },
  "Cielo-Fuego": { n: 13, name: "La Comunidad", judgment: "Lo compartido crece: buscá afinidad genuina." },
  "Fuego-Cielo": { n: 14, name: "La Gran Posesión", judgment: "Lo que tenés es mucho: usalo con generosidad." },
  "Montaña-Tierra": { n: 15, name: "La Modestia", judgment: "Lo genuino no necesita alarde." },
  "Tierra-Trueno": { n: 16, name: "El Entusiasmo", judgment: "La energía compartida contagia: conducila con ritmo." },
  "Trueno-Lago": { n: 17, name: "La Continuidad", judgment: "Seguir no es rendirse: elegí bien a qué te unís." },
  "Viento-Montaña": { n: 18, name: "La Reparación", judgment: "Lo descuidado pide trabajo honesto." },
  "Lago-Tierra": { n: 19, name: "La Aproximación", judgment: "Lo bueno se acerca: recibilo con apertura." },
  "Tierra-Viento": { n: 20, name: "La Contemplación", judgment: "Mirar desde lejos también es actuar." },
  "Trueno-Fuego": { n: 21, name: "La Mordedura", judgment: "Hay un obstáculo que morder: atravesalo decidida/o." },
  "Fuego-Montaña": { n: 22, name: "La Gracia", judgment: "La belleza adorna, pero el fondo sostiene." },
  "Tierra-Montaña": { n: 23, name: "La Desintegración", judgment: "Lo que cae, cae: no sostengas lo gastado." },
  "Trueno-Tierra": { n: 24, name: "El Retorno", judgment: "Lo esencial vuelve: abrí paso a lo nuevo." },
  "Trueno-Cielo": { n: 25, name: "La Inocencia", judgment: "Actuá sin segundas intenciones y lo correcto se ordena solo." },
  "Cielo-Montaña": { n: 26, name: "La Gran Acumulación", judgment: "Contené tu fuerza: el caudal guardado es poder." },
  "Trueno-Montaña": { n: 27, name: "La Nutrición", judgment: "Cuidá qué alimentás: palabras, hábitos, personas." },
  "Viento-Lago": { n: 28, name: "El Gran Exceso", judgment: "La viga se comba: actuá antes de que ceda." },
  "Agua-Agua": { n: 29, name: "Lo Abismal", judgment: "El agua siempre encuentra salida: fluí sin fingir." },
  "Fuego-Fuego": { n: 30, name: "Lo Adherente", judgment: "Tu luz necesita algo a qué adherirse: elegí bien." },
  "Montaña-Lago": { n: 31, name: "La Influencia", judgment: "La atracción mutua abre caminos: dejate conmover." },
  "Viento-Trueno": { n: 32, name: "La Duración", judgment: "Lo que perdura no se fuerza: se mantiene." },
  "Montaña-Cielo": { n: 33, name: "La Retirada", judgment: "Retirarse a tiempo también es ganar." },
  "Cielo-Trueno": { n: 34, name: "El Gran Poder", judgment: "Tenés fuerza de sobra: usala con justicia, no con impulso." },
  "Tierra-Fuego": { n: 35, name: "El Progreso", judgment: "Tu luz emerge: avanzá con claridad." },
  "Fuego-Tierra": { n: 36, name: "El Oscurecimiento de la Luz", judgment: "Cuidá tu luz interior en tiempos oscuros." },
  "Fuego-Viento": { n: 37, name: "La Familia", judgment: "El orden empieza en lo cercano: palabra y ejemplo." },
  "Lago-Fuego": { n: 38, name: "La Oposición", judgment: "Las diferencias también enseñan." },
  "Montaña-Agua": { n: 39, name: "La Obstrucción", judgment: "El paso está cerrado: pausá y buscá otro camino." },
  "Agua-Trueno": { n: 40, name: "La Liberación", judgment: "Lo que apretaba se suelta: soltá también vos." },
  "Lago-Montaña": { n: 41, name: "La Disminución", judgment: "Dar menos de lo accesorio agranda lo esencial." },
  "Trueno-Viento": { n: 42, name: "El Aumento", judgment: "Viento favorable: el momento expande lo que emprendas." },
  "Cielo-Lago": { n: 43, name: "La Resolución", judgment: "Decidí con firmeza y declaralo sin agresión." },
  "Viento-Cielo": { n: 44, name: "El Encuentro", judgment: "Algo poderoso se acerca: cuidá qué dejás entrar." },
  "Tierra-Lago": { n: 45, name: "La Reunión", judgment: "La gente se junta alrededor de un centro: sé ese centro." },
  "Viento-Tierra": { n: 46, name: "El Ascenso", judgment: "El crecimiento gradual llega lejos: subí paso a paso." },
  "Agua-Lago": { n: 47, name: "La Opresión", judgment: "La sequía prueba lo que sos: tu palabra sigue valiendo." },
  "Viento-Agua": { n: 48, name: "El Pozo", judgment: "Lo profundo sigue ahí: cambiá el cubo, no la fuente." },
  "Fuego-Lago": { n: 49, name: "La Revolución", judgment: "El cambio llegó: acompañalo o te arrastra." },
  "Viento-Fuego": { n: 50, name: "El Caldero", judgment: "Lo crudo se transforma: cociná tu experiencia." },

  "Trueno-Trueno": { n: 51, name: "Lo Conmovedor", judgment: "El susto despierta: después del trueno, calma." },
  "Montaña-Montaña": { n: 52, name: "La Quietud", judgment: "Quieto por fuera, quieto por dentro: el descanso es sabio." },
  "Montaña-Viento": { n: 53, name: "El Desarrollo Gradual", judgment: "Como el árbol en la montaña: crece lento pero dura." },
  "Lago-Trueno": { n: 54, name: "La Doncella", judgment: "No todas las uniones son iguales: mirá tu lugar real." },
  "Fuego-Trueno": { n: 55, name: "La Abundancia", judgment: "El sol al mediodía: brilla ahora, que no dura siempre." },
  "Montaña-Fuego": { n: 56, name: "El Viajero", judgment: "De paso por tierra extraña: poco equipaje, mucha atención." },
  "Viento-Viento": { n: 57, name: "Lo Suave", judgment: "El viento penetra sin romperse: insistí con suavidad." },
  "Lago-Lago": { n: 58, name: "Lo Alegre", judgment: "La alegría compartida se duplica: celebrá con los tuyos." },
  "Agua-Viento": { n: 59, name: "La Dispersión", judgment: "Lo que se dispersa puede reunirse de otro modo." },
  "Lago-Agua": { n: 60, name: "La Limitación", judgment: "Los límites sanos protegen: poné bordes sin culpa." },
  "Lago-Viento": { n: 61, name: "La Verdad Interior", judgment: "Lo que sentís por dentro se nota por fuera: sé genuina/o." },
  "Montaña-Trueno": { n: 62, name: "El Pequeño Exceso", judgment: "Pájaro que vuela bajo: modestia en los gestos chicos." },
  "Fuego-Agua": { n: 63, name: "La Perfección", judgment: "Todo en su lugar: cuidá lo que ya lograste." },
  "Agua-Fuego": { n: 64, name: "Antes del Completamiento", judgment: "Casi llegás: no festejes antes de cruzar el río." },
};

export function drawIChing(seed: string): IChingResult {
  const rng = mulberry32(seedFrom(seed));
  // Método de 3 monedas por línea: 6=yin viejo, 7=yang, 8=yin, 9=yang viejo
  const throws = Array.from({ length: 6 }, () => {
    const coins = [0, 0, 0].map(() => (rng() < 0.5 ? 2 : 3));
    const sum = coins[0] + coins[1] + coins[2];
    return { yang: sum === 7 || sum === 9, moving: sum === 6 || sum === 9 };
  });
  const lower = throws.slice(0, 3).map((l) => l.yang);
  const upper = throws.slice(3, 6).map((l) => l.yang);
  const lowerName = trigramName(lower);
  const upperName = trigramName(upper);
  const hex = HEX_NAMES[`${lowerName}-${upperName}`] ?? {
    n: ((lowerName.charCodeAt(0) + upperName.charCodeAt(0)) % 64) + 1,
    name: `${upperName} sobre ${lowerName}`,
    judgment: "Dos fuerzas se combinan: leé la situación como diálogo entre ellas.",
  };
  const moving = throws.filter((l) => l.moving).length;
  // Hexagrama derivado: voltear las líneas móviles y buscar el hexagrama resultante
  let changedHexagramNumber: number | undefined;
  if (moving > 0) {
    const flipped = throws.map((l) => (l.moving ? !l.yang : l.yang));
    const cl = trigramName(flipped.slice(0, 3));
    const cu = trigramName(flipped.slice(3, 6));
    changedHexagramNumber = HEX_NAMES[`${cl}-${cu}`]?.n;
  }
  return {
    lines: throws,
    hexagramNumber: hex.n,
    name: hex.name,
    judgment: hex.judgment,
    changedHexagramNumber,
  };
}

function trigramName(lines: boolean[]): string {
  return TRIGRAMS.find((t) => t.lines.every((v, i) => v === lines[i]))?.name ?? "Tierra";
}

// ---------- Registros akáshicos ----------
export interface AkashicResult {
  hall: string;      // sala del registro que se abre
  symbol: string;    // símbolo central encontrado
  fragment: string;  // fragmento del registro (texto simbólico)
  theme: string;     // tema que atraviesa tu camino ahora
}

const AKASHIC_HALLS = [
  "El atrio de los orígenes",
  "La galería de los pactos",
  "La sala de los hilos dorados",
  "El archivo de las mareas",
  "El corredor de las puertas gemelas",
  "La capilla de los nombres",
];

const AKASHIC_SYMBOLS = [
  { symbol: "Una llave de bronce", theme: "apertura — algo que estaba cerrado empieza a ceder" },
  { symbol: "Un espejo empañado", theme: "identidad — lo que buscás afuera primero se ordena adentro" },
  { symbol: "Un hilo rojo anudado", theme: "vínculos — una conexión marcada pide ser revisada" },
  { symbol: "Una semilla partida", theme: "proyectos — algo que plantaste ya germinó en silencio" },
  { symbol: "Una escalera en espiral", theme: "aprendizaje — repetís el patrón en una vuelta más alta" },
  { symbol: "Un recipiente de agua tibia", theme: "emociones — lo que cargás necesita contención, no respuesta" },
  { symbol: "Un pájaro con carta", theme: "mensajes — una noticia o señal está en camino" },
  { symbol: "Una puerta entreabierta", theme: "transición — estás entre dos etapas; no fuerces el cierre" },
];

const AKASHIC_FRAGMENTS = [
  "«En este capítulo de tu camino, lo que parecía pérdida era espacio haciéndose.»",
  "«Tu nombre aparece escrito muchas veces acá: siempre la misma búsqueda, distintos escenarios.»",
  "«La página está húmeda, como recién escrita. Algo de hoy todavía se está decidiendo.»",
  "«Hay un margen de tu historia que casi no leés. Ahí está lo que pediste.»",
  "«El registro se abre solo en la página donde dudás: señal de que ya sabés la respuesta.»",
  "«Entre líneas se lee una promesa que te hiciste hace tiempo y aún está pendiente.»",
  "«La tinta se aclara en este punto: el próximo tramo es más liviano que el anterior.»",
  "«El libro no muestra el final, pero sí la dirección: lo que buscás está más cerca de lo que pensás.»",
];

/** Sorteo akáshico: sala + símbolo + fragmento del registro. */
export function drawAkashic(seed: string): AkashicResult {
  const rng = mulberry32(seedFrom(seed));
  const hall = AKASHIC_HALLS[Math.floor(rng() * AKASHIC_HALLS.length)];
  const s = AKASHIC_SYMBOLS[Math.floor(rng() * AKASHIC_SYMBOLS.length)];
  const fragment = AKASHIC_FRAGMENTS[Math.floor(rng() * AKASHIC_FRAGMENTS.length)];
  return { hall, symbol: s.symbol, fragment, theme: s.theme };
}
