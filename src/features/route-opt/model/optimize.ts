/* Day-route optimizer — pure geometry, no DOM (docs/PLAN_FIELD_REPORT_FIXES.md E7).
   Advisory only: this never decides anything for the traveler, it just answers
   "would reordering this day's located stops meaningfully shorten the walk/drive?"
   Only waypoints with real lat/lng participate — a stop with no coords is neither
   reordered nor allowed to break the distance math, it's simply excluded from
   consideration, and `order` maps back to indices in the ORIGINAL waypoints array
   so the caller can place the untouched ones exactly where they already were. */

export type OptWaypoint = { lat?: number; lng?: number };
export type OptimizeResult = { order: number[]; savedKm: number; currentKm: number } | null;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function routeDistance(points: { lat: number; lng: number }[], order: number[]): number {
  let d = 0;
  for (let i = 0; i < order.length - 1; i++) d += haversineKm(points[order[i]], points[order[i + 1]]);
  return d;
}

// Fixes the day's real first stop as the route's start (you don't get "your last
// stop is now first" — only what comes AFTER the start gets re-sequenced).
export function nearestNeighborOrder(points: { lat: number; lng: number }[]): number[] {
  const n = points.length;
  const visited = new Array(n).fill(false);
  const order = [0];
  visited[0] = true;
  for (let step = 1; step < n; step++) {
    const last = order[order.length - 1];
    let best = -1;
    let bestDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (visited[j]) continue;
      const dist = haversineKm(points[last], points[j]);
      if (dist < bestDist) { bestDist = dist; best = j; }
    }
    order.push(best);
    visited[best] = true;
  }
  return order;
}

export function twoOpt(points: { lat: number; lng: number }[], seed: number[]): number[] {
  let best = seed.slice();
  let bestDist = routeDistance(points, best);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 2; i++) {
      for (let k = i + 1; k < best.length - 1; k++) {
        const candidate = best.slice(0, i).concat(best.slice(i, k + 1).reverse(), best.slice(k + 1));
        const dist = routeDistance(points, candidate);
        if (dist < bestDist - 1e-9) { best = candidate; bestDist = dist; improved = true; }
      }
    }
  }
  return best;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function optimizeDayRoute(waypoints: OptWaypoint[] | null | undefined): OptimizeResult {
  if (!waypoints || !waypoints.length) return null;
  const located: { i: number; lat: number; lng: number }[] = [];
  waypoints.forEach((w, i) => {
    if (Number.isFinite(w.lat) && Number.isFinite(w.lng)) located.push({ i, lat: w.lat as number, lng: w.lng as number });
  });
  if (located.length < 3) return null;

  const currentOrder = located.map((_, k) => k);
  const currentKm = routeDistance(located, currentOrder);
  const seeded = nearestNeighborOrder(located);
  const optimizedLocalOrder = twoOpt(located, seeded);
  const optimizedKm = routeDistance(located, optimizedLocalOrder);
  const savedKm = currentKm - optimizedKm;

  const threshold = Math.max(0.5, currentKm * 0.1);
  if (savedKm < threshold) return null;

  return {
    order: optimizedLocalOrder.map((k) => located[k].i),
    savedKm: round2(savedKm),
    currentKm: round2(currentKm),
  };
}
