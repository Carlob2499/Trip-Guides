/* Post-trip recap atoms (design-system.md D6-33) — a few large, meaningful outcomes derived
   from the guide's own curated post-mortem and its own itinerary. Not analytics: every number
   is a count of things the guide actually recorded, and an absent record yields an absent
   atom, never a zero dressed up as a result. */

export interface LearningsLike {
  summary?: string;
  keyLearnings?: string[];
  changed?: string[];
  verified_on?: string;
  days?: { date: string; actually?: string; skipped?: { stop: string; reason?: string; group?: string }[] }[];
}

export interface RecapAtoms {
  /** Planned stops across the itinerary (waypoints the guide carried). */
  plannedStops: number;
  /** Stops the post-mortem recorded as skipped. */
  skippedStops: number;
  /** Planned minus skipped — only when the post-mortem covers the trip, else null. */
  hitStops: number | null;
  daysReviewed: number;
  dayCount: number;
  /** The days whose plan changed, with what actually happened — the major Plan-vs-Actual. */
  changedDays: { date: string; actually: string | null; skipped: { stop: string; reason: string | null }[] }[];
}

export function deriveRecap(
  days: readonly { date: string; stops: readonly unknown[] }[],
  learnings: LearningsLike | null | undefined,
): RecapAtoms | null {
  const reviewed = learnings?.days ?? [];
  if (!learnings || (!learnings.summary && reviewed.length === 0)) return null;
  const plannedStops = days.reduce((n, d) => n + d.stops.length, 0);
  const skippedStops = reviewed.reduce((n, d) => n + (d.skipped?.length ?? 0), 0);
  const changedDays = reviewed
    .filter((d) => d.actually || (d.skipped?.length ?? 0) > 0)
    .map((d) => ({
      date: d.date,
      actually: d.actually ?? null,
      skipped: (d.skipped ?? []).map((s) => ({ stop: s.stop, reason: s.reason ?? null })),
    }));
  return {
    plannedStops,
    skippedStops,
    hitStops: reviewed.length > 0 && plannedStops > 0 ? Math.max(0, plannedStops - skippedStops) : null,
    daysReviewed: reviewed.length,
    dayCount: days.length,
    changedDays,
  };
}
