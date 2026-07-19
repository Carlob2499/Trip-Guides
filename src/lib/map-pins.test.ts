import { describe, it, expect } from "vitest";
import { derivePins, derivePlannerData, pinSlug } from "./map-pins";

const guide = (sections: any[]) => sections;

describe("pinSlug", () => {
  it("slugifies display names stably", () => {
    expect(pinSlug("Gyeongbokgung")).toBe("gyeongbokgung");
    expect(pinSlug("N Seoul Tower (Namsan)")).toBe("n-seoul-tower-namsan");
    expect(pinSlug("  ")).toBe("pin");
  });
});

describe("derivePins", () => {
  const mapA = { type: "map", title: "Orientation map", center: { lat: 37.5, lng: 127.0 }, points: [
    { name: "Melody House", lat: 37.55, lng: 126.92, local_script_name: "멜로디" },
    { name: "No coords point" }, // must be skipped
  ]};
  const mapB = { type: "map", title: "Daejeon", center: { lat: 36.35, lng: 127.38 } };
  const sights = { type: "sights", items: [
    { name: "Gyeongbokgung", map: { lat: 37.5796, lng: 126.977 } },
    { name: "No-coord sight" }, // skipped
  ]};

  it("first map gets center + own points + all guide sights", () => {
    const pins = derivePins(guide([mapA, sights, mapB])).get(mapA)!;
    expect(pins.map(p => p.kind)).toEqual(["center", "point", "sight"]);
    expect(pins[1]).toMatchObject({ id: "melody-house", local: "멜로디" });
    expect(pins[2]).toMatchObject({ id: "gyeongbokgung", lat: 37.5796 });
  });

  it("later maps get only their own center/points — no sights", () => {
    const pins = derivePins(guide([mapA, sights, mapB])).get(mapB)!;
    expect(pins).toHaveLength(1);
    expect(pins[0].kind).toBe("center");
  });

  it("guide with sights but map listed after them still binds sights to first map", () => {
    const pins = derivePins(guide([sights, mapA])).get(mapA)!;
    expect(pins.some(p => p.kind === "sight")).toBe(true);
  });

  it("map without valid center is excluded entirely", () => {
    const bad = { type: "map", center: { lat: "x" } };
    expect(derivePins(guide([bad])).size).toBe(0);
  });

  it("scaffold guide (no sights, no points) → single center pin", () => {
    const pins = derivePins(guide([mapB])).get(mapB)!;
    expect(pins).toHaveLength(1);
  });
});

describe("derivePlannerData", () => {
  const daysSection = {
    type: "days",
    items: [
      {
        date: "Mon Jul 13", title: "Arrival", energy: "packed",
        waypoints: [
          { name: "Airport", lat: 37.46, lng: 126.44, time: "09:00", note: "land" },
          { name: "No coords stop" }, // must be skipped from pins, kept as a stop
        ],
      },
      { date: "Tue Jul 14", title: "Rest day", waypoints: [] },
    ],
  };

  it("maps each itinerary day to a PlannerDay with its stops", () => {
    const { days } = derivePlannerData([daysSection]);
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({ idx: 0, date: "Mon Jul 13", title: "Arrival", energy: "packed" });
    expect(days[0].stops).toHaveLength(2);
    expect(days[0].stops[0]).toEqual({ name: "Airport", time: "09:00", note: "land", lat: 37.46, lng: 126.44 });
  });

  it("defaults a day's energy to \"balanced\" when absent", () => {
    const { days } = derivePlannerData([daysSection]);
    expect(days[1].energy).toBe("balanced");
  });

  it("only emits pins for stops with valid coordinates", () => {
    const { pins } = derivePlannerData([daysSection]);
    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({ name: "Airport", lat: 37.46, lng: 126.44, dayIdx: 0, time: "09:00", kind: "point" });
  });

  it("ids each pin with its day index + slug + stop index (stable, collision-safe)", () => {
    const { pins } = derivePlannerData([daysSection]);
    expect(pins[0].id).toBe("d0-airport-0");
  });

  it("reports hasCoords: false when no waypoint anywhere has valid coordinates", () => {
    const noCoords = { type: "days", items: [{ date: "Wed Jul 15", title: "Free day", waypoints: [{ name: "Somewhere" }] }] };
    const { hasCoords, pins } = derivePlannerData([noCoords]);
    expect(hasCoords).toBe(false);
    expect(pins).toEqual([]);
  });

  it("returns empty days/pins for a guide with no days section", () => {
    expect(derivePlannerData([{ type: "prose" }])).toEqual({ days: [], pins: [], hasCoords: false });
  });

  it("treats a days section with an empty items array as having no days", () => {
    expect(derivePlannerData([{ type: "days", items: [] }])).toEqual({ days: [], pins: [], hasCoords: false });
  });
});
