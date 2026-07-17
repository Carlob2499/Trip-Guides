/* Weather decision layer — pure, no DOM, no network.
   Lifted out of guide-ui.js's weather IIFE, where the validators guarding against garbage
   forecast data had no tests at all. */

import type { TripWindow } from "../../../lib/trip-dates";

/** WMO weather code → monochrome text symbol. ︎ forces text (not emoji) rendering,
    per the guide's no-emoji content rule. */
export function wxIcon(code: number): string {
  if (code === 0) return "☀︎";
  if (code <= 3) return "⛅︎";
  if (code <= 48) return "☁︎";
  if (code <= 67) return "☂︎";
  if (code <= 77) return "❄︎";
  if (code <= 82) return "☂︎";
  if (code <= 86) return "❄︎";
  if (code >= 95) return "☈";
  return "⛅︎";
}

export interface Daily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weathercode: number[];
}

/** One day's values present and physically possible. The −90..60 °C band catches unit
    errors and garbage (a Fahrenheit payload, a sentinel, a null) rather than rendering
    "200°" at a traveler. */
export function wxDayOk(d: Daily, k: number): boolean {
  const H = d.temperature_2m_max[k], L = d.temperature_2m_min[k], W = d.weathercode[k];
  return typeof H === "number" && H >= -90 && H <= 60 &&
         typeof L === "number" && L >= -90 && L <= 60 &&
         typeof W === "number";
}

/**
 * Validate an Open-Meteo response and return its `daily` block, or null.
 *
 * Trailing days are TRIMMED, not rejected: Open-Meteo legitimately returns nulls for the
 * last day or two of the 16-day window while its model refreshes at the edge, and throwing
 * the whole forecast away over that would hide 14 good days. A bad value anywhere before
 * the trailing run is still a hard failure — that's a real anomaly, not an edge artifact.
 */
export function wxValidate(data: any): Daily | null {
  if (!data || !data.daily) return null;
  const d = data.daily as Daily;
  if (!Array.isArray(d.time) || !d.time.length) return null;
  const n = d.time.length;
  if (!Array.isArray(d.temperature_2m_max) || d.temperature_2m_max.length !== n) return null;
  if (!Array.isArray(d.temperature_2m_min) || d.temperature_2m_min.length !== n) return null;
  if (!Array.isArray(d.weathercode) || d.weathercode.length !== n) return null;

  let validLen = n;
  while (validLen > 0 && !wxDayOk(d, validLen - 1)) validLen--;
  if (!validLen) return null;
  for (let k = 0; k < validLen; k++) if (!wxDayOk(d, k)) return null;
  if (validLen === n) return d;
  return {
    time: d.time.slice(0, validLen),
    temperature_2m_max: d.temperature_2m_max.slice(0, validLen),
    temperature_2m_min: d.temperature_2m_min.slice(0, validLen),
    weathercode: d.weathercode.slice(0, validLen),
  };
}

export interface WxSlice {
  startI: number;
  count: number;
  onTrip: boolean;
}

/**
 * Which slice of the forecast to show. Recomputed per render (never cached) so a stale
 * cached "today" can't freeze the window on an old day.
 *
 * Three cases, and the reason each exists:
 *  · ongoing trip → the REMAINING days from today, not the original full length (showing a
 *    9-day strip on day 7 would be mostly history)
 *  · upcoming trip → locate the start date inside the forecast; null if it's beyond the
 *    horizon, because a forecast that doesn't reach the trip is worse than none
 *  · no trip dates → today's next 7, unrelated to any trip (a legitimate generic case)
 *
 * Returns null to mean "render nothing". Past trips never reach here — the caller skips
 * the network entirely for those.
 */
export function weatherWindow(d: Daily, trip: TripWindow): WxSlice | null {
  const HORIZON = d.time.length;
  if (!trip.hasDates) return { startI: 0, count: Math.min(HORIZON, 7), onTrip: false };
  if (trip.isPast) return null;

  if (trip.isOngoing) {
    const daysElapsed = -trip.daysUntilStart;
    return { startI: 0, count: Math.min(HORIZON, trip.lengthDays - daysElapsed), onTrip: true };
  }

  const daysUntilStart = trip.daysUntilStart;
  if (daysUntilStart >= HORIZON) return null; // beyond the forecast — stay hidden
  // Find the trip's start inside d.time[] by month/day, falling back to index arithmetic.
  const s = trip.start!;
  const wantMD = "-" + String(s.getMonth() + 1).padStart(2, "0") + "-" + String(s.getDate()).padStart(2, "0");
  let startI = -1;
  for (let j = 0; j < d.time.length; j++) {
    if (d.time[j].indexOf(wantMD) !== -1) { startI = j; break; }
  }
  if (startI === -1) startI = daysUntilStart;
  return { startI, count: Math.min(HORIZON - startI, trip.lengthDays), onTrip: true };
}
