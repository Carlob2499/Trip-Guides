// @protects-file Route order on the Tools screen is computed from mapped stops only, and says so.

import { describe, it, expect } from "vitest";
import { buildRoutePlan, km } from "../model/route-plan";

// A deliberately out-of-order day: A and C are neighbours, B is far away, so the guide's
// A → B → C order backtracks and the optimiser has something real to say.
const detour = {
  date: "Thu Oct 15", title: "Fukuoka",
  waypoints: [
    { name: "A", lat: 33.590, lng: 130.401 },
    { name: "B", lat: 33.650, lng: 130.480 },
    { name: "C", lat: 33.592, lng: 130.404 },
  ],
};

describe("buildRoutePlan", () => {
  it("reports the guide's own order as legs plus a total", () => {
    const [day] = buildRoutePlan([detour]);
    expect(day.legs.map((l) => `${l.from}→${l.to}`)).toEqual(["A→B", "B→C"]);
    expect(day.currentKm).toBeGreaterThan(0);
    expect(day.currentKm).toBeCloseTo(day.legs[0].km + day.legs[1].km, 6);
  });

  it("suggests a shorter order only when one exists, and shows what it saves", () => {
    const [day] = buildRoutePlan([detour]);
    expect(day.suggestion).not.toBeNull();
    expect(day.suggestion!.km).toBeLessThan(day.currentKm);
    expect(day.suggestion!.savedKm).toBeGreaterThan(0);
    expect(day.suggestion!.legs).toHaveLength(2);
    expect(day.suggestion!.names).toHaveLength(3);
  });

  it("stays silent on a day that is already in a sensible order", () => {
    const [day] = buildRoutePlan([{
      date: "Fri Oct 16", title: "Straight line",
      waypoints: [
        { name: "A", lat: 33.590, lng: 130.400 },
        { name: "B", lat: 33.600, lng: 130.400 },
        { name: "C", lat: 33.610, lng: 130.400 },
      ],
    }]);
    expect(day.suggestion).toBeNull();
  });

  it("counts stops that have no coordinates instead of dropping them silently", () => {
    const [day] = buildRoutePlan([{
      ...detour,
      waypoints: [...detour.waypoints, { name: "D — not located yet" }],
    }]);
    expect(day.unlocatedCount).toBe(1);
    expect(day.points).toHaveLength(3);
  });

  it("omits a day that cannot be ordered at all", () => {
    expect(buildRoutePlan([{ date: "Sat", title: "One stop", waypoints: [{ name: "A", lat: 1, lng: 1 }] }])).toEqual([]);
    expect(buildRoutePlan([{ date: "Sat", title: "No coords", waypoints: [{ name: "A" }, { name: "B" }] }])).toEqual([]);
  });

  it("survives malformed input instead of throwing", () => {
    expect(buildRoutePlan(null)).toEqual([]);
    expect(buildRoutePlan([null, {}, { waypoints: [] }] as never)).toEqual([]);
  });
});

describe("km", () => {
  it("rounds to one decimal — the honest precision for a straight-line estimate", () => {
    expect(km(2.1449)).toBe("2.1 km");
    expect(km(0)).toBe("0 km");
  });
});
