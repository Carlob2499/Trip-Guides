/* Route order — the trip-wide view of the same advice the day cards already give as a chip.
   The optimiser itself is `src/lib/route-optimize.ts` (nearest-neighbour then
   2-opt, unit-tested there); this module only asks it about every day at once and attaches
   the leg distances the Tools screen prints.

   Every distance is STRAIGHT-LINE (haversine). That is stated on the surface, not implied:
   a "2.1 km" leg through a river with one bridge is not a 2.1 km walk, and a tool that lets
   a reader believe otherwise is worse than one that says nothing. */

import { haversineKm, routeDistance, optimizeDayRoute } from "../../../lib/route-optimize";

export interface RoutePoint { name: string; lat: number; lng: number }

export interface RouteLeg { from: string; to: string; km: number }

export interface RouteDay {
  /** The day's own date label, verbatim from the guide ("Thu Oct 15"). */
  date: string;
  title: string;
  /** Located stops only — an unmapped stop cannot be ordered and is counted separately. */
  points: RoutePoint[];
  /** Stops the day carries that have no coordinates yet. */
  unlocatedCount: number;
  /** The guide's own order, as legs. */
  legs: RouteLeg[];
  currentKm: number;
  /** Present only when reordering genuinely helps — otherwise the day says so. */
  suggestion: { order: number[]; names: string[]; legs: RouteLeg[]; km: number; savedKm: number } | null;
}

function legsFor(points: RoutePoint[], order: number[]): RouteLeg[] {
  const out: RouteLeg[] = [];
  for (let i = 1; i < order.length; i++) {
    const a = points[order[i - 1]], b = points[order[i]];
    out.push({ from: a.name, to: b.name, km: haversineKm(a, b) });
  }
  return out;
}

export interface RouteDaySource {
  date?: string;
  title?: string;
  waypoints?: { name?: string; lat?: number; lng?: number }[];
}

/**
 * Build a per-day route reading for every day that has at least two located stops. Days
 * with fewer are omitted entirely rather than listed as "nothing to optimise" — a list of
 * empty rows is noise, and the count of skipped days is reported alongside instead.
 */
export function buildRoutePlan(days: RouteDaySource[] | null | undefined): RouteDay[] {
  if (!Array.isArray(days)) return [];
  const out: RouteDay[] = [];

  for (const d of days) {
    if (!d || !Array.isArray(d.waypoints) || !d.waypoints.length) continue;
    const points: RoutePoint[] = [];
    let unlocated = 0;
    for (const w of d.waypoints) {
      if (!w || !w.name) continue;
      if (typeof w.lat === "number" && typeof w.lng === "number") points.push({ name: w.name, lat: w.lat, lng: w.lng });
      else unlocated++;
    }
    if (points.length < 2) continue;

    const guideOrder = points.map((_, i) => i);
    const opt = optimizeDayRoute(points);
    const suggestion = opt
      ? {
          order: opt.order,
          names: opt.order.map((i) => points[i].name),
          legs: legsFor(points, opt.order),
          km: routeDistance(points, opt.order),
          savedKm: opt.savedKm,
        }
      : null;

    out.push({
      date: d.date || "",
      title: d.title || "",
      points,
      unlocatedCount: unlocated,
      legs: legsFor(points, guideOrder),
      currentKm: routeDistance(points, guideOrder),
      suggestion,
    });
  }

  return out;
}

/** One decimal is the honest precision for a straight-line estimate off rounded coordinates. */
export function km(n: number): string {
  return `${Math.round(n * 10) / 10} km`;
}
