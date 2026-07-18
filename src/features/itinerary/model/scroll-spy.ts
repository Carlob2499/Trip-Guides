/**
 * Pure active-day selection for the day-rail scroll-spy, isolated from
 * getBoundingClientRect so the picking rule is testable. The UI measures the
 * day cards each frame and hands the raw numbers here.
 */

/**
 * Horizontal deck (phone): the index of the card whose center is nearest the
 * viewport center. Ties resolve to the earliest index (first strictly-nearer
 * wins), matching a forward scan. Empty input → 0.
 */
export function nearestToCenter(centers: number[], viewportCenter: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const d = Math.abs(centers[i] - viewportCenter);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/**
 * Vertical list/page: the last card whose top has crossed the fold threshold
 * (top - threshold <= 0), scanning from the top and stopping at the first card
 * still below the fold. Card tops are in document order (monotonic), so this is
 * the deepest fully-scrolled-past day. Nothing crossed yet → 0.
 *
 * Takes `topAt(i)` as a lazy accessor rather than a precomputed array
 * specifically so the early break avoids measuring cards past the fold — the UI
 * hands in `i => dayEls[i].getBoundingClientRect().top`, and each rect read
 * forces layout, so on a long itinerary reading only down to the fold (instead
 * of every day) matters in the scroll hot path.
 */
export function lastAboveFold(count: number, topAt: (i: number) => number, threshold: number): number {
  let idx = 0;
  for (let i = 0; i < count; i++) {
    if (topAt(i) - threshold <= 0) idx = i;
    else break;
  }
  return idx;
}
