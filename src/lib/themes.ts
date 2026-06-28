// The ONE place country colours live now. Add or change a colour here and every
// guide + the home page picks it up — no more copying the same list into each file.

export interface Currency { code: string; symbol: string; name: string; approxRate: number; }

export const CURRENCIES: Record<string, Currency> = {
  "Denmark":       { code: "DKK", symbol: "kr", name: "Danish Krone",   approxRate: 6.9  },
  "Germany":       { code: "EUR", symbol: "€",  name: "Euro",           approxRate: 0.93 },
  "Portugal":      { code: "EUR", symbol: "€",  name: "Euro",           approxRate: 0.93 },
  "Japan":         { code: "JPY", symbol: "¥",  name: "Japanese Yen",   approxRate: 150  },
  "South Korea":   { code: "KRW", symbol: "₩",  name: "Korean Won",     approxRate: 1380 },
  "Korea":         { code: "KRW", symbol: "₩",  name: "Korean Won",     approxRate: 1380 },
};

export function currencyFor(country: string): Currency | null {
  return CURRENCIES[country] || null;
}

export const THEMES: Record<string, string> = {
  Denmark: "#a4332a", Sweden: "#8a6a1f", Norway: "#34507a", Finland: "#2b5d86", Iceland: "#3a6ea5",
  "South Korea": "#2b5d86", Korea: "#2b5d86", Japan: "#b23a48", China: "#9c2f2a", Thailand: "#2e4a86",
  France: "#33518a", Italy: "#2f6f4f", Spain: "#b07a1f", Portugal: "#2f6f4f", Germany: "#8a6a1f",
  Netherlands: "#b5651d", Greece: "#2b5d9e", "United Kingdom": "#34507a", "United States": "#34507a", Mexico: "#2f6f4f",
};

export const DEFAULT_ACCENT = "#9c4421";

export function accentFor(country: string): string {
  return THEMES[country] || DEFAULT_ACCENT;
}

// Make a slightly darker shade of the accent (used for hover states).
export function darken(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - f));
  const g = Math.round(((n >> 8) & 255) * (1 - f));
  const b = Math.round((n & 255) * (1 - f));
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
