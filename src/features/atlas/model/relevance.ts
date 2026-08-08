/* Table view's relevance sort (README §3, "sorted by relevance to today: in-progress →
   upcoming → most recent") — distinct from D6's `sheetOrder()`, which is a fixed,
   content-pinned chronological ordinal (the plate number) that never moves with the clock.
   This one is deliberately now-relative: it decides which sheet is the quick card and in
   what order the full sheet list reads, and both must re-sort as trips start and finish. */

import type { TripStatus } from "./guide-record";

export interface RelevanceInput {
  status: TripStatus;
  start: Date | null;
  end: Date | null;
}

const RANK: Record<TripStatus, number> = { ongoing: 0, upcoming: 1, past: 2, undated: 3 };

/** Sort records by relevance to `now`: ongoing first, then upcoming (soonest start first),
    then past (most recently finished first), undated last. Stable within a rank when the
    tiebreak date is absent — never throws on a null date, since `undated` guides carry one. */
export function relevanceOrder<T extends RelevanceInput>(records: readonly T[]): T[] {
  return [...records].sort((a, b) => {
    const ra = RANK[a.status], rb = RANK[b.status];
    if (ra !== rb) return ra - rb;
    if (a.status === "upcoming") return (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity);
    if (a.status === "past") return (b.end?.getTime() ?? -Infinity) - (a.end?.getTime() ?? -Infinity);
    return 0;
  });
}

/** The quick card's kicker string — one of exactly three (SPEC-COMPONENTS.md §5), or null
    when nothing is relevant enough to feature (every guide undated: an honest absence, not a
    guessed pick). */
export function quickCardKicker(status: TripStatus): "ON THIS TRIP NOW" | "NEXT TRIP" | "MOST RECENT" | null {
  if (status === "ongoing") return "ON THIS TRIP NOW";
  if (status === "upcoming") return "NEXT TRIP";
  if (status === "past") return "MOST RECENT";
  return null;
}
