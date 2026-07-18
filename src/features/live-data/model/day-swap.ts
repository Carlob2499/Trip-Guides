// Weather day-swap advisory — pure decision logic (UI in ../ui/day-swap.js).
//
// When the live forecast shows precipitation on a day explicitly tagged `env:"outdoor"`
// and a dry `env:"indoor"` day exists in the same forecast window, suggest (never apply)
// swapping them. Honesty rules: the `env` tag must be EXPLICIT — days without it are
// never classified (no prose-keyword guessing), so the advisory is silent rather than
// wrong. Only today-or-future days are considered; one suggestion max (the first rainy
// outdoor day + the nearest dry indoor day).

export type SwapDay = { date: string; title: string; env?: string | null };
export type DailyForecast = { time: string[]; weathercode: number[] };
export type SwapAdvice = {
  rain: { date: string; title: string; iso: string };
  dry: { date: string; title: string; iso: string };
};

// WMO precipitation codes (Open-Meteo `weathercode`): drizzle 51–57, rain 61–67,
// snow 71–77, showers 80–82, snow showers 85–86, thunderstorms 95–99.
export function isWetCode(w: number | null | undefined): boolean {
  if (typeof w !== "number" || !isFinite(w)) return false;
  return (w >= 51 && w <= 67) || (w >= 71 && w <= 77) || (w >= 80 && w <= 86) || (w >= 95 && w <= 99);
}

const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// Match a guide day label ("Wed Jul 8") to a forecast ISO date by month+day — the
// forecast window is ≤16 days, so month+day is unambiguous within it.
export function matchForecastIndex(dayDate: string, time: string[]): number {
  const m = /([A-Z][a-z]{2})\s+(\d{1,2})/.exec(String(dayDate || ""));
  if (!m || MONTHS[m[1]] === undefined) return -1;
  const mo = MONTHS[m[1]], dd = parseInt(m[2], 10);
  for (let i = 0; i < time.length; i++) {
    const t = new Date(time[i] + "T12:00:00");
    if (t.getMonth() === mo && t.getDate() === dd) return i;
  }
  return -1;
}

export function daySwapAdvice(
  days: SwapDay[],
  daily: DailyForecast,
  now: Date = new Date()
): SwapAdvice | null {
  if (!Array.isArray(days) || !daily || !Array.isArray(daily.time) || !Array.isArray(daily.weathercode)) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  type Cand = { date: string; title: string; iso: string; wet: boolean; env: string };
  const cands: Cand[] = [];
  for (const d of days) {
    if (d.env !== "outdoor" && d.env !== "indoor") continue; // explicit tags only; `mixed` swaps neither way
    const i = matchForecastIndex(d.date, daily.time);
    if (i < 0) continue;
    const dt = new Date(daily.time[i] + "T12:00:00");
    if (dt < today) continue; // never advise rearranging the past
    cands.push({ date: d.date, title: d.title, iso: daily.time[i], wet: isWetCode(daily.weathercode[i]), env: d.env });
  }

  const rain = cands.find((c) => c.env === "outdoor" && c.wet);
  if (!rain) return null;
  // Nearest dry indoor day (by absolute distance in the forecast array order).
  const dryIndoor = cands
    .filter((c) => c.env === "indoor" && !c.wet && c.iso !== rain.iso)
    .sort((a, b) => Math.abs(Date.parse(a.iso) - Date.parse(rain.iso)) - Math.abs(Date.parse(b.iso) - Date.parse(rain.iso)))[0];
  if (!dryIndoor) return null;

  return {
    rain: { date: rain.date, title: rain.title, iso: rain.iso },
    dry: { date: dryIndoor.date, title: dryIndoor.title, iso: dryIndoor.iso },
  };
}
