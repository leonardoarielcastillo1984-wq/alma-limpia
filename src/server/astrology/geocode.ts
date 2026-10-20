/**
 * Geocoding local MVP — tabla de ciudades principales.
 * Sin claves externas. Si la ciudad no está, el usuario ingresa lat/lon manual
 * o se calcula la carta sin Ascendente (warning explícito).
 * Fase posterior: integrar Nominatim/Google con clave configurable.
 */

interface CityCoord { lat: number; lon: number; tz: string }

const CITIES: Record<string, CityCoord> = {
  "buenos aires": { lat: -34.6037, lon: -58.3816, tz: "America/Argentina/Buenos_Aires" },
  "cordoba": { lat: -31.4201, lon: -64.1888, tz: "America/Argentina/Cordoba" },
  "córdoba": { lat: -31.4201, lon: -64.1888, tz: "America/Argentina/Cordoba" },
  "rosario": { lat: -32.9442, lon: -60.6505, tz: "America/Argentina/Cordoba" },
  "mendoza": { lat: -32.8895, lon: -68.8458, tz: "America/Argentina/Mendoza" },
  "la plata": { lat: -34.9215, lon: -57.9545, tz: "America/Argentina/Buenos_Aires" },
  "montevideo": { lat: -34.9011, lon: -56.1645, tz: "America/Montevideo" },
  "santiago": { lat: -33.4489, lon: -70.6693, tz: "America/Santiago" },
  "ciudad de mexico": { lat: 19.4326, lon: -99.1332, tz: "America/Mexico_City" },
  "méxico": { lat: 19.4326, lon: -99.1332, tz: "America/Mexico_City" },
  "mexico": { lat: 19.4326, lon: -99.1332, tz: "America/Mexico_City" },
  "bogota": { lat: 4.7110, lon: -74.0721, tz: "America/Bogota" },
  "bogotá": { lat: 4.7110, lon: -74.0721, tz: "America/Bogota" },
  "lima": { lat: -12.0464, lon: -77.0428, tz: "America/Lima" },
  "madrid": { lat: 40.4168, lon: -3.7038, tz: "Europe/Madrid" },
  "barcelona": { lat: 41.3874, lon: 2.1686, tz: "Europe/Madrid" },
  "sao paulo": { lat: -23.5505, lon: -46.6333, tz: "America/Sao_Paulo" },
  "são paulo": { lat: -23.5505, lon: -46.6333, tz: "America/Sao_Paulo" },
  "rio de janeiro": { lat: -22.9068, lon: -43.1729, tz: "America/Sao_Paulo" },
  "asuncion": { lat: -25.2637, lon: -57.5759, tz: "America/Asuncion" },
  "asunción": { lat: -25.2637, lon: -57.5759, tz: "America/Asuncion" },
  "caracas": { lat: 10.4806, lon: -66.9036, tz: "America/Caracas" },
  "miami": { lat: 25.7617, lon: -80.1918, tz: "America/New_York" },
  "new york": { lat: 40.7128, lon: -74.0060, tz: "America/New_York" },
};

export function geocode(city: string | null | undefined, _country?: string | null): CityCoord | null {
  if (!city) return null;
  const key = city.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const direct = CITIES[key] ?? CITIES[city.trim().toLowerCase()];
  if (direct) return direct;
  // búsqueda parcial
  for (const [k, v] of Object.entries(CITIES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}
