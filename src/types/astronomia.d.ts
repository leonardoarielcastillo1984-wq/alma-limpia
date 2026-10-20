// Declaraciones mínimas para `astronomia` (sin @types en npm).
// Solo tipamos lo que ALMA LIMPIA usa; el resto queda any.

declare module "astronomia" {
  export namespace julian {
    function CalendarGregorianToJD(y: number, m: number, d: number): number;
    function DateToJD(date: Date): number;
    function JDToDate(jd: number): Date;
  }
  export namespace base {
    const J2000: number;
    function JDEToJulianYear(jde: number): number;
    function JulianYearToJDE(y: number): number;
  }
  export namespace solar {
    /** T = Julian centuries since J2000 (use base.J2000Century(jde)) */
    function apparentLongitude(T: number): number;
    function trueLongitude(T: number): { lon: number; ano: number };
    /** Apparent geocentric longitude of the Sun via VSOP87 — takes JDE */
    function apparentVSOP87(earthPlanet: planetposition.Planet, jde: number): { lon: number; lat: number; range: number };
  }
  export namespace moonposition {
    function position(jd: number): { lon: number; lat: number; range: number };
  }
  export namespace moonillum {
    function phaseAngle(jd: number): number;
    function illuminated(k: number): number;
  }
  export namespace nutation {
    function nutation(jd: number): [number, number];
    function meanObliquity(jd: number): number;
  }
  export namespace sidereal {
    function apparent(jd: number): number;
    function mean(jd: number): number;
  }
  export namespace coord {
    class Ecliptic {
      constructor(lon: number, lat: number, range?: number);
      lon: number;
      lat: number;
      range?: number;
    }
    class Equatorial {
      constructor(ra: number, dec: number, range?: number);
      ra: number;
      dec: number;
      range?: number;
    }
  }
  export namespace precess {
    class EclipticPrecessor {
      /** epochs are Julian years (e.g. 2000, not JDE 2451545) */
      constructor(epochFrom: number, epochTo: number);
      precess(eclFrom: coord.Ecliptic): coord.Ecliptic;
    }
    function eclipticPosition(eclFrom: coord.Ecliptic, epochFrom: number, epochTo: number, mRa?: number, mDec?: number): coord.Ecliptic;
  }
  export namespace planetposition {
    interface Vsop87Series {
      L: Record<string, number[][]>;
      B: Record<string, number[][]>;
      R: Record<string, number[][]>;
      name: string;
      type: string;
    }
    class Planet {
      constructor(data: Vsop87Series);
      position2000(jd: number): { lon: number; lat: number; range: number };
      position(jd: number): { lon: number; lat: number; range: number };
    }
    function toFK5(lon: number, lat: number, jd: number): { lon: number; lat: number };
  }
  export namespace pluto {
    function heliocentric(jd: number): { lon: number; lat: number; range: number };
  }
}

declare module "astronomia/data/vsop87Bearth" {
  const d: import("astronomia").planetposition.Vsop87Series;
  export default d;
}
declare module "astronomia/data/vsop87Bmercury" {
  const d: import("astronomia").planetposition.Vsop87Series;
  export default d;
}
declare module "astronomia/data/vsop87Bvenus" {
  const d: import("astronomia").planetposition.Vsop87Series;
  export default d;
}
declare module "astronomia/data/vsop87Bmars" {
  const d: import("astronomia").planetposition.Vsop87Series;
  export default d;
}
declare module "astronomia/data/vsop87Bjupiter" {
  const d: import("astronomia").planetposition.Vsop87Series;
  export default d;
}
declare module "astronomia/data/vsop87Bsaturn" {
  const d: import("astronomia").planetposition.Vsop87Series;
  export default d;
}
declare module "astronomia/data/vsop87Buranus" {
  const d: import("astronomia").planetposition.Vsop87Series;
  export default d;
}
declare module "astronomia/data/vsop87Bneptune" {
  const d: import("astronomia").planetposition.Vsop87Series;
  export default d;
}
