/* Sunrise / sunset / golden hour — pure math, no API, no dep (docs/FEATURES.md #8).
   Algorithm: the standard NOAA/Meeus-style approximation — solar declination +
   equation of time (both closed-form, from Wikipedia's "Position of the Sun" and
   "Equation of time" articles, sourced from Jean Meeus's Astronomical Algorithms)
   feeding the sunrise-equation hour angle. Same family used by suncalc.js and most
   web sunrise calculators. Accurate to within a few minutes — plenty for "pack a
   jacket for the evening" and golden-hour photo planning; not an ephemeris.

   Calibrated against sunrise-sunset.org reference values for Seoul (2026-07-09)
   and Copenhagen (2026-06-10) — see sun.test.ts. */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const MS_PER_DAY = 86400000;
const J2000_NOON_UTC = Date.UTC(2000, 0, 1, 12, 0, 0);

// Depression angles (degrees below horizon) that bound each phase.
const SUNSET_ANGLE = -0.833; // atmospheric refraction + solar radius — the standard rise/set instant
const GOLDEN_ANGLE = 6; // sun's elevation above horizon — photography "golden hour" convention (suncalc.js)

function dayOfYearUTC(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / MS_PER_DAY) + 1;
}

function daysSinceJ2000(date: Date): number {
  return (date.getTime() - J2000_NOON_UTC) / MS_PER_DAY;
}

/** Solar declination (degrees) for a given day of year. */
function declination(dayOfYear: number): number {
  const inner = 0.98565 * (dayOfYear + 10) + 1.914 * Math.sin(RAD * 0.98565 * (dayOfYear - 2));
  return -Math.asin(0.39779 * Math.cos(RAD * inner)) * DEG;
}

/** Equation of time (minutes) — apparent solar time minus mean solar time. */
function equationOfTime(date: Date): number {
  const D = daysSinceJ2000(date);
  const M = 6.24004077 + 0.01720197 * D; // radians
  return -7.659 * Math.sin(M) + 9.863 * Math.sin(2 * M + 3.5932);
}

/** Hour angle (degrees) for a sun elevation of `angleDeg`, or null if the sun
    never reaches that elevation on this day at this latitude (polar day/night). */
function hourAngle(lat: number, decl: number, angleDeg: number): number | null {
  const cosH = (Math.sin(RAD * angleDeg) - Math.sin(RAD * lat) * Math.sin(RAD * decl)) /
    (Math.cos(RAD * lat) * Math.cos(RAD * decl));
  if (cosH > 1 || cosH < -1) return null;
  return Math.acos(cosH) * DEG;
}

export interface SolarTimes {
  sunrise: Date | null;
  sunset: Date | null;
  solarNoon: Date;
  dayLengthMin: number | null;
  goldenHourMorningEnd: Date | null;
  goldenHourEveningStart: Date | null;
  /** Sun never sets this day (midnight sun) — sunrise/sunset are null because there's no instant to report. */
  alwaysUp: boolean;
  /** Sun never rises this day (polar night). */
  alwaysDown: boolean;
}

/**
 * Sun times for a calendar date at a given location. `date` is read for its
 * UTC calendar day only (time-of-day is ignored) — this is a per-day figure.
 */
export function solarTimesFor(lat: number, lng: number, date: Date): SolarTimes {
  const N = dayOfYearUTC(date);
  const decl = declination(N);
  const eot = equationOfTime(date);
  // Solar noon in UTC hours: mean noon at this longitude, shifted by the equation of time.
  const solarNoonUTCHours = 12 - lng / 15 - eot / 60;
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const solarNoon = new Date(dayStart + solarNoonUTCHours * 3600000);

  const h0 = hourAngle(lat, decl, SUNSET_ANGLE);
  const hGold = hourAngle(lat, decl, GOLDEN_ANGLE);

  const atOffset = (hours: number | null) => hours === null ? null : new Date(dayStart + (solarNoonUTCHours + hours) * 3600000);

  const sunrise = h0 === null ? null : atOffset(-h0 / 15);
  const sunset = h0 === null ? null : atOffset(h0 / 15);
  const goldenHourMorningEnd = hGold === null ? null : atOffset(-hGold / 15);
  const goldenHourEveningStart = hGold === null ? null : atOffset(hGold / 15);

  // h0 === null means the sun never crosses -0.833° that day: either always above
  // (midnight sun) or always below (polar night) — distinguish by the sun's elevation at noon.
  const noonElevation = Math.asin(
    Math.sin(RAD * lat) * Math.sin(RAD * decl) + Math.cos(RAD * lat) * Math.cos(RAD * decl)
  ) * DEG;
  const alwaysUp = h0 === null && noonElevation > SUNSET_ANGLE;
  const alwaysDown = h0 === null && noonElevation <= SUNSET_ANGLE;

  return {
    sunrise, sunset, solarNoon,
    dayLengthMin: h0 === null ? (alwaysUp ? 1440 : 0) : Math.round((h0 * 2 / 15) * 60),
    goldenHourMorningEnd, goldenHourEveningStart,
    alwaysUp, alwaysDown,
  };
}

/** "5h 32m" style remaining-daylight label, or null once the sun has set / hasn't risen. */
export function daylightLeftLabel(now: Date, times: SolarTimes): string | null {
  if (!times.sunset || now >= times.sunset) return null;
  const from = times.sunrise && now < times.sunrise ? times.sunrise : now;
  const minsLeft = Math.round((times.sunset.getTime() - from.getTime()) / 60000);
  if (minsLeft <= 0) return null;
  const h = Math.floor(minsLeft / 60), m = minsLeft % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function fmtClock(d: Date | null, tzIana?: string | null): string {
  if (!d) return "—";
  // Absent or invalid time zone → UTC, never the host's local zone. Every production caller passes
  // a real IANA zone; the fallback only matters for determinism — a clock formatter must render the
  // same string on a UTC CI runner and on a UTC-offset dev machine, not silently follow whichever
  // zone the process happens to run in.
  try {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tzIana || "UTC" }).format(d);
  } catch (_) {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(d);
  }
}
