/* Recurring closures — which of the trip's own places are shut on which weekday, scanned
   out of the guide's `closed_days` data (design-handoff README §5: "Recurring closures are
   scanned out of each guide's own sight entries and carry their check dates").

   The public-holiday half of the Closures tool is `src/lib/holidays.ts` — already written,
   already tested, and NOT duplicated here. This module answers the other question: it is
   Tuesday, what is shut?

   `closed_days` is structured data precisely so this can be a lookup rather than a prose
   read (content.config.ts's own comment on the `visitable` fields). A venue whose closure
   is only stated in prose does not appear here, and that is the honest outcome — inferring
   it from a sentence would be a guess. */

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

/** JS `Date#getDay()` is Sunday-first; the schema's list is Monday-first. */
const BY_JS_DAY: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function weekdayOf(date: Date): Weekday {
  return BY_JS_DAY[date.getDay()];
}

export interface ClosedPlace {
  name: string;
  /** The section it came from, so a reader can go back to the entry itself. */
  from: string;
  verifiedOn: string | null;
  sourceUrl: string | null;
}

export interface ClosureDay {
  day: Weekday;
  label: string;
  places: ClosedPlace[];
}

export interface ClosureScanSource {
  type?: string;
  title?: string;
  group?: string;
  items?: {
    name?: string;
    closed_days?: string[];
    verified_on?: string;
    source_url?: string;
  }[];
}

/**
 * Group every place with a `closed_days` entry by the weekday it is shut. Only weekdays
 * that actually close something are returned, in Monday-first order; a guide whose entries
 * carry no `closed_days` returns an empty array, which the surface renders as an admitted
 * blank rather than a reassuring "nothing closes".
 */
export function buildClosures(sections: ClosureScanSource[] | null | undefined): ClosureDay[] {
  if (!Array.isArray(sections)) return [];
  const byDay = new Map<Weekday, ClosedPlace[]>();

  for (const s of sections) {
    if (!s || !Array.isArray(s.items)) continue;
    const from = s.title || s.group || s.type || "The guide";
    for (const it of s.items) {
      if (!it || !it.name || !Array.isArray(it.closed_days) || !it.closed_days.length) continue;
      const place: ClosedPlace = {
        name: it.name,
        from,
        verifiedOn: it.verified_on ?? null,
        sourceUrl: it.source_url ?? null,
      };
      for (const raw of it.closed_days) {
        const d = String(raw).toLowerCase() as Weekday;
        if (!WEEKDAYS.includes(d)) continue;
        const list = byDay.get(d) ?? [];
        // A place listed twice under one weekday (two sections carrying the same venue)
        // would read as two different closures.
        if (!list.some((p) => p.name === place.name)) list.push(place);
        byDay.set(d, list);
      }
    }
  }

  return WEEKDAYS
    .filter((d) => (byDay.get(d) ?? []).length > 0)
    .map((d) => ({ day: d, label: WEEKDAY_LABEL[d], places: byDay.get(d)! }));
}

/** How many distinct places the scan found — the honest denominator for "we checked N". */
export function closureCount(days: ClosureDay[]): number {
  const names = new Set<string>();
  for (const d of days) for (const p of d.places) names.add(p.name);
  return names.size;
}
