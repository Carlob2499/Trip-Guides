/* Exchange-rate decision layer — pure, no DOM, no network.
   Everything here used to be closure functions inside guide-ui.js's rate IIFE, untested,
   guarding a number the traveler budgets against. */

/** Plausible USD→X bands. A rate outside its band is bad data, not a market move —
    the ECB does not wake up and reprice the won by 10×. Currencies with no band are
    unconstrained (unknown is not the same as invalid). */
export const SANITY: Record<string, [number, number]> = {
  KRW: [500, 3000],
  JPY: [80, 250],
  DKK: [4, 12],
  EUR: [0.5, 1.5],
};

/** Is this rate plausible for this currency? Unknown currency → accepted. */
export function inBand(rate: number, code: string): boolean {
  const b = SANITY[code];
  if (!b) return true;
  return rate >= b[0] && rate <= b[1];
}

/**
 * Magnitude-aware display. Math.round alone would render EUR 0.93 as a useless "1", and
 * KRW 1479.45 as an over-precise "1,479.45". The thresholds follow the number, not the
 * currency, so an unlisted currency still formats sensibly.
 */
export function fmtRate(rate: number): string {
  return rate >= 100 ? Math.round(rate).toLocaleString() : rate >= 1 ? rate.toFixed(2) : rate.toFixed(3);
}

export interface RateCache {
  rate?: number;
  date?: string;
  fetchedAt?: string;
}

/**
 * Is a cached rate today's? Compared against a UTC day string because that's the reference
 * Frankfurter stamps its daily rate with — a device in UTC+9 at 00:30 local is still on the
 * previous UTC day, and using the device date there would refetch (or serve stale) once a day.
 */
export function isCacheFresh(cached: RateCache | null | undefined, todayUTC: string): boolean {
  return !!(cached && cached.rate && cached.date && cached.fetchedAt === todayUTC);
}

/**
 * Pull a usable rate out of a Frankfurter response, or throw with a reason worth logging.
 * Throwing (rather than returning null) keeps the caller's promise chain honest: every
 * failure lands in one .catch that decides between the stale cache and the build-time
 * fallback.
 */
export function parseRateResponse(data: any, code: string): { rate: number; date: string } {
  const rate = data && data.rates && data.rates[code];
  if (!rate || !isFinite(rate)) throw new Error("missing or non-finite rate");
  if (!inBand(rate, code)) throw new Error("rate " + rate + " outside sanity band for " + code);
  return { rate, date: data.date || "" };
}
