import { describe, it, expect } from "vitest";
import { deriveArrivalPlan } from "./arrival";

describe("deriveArrivalPlan", () => {
  it("derives a plan from the first days item, preserving order", () => {
    const plan = deriveArrivalPlan([
      {
        date: "Wed Jul 8", title: "Flight day", tldr: "Overnight flight.", fit: "Compression socks.",
        waypoints: [
          { name: "Depart EWR", time: "≈01:00 EDT", note: "confirm booking" },
          { name: "Land ICN", lat: 37.44957, lng: 126.45212, time: "≈04:55 KST" },
        ],
        checklist: ["Pack melatonin", "Charge devices"],
      },
      { date: "Thu Jul 9", title: "Second day" },
    ]);
    expect(plan?.date).toBe("Wed Jul 8");
    expect(plan?.title).toBe("Flight day");
    expect(plan?.steps).toHaveLength(2);
    expect(plan?.steps[0]).toEqual({ name: "Depart EWR", time: "≈01:00 EDT", note: "confirm booking", lat: null, lng: null });
    expect(plan?.steps[1].lat).toBe(37.44957);
    expect(plan?.checklist).toEqual(["Pack melatonin", "Charge devices"]);
  });

  it("falls back to the date as title when title is missing", () => {
    expect(deriveArrivalPlan([{ date: "Mon Jun 8" }])?.title).toBe("Mon Jun 8");
  });

  it("returns empty steps/checklist arrays rather than omitting them, when absent", () => {
    const plan = deriveArrivalPlan([{ date: "Mon Jun 8", title: "Arrival" }]);
    expect(plan?.steps).toEqual([]);
    expect(plan?.checklist).toEqual([]);
    expect(plan?.tldr).toBe(null);
    expect(plan?.fit).toBe(null);
  });

  it("returns null for a guide with no days section (draft scaffold)", () => {
    expect(deriveArrivalPlan([])).toBe(null);
    expect(deriveArrivalPlan(null)).toBe(null);
    expect(deriveArrivalPlan(undefined)).toBe(null);
  });

  it("never invents coordinates for a step that has none", () => {
    const plan = deriveArrivalPlan([{ date: "D", waypoints: [{ name: "No-coord stop" }] }]);
    expect(plan?.steps[0].lat).toBe(null);
    expect(plan?.steps[0].lng).toBe(null);
  });
});
