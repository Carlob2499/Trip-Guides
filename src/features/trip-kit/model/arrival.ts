// Arrival autopilot (docs/FEATURES.md #5) — derives a focused arrival view from the
// guide's OWN Day 1 data. No new schema, no fabricated content: Day 1 is already the
// convention this codebase uses for "arrival day" (the jet-lag calculator and trip
// countdown both key off it the same way). This just re-plates its existing
// waypoints/checklist/fit for a stressed, jet-lagged traveler in one focused view
// instead of buried in the long day-by-day scroll.

export type ArrivalStep = {
  name: string;
  time: string | null;
  note: string | null;
  lat: number | null;
  lng: number | null;
};

export type ArrivalPlan = {
  date: string;
  title: string;
  tldr: string | null;
  fit: string | null;
  steps: ArrivalStep[];
  checklist: string[];
} | null;

export function deriveArrivalPlan(days: any[] | null | undefined): ArrivalPlan {
  const d0 = Array.isArray(days) ? days[0] : null;
  if (!d0 || !d0.date) return null;
  return {
    date: d0.date,
    title: d0.title || d0.date,
    tldr: d0.tldr || null,
    fit: d0.fit || null,
    steps: (d0.waypoints || []).map((w: any) => ({
      name: w.name,
      time: w.time ?? null,
      note: w.note ?? null,
      lat: Number.isFinite(w.lat) ? w.lat : null,
      lng: Number.isFinite(w.lng) ? w.lng : null,
    })),
    checklist: Array.isArray(d0.checklist) ? d0.checklist : [],
  };
}
