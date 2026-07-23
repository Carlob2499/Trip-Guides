/* Weather-aware packing strip (docs/PLAN_TRAVELER_FEATURES.md F4) — pure derivation from
   data the repo already fetches for the weather strip: no new API, no UV index (none
   exists anywhere in this codebase or in Open-Meteo's `daily` response we already use —
   see model/weather.ts's `Daily`), so "sun protection" is approximated from daylight
   length, the one sun-exposure signal already computed for the sun strip (model/sun.ts).
   Every threshold below is a stated heuristic, not a sourced fact — this only ever
   surfaces when a trip's OWN forecast crosses one, never a guess dressed as certainty.
   Returns null (renders nothing) whenever there's no forecast slice or nothing in it
   crosses a threshold — a mild, dry trip needs no packing card at all. */

import type { Daily, WxSlice } from "./weather";
import { isWetCode } from "./day-swap";

export interface PackingResult {
  tempMinC: number;
  tempMaxC: number;
  wetDays: number;
  totalDays: number;
  daylightHours: number | null;
  items: string[];
}

// A day/night swing this wide means a single wardrobe weight won't work the whole trip.
const LAYER_SPREAD_C = 8;
// Daylight this long is worth flagging sun protection for, absent a real UV signal.
const LONG_DAYLIGHT_MIN = 12 * 60;

export function derivePackingList(daily: Daily | null | undefined, slice: WxSlice | null, daylightMinutes: number | null | undefined): PackingResult | null {
  if (!daily || !slice || slice.count <= 0) return null;
  const idx: number[] = [];
  for (let i = slice.startI; i < slice.startI + slice.count && i < daily.time.length; i++) idx.push(i);
  if (!idx.length) return null;

  const highs = idx.map((i) => daily.temperature_2m_max[i]);
  const lows = idx.map((i) => daily.temperature_2m_min[i]);
  const tempMaxC = Math.max(...highs);
  const tempMinC = Math.min(...lows);
  const wetDays = idx.filter((i) => isWetCode(daily.weathercode[i])).length;
  const spread = tempMaxC - tempMinC;
  const daylightHours = typeof daylightMinutes === "number" ? Math.round(daylightMinutes / 60) : null;

  const items: string[] = [];
  if (wetDays > 0) {
    items.push(`Rain shell or umbrella — ${wetDays} of ${idx.length} day${idx.length === 1 ? "" : "s"} in the forecast show rain`);
  }
  if (spread >= LAYER_SPREAD_C) {
    items.push(`Layers — ${Math.round(tempMinC)}–${Math.round(tempMaxC)}°C across the trip`);
  }
  if (daylightHours != null && daylightMinutes! >= LONG_DAYLIGHT_MIN) {
    items.push(`Sun protection — ≈${daylightHours}h of daylight most days`);
  }
  if (!items.length) return null;

  return { tempMinC, tempMaxC, wetDays, totalDays: idx.length, daylightHours, items };
}
