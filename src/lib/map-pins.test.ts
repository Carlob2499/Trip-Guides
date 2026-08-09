// @protects-file A pin is only placed where there are verified coordinates.

import { describe, it, expect } from "vitest";
import { derivePins, derivePlannerData, pinCategories, pinSlug } from "./map-pins";
import type { Section, SectionOf } from "./guide-types";

/* M6: these fixtures are DELIBERATELY partial — several cases exist precisely to prove these
   walkers survive imperfect data (a map with a non-numeric lat, a section with no items). The
   casts below say that out loud, rather than padding every fixture with fields the assertion
   does not care about and thereby hiding what each case is actually testing. */
const guide = (sections: unknown[]) => sections as Section[];
const asMap = (s: unknown) => s as SectionOf<"map">;

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
    const pins = derivePins(guide([mapA, sights, mapB])).get(asMap(mapA))!;
    expect(pins.map(p => p.kind)).toEqual(["center", "point", "sight"]);
    expect(pins[1]).toMatchObject({ id: "melody-house", local: "멜로디" });
    expect(pins[2]).toMatchObject({ id: "gyeongbokgung", lat: 37.5796 });
  });

  it("later maps get only their own center/points — no sights", () => {
    const pins = derivePins(guide([mapA, sights, mapB])).get(asMap(mapB))!;
    expect(pins).toHaveLength(1);
    expect(pins[0].kind).toBe("center");
  });

  it("guide with sights but map listed after them still binds sights to first map", () => {
    const pins = derivePins(guide([sights, mapA])).get(asMap(mapA))!;
    expect(pins.some(p => p.kind === "sight")).toBe(true);
  });

  it("map without valid center is excluded entirely", () => {
    const bad = { type: "map", center: { lat: "x" } };
    expect(derivePins(guide([bad])).size).toBe(0);
  });

  it("scaffold guide (no sights, no points) → single center pin", () => {
    const pins = derivePins(guide([mapB])).get(asMap(mapB))!;
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
    const { days } = derivePlannerData(guide([daysSection]));
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({ idx: 0, date: "Mon Jul 13", title: "Arrival", energy: "packed" });
    expect(days[0].stops).toHaveLength(2);
    expect(days[0].stops[0]).toEqual({ name: "Airport", time: "09:00", note: "land", lat: 37.46, lng: 126.44 });
  });

  it("defaults a day's energy to \"balanced\" when absent", () => {
    const { days } = derivePlannerData(guide([daysSection]));
    expect(days[1].energy).toBe("balanced");
  });

  it("only emits pins for stops with valid coordinates", () => {
    const { pins } = derivePlannerData(guide([daysSection]));
    expect(pins).toHaveLength(1);
    expect(pins[0]).toMatchObject({ name: "Airport", lat: 37.46, lng: 126.44, dayIdx: 0, time: "09:00", kind: "point" });
  });

  it("ids each pin with its day index + slug + stop index (stable, collision-safe)", () => {
    const { pins } = derivePlannerData(guide([daysSection]));
    expect(pins[0].id).toBe("d0-airport-0");
  });

  it("reports hasCoords: false when no waypoint anywhere has valid coordinates", () => {
    const noCoords = { type: "days", items: [{ date: "Wed Jul 15", title: "Free day", waypoints: [{ name: "Somewhere" }] }] };
    const { hasCoords, pins } = derivePlannerData(guide([noCoords]));
    expect(hasCoords).toBe(false);
    expect(pins).toEqual([]);
  });

  it("returns empty days/pins for a guide with no days section", () => {
    expect(derivePlannerData(guide([{ type: "prose" }]))).toEqual({ days: [], pins: [], hasCoords: false });
  });

  it("treats a days section with an empty items array as having no days", () => {
    expect(derivePlannerData(guide([{ type: "days", items: [] }]))).toEqual({ days: [], pins: [], hasCoords: false });
  });
});

/* The repository turn (2026-08-03): a guide is browsed on the street, not only followed, so
   its restaurants and shops have to exist on its own map. They could not: derivePins read
   `sights` sections and nothing else, while the schema had always allowed `map` on a venue —
   so the omission read as "no venue has coordinates" instead of "a venue can never be pinned".
   Measured across the four shipped guides at the time: 32 of 159 sights+venues items were
   mappable, and all 32 were sights. */
describe("derivePins — venues", () => {
  const mapA = { type: "map", title: "Seoul", center: { lat: 37.5, lng: 127.0 } };
  const sights = { type: "sights", group: "Sights", items: [
    { name: "Gyeongbokgung", map: { lat: 37.5796, lng: 126.977 }, place_id: "ChIJ_palace" },
  ]};
  const food = { type: "venues", group: "Food & shopping", items: [
    { name: "Tosokchon Samgyetang", map: { lat: 37.5779, lng: 126.9718 } },
    { name: "Un-geocoded stall" },                      // skipped, not invented
  ]};

  it("pins venues alongside sights on the primary map", () => {
    const pins = derivePins(guide([mapA, sights, food])).get(asMap(mapA))!;
    expect(pins.map((p) => p.kind)).toEqual(["center", "sight", "venue"]);
    expect(pins[2]).toMatchObject({ name: "Tosokchon Samgyetang", cat: "Food & shopping" });
  });

  it("tags each pin with its section group, so the map can filter by it", () => {
    const pins = derivePins(guide([mapA, sights, food])).get(asMap(mapA))!;
    expect(pins[1].cat).toBe("Sights");
    expect(pins[0].cat).toBeNull();                     // the centre belongs to no category
  });

  it("carries place_id through when the content has one, null when it doesn't", () => {
    const pins = derivePins(guide([mapA, sights, food])).get(asMap(mapA))!;
    expect(pins[1].placeId).toBe("ChIJ_palace");
    expect(pins[2].placeId).toBeNull();
  });

  it("still skips anything without coordinates rather than guessing a location", () => {
    const pins = derivePins(guide([mapA, food])).get(asMap(mapA))!;
    expect(pins.some((p) => p.name === "Un-geocoded stall")).toBe(false);
  });
});

describe("pinCategories", () => {
  const pins = [
    { id: "c", name: "c", lat: 0, lng: 0, local: null, kind: "center" as const, cat: null, placeId: null },
    { id: "a", name: "a", lat: 0, lng: 0, local: null, kind: "sight" as const, cat: "Sights", placeId: null },
    { id: "b", name: "b", lat: 0, lng: 0, local: null, kind: "venue" as const, cat: "Food & shopping", placeId: null },
    { id: "d", name: "d", lat: 0, lng: 0, local: null, kind: "venue" as const, cat: "Sights", placeId: null },
  ];

  it("lists each category once, in first-seen order, ignoring the centre", () => {
    expect(pinCategories(pins)).toEqual(["Sights", "Food & shopping"]);
  });

  it("returns nothing when there is nothing to filter", () => {
    expect(pinCategories([pins[0]])).toEqual([]);
  });
});
