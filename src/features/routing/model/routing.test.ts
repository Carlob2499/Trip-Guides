import { describe, expect, it } from "vitest";
import { buildDayRouteAdvisory, leaveBy, type ItineraryStop, type RouteMatrixValue } from "./routing";

const stops: ItineraryStop[] = [
  { id: "authored-a", latitude: 0, longitude: 0 },
  { id: "authored-b", latitude: 0, longitude: 0.02 },
  { id: "authored-c", latitude: 0, longitude: 0.01 },
];

const matrix: RouteMatrixValue = {
  attribution: "Google",
  cells: [
    { originIndex: 0, destinationIndex: 1, durationSeconds: 1200, distanceMeters: 2000 },
    { originIndex: 0, destinationIndex: 2, durationSeconds: 300, distanceMeters: 1000 },
    { originIndex: 1, destinationIndex: 0, durationSeconds: 1200, distanceMeters: 2000 },
    { originIndex: 1, destinationIndex: 2, durationSeconds: 300, distanceMeters: 1000 },
    { originIndex: 2, destinationIndex: 0, durationSeconds: 300, distanceMeters: 1000 },
    { originIndex: 2, destinationIndex: 1, durationSeconds: 300, distanceMeters: 1000 },
  ],
};

describe("route advisory", () => {
  it("keeps authored order and only returns a better matrix order as unapplied advice", () => {
    const before = structuredClone(stops);
    const advisory = buildDayRouteAdvisory(stops, matrix, "WALK");
    expect(advisory).toMatchObject({
      authoredOrder: ["authored-a", "authored-b", "authored-c"],
      suggestedOrder: ["authored-a", "authored-c", "authored-b"],
      estimatedSavingsSeconds: 900,
      applied: false,
    });
    expect(stops).toEqual(before);
  });

  it("falls back deterministically per authored transition when matrix data is absent", () => {
    const advisory = buildDayRouteAdvisory(stops, null, "WALK");
    expect(advisory.authoredOrder).toEqual(["authored-a", "authored-b", "authored-c"]);
    expect(advisory.transitions.map((transition) => transition.source)).toEqual(["haversine", "haversine"]);
    expect(advisory.transitions.map((transition) => transition.durationSeconds)).toEqual([null, null]);
    expect(advisory.suggestedOrder).toBeNull();
  });

  it("computes leave-by from arrival, route duration and explicit buffer", () => {
    expect(leaveBy("2026-09-04T18:00:00.000Z", 900, 300)).toBe("2026-09-04T17:40:00.000Z");
  });
});
