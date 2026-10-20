/**
 * Carta natal — cálculo astronómico real con `astronomia` (VSOP87).
 *
 * - Planetas: posición geocéntrica = heliocéntrica(planeta) − heliocéntrica(Tierra),
 *   en coordenadas VSOP87B (eclíptica J2000), luego precesión a equinoccio de la fecha
 *   con precess.EclipticPrecessor → longitud tropical.
 * - Sol: solar.apparentVSOP87 (geocéntrico aparente, incluye aberración+nutación).
 * - Luna: moonposition.position (geocéntrica, equinoccio de la fecha).
 * - Ascendente y Medio Cielo: solo si hay hora+lugar (tiempo sidéreo aparente + oblicuidad).
 *   Nunca se inventan: sin hora, quedan null.
 */
import {
  julian, solar, moonposition, planetposition, precess, sidereal, nutation, base, coord, pluto,
} from "astronomia";
import earthData from "astronomia/data/vsop87Bearth";
import mercuryData from "astronomia/data/vsop87Bmercury";
import venusData from "astronomia/data/vsop87Bvenus";
import marsData from "astronomia/data/vsop87Bmars";
import jupiterData from "astronomia/data/vsop87Bjupiter";
import saturnData from "astronomia/data/vsop87Bsaturn";
import uranusData from "astronomia/data/vsop87Buranus";
import neptuneData from "astronomia/data/vsop87Bneptune";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

const PLANET_DATA = {
  mercury: mercuryData,
  venus: venusData,
  mars: marsData,
  jupiter: jupiterData,
  saturn: saturnData,
  uranus: uranusData,
  neptune: neptuneData,
} as const;

// Cache de planetas VSOP87 (los objetos cargan series grandes)
const planets = new Map<string, InstanceType<typeof planetposition.Planet>>();
function planet(key: keyof typeof PLANET_DATA) {
  if (!planets.has(key)) {
    planets.set(key, new planetposition.Planet(PLANET_DATA[key]));
  }
  return planets.get(key)!;
}
let earth: InstanceType<typeof planetposition.Planet> | null = null;
function earthPlanet() {
  if (!earth) earth = new planetposition.Planet(earthData);
  return earth;
}

const SIGNS_ES = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

const PLANET_NAMES: Record<string, string> = {
  sun: "Sol", moon: "Luna", mercury: "Mercurio", venus: "Venus", mars: "Marte",
  jupiter: "Júpiter", saturn: "Saturno", uranus: "Urano", neptune: "Neptuno",
  pluto: "Plutón", asc: "Ascendente", mc: "Medio Cielo",
};

export interface PlanetPos {
  key: string;
  name: string;
  longitude: number;   // grados 0-360, tropical
  sign: string;
  signDegree: number;  // grados dentro del signo
  retrograde?: boolean;
}

export interface NatalChart {
  calculatedAt: string;
  julianDay: number;
  positions: PlanetPos[];
  ascendant: PlanetPos | null;   // null si falta hora/lugar
  midheaven: PlanetPos | null;
  moonPhase: { name: string; illumination: number } | null;
  warnings: string[];
  engine: string;
}

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function toPos(key: string, lonRad: number): PlanetPos {
  const lon = norm360(lonRad * DEG);
  const signIdx = Math.floor(lon / 30);
  return {
    key,
    name: PLANET_NAMES[key] ?? key,
    longitude: Math.round(lon * 100) / 100,
    sign: SIGNS_ES[signIdx],
    signDegree: Math.round((lon - signIdx * 30) * 100) / 100,
  };
}

// VSOP87B heliocéntrico → XYZ
function helioXYZ(lon: number, lat: number, range: number) {
  const c = Math.cos(lat);
  return { x: range * c * Math.cos(lon), y: range * c * Math.sin(lon), z: range * Math.sin(lat) };
}

interface HelioPos { lon: number; lat: number; range: number }

/**
 * Posición geocéntrica eclíptica J2000 a partir de coordenadas heliocéntricas.
 * Devuelve {lon, lat} en radianes (J2000).
 */
function geocentric(pl: HelioPos, earthPos: HelioPos) {
  const ex = helioXYZ(earthPos.lon, earthPos.lat, earthPos.range);
  const px = helioXYZ(pl.lon, pl.lat, pl.range);
  const dx = px.x - ex.x, dy = px.y - ex.y, dz = px.z - ex.z;
  const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return { lon: Math.atan2(dy, dx), lat: Math.asin(dz / r), range: r };
}

const MOON_PHASES = ["Luna nueva", "Cuarto creciente", "Luna llena", "Cuarto menguante"];

export function computeNatalChart(opts: {
  birthDate: Date;        // UTC instant of birth
  lat?: number | null;    // grados decimales
  lon?: number | null;    // grados decimales (este positivo)
  hasTime: boolean;
}): NatalChart {
  const { birthDate } = opts;
  const jd = julian.DateToJD(birthDate);
  const warnings: string[] = [];
  const positions: PlanetPos[] = [];

  // Precesor J2000 → equinoccio de la fecha (longitudes tropicales)
  // OJO: las epochs son años julianos (2000), no días julianos
  const jdeYear = base.JDEToJulianYear(jd);
  const prec = new precess.EclipticPrecessor(2000, jdeYear);
  const precessPos = (lon: number, lat: number) => {
    const out = prec.precess(new coord.Ecliptic(lon, lat));
    return { lon: out.lon, lat: out.lat };
  };

  // Sol (geocéntrico aparente VSOP87, ya en equinoccio de fecha, incluye
  // nutación y aberración). OJO: apparentLongitude() recibe siglos T, no JD.
  const earthP = earthPlanet();
  const sunLon = solar.apparentVSOP87(earthP, jd).lon;
  positions.push(toPos("sun", sunLon));

  // Luna
  const moon = moonposition.position(jd);
  positions.push(toPos("moon", moon.lon));

  // Tierra heliocéntrica una sola vez (geocéntrico = planeta − Tierra)
  const earthPos = earthP.position2000(jd);

  // Planetas VSOP87 (J2000 → precesión a fecha)
  for (const key of Object.keys(PLANET_DATA) as (keyof typeof PLANET_DATA)[]) {
    const geo = geocentric(planet(key).position2000(jd), earthPos);
    const pre = precessPos(geo.lon, geo.lat);
    positions.push(toPos(key, pre.lon));
  }

  // Plutón — modelo semianalítico heliocéntrico de astronomia
  try {
    const geo = geocentric(pluto.heliocentric(jd), earthPos);
    const pre = precessPos(geo.lon, geo.lat);
    positions.push(toPos("pluto", pre.lon));
  } catch {
    warnings.push("Plutón no disponible en esta versión del motor.");
  }

  // Ascendente y MC — SOLO con hora y coordenadas
  let ascendant: PlanetPos | null = null;
  let midheaven: PlanetPos | null = null;
  if (opts.hasTime && opts.lat != null && opts.lon != null) {
    const latRad = opts.lat * RAD;
    const eps = nutation.meanObliquity(jd) + nutation.nutation(jd)[1];
    const theta = sidereal.apparent(jd); // sidéreo aparente Greenwich (rad)
    const lst = norm360((theta + opts.lon * RAD) * DEG) * RAD; // sidéreo local

    // MC: tan(λ_mc) = tan(LST) / cos(ε)
    let mcLon = Math.atan2(Math.sin(lst), Math.cos(lst) * Math.cos(eps));
    if (mcLon < 0) mcLon += Math.PI;
    midheaven = toPos("mc", mcLon);

    // ASC: tan(λ_asc) = −cos(LST) / (sin(ε)·tan(φ) + cos(ε)·sin(LST))
    const num = -Math.cos(lst);
    const den = Math.sin(eps) * Math.tan(latRad) + Math.cos(eps) * Math.sin(lst);
    let ascLon = Math.atan2(num, den);
    if (ascLon < 0) ascLon += Math.PI;
    // Ajustar a horizonte oriental
    if (norm360(ascLon * DEG - mcLon * DEG) > 180) ascLon += Math.PI;
    ascendant = toPos("asc", ascLon);
  } else {
    warnings.push(
      "Sin hora y lugar de nacimiento no calculamos Ascendente ni casas — hacerlo sería inventar."
    );
  }

  // Fase lunar
  const phaseAngle = norm360(moon.lon * DEG - sunLon * DEG);
  const phaseIdx = Math.floor(((phaseAngle + 45) % 360) / 90);
  const illumination = (1 - Math.cos(phaseAngle * RAD)) / 2;

  return {
    calculatedAt: new Date().toISOString(),
    julianDay: jd,
    positions,
    ascendant,
    midheaven,
    moonPhase: { name: MOON_PHASES[phaseIdx], illumination: Math.round(illumination * 100) / 100 },
    warnings,
    engine: "astronomia/VSOP87B + precess + sidereal (Meeus)",
  };
}
