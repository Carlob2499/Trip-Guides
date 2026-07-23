import { describe, it, expect } from "vitest";
import { optimizeDayRoute, nearestNeighborOrder, twoOpt, routeDistance } from "./optimize";

// A zigzag along one line of latitude: the day's stops sit east of the start at
// 10km, 2km, and 8km — visiting them in that (recorded) order backtracks twice.
const ZIGZAG = [
  { lat: 37.5, lng: 127.0 },  // 0 — the day's real first stop, stays fixed
  { lat: 37.5, lng: 127.1 },  // 1 — far east
  { lat: 37.5, lng: 127.02 }, // 2 — near the start
  { lat: 37.5, lng: 127.08 }, // 3 — mid-far east
];

// Five points where the nearest-neighbour heuristic's own greedy seed is
// provably not the shortest path through them — 2-opt must improve on it.
const NN_TRAP = [
  { lat: 37.5148, lng: 126.9302 },
  { lat: 37.5802, lng: 126.9145 },
  { lat: 37.5572, lng: 126.9731 },
  { lat: 37.4616, lng: 127.0015 },
  { lat: 37.4575, lng: 126.9867 },
];

describe("optimizeDayRoute", () => {
  it("finds a materially shorter order for a genuine zigzag and reports the saving", () => {
    const result = optimizeDayRoute(ZIGZAG);
    expect(result).not.toBeNull();
    expect(result!.order).toEqual([0, 2, 3, 1]);
    expect(result!.currentKm).toBeCloseTo(21.17, 1);
    expect(result!.savedKm).toBeGreaterThan(12);
  });

  it("returns null under 3 located waypoints", () => {
    expect(optimizeDayRoute([{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }])).toBeNull();
    expect(optimizeDayRoute([])).toBeNull();
    expect(optimizeDayRoute(null)).toBeNull();
    expect(optimizeDayRoute(undefined)).toBeNull();
  });

  it("excludes waypoints with no coordinates from consideration entirely", () => {
    const withGaps = [ZIGZAG[0], { name: "no coords" } as any, ZIGZAG[1], ZIGZAG[2], ZIGZAG[3]];
    const result = optimizeDayRoute(withGaps);
    expect(result).not.toBeNull();
    // Original indices in the 5-item array: 0, 2, 3, 4 are located; index 1 is skipped.
    expect(result!.order.every((i) => i !== 1)).toBe(true);
    expect(new Set(result!.order)).toEqual(new Set([0, 2, 3, 4]));
  });

  it("returns null when a day is already near-optimal (below the honest-blank threshold)", () => {
    // Already monotonic east — reordering has nothing meaningful to offer.
    const alreadyGood = [
      { lat: 37.5, lng: 127.0 },
      { lat: 37.5, lng: 127.02 },
      { lat: 37.5, lng: 127.04 },
    ];
    expect(optimizeDayRoute(alreadyGood)).toBeNull();
  });

  it("is deterministic — the same input always returns the same suggestion", () => {
    const a = optimizeDayRoute(ZIGZAG);
    const b = optimizeDayRoute(ZIGZAG);
    expect(a).toEqual(b);
  });

  it("real guide data: Korea's Tue Jul 14 shopping day fires, every other day of the trip stays silent", () => {
    // Actual coordinates from src/content/guides/korea/04-itinerary.json — this
    // is the exit criterion from docs/PLAN_FIELD_REPORT_FIXES.md E7: the
    // advisory must fire on a REAL day where it genuinely helps, not a fixture
    // invented to make the feature look good.
    const jul14 = [
      { lat: 37.58239, lng: 126.9917 },  // Changdeokgung
      { lat: 37.5271, lng: 127.0395 },   // Apgujeong
      { lat: 37.52465, lng: 126.96416 }, // HYBE HQ (Yongsan)
      { lat: 37.5609, lng: 126.98638 },  // Myeongdong
      { lat: 37.57549, lng: 126.98411 }, // A Flower Blossom on the Rice
    ];
    const result = optimizeDayRoute(jul14);
    expect(result).not.toBeNull();
    expect(result!.savedKm).toBeGreaterThan(result!.currentKm * 0.1);
  });
});

describe("nearestNeighborOrder + twoOpt", () => {
  it("2-opt improves on the nearest-neighbour seed when the seed is provably suboptimal", () => {
    const seed = nearestNeighborOrder(NN_TRAP);
    const seedDist = routeDistance(NN_TRAP, seed);
    const improved = twoOpt(NN_TRAP, seed);
    const improvedDist = routeDistance(NN_TRAP, improved);
    expect(improvedDist).toBeLessThan(seedDist - 1);
  });

  it("nearest-neighbour always starts at the day's real first stop", () => {
    const order = nearestNeighborOrder(ZIGZAG);
    expect(order[0]).toBe(0);
  });
});
