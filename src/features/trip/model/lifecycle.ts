/* Trip lifecycle — the pure decisions behind the Trip destination (design-system.md D6-02,
   D6-19, D6-31, D6-48). Trip means "what matters now", and "now" is a fact about the reader's
   clock, so everything here is clock-injected and nothing reaches for `new Date()`.

   Four phases, and no fifth for "not sure": a guide with no calendar dates is `undated` and
   renders its readiness/reference view rather than guessing a present moment. */

import { tripWindow, dayState } from "../../../lib/trip-dates";

export type TripPhase = "pre" | "active" | "post" | "undated";

export interface TripStop {
  name: string;
  time: string | null;
  note: string | null;
  lat: number | null;
  lng: number | null;
  /** Parallel-party label when a day branches (Denmark, D6-46). Null on a shared stop. */
  branch: string | null;
}

export interface TripDay {
  idx: number;
  date: string;
  title: string;
  tldr: string | null;
  fit: string | null;
  pace: string | null;
  env: string | null;
  stops: TripStop[];
  planB: { trigger: "rain" | "closure"; body: string } | null;
  /** Stable itinerary anchor this day renders under — the deep link every projection uses. */
  anchor: string;
}

export function tripPhase(firstDayDate: string | null, lastDayDate: string | null, now: Date): TripPhase {
  const win = tripWindow(firstDayDate, lastDayDate, now);
  if (!win.hasDates) return "undated";
  if (win.isOngoing) return "active";
  if (win.isPast) return "post";
  return "pre";
}

/** Which day is today, by the shared dayState derivation — -1 outside the trip. */
export function todayIndex(dates: readonly string[], now: Date): number {
  for (let i = 0; i < dates.length; i++) if (dayState([...dates], i, now) === "now") return i;
  return -1;
}

/** First HH:MM in a stop's display time ("~06:15", "17:00–21:00" → 17:00), else null.
    "morning" / "evening" / "from 11:30" style windows: only a real clock time parses, so a
    flexible window is left flexible rather than pinned to an invented minute. */
export function parseStartMinutes(time: string | null | undefined): number | null {
  const m = /(\d{1,2}):(\d{2})/.exec(String(time || ""));
  if (!m) return null;
  const h = parseInt(m[1], 10), mm = parseInt(m[2], 10);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}

export interface Focus {
  /** The stop the traveler is in, or about to be in. */
  now: TripStop | null;
  next: TripStop | null;
  /** Everything after `next`, in order. */
  later: TripStop[];
  /** Stops already behind the clock (or already checked off). */
  done: TripStop[];
  /** True when at least one stop carries a real clock time — the timed cursor is meaningful. */
  timed: boolean;
}

/**
 * Now → Next → the rest, for one day.
 *
 * With clock times: the last stop whose start has passed is "now", the first whose start is
 * ahead is "next". Untimed stops between them keep their listed order. Without any clock
 * time (Denmark's "morning"/"evening" days): the first stop not checked off is "now" and the
 * one after it "next" — the day's own order is the only honest cursor there is.
 * `done` is an index set of checked-off stops (field-tools' per-device state), so the cursor
 * respects what the traveler has actually ticked.
 */
export function focusFor(stops: readonly TripStop[], nowMinutes: number | null, done: ReadonlySet<number> = new Set()): Focus {
  const empty: Focus = { now: null, next: null, later: [], done: [], timed: false };
  if (!stops.length) return empty;
  const timed = stops.some((s) => parseStartMinutes(s.time) !== null);
  const remaining: TripStop[] = [];
  const past: TripStop[] = [];
  let nowIdx = -1;
  if (timed && nowMinutes !== null) {
    stops.forEach((s, i) => {
      const t = parseStartMinutes(s.time);
      if (done.has(i)) { past.push(s); return; }
      if (t !== null && t <= nowMinutes) { nowIdx = i; }
    });
    // Everything up to the most recent started stop is behind us, except the current one.
    stops.forEach((s, i) => {
      if (done.has(i)) return;
      if (i < nowIdx) past.push(s);
      else remaining.push(s);
    });
  } else {
    stops.forEach((s, i) => { if (done.has(i)) past.push(s); else remaining.push(s); });
  }
  const [now = null, next = null, ...later] = remaining;
  return { now, next, later, done: past, timed };
}

/** Whole days until the first day, from the shared window — null when undated. */
export function daysToGo(firstDayDate: string | null, lastDayDate: string | null, now: Date): number | null {
  const win = tripWindow(firstDayDate, lastDayDate, now);
  if (!win.hasDates) return null;
  return win.daysUntilStart;
}
