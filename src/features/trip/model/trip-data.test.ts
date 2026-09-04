// @protects-file One canonical itinerary object feeds every surface, with nothing invented.

import { describe, it, expect } from "vitest";
import { deriveTripDays, dayStops } from "./trip-data";

describe("deriveTripDays", () => {
  it("keeps authored order, times, coordinates and honest nulls", () => {
    const days = deriveTripDays([
      { date: "Wed Jul 8", title: "Fly", waypoints: [{ name: "EWR", time: "≈01:00 EDT", lat: 40.69, lng: -74.17 }, { name: "Nap" }] },
      { date: "Thu Jul 9", title: "Arrive", tldr: "Shower, bus, light", plan_b: { trigger: "rain", body: "Jjimjilbang" } },
    ]);
    expect(days).toHaveLength(2);
    expect(days[0].anchor).toBe("day-0");
    expect(days[0].stops[0]).toMatchObject({ name: "EWR", time: "≈01:00 EDT", lat: 40.69, lng: -74.17, branch: null });
    expect(days[0].stops[1]).toMatchObject({ name: "Nap", time: null, lat: null, lng: null });
    expect(days[1].planB).toEqual({ trigger: "rain", body: "Jjimjilbang" });
    expect(days[1].stops).toEqual([]);
    expect(days[0].tldr).toBeNull();
  });

  it("projects a branched day as shared stops then each party's own, labelled", () => {
    const stops = dayStops({
      waypoints: [{ name: "Breakfast" }],
      branches: [
        { label: "GO Fest group", waypoints: [{ name: "LEGO Store" }, { name: "CopenHill" }] },
        { label: "Mom's group", waypoints: [{ name: "Canal tour" }] },
      ],
    });
    expect(stops.map((s) => `${s.branch ?? "·"}:${s.name}`)).toEqual([
      "·:Breakfast", "GO Fest group:LEGO Store", "GO Fest group:CopenHill", "Mom's group:Canal tour",
    ]);
  });
});
