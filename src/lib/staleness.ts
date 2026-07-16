/* Per-fact staleness — the pure decision layer behind the recert audit and the
   (Phase 5) warning-tone UI. A fact's `verified_on` date plus its category's
   shelf life decide whether it may still present as "verified" or must visibly
   downgrade. Clock is injected (WayPoint-V2 retrospective: injected clocks make
   date logic trivially testable) — callers pass `now`; only the CLI default
   reaches for the real clock. */

/** Days a category of perishable fact may present as verified before it must
    visibly downgrade. Calibrated to how fast each actually drifts. */
export const SHELF_LIFE_DAYS = {
  fx: 7,          // exchange rates
  transit: 90,    // schedules, fares, route numbers
  hours: 90,      // opening hours, admission prices
  venue: 180,     // existence/location of a venue
  default: 90,
} as const;

export type ShelfLifeCategory = keyof typeof SHELF_LIFE_DAYS;

export interface Staleness {
  /** Whole days since verified_on (floor; 0 = verified today). */
  ageDays: number;
  /** True once ageDays exceeds the shelf life — the fact must downgrade. */
  stale: boolean;
  /** Days remaining until stale (negative = days past). */
  remainingDays: number;
}

/**
 * Judge one fact. `verifiedOn` is a YYYY-MM-DD string (the schema's
 * `verified_on` shape); `shelfLifeDays` a day count or a named category.
 * Returns null for a missing/unparseable date — the caller decides how an
 * unverified fact renders (never silently "fresh").
 */
export function staleness(
  verifiedOn: string | null | undefined,
  shelfLifeDays: number | ShelfLifeCategory,
  now: Date,
): Staleness | null {
  if (!verifiedOn) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(verifiedOn);
  if (!m) return null;
  const then = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  if (Number.isNaN(then)) return null;
  const life = typeof shelfLifeDays === "number" ? shelfLifeDays : SHELF_LIFE_DAYS[shelfLifeDays];
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const ageDays = Math.floor((nowUTC - then) / 86_400_000);
  return { ageDays, stale: ageDays > life, remainingDays: life - ageDays };
}
