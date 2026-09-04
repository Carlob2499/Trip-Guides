/* The canonical itinerary projection every surface reads — Trip's Now/Next, Itinerary's
   timeline, Map's day lens, Search's day/stop records, the masthead's next leg. ONE object,
   many projections (design-system.md D6-26): a day here is the day the guide authored, with
   the same stop order, the same times and the same coordinates. Nothing is invented for a
   layout's convenience: a stop with no time keeps time:null, a stop with no coordinates keeps
   lat/lng:null, and a day with no waypoints has an empty list.

   This replaced the Story-mode `#storyDays` payload (D6-45): that data had a non-Story
   consumer (the plate line's next leg), so the payload moved to a neutral owner before the
   Story feature was deleted. */

import type { TripDay, TripStop } from "./lifecycle";

interface WaypointLike { name?: string; time?: string; note?: string; lat?: number; lng?: number; branch?: string }
interface BranchLike { label: string; body?: string; waypoints?: WaypointLike[] }
interface DayLike {
  date?: string; title?: string; tldr?: string; fit?: string; pace?: string; env?: string;
  waypoints?: WaypointLike[]; branches?: BranchLike[];
  plan_b?: { trigger: "rain" | "closure"; body: string } | null;
}

function toStop(w: WaypointLike, branch: string | null): TripStop {
  return {
    name: String(w.name || ""),
    time: w.time ? String(w.time) : null,
    note: w.note ? String(w.note) : null,
    lat: Number.isFinite(w.lat) ? (w.lat as number) : null,
    lng: Number.isFinite(w.lng) ? (w.lng as number) : null,
    branch: branch ?? (w.branch ? String(w.branch) : null),
  };
}

/** Stops of one day in traveler order: shared stops first, then each branch's own stops
    carrying that branch's label — a branched day never collapses into one fake route. */
export function dayStops(d: DayLike): TripStop[] {
  const shared = (d.waypoints || []).map((w) => toStop(w, null));
  const branched = (d.branches || []).flatMap((b) => (b.waypoints || []).map((w) => toStop(w, b.label)));
  return [...shared, ...branched];
}

export function deriveTripDays(days: readonly DayLike[] | null | undefined): TripDay[] {
  return (days || []).map((d, idx) => ({
    idx,
    date: String(d.date || ""),
    title: String(d.title || d.date || ""),
    tldr: d.tldr ? String(d.tldr) : null,
    fit: d.fit ? String(d.fit) : null,
    pace: d.pace ? String(d.pace) : null,
    env: d.env ? String(d.env) : null,
    stops: dayStops(d),
    planB: d.plan_b ? { trigger: d.plan_b.trigger, body: d.plan_b.body } : null,
    anchor: `day-${idx}`,
  }));
}
