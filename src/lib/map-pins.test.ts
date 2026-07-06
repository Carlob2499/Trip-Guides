import { describe, it, expect } from "vitest";
import { derivePins, pinSlug } from "./map-pins";

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
