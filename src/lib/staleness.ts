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

/**
 * SPEC-COMPONENTS §2's staleness wording, in ONE place.
 *
 * Two surfaces print this reading — the popover's Status row (provenance-dot.js) and the
 * section title-row pill (staleness-ui.js) — and they had drifted into describing the same
 * judgment two different ways: the popover said "⚠ 118 DAYS OLD — 28 PAST ITS HOURS SHELF
 * LIFE" while the pill beside it said "⚠ verified 2026-04-02 — re-check", which names a date
 * but never says how far past its life the fact actually is. One declaration, so they cannot
 * disagree again; the module header's own twin-declaration warning is the precedent.
 *
 * Returns null with room to spare — SPEC: "otherwise → no staleness line at all. Silence is
 * the healthy state." A caller that draws something on the healthy path (the ✓ CHECKED stamp)
 * decides that for itself.
 *
 * `glyph` is handed back SEPARATE from `label` (rather than baked into one string) because the
 * flag-chip surface has to wrap it in an aria-hidden element — a screen reader announcing
 * "warning sign" before a sentence that already says the fact is past its shelf life is the
 * glyph's meaning read twice. Callers that need the whole line compose the two.
 */
export interface StalenessReading {
  /** "⚠" on a downgrade, "" on the ageing heads-up. Decorative — hide it from AT. */
  glyph: string;
  /** The reading itself, with no leading glyph. */
  label: string;
  /** True once the fact is past its shelf life (ochre/warn tone), not merely ageing. */
  warn: boolean;
}

export function stalenessReading(s: Staleness, category: ShelfLifeCategory): StalenessReading | null {
  const life = SHELF_LIFE_DAYS[category];
  if (s.stale) {
    return {
      glyph: "⚠",
      label: `${s.ageDays} DAYS OLD — ${s.ageDays - life} PAST ITS ${category.toUpperCase()} SHELF LIFE`,
      warn: true,
    };
  }
  // "Inside the last third" of shelf life — a heads-up, not yet a downgrade.
  if (s.remainingDays <= life / 3) {
    return { glyph: "", label: `AGEING — ${s.remainingDays} DAYS OF SHELF LIFE LEFT`, warn: false };
  }
  return null;
}
