// Thin, typed accessors over the country data table (src/data/countries.mjs), which
// is the single source of truth and is shared with the plain-Node scripts. Add or
// change a country THERE, not here.

import {
  countryData,
  DEFAULT_ACCENT,
  FALLBACK_RATES,
  COUNTRY_CODES as _COUNTRY_CODES,
} from "../data/countries.mjs";

export interface Currency { code: string; symbol: string; name: string; approxRate: number | null; }

// Country → accent colour (house accent for unknown countries).
export function accentFor(country: string): string {
  return countryData(country)?.accent || DEFAULT_ACCENT;
}

// Country → currency for the budget / split tools. `approxRate` is a ROUGH fallback
// (null when we have none) that the live Frankfurter rate overrides — never treat it
// as authoritative. Exchange rates are perishable and are not tabled per country.
export function currencyFor(country: string): Currency | null {
  const d = countryData(country);
  if (!d?.currency) return null;
  return { ...d.currency, approxRate: FALLBACK_RATES[d.currency.code as keyof typeof FALLBACK_RATES] ?? null };
}

// Country → IANA time zone (e.g. "Asia/Seoul") for the local-time pill + jet-lag calc.
// IANA + Intl handles DST automatically — this replaces the old fixed-offset DEST_TZ,
// which was an hour wrong for European destinations in winter.
export function tzFor(country: string): string | null {
  return countryData(country)?.tz ?? null;
}

// Country → ISO 3166-1 alpha-2, for the public-holiday lookup.
export const COUNTRY_CODES: Record<string, string> = _COUNTRY_CODES;

// A slightly darker shade of the accent (hover states).
export function darken(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - f));
  const g = Math.round(((n >> 8) & 255) * (1 - f));
  const b = Math.round((n & 255) * (1 - f));
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
