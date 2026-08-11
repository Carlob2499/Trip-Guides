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
  const parsed = parseMonthDay(str);
  if (!parsed) return null;
  const d = new Date(now.getFullYear(), parsed.moIdx, parsed.day);
  if (d < now && (now.getTime() - d.getTime()) > 180 * 86400000) d.setFullYear(now.getFullYear() + 1);
  return d;
}

/** The label's month/day components, or null when it isn't a calendar date ("Day 1"). */
function parseMonthDay(str: string | null | undefined): { moIdx: number; day: number } | null {
  if (!str) return null;
  const parts = String(str).split(/\s+/);
  const moIdx = MONTHS.indexOf(parts[1]);
  const day = parseInt(parts[2], 10);
  if (moIdx === -1 || isNaN(day)) return null;
  return { moIdx, day };
}

/**
 * Resolve a day label into a KNOWN year — no inference at all. The now-relative rule above
 * exists for surfaces judged against the reader's clock (countdowns, weather windows), and
 * its 180-day rollover deliberately moves a long-finished trip into next year. That is
 * exactly wrong for anything that must stay STABLE across build dates — the sheet ordinal
 * (D6) would silently renumber every masthead plate the first time a build ran more than
 * 180 days after a trip ended. When the year is actually known (a guide's kicker states it:
 * "Jul 8–15, 2026"), resolve against it and skip inference entirely.
 */
export function resolveTripDateInYear(str: string | null | undefined, year: number): Date | null {
  const parsed = parseMonthDay(str);
  if (!parsed) return null;
  return new Date(year, parsed.moIdx, parsed.day);
}

/**
 * tripWindow with the year pinned (see resolveTripDateInYear). A range that wraps the year
 * boundary (Dec 28 – Jan 4) rolls its END into `year + 1` rather than clamping to start —
 * the label year names the trip's START.
 */
export function tripWindowInYear(
  firstDayDate: string | null | undefined,
  lastDayDate: string | null | undefined,
  year: number,
  now: Date,
): TripWindow {
  const start = resolveTripDateInYear(firstDayDate, year);
  let end = start ? (resolveTripDateInYear(lastDayDate, year) || start) : null;
  if (start && end && end < start) end = new Date(year + 1, end.getMonth(), end.getDate());
  return windowFrom(start, end, now);
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
  return windowFrom(start, end, now);
}

/** The window math both builders share — everything derived from an already-resolved pair. */
function windowFrom(start: Date | null, end: Date | null, now: Date): TripWindow {
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

/** A day's position relative to the reader's own present. */
export type DayState = "done" | "now" | "next" | "planned";

/**
 * Resolve one day of a trip against a given "now" (R5 COMPONENTS.md §4, SCREENS.md §3).
 *
 * The rule that matters most is the one about ABSENCE: **`now` exists only if today falls
 * inside the trip.** A pre-trip guide has no `now` day — day 1 is selected because it is first,
 * not because it is current — and a finished trip has none either. Inventing a present moment
 * for a trip nobody is on is the same class of error as a seeded expense ledger: a claim about
 * the reader's situation that nobody checked.
 *
 * `next` is the single day immediately after `now`, and it too exists only mid-trip: on a
 * pre-trip guide every day reads `planned`, because calling day 1 "next" would imply a
 * departure the guide cannot see.
 *
 * Returns null for a day whose date string cannot be resolved — an unknown date gets no state
 * rather than a guessed one.
 */
export function dayState(
  dayDates: Array<string | null | undefined>,
  index: number,
  now: Date,
): DayState | null {
  const dates = dayDates.map((d) => resolveTripDate(d, now));
  const self = dates[index];
  if (!self) return null;

  const today = localISODate(now);
  const iso = (d: Date | null) => (d ? localISODate(d) : null);

  // Is today one of the trip's own days? Compared as local calendar dates, not timestamps: a
  // reader at 23:50 and one at 00:10 the same evening are on different days, and only the
  // calendar comparison agrees with what their phone says the date is.
  const currentIndex = dates.findIndex((d) => iso(d) === today);
  const inTrip = currentIndex >= 0;

  if (!inTrip) {
    // Outside the trip there is no present to be near. Every day before today is done; every
    // day after is planned. Never `now`, never `next`.
    return iso(self)! < today ? "done" : "planned";
  }

  if (index === currentIndex) return "now";
  if (index === currentIndex + 1) return "next";
  return index < currentIndex ? "done" : "planned";
}

/**
 * The trip's window as one label — `Jul 8–15, 2026`, or `Oct 15–Nov 10, 2026` when it
 * crosses a month.
 *
 * Formatted from the window's own `Date`s rather than sliced out of the guide's kicker.
 * `dateLine()` looks like it would do this and does not: its contract is "whatever
 * `cityLine` takes, this leaves", so a kicker with no city list — `Sedona, Arizona — Sep
 * 2–8, 2026` — correctly comes back whole, and the hub's record rail printed the place name
 * inside its date column. Two different questions, so two different functions.
 *
 * Null when either end is missing: a half-known window is not a range, and the surfaces that
 * call this print nothing rather than an open-ended one.
 */
export function tripRangeLabel(start: Date | null, end: Date | null): string | null {
  if (!start || !end) return null;
  const mon = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const head = sameMonth
    ? `${mon(start)} ${start.getDate()}–${end.getDate()}`
    : `${mon(start)} ${start.getDate()}–${mon(end)} ${end.getDate()}`;
  return `${head}, ${end.getFullYear()}`;
}
