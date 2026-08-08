/* closed_days (D11 — CLAUDE.md/PLAN_ATLAS_MIGRATION.md Stage A.3): the visitable schema's
   structured weekday-closure field. Plain .mjs (not .ts), same reason facts.mjs/issue-forms.mjs
   are: this needs importing from BOTH an Astro/TS surface (SightsBlock.astro's Closed row) and
   a plain-`node` build script (scripts/check-closed-days.mjs's itinerary cross-check) with one
   source of truth, and a script that runs inside `npm run build` (no tsx) cannot import .ts.
   Pure + tested; no I/O here. */

const WEEKDAY_BY_INDEX = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const WEEKDAY_LABEL = {
  mon: "Mondays", tue: "Tuesdays", wed: "Wednesdays", thu: "Thursdays",
  fri: "Fridays", sat: "Saturdays", sun: "Sundays",
};

/** JS `Date#getDay()` (0 = Sunday) to the schema's 3-letter weekday code. */
export function weekdayOf(d) {
  return WEEKDAY_BY_INDEX[d.getDay()];
}

/** "Closed Tuesdays" / "Closed Sundays, Mondays" — null when there's nothing to say
    (honest absence: a sight/venue with no closed_days renders no row at all). */
export function formatClosedDays(days) {
  if (!days || !days.length) return null;
  return `Closed ${days.map((d) => WEEKDAY_LABEL[d] ?? d).join(", ")}`;
}

export function fallsOnClosedDay(weekday, closedDays) {
  return !!closedDays && closedDays.includes(weekday);
}

const normalizeName = (s) => s.trim().toLowerCase();

/**
 * Cross-check itinerary waypoints against the closed_days of the sight/venue they name.
 * Matched by exact name (case/whitespace-insensitive) — waypoints carry no id to match by.
 * A waypoint whose name matches no visitable item, or matches one with no closed_days,
 * produces no warning: absence is not evidence of a conflict.
 *
 * @param {{guideSlug: string, dayDate: string, weekday: string, waypointName: string}[]} days
 *   `weekday` is the CALLER's resolved calendar weekday — never re-derived from `dayDate`'s
 *   label here (a mislabeled "Wed" is exactly the kind of error this check exists to catch).
 * @param {{name: string, closedDays: string[] | null | undefined}[]} visitables
 */
export function checkClosedDayConflicts(days, visitables) {
  const byName = new Map();
  for (const v of visitables) {
    if (v.closedDays && v.closedDays.length) byName.set(normalizeName(v.name), v);
  }
  const warnings = [];
  for (const d of days) {
    const match = byName.get(normalizeName(d.waypointName));
    if (match && fallsOnClosedDay(d.weekday, match.closedDays)) {
      warnings.push({
        guideSlug: d.guideSlug, dayDate: d.dayDate, waypointName: d.waypointName,
        matchedName: match.name, weekday: d.weekday,
      });
    }
  }
  return warnings;
}
