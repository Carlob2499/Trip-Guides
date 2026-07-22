/* Trip-date label resolution — pure, clock-injected, shared.
   Guides label days as "Wed Jul 8": weekday, month, day, and NO YEAR. Three separate
   consumers need a real Date from that (the countdown, the weather window, the day rail),
   and each one has to answer the same question — which year? — identically, or they
   disagree about when the trip is.

   Lived in guide-ui.js as a closure function with no tests. The year-rollover rule below
   is the kind of logic that fails silently and only in December. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Resolve a guide's day label ("Wed Jul 8") to a Date, inferring the year.
 *
 * The rule: assume the current year, UNLESS that lands the date more than 180 days in the
 * past — then assume next year. That's what makes a guide written in December for a January
 * trip resolve forward instead of pointing at a January that already happened. The 180-day
 * threshold (not "any past date") is deliberate: a trip that ended last week must stay in
 * the past, or a just-finished guide would claim to be upcoming.
 *
 * Returns null when the label isn't a calendar date — some guides use relative labels like
 * "Day 1", and those guides legitimately have no trip dates. Null is the caller's signal to
 * fall back to no-trip-date behaviour, never an error.
 *
 * `now` is injected: date logic that reaches for the real clock can't be tested.
 */
export function resolveTripDate(str: string | null | undefined, now: Date): Date | null {
  if (!str) return null;
  const parts = String(str).split(/\s+/);
  const moIdx = MONTHS.indexOf(parts[1]);
  const day = parseInt(parts[2], 10);
  if (moIdx === -1 || isNaN(day)) return null;
  const d = new Date(now.getFullYear(), moIdx, day);
  if (d < now && (now.getTime() - d.getTime()) > 180 * 86400000) d.setFullYear(now.getFullYear() + 1);
  return d;
}

/**
 * "YYYY-MM-DD" from a Date's LOCAL calendar components — never `.toISOString()`, which
 * converts to UTC first. R2: a Date built at LOCAL midnight (e.g. `new Date(y, m, d)`)
 * shifts to the PREVIOUS calendar day once `.toISOString()` converts it to UTC for any
 * negative UTC offset (all of the Americas) — so a trip starting local-midnight Jan 15
 * came out of `.toISOString().slice(0,10)` as "2026-01-14". Comparing that string against
 * another built the same wrong way looked consistent locally but drifted a full day for
 * anyone west of UTC, which is exactly how the hub and a guide page's countdown could
 * disagree, and how the grid could mis-sort a trip starting "today" as already past.
 */
export function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface TripWindow {
  start: Date | null;
  end: Date | null;
  /** True when the guide has usable calendar labels (not "Day 1" style). */
  hasDates: boolean;
  /** Inclusive day count; 0 when there are no dates. */
  lengthDays: number;
  /** Today is past the last day — the trip is over. */
  isPast: boolean;
  /** Today falls within [start, end] inclusive. */
  isOngoing: boolean;
  /** Whole days until the trip starts; negative once started, 0 when no dates. */
  daysUntilStart: number;
}

/**
 * Resolve both ends of a trip and everything the callers derive from them, in one place —
 * so the countdown, the weather window and anything later can't drift apart on what
 * "ongoing" or "past" means.
 *
 * Guards a malformed range (end before start) by clamping end to start rather than
 * producing a negative length that would poison every downstream calculation.
 */
export function tripWindow(
  firstDayDate: string | null | undefined,
  lastDayDate: string | null | undefined,
  now: Date,
): TripWindow {
  const start = resolveTripDate(firstDayDate, now);
  let end = start ? (resolveTripDate(lastDayDate, now) || start) : null;
  if (start && end && end < start) end = start; // defensive: malformed data
  const hasDates = !!start;
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lengthDays = hasDates && end ? Math.round((end.getTime() - start!.getTime()) / 86400000) + 1 : 0;
  return {
    start,
    end,
    hasDates,
    lengthDays,
    isPast: hasDates && !!end && todayMid > end,
    isOngoing: hasDates && !!end && todayMid >= start! && todayMid <= end,
    daysUntilStart: hasDates ? Math.round((start!.getTime() - todayMid.getTime()) / 86400000) : 0,
  };
}
