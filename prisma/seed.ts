/**
 * Seed ALMA LIMPIA — categorías, servicios, mazo Rider-Waite (78), prompts, admin.
 * Uso: npx tsx prisma/seed.ts   (o npm run db:seed)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------- 6 universos ----------
const CATEGORIES = [
  { slug: "oraculo", name: "El Oráculo", tagline: "Tarot, oráculos y símbolos", icon: "moon", order: 1 },
  { slug: "universo", name: "El Universo", tagline: "Astrología y tu carta natal", icon: "star", order: 2 },
  { slug: "alma", name: "El Alma", tagline: "Propósito, registros y evolución", icon: "flame", order: 3 },
  { slug: "energia", name: "La Energía", tagline: "Chakras, aura y armonización", icon: "sparkles", order: 4 },
  { slug: "vinculos", name: "Los Vínculos", tagline: "Amor, compatibilidad y cierres", icon: "heart", order: 5 },
  { slug: "rituales", name: "Los Rituales", tagline: "Lunas, intenciones y sueños", icon: "moon-star", order: 6 },
];

// ---------- Servicios (kind: CHAT | TAROT | NATAL | NUMEROLOGY | RITUAL | TEST | READING) ----------
type Svc = {
  slug: string; name: string; shortDesc?: string; kind: string;
  priceArs?: number; creditsCost?: number; freeDaily?: boolean; order?: number;
  engineConfig?: Record<string, unknown>;
};

const SERVICES: Record<string, Svc[]> = {
  oraculo: [
    { slug: "tarot-personalizado", name: "Tarot personalizado", shortDesc: "Lectura profunda a tu medida", kind: "TAROT", priceArs: 15000, order: 1,
      engineConfig: { spread: "three", questions: ["¿Qué es lo que más te está inquietando últimamente?", "¿Hay alguna decisión o situación puntual que quieras mirar?"] } },
    { slug: "tarot-del-amor", name: "Tarot del amor", shortDesc: "Vínculos, sentimientos y caminos", kind: "TAROT", priceArs: 15000, order: 2,
      engineConfig: { spread: "three", theme: "amor" } },
    { slug: "tarot-laboral", name: "Tarot laboral", shortDesc: "Trabajo, proyectos y vocación", kind: "TAROT", priceArs: 15000, order: 3,
      engineConfig: { spread: "three", theme: "trabajo" } },
    { slug: "tarot-del-dia", name: "Tarot del día", shortDesc: "Una carta para tu día", kind: "TAROT", freeDaily: true, order: 4,
      engineConfig: { spread: "one" } },
    { slug: "tirada-tres-cartas", name: "Tirada de tres cartas", shortDesc: "Pasado, presente, tendencia", kind: "TAROT", priceArs: 15000, order: 5,
      engineConfig: { spread: "three" } },
    { slug: "tirada-cinco-cartas", name: "Tirada de cinco cartas", shortDesc: "Panorama ampliado", kind: "TAROT", priceArs: 15000, order: 6,
      engineConfig: { spread: "five" } },
    { slug: "cruz-celta", name: "Cruz celta", shortDesc: "La lectura más completa", kind: "TAROT", priceArs: 20000, order: 7,
      engineConfig: { spread: "celtic" } },
    { slug: "oraculo-angelical", name: "Oráculo angelical", shortDesc: "Mensajes suaves y guía", kind: "READING", priceArs: 15000, order: 8 },
    { slug: "oraculo-lunar", name: "Oráculo lunar", shortDesc: "Tu momento según la luna", kind: "READING", freeDaily: true, order: 9 },
    { slug: "oraculo-de-diosas", name: "Oráculo de diosas", shortDesc: "Arquetipos femeninos", kind: "READING", priceArs: 15000, order: 10 },
    { slug: "runas-nordicas", name: "Runas nórdicas", shortDesc: "Sabiduría ancestral", kind: "READING", priceArs: 15000, order: 11 },
    { slug: "i-ching", name: "I Ching", shortDesc: "El libro de las mutaciones", kind: "READING", priceArs: 15000, order: 12 },
    { slug: "pendulo-virtual", name: "Péndulo virtual", shortDesc: "Respuestas sí/no simbólicas", kind: "READING", freeDaily: true, order: 13 },
    { slug: "tarot-financiero", name: "Tarot financiero simbólico", shortDesc: "Recursos, decisiones y abundancia", kind: "TAROT", priceArs: 15000, order: 14,
      engineConfig: { spread: "three", theme: "finanzas" } },
    { slug: "tarot-de-decisiones", name: "Tarot de decisiones", shortDesc: "Dos caminos, una lectura", kind: "TAROT", priceArs: 15000, order: 15,
      engineConfig: { spread: "three", theme: "decisiones" } },
    { slug: "tirada-siete-cartas", name: "Tirada de siete cartas", shortDesc: "Panorama profundo en 7 posiciones", kind: "TAROT", priceArs: 20000, order: 16,
      engineConfig: { spread: "seven" } },
    { slug: "tarot-de-marsella", name: "Tarot de Marsella", shortDesc: "La tradición clásica europea", kind: "TAROT", priceArs: 15000, order: 17,
      engineConfig: { spread: "three", deck: "marsella" } },
    { slug: "oraculo-de-animales", name: "Oráculo de animales", shortDesc: "Tu guía animal del momento", kind: "READING", priceArs: 15000, order: 18 },
    { slug: "cartas-espanolas", name: "Cartas españolas", shortDesc: "La baraja tradicional", kind: "TAROT", priceArs: 15000, order: 19,
      engineConfig: { spread: "three", deck: "spanish" } },
    { slug: "lenormand", name: "Lenormand", shortDesc: "Símbolos cotidianos, respuestas concretas", kind: "READING", priceArs: 15000, order: 20 },
    { slug: "bibliomancia", name: "Bibliomancia", shortDesc: "Un pasaje como espejo", kind: "READING", priceArs: 15000, order: 21 },
    { slug: "geomancia", name: "Geomancia", shortDesc: "Figuras de tierra y puntos", kind: "READING", priceArs: 15000, order: 22 },
    { slug: "lectura-de-te", name: "Lectura de hojas de té", shortDesc: "Símbolos en la taza", kind: "READING", priceArs: 15000, order: 23 },
  ],
  universo: [
    { slug: "carta-natal", name: "Carta natal", shortDesc: "Tu mapa del cielo al nacer", kind: "NATAL", priceArs: 20000, order: 1 },
    { slug: "sol-luna-ascendente", name: "Sol, Luna y Ascendente", shortDesc: "Tu tríada esencial", kind: "NATAL", priceArs: 15000, order: 2 },
    { slug: "horoscopo-diario", name: "Horóscopo diario", shortDesc: "Tu cielo de hoy", kind: "READING", freeDaily: true, order: 3 },
    { slug: "transitos", name: "Tránsitos planetarios", shortDesc: "Qué se mueve en tu cielo", kind: "NATAL", priceArs: 15000, order: 4 },
    { slug: "revolucion-solar", name: "Revolución solar", shortDesc: "Tu año en astrología", kind: "NATAL", priceArs: 20000, order: 5 },
    { slug: "sinastria", name: "Sinastría", shortDesc: "Dos cartas, un vínculo", kind: "NATAL", priceArs: 20000, order: 6 },
    { slug: "compatibilidad-zodiacal", name: "Compatibilidad zodiacal", shortDesc: "Química entre signos", kind: "READING", priceArs: 15000, order: 7 },
    { slug: "calendario-astrologico", name: "Calendario astrológico", shortDesc: "Tus fechas potentes", kind: "READING", priceArs: 15000, order: 8 },
    { slug: "doce-casas", name: "Las doce casas", shortDesc: "Los escenarios de tu vida", kind: "NATAL", priceArs: 15000, order: 9 },
    { slug: "aspectos-planetarios", name: "Aspectos planetarios", shortDesc: "Diálogos entre tus planetas", kind: "NATAL", priceArs: 15000, order: 10 },
    { slug: "retorno-de-saturno", name: "Retorno de Saturno", shortDesc: "El gran ciclo de maduración", kind: "NATAL", priceArs: 15000, order: 11 },
    { slug: "carta-infantil", name: "Carta astral infantil", shortDesc: "El cielo de los más chicos", kind: "NATAL", priceArs: 15000, order: 12 },
    { slug: "horoscopo-semanal", name: "Horóscopo semanal", shortDesc: "Tu semana en el cielo", kind: "READING", freeDaily: true, order: 13 },
    { slug: "horoscopo-mensual", name: "Horóscopo mensual", shortDesc: "El mes según tus astros", kind: "READING", priceArs: 15000, order: 14 },
  ],
  alma: [
    { slug: "registros-akashicos", name: "Registros akáshicos", shortDesc: "Narrativa simbólica de tu alma", kind: "READING", priceArs: 20000, order: 1,
      engineConfig: { narrative: true } },
    { slug: "proposito-del-alma", name: "Propósito del alma", shortDesc: "Para qué viniste", kind: "CHAT", priceArs: 20000, order: 2 },
    { slug: "vidas-pasadas", name: "Vidas pasadas", shortDesc: "Historias como espejo", kind: "READING", priceArs: 20000, order: 3 },
    { slug: "patrones-karmicos", name: "Patrones kármicos", shortDesc: "Lo que se repite y por qué", kind: "CHAT", priceArs: 20000, order: 4 },
    { slug: "mensajes-de-sabiduria", name: "Mensajes de sabiduría", shortDesc: "Tu voz interior, escrita", kind: "READING", freeDaily: true, order: 5 },
    { slug: "contratos-del-alma", name: "Contratos del alma", shortDesc: "Acuerdos simbólicos antes de nacer", kind: "READING", priceArs: 15000, order: 6 },
    { slug: "conexiones-de-almas", name: "Conexiones de almas", shortDesc: "Vínculos que trascienden", kind: "CHAT", priceArs: 20000, order: 7 },
    { slug: "aprendizajes-espirituales", name: "Aprendizajes espirituales", shortDesc: "Lo que tu alma practica", kind: "CHAT", priceArs: 20000, order: 8 },
    { slug: "camino-de-evolucion", name: "Camino de evolución", shortDesc: "Tu proceso de crecimiento", kind: "READING", priceArs: 15000, order: 9 },
  ],
  energia: [
    { slug: "test-chakras", name: "Test de chakras", shortDesc: "Tu equilibrio energético hoy", kind: "TEST", freeDaily: true, order: 1 },
    { slug: "interpretacion-aura", name: "Tu aura hoy", shortDesc: "Una lectura de tu energía", kind: "READING", priceArs: 15000, order: 2 },
    { slug: "armonizacion-guiada", name: "Armonización guiada", shortDesc: "Audio-visual de equilibrio", kind: "READING", priceArs: 15000, order: 3 },
    { slug: "meditacion-guiada", name: "Meditación guiada", shortDesc: "Pausa y respiración", kind: "READING", freeDaily: true, order: 4 },
    { slug: "afirmaciones", name: "Afirmaciones", shortDesc: "Palabras que sostienen", kind: "READING", freeDaily: true, order: 5 },
    { slug: "respiracion-consciente", name: "Respiración consciente", shortDesc: "Técnicas guiadas", kind: "READING", freeDaily: true, order: 6 },
    { slug: "exploracion-chakras", name: "Los siete chakras", shortDesc: "Recorrido guiado por tu energía", kind: "TEST", freeDaily: true, order: 7 },
    { slug: "introduccion-reiki", name: "Introducción al Reiki", shortDesc: "Sanación energética", kind: "READING", priceArs: 15000, order: 8 },
    { slug: "limpieza-energetica", name: "Limpieza energética", shortDesc: "Soltar lo que pesa", kind: "READING", priceArs: 15000, order: 9 },
    { slug: "proteccion-energetica", name: "Protección energética", shortDesc: "Visualización de cuidado", kind: "READING", priceArs: 15000, order: 10 },
    { slug: "cuatro-elementos", name: "Los cuatro elementos", shortDesc: "Tierra, agua, fuego y aire en vos", kind: "READING", priceArs: 15000, order: 11 },
    { slug: "visualizacion-positiva", name: "Visualización positiva", shortDesc: "Imaginar para crear", kind: "READING", freeDaily: true, order: 12 },
  ],
  vinculos: [
    { slug: "tarot-del-amor-v", name: "Tarot del amor", shortDesc: "Desde el universo de vínculos", kind: "TAROT", priceArs: 15000, order: 1,
      engineConfig: { spread: "three", theme: "amor" } },
    { slug: "compatibilidad-astrologica", name: "Compatibilidad astrológica", shortDesc: "Dos cielos en diálogo", kind: "READING", priceArs: 15000, order: 2 },
    { slug: "compatibilidad-numerologica", name: "Compatibilidad numerológica", shortDesc: "Los números del vínculo", kind: "NUMEROLOGY", priceArs: 15000, order: 3 },
    { slug: "cierre-de-ciclos", name: "Cierre de ciclos", shortDesc: "Soltar con sentido", kind: "CHAT", priceArs: 20000, order: 4 },
    { slug: "amor-propio", name: "Amor propio", shortDesc: "El vínculo con vos", kind: "CHAT", priceArs: 20000, order: 5 },
    { slug: "diario-emocional", name: "Diario emocional", shortDesc: "Espacio de escritura", kind: "READING", freeDaily: true, order: 6 },
    { slug: "almas-gemelas", name: "Almas gemelas", shortDesc: "El concepto espiritual", kind: "READING", priceArs: 15000, order: 7 },
    { slug: "llamas-gemelas", name: "Llamas gemelas", shortDesc: "La tradición simbólica", kind: "READING", priceArs: 15000, order: 8 },
    { slug: "patrones-de-relaciones", name: "Patrones de relaciones", shortDesc: "Lo que repetís en el amor", kind: "CHAT", priceArs: 20000, order: 9 },
    { slug: "decisiones-sentimentales", name: "Decisiones sentimentales", shortDesc: "Claridad para el corazón", kind: "CHAT", priceArs: 20000, order: 10 },
    { slug: "acompanamiento-rupturas", name: "Acompañamiento en rupturas", shortDesc: "Sostén para transitar", kind: "CHAT", priceArs: 20000, order: 11 },
    { slug: "ejercicios-autoconocimiento", name: "Ejercicios de autoconocimiento", shortDesc: "Prácticas para conocerte", kind: "READING", freeDaily: true, order: 12 },
  ],
  rituales: [
    { slug: "ritual-luna-nueva", name: "Ritual de luna nueva", shortDesc: "Sembrar intenciones", kind: "RITUAL", priceArs: 15000, order: 1 },
    { slug: "ritual-luna-llena", name: "Ritual de luna llena", shortDesc: "Soltar y agradecer", kind: "RITUAL", priceArs: 15000, order: 2 },
    { slug: "ritual-gratitud", name: "Ritual de gratitud", shortDesc: "Una pausa luminosa", kind: "RITUAL", freeDaily: true, order: 3 },
    { slug: "interpretacion-suenos", name: "Interpretación de sueños", shortDesc: "Qué te dice tu noche", kind: "CHAT", priceArs: 20000, order: 4 },
    { slug: "diario-de-suenos", name: "Diario de sueños", shortDesc: "Registrá tus noches", kind: "READING", freeDaily: true, order: 5 },
    { slug: "cristales", name: "Cristales y simbolismos", shortDesc: "Guía de piedras", kind: "READING", priceArs: 15000, order: 6 },
    { slug: "animales-de-poder", name: "Animales de poder", shortDesc: "Tu aliado simbólico", kind: "READING", priceArs: 15000, order: 7 },
    { slug: "ritual-abundancia", name: "Ritual de abundancia", shortDesc: "Abrir caminos simbólicos", kind: "RITUAL", priceArs: 15000, order: 8 },
    { slug: "limpieza-de-espacios", name: "Limpieza de espacios", shortDesc: "Renovar tu hogar", kind: "RITUAL", priceArs: 15000, order: 9 },
    { slug: "cierre-de-etapas", name: "Cierre de etapas", shortDesc: "Despedir con ritual", kind: "RITUAL", priceArs: 15000, order: 10 },
    { slug: "manifestacion-objetivos", name: "Manifestación y objetivos", shortDesc: "Sembrar lo que querés", kind: "RITUAL", priceArs: 15000, order: 11 },
    { slug: "ritual-con-velas", name: "Ritual con velas", shortDesc: "Luz e intención", kind: "RITUAL", priceArs: 15000, order: 12 },
    { slug: "diario-de-manifestacion", name: "Diario de manifestación", shortDesc: "Escribí tu futuro", kind: "READING", freeDaily: true, order: 13 },
    { slug: "arquetipos-de-jung", name: "Arquetipos de Jung", shortDesc: "Los personajes de tu psique", kind: "READING", priceArs: 15000, order: 14 },
    { slug: "sincronicidades", name: "Sincronicidades", shortDesc: "Casualidades con sentido", kind: "CHAT", priceArs: 20000, order: 15 },
  ],
};

// ---------- Rider-Waite: 78 cartas ----------
const MAJORS = [
  "El Loco", "El Mago", "La Sacerdotisa", "La Emperatriz", "El Emperador",
  "El Hierofante", "Los Enamorados", "El Carro", "La Fuerza", "El Ermitaño",
  "La Rueda de la Fortuna", "La Justicia", "El Colgado", "La Muerte", "La Templanza",
  "El Diablo", "La Torre", "La Estrella", "La Luna", "El Sol",
  "El Juicio", "El Mundo",
];
const MAJOR_KEYS: Record<string, [string, string]> = {
  "El Loco": ["comienzos, libertad, salto de fe", "imprudencia, miedo al vacío"],
  "El Mago": ["voluntad, recursos, manifestación", "dispersión, truco, potencial sin usar"],
  "La Sacerdotisa": ["intuición, misterio, voz interior", "secretos, desconexión de la intuición"],
  "La Emperatriz": ["abundancia, cuidado, creatividad", "dependencia, bloqueo creativo"],
  "El Emperador": ["estructura, autoridad, orden", "rigidez, control excesivo"],
  "El Hierofante": ["tradición, guía, aprendizaje", "dogma, rebeldía"],
  "Los Enamorados": ["amor, elección, unión", "desalineación, decisión difícil"],
  "El Carro": ["avance, determinación, victoria", "falta de dirección, fuerza bruta"],
  "La Fuerza": ["coraje suave, paciencia, dominio interior", "inseguridad, impulso"],
  "El Ermitaño": ["introspección, búsqueda, guía interna", "aislamiento, soledad"],
  "La Rueda de la Fortuna": ["ciclos, destino, cambio", "resistencia al cambio, mala racha"],
  "La Justicia": ["verdad, equilibrio, consecuencias", "injusticia, deshonestidad"],
  "El Colgado": ["pausa, nueva perspectiva, entrega", "estancamiento, sacrificio inútil"],
  "La Muerte": ["transformación, fin de ciclo, renacimiento", "resistencia a soltar"],
  "La Templanza": ["equilibrio, alquimia, moderación", "exceso, desequilibrio"],
  "El Diablo": ["apegos, sombra, ataduras", "liberación, tomar conciencia"],
  "La Torre": ["caída de estructuras, revelación", "crisis evitable, miedo al cambio"],
  "La Estrella": ["esperanza, guía, renovación", "desánimo, fe perdida"],
  "La Luna": ["intuición, sueños, lo oculto", "confusión, miedos, engaño"],
  "El Sol": ["alegría, claridad, vitalidad", "optimismo nublado, ego"],
  "El Juicio": ["llamado, renovación, perdón", "autocrítica, negación del llamado"],
  "El Mundo": ["cierre, logro, integración", "ciclo incompleto, freno"],
};
const SUITS = [
  { key: "wands", name: "Bastos", theme: "acción, pasión y creatividad" },
  { key: "cups", name: "Copas", theme: "emociones, vínculos e intuición" },
  { key: "swords", name: "Espadas", theme: "mente, verdad y decisiones" },
  { key: "pentacles", name: "Oros", theme: "cuerpo, trabajo y abundancia" },
];
const RANKS = [
  { n: 1, name: "As de" }, { n: 2, name: "Dos de" }, { n: 3, name: "Tres de" },
  { n: 4, name: "Cuatro de" }, { n: 5, name: "Cinco de" }, { n: 6, name: "Seis de" },
  { n: 7, name: "Siete de" }, { n: 8, name: "Ocho de" }, { n: 9, name: "Nueve de" },
  { n: 10, name: "Diez de" }, { n: 11, name: "Sota de" }, { n: 12, name: "Caballo de" },
  { n: 13, name: "Reina de" }, { n: 14, name: "Rey de" },
];

// ---------- Mazos alternativos ----------
const MARSELLA_MAJORS = [
  "Le Mat", "Le Bateleur", "La Papesse", "L'Impératrice", "L'Empereur",
  "Le Pape", "L'Amoureux", "Le Chariot", "La Force", "L'Ermite",
  "La Roue de Fortune", "La Justice", "Le Pendu", "L'Arcane sans nom", "Tempérance",
  "Le Diable", "La Maison Dieu", "L'Étoile", "La Lune", "Le Soleil",
  "Le Jugement", "Le Monde",
];
const MARSELLA_SUITS = [
  { key: "batons", name: "Bâtons", theme: "acción y creatividad" },
  { key: "coupes", name: "Coupes", theme: "emociones y vínculos" },
  { key: "epees", name: "Épées", theme: "mente y decisiones" },
  { key: "deniers", name: "Deniers", theme: "cuerpo y abundancia" },
];
const MARSELLA_RANKS = [
  { n: 1, name: "As de" }, { n: 2, name: "2 de" }, { n: 3, name: "3 de" },
  { n: 4, name: "4 de" }, { n: 5, name: "5 de" }, { n: 6, name: "6 de" },
  { n: 7, name: "7 de" }, { n: 8, name: "8 de" }, { n: 9, name: "9 de" },
  { n: 10, name: "10 de" }, { n: 11, name: "Valet de" }, { n: 12, name: "Cavalier de" },
  { n: 13, name: "Reine de" }, { n: 14, name: "Roi de" },
];

// Baraja española: 4 palos × 12 cartas (sin 8 ni 9, con Sota/Caballo/Rey)
const SPANISH_SUITS = [
  { key: "oros", name: "Oros", theme: "dinero, trabajo y lo material" },
  { key: "copas", name: "Copas", theme: "amor, emociones y hogar" },
  { key: "espadas", name: "Espadas", theme: "conflictos, mente y decisiones" },
  { key: "bastos", name: "Bastos", theme: "acción, suerte y proyectos" },
];
const SPANISH_RANKS = [
  { n: 1, name: "As de" }, { n: 2, name: "Dos de" }, { n: 3, name: "Tres de" },
  { n: 4, name: "Cuatro de" }, { n: 5, name: "Cinco de" }, { n: 6, name: "Seis de" },
  { n: 7, name: "Siete de" }, { n: 10, name: "Sota de" }, { n: 11, name: "Caballo de" },
  { n: 12, name: "Rey de" },
];

// ---------- Rituales con contenido ----------
const RITUALS = [
  {
    slug: "ritual-luna-nueva", name: "Ritual de luna nueva", category: "luna_nueva", durationMin: 20,
    description: "La luna nueva es un cielo en blanco: el momento tradicional de sembrar intenciones.",
    steps: [
      { t: "Preparación", d: "Buscá un lugar tranquilo. Tené a mano papel y lapicera, y si querés, una vela blanca o un vaso con agua." },
      { t: "Limpieza simbólica", d: "Respirá hondo 3 veces. Con cada exhalación, imaginá que soltás el mes que pasó." },
      { t: "Escritura de intenciones", d: "Escribí entre 1 y 3 intenciones en tiempo presente, como si ya fueran reales: 'Estoy construyendo…', 'Me relaciono con…'." },
      { t: "Visualización", d: "Cerrá los ojos un minuto. Imaginá cada intención ya cumplida y quedate con la sensación corporal que genera." },
      { t: "Cierre", d: "Guardá el papel en un lugar visible o doblado junto a algo que uses todos los días. La intención se revisita en la próxima luna llena." },
    ],
    safeVariant: { nota: "Podés hacer todo el ritual sin vela: el agua o una lamparita cálida cumplen la misma función simbólica." },
  },
  {
    slug: "ritual-luna-llena", name: "Ritual de luna llena", category: "luna_llena", durationMin: 20,
    description: "La luna llena ilumina lo que ya maduró: momento de agradecer y soltar.",
    steps: [
      { t: "Preparación", d: "De noche, si podés, mirá la luna aunque sea por la ventana. Tené dos papelitos." },
      { t: "Balance", d: "En el primer papel escribí 3 cosas que agradecés del último ciclo." },
      { t: "Soltar", d: "En el segundo, escribí lo que querés dejar ir: un hábito, una idea sobre vos, una discusión pendiente." },
      { t: "Gestualidad", d: "Rasgá o tachá el segundo papel mientras decís en voz baja: 'Esto ya cumplió su ciclo'." },
      { t: "Cierre", d: "Leé el papel de gratitud una vez más y guardalo. El otro, desechalo." },
    ],
    safeVariant: { nota: "Sin fuego: en vez de quemar el papel de lo que soltás, podés rasgarlo o escribirlo y borrarlo." },
  },
  {
    slug: "ritual-gratitud", name: "Ritual de gratitud", category: "gratitud", durationMin: 10,
    description: "Una pausa diaria para registrar lo que ya está bien.",
    steps: [
      { t: "Pausa", d: "Sentate cómoda/o. Un minuto de respiración tranquila." },
      { t: "Registro", d: "Escribí 3 cosas concretas por las que hoy sentís gratitud. Vale lo pequeño: un mate, un mensaje, el sol." },
      { t: "Cuerpo", d: "Releé la lista despacio. Notá dónde se siente la gratitud en el cuerpo." },
      { t: "Cierre", d: "Elegí una de las tres y decite por qué importa. Listo." },
    ],
    safeVariant: {},
  },
  {
    slug: "ritual-abundancia", name: "Ritual de abundancia", category: "manifestacion", durationMin: 15,
    description: "Un ritual simbólico para trabajar la relación con lo que recibís y lo que das.",
    steps: [
      { t: "Preparación", d: "Tené un recipiente vacío (un frasco, un cuenco) y algo que represente semillas: arroz, lentejas o semillas reales." },
      { t: "Reflexión", d: "Pensá: ¿en qué área sentís escasez? ¿Dónde ya hay abundancia que no estás viendo?" },
      { t: "Siembra simbólica", d: "Poné las semillas en el recipiente una por una. Con cada una, nombrá algo que ya tenés y valorás." },
      { t: "Intención", d: "Escribí una acción concreta de esta semana que acerque más abundancia (ordenar cuentas, pedir ayuda, ofrecer algo)." },
      { t: "Cierre", d: "Dejá el recipiente a la vista una semana. La abundancia también es práctica." },
    ],
    safeVariant: {},
  },
  {
    slug: "limpieza-de-espacios", name: "Limpieza de espacios", category: "limpieza", durationMin: 30,
    description: "Renovar la energía de un ambiente a través de la limpieza intencionada.",
    steps: [
      { t: "Preparación", d: "Elegí UN espacio acotado: un cajón, un estante, la mesita de luz. No la casa entera." },
      { t: "Vaciado", d: "Sacá todo. Mientras lo hacés, pensá qué de eso todavía te representa." },
      { t: "Limpieza", d: "Limpiá la superficie. Si querés, agregá al agua unas gotas de aceite esencial o un chorrito de vinagre." },
      { t: "Devolución", d: "Volvé a poner solo lo que querés cerca. Lo demás: regalar, descartar, reubicar." },
      { t: "Cierre", d: "Abrí una ventana dos minutos. Decite: 'Este espacio también soy yo'." },
    ],
    safeVariant: {},
  },
  {
    slug: "cierre-de-etapas", name: "Cierre de etapas", category: "cierre", durationMin: 25,
    description: "Un ritual para despedir algo que terminó: una relación, un trabajo, una época.",
    steps: [
      { t: "Preparación", d: "Buscá un objeto pequeño que represente lo que cierra (una foto, un papel, algo simbólico)." },
      { t: "Carta de despedida", d: "Escribí una carta corta: qué te llevás, qué agradecés, qué no querés repetir." },
      { t: "Lectura", d: "Leela en voz alta o mentalmente, despacio." },
      { t: "Despedida", d: "Guardá la carta, rasgala o deshacete del objeto simbólico. Vos elegís el gesto." },
      { t: "Umbral", d: "Cruzá una puerta o caminá unos pasos diciendo: 'Esto quedó atrás. Ahora sigo yo'." },
    ],
    safeVariant: {},
  },
  {
    slug: "manifestacion-objetivos", name: "Manifestación y objetivos", category: "manifestacion", durationMin: 20,
    description: "Convertir un deseo en un objetivo con pasos: la manifestación como foco, no como magia.",
    steps: [
      { t: "Deseo", d: "Escribí un deseo en una oración." },
      { t: "Traducción", d: "Reescribilo como objetivo: concreto, medible y que dependa de vos." },
      { t: "Visualización", d: "Cerrá los ojos e imaginá el momento en que ya está cumplido. Un minuto." },
      { t: "Primer paso", d: "Anotá la acción más chica que podés hacer ESTA semana. Agendala." },
      { t: "Cierre", d: "Guardá el papel donde lo veas. La manifestación trabaja junto a la acción." },
    ],
    safeVariant: {},
  },
  {
    slug: "ritual-con-velas", name: "Ritual con velas", category: "luz", durationMin: 15,
    description: "La llama como punto de foco para una intención. Con alternativa sin fuego.",
    steps: [
      { t: "Preparación", d: "Una vela sobre superficie segura, lejos de cortinas y papeles. Alternativa: una lamparita cálida o la linterna del celu sobre un vaso." },
      { t: "Encendido", d: "Al encenderla, nombrá tu intención en una frase." },
      { t: "Contemplación", d: "Mirá la llama 2-3 minutos sin hacer nada más. Si la mente divaga, volvé a la luz." },
      { t: "Escritura", d: "Anotá lo que surgió: una imagen, una palabra, una idea." },
      { t: "Cierre", d: "Apagá la vela sin soplarla (con un apagavelas o ahogándola) o simplemente apagá la luz, agradeciendo el momento." },
    ],
    safeVariant: { nota: "Sin fuego: una lamparita, la linterna del celular o una vela LED funcionan igual de bien como foco simbólico." },
  },
];

// ---------- Prompts base por kind ----------
const BASE_SYSTEM = `Sos la guía espiritual de ALMA LIMPIA, una plataforma de autoconocimiento.
Hablás en español rioplatense natural, cálido y cercano — voseás (vos, contame, sentís) sin exagerar.
Escuchás, preguntás, interpretás y acompañás. No das diagnósticos ni promesas.
No afirmás ser una persona física: sos la guía de ALMA LIMPIA. Si alguien te pregunta directamente qué sos, respondé con honestidad y naturalidad, sin hacer de eso el centro de la conversación.
Evitás respuestas robóticas, frases hechas y lenguaje técnico.
No das consejos médicos, psicológicos, legales ni financieros; si el tema lo requiere, sugerís buscar ayuda profesional con ternura.
Las cartas, números y astros son símbolos para reflexionar, no predicciones fijas.
Mantené las respuestas concisas (2-4 párrafos salvo que pidan más detalle).`;

const PROMPTS = [
  { key: "tarot", version: 1, system: `${BASE_SYSTEM}\n\nEstás interpretando una tirada de tarot REAL: las cartas fueron elegidas por un algoritmo aleatorio y te las pasan con su posición y orientación. Interpretá ESAS cartas, no inventes otras. Conectá la simbología con lo que la persona compartió.` },
  { key: "chat", version: 1, system: `${BASE_SYSTEM}\n\nSos una guía conversacional. Hacé preguntas cuando ayuden, no llenes de preguntas. Acompañá el ritmo de la persona.` },
  { key: "reading", version: 1, system: `${BASE_SYSTEM}\n\nGenerás lecturas simbólicas narrativas (oráculos, registros, vidas pasadas como metáfora). Presentalas siempre como símbolos para reflexionar, jamás como hechos verificables.` },
  { key: "natal", version: 1, system: `${BASE_SYSTEM}\n\nInterpretás cartas natales a partir de posiciones astronómicas REALES que te pasan calculadas. Nunca inventes posiciones. Si falta la hora, explicá que no hay ascendente ni casas.` },
  { key: "numerology", version: 1, system: `${BASE_SYSTEM}\n\nInterpretás números ya calculados por el sistema (pitagórico). No cambies los números, solo tejelos en una narrativa útil y cálida.` },
];

async function main() {
  console.log("🌙 Seeding ALMA LIMPIA…");

  // Categorías + servicios
  for (const cat of CATEGORIES) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, tagline: cat.tagline, icon: cat.icon, order: cat.order },
      create: cat,
    });
    for (const s of SERVICES[cat.slug] ?? []) {
      await prisma.service.upsert({
        where: { slug: s.slug },
        update: {
          name: s.name, shortDesc: s.shortDesc, kind: s.kind,
          priceArs: s.priceArs ?? 0, creditsCost: s.creditsCost ?? 0,
          freeDaily: s.freeDaily ?? false, order: s.order ?? 0,
          engineConfig: (s.engineConfig ?? {}) as object,
          categoryId: category.id,
        },
        create: {
          slug: s.slug, name: s.name, shortDesc: s.shortDesc, kind: s.kind,
          priceArs: s.priceArs ?? 0, creditsCost: s.creditsCost ?? 0,
          freeDaily: s.freeDaily ?? false, order: s.order ?? 0,
          engineConfig: (s.engineConfig ?? {}) as object,
          categoryId: category.id,
        },
      });
    }
    console.log(`  ✓ ${cat.name} (${SERVICES[cat.slug]?.length ?? 0} servicios)`);
  }

  // Mazo Rider-Waite
  const deck = await prisma.tarotDeck.upsert({
    where: { slug: "rider" },
    update: {},
    create: { slug: "rider", name: "Rider-Waite", cardCount: 78 },
  });

  let order = 0;
  for (let i = 0; i < MAJORS.length; i++) {
    const name = MAJORS[i];
    const [up, rev] = MAJOR_KEYS[name] ?? ["", ""];
    const code = `major-${String(i).padStart(2, "0")}`;
    await prisma.tarotCard.upsert({
      where: { deckId_code: { deckId: deck.id, code } },
      update: { name, uprightKeys: up, reversedKeys: rev, order: order++ },
      create: {
        deckId: deck.id, code, name, arcana: "MAJOR", number: i,
        uprightKeys: up, reversedKeys: rev,
        uprightText: `${name} habla de ${up}.`,
        reversedText: `${name} invertida sugiere atención a: ${rev}.`,
        order: order - 1,
      },
    });
  }
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const code = `${suit.key}-${String(rank.n).padStart(2, "0")}`;
      const name = `${rank.name} ${suit.name}`;
      await prisma.tarotCard.upsert({
        where: { deckId_code: { deckId: deck.id, code } },
        update: { name, order: order++ },
        create: {
          deckId: deck.id, code, name, arcana: suit.key.toUpperCase(), number: rank.n,
          uprightKeys: `${suit.theme}`,
          reversedKeys: `bloqueo o exceso en ${suit.theme}`,
          uprightText: `${name}: energía de ${suit.theme}.`,
          reversedText: `${name} invertida: revisar ${suit.theme}.`,
          order: order - 1,
        },
      });
    }
  }
  console.log(`  ✓ Mazo Rider-Waite: 78 cartas`);

  // Mazo de Marsella (78)
  const marsella = await prisma.tarotDeck.upsert({
    where: { slug: "marsella" },
    update: {},
    create: { slug: "marsella", name: "Tarot de Marsella", cardCount: 78 },
  });
  let mOrder = 0;
  for (let i = 0; i < MARSELLA_MAJORS.length; i++) {
    const code = `major-${String(i).padStart(2, "0")}`;
    await prisma.tarotCard.upsert({
      where: { deckId_code: { deckId: marsella.id, code } },
      update: { name: MARSELLA_MAJORS[i], order: mOrder },
      create: {
        deckId: marsella.id, code, name: MARSELLA_MAJORS[i], arcana: "MAJOR", number: i,
        uprightKeys: "arquetipo mayor (tradición Marsella)",
        reversedKeys: "sombra del arquetipo",
        uprightText: `${MARSELLA_MAJORS[i]} en la tradición de Marsella.`,
        reversedText: `${MARSELLA_MAJORS[i]} invertida pide revisar su sombra.`,
        order: mOrder++,
      },
    });
  }
  for (const suit of MARSELLA_SUITS) {
    for (const rank of MARSELLA_RANKS) {
      const code = `${suit.key}-${String(rank.n).padStart(2, "0")}`;
      const name = `${rank.name} ${suit.name}`;
      await prisma.tarotCard.upsert({
        where: { deckId_code: { deckId: marsella.id, code } },
        update: { name, order: mOrder },
        create: {
          deckId: marsella.id, code, name, arcana: "MINOR", number: rank.n,
          uprightKeys: suit.theme,
          reversedKeys: `bloqueo en ${suit.theme}`,
          uprightText: `${name}: ${suit.theme}.`,
          reversedText: `${name} invertida: revisar ${suit.theme}.`,
          order: mOrder++,
        },
      });
    }
  }
  console.log(`  ✓ Mazo Marsella: 78 cartas`);

  // Baraja española (40)
  const spanish = await prisma.tarotDeck.upsert({
    where: { slug: "spanish" },
    update: {},
    create: { slug: "spanish", name: "Baraja española", cardCount: 40 },
  });
  let sOrder = 0;
  for (const suit of SPANISH_SUITS) {
    for (const rank of SPANISH_RANKS) {
      const code = `${suit.key}-${String(rank.n).padStart(2, "0")}`;
      const name = `${rank.name} ${suit.name}`;
      await prisma.tarotCard.upsert({
        where: { deckId_code: { deckId: spanish.id, code } },
        update: { name, order: sOrder },
        create: {
          deckId: spanish.id, code, name, arcana: "MINOR", number: rank.n,
          uprightKeys: suit.theme,
          reversedKeys: `traba en ${suit.theme}`,
          uprightText: `${name}: ${suit.theme}.`,
          reversedText: `${name} invertida: revisar ${suit.theme}.`,
          order: sOrder++,
        },
      });
    }
  }
  console.log(`  ✓ Baraja española: 40 cartas`);

  // Rituales con pasos
  for (const r of RITUALS) {
    await prisma.ritual.upsert({
      where: { slug: r.slug },
      update: {
        name: r.name, category: r.category, description: r.description,
        steps: r.steps, safeVariant: r.safeVariant, durationMin: r.durationMin, active: true,
      },
      create: {
        slug: r.slug, name: r.name, category: r.category, description: r.description,
        steps: r.steps, safeVariant: r.safeVariant, durationMin: r.durationMin,
      },
    });
  }
  console.log(`  ✓ Rituales: ${RITUALS.length}`);

  // Prompts
  for (const p of PROMPTS) {
    const existing = await prisma.promptTemplate.findFirst({
      where: { key: p.key, version: p.version },
    });
    if (!existing) await prisma.promptTemplate.create({ data: p });
  }
  console.log(`  ✓ Prompts base (${PROMPTS.length})`);

  // Admin
  const email = process.env.ALMA_ADMIN_EMAIL ?? "admin@almalimpia.app";
  const pass = process.env.ALMA_ADMIN_PASSWORD ?? "AlmaAdmin2026!";
  const admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    await prisma.user.create({
      data: {
        email, name: "Guardianes de Alma", role: "SUPERADMIN",
        passwordHash: await bcrypt.hash(pass, 12),
        profile: { create: { displayName: "Guardianes" } },
        preferences: { create: {} },
        creditWallet: { create: {} },
      },
    });
    console.log(`  ✓ Admin: ${email}`);
  }

  // Precios configurables en admin_settings
  await prisma.adminSetting.upsert({
    where: { key: "pricing.defaults" },
    update: {},
    create: {
      key: "pricing.defaults",
      value: {
        tarot_personalizado: 15000, carta_astral: 20000, registros_akashicos: 20000,
        guia_espiritual: 20000, membresia_mensual: 7900,
      },
    },
  });

  console.log("✨ Seed completo.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
