/* Sheet ordinal (D6, PLAN_ATLAS_MIGRATION.md) — ONE derivation, chronological by trip
   start date, feeding the hub index, table rows, the ping sheet, AND the masthead plate
   number ("PLATE NN — <CC>", Stage A.5/D13) — so none of them can ever disagree about
   which guide is "01". Content is king: the input is each guide's OWN first/last day date
   label (as already extracted via flattenSections + the `days` sections, the same way
   src/pages/index.astro derives its trip-date badge), never a hand-filled ordinal. */

import { tripWindow, tripWindowInYear } from "./trip-dates";

export interface SheetOrderInput {
  slug: string;
  /** The guide's first/last day date labels ("Wed Jul 8"), or null/undefined for a guide
      with no calendar-dated days (e.g. "Day 1" style) — same shape tripWindow() takes. */
  firstDayDate: string | null | undefined;
  lastDayDate: string | null | undefined;
  /** The guide's own kicker ("Seoul · Daejeon — Jul 8–15, 2026"). When it carries a year,
      that year PINS the trip dates (tripWindowInYear) instead of the now-relative inference —
      which is what keeps ordinals stable across build dates: without it, trip-dates' 180-day
      rollover resolves a long-finished trip into NEXT year, and the first build more than
      ~6 months after a trip ended would silently renumber every guide's plate. */
  kicker?: string | null;
}

/** The first 4-digit year in a kicker, or null. Content is king: the kicker is guide
    content that states the trip's year — the one place the year exists at all, since day
    labels ("Wed Jul 8") deliberately carry none. */
export function yearFromKicker(kicker: string | null | undefined): number | null {
  const m = String(kicker ?? "").match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1], 10) : null;
}

export interface SheetOrderEntry {
  slug: string;
  /** 1-based. */
  ordinal: number;
}

/**
 * Chronological ordinal by trip start date. Guides with no resolvable start date sort
 * LAST (in their given input order among themselves) — a guide can't earn a chronological
 * position it has no date to justify, but it still needs some stable number to plate.
 *
 * `now` is injected (year-inference for label dates like "Wed Jul 8" depends on it) —
 * date logic that reaches for the real clock can't be tested.
 */
export function sheetOrder(guides: readonly SheetOrderInput[], now: Date): SheetOrderEntry[] {
  const withStart = guides.map((g) => {
    const year = yearFromKicker(g.kicker);
    const win = year != null
      ? tripWindowInYear(g.firstDayDate, g.lastDayDate, year, now)
      : tripWindow(g.firstDayDate, g.lastDayDate, now);
    return { slug: g.slug, start: win.start };
  });
  const dated = withStart
    .filter((g) => g.start !== null)
    .sort((a, b) => a.start!.getTime() - b.start!.getTime());
  const undated = withStart.filter((g) => g.start === null);
  return [...dated, ...undated].map((g, i) => ({ slug: g.slug, ordinal: i + 1 }));
}

/** Convenience lookup for a single guide's ordinal out of a computed order — the masthead
    only needs its own guide's number, not the whole list. */
export function ordinalFor(order: readonly SheetOrderEntry[], slug: string): number | null {
  return order.find((e) => e.slug === slug)?.ordinal ?? null;
}
