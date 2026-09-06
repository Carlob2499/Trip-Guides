// @protects-file Map pins group and split apart at sensible zoom levels instead of piling up.

import { describe, it, expect } from "vitest";
import { clusterPins, worldPixel } from "./cluster";
import type { Pin } from "../../../lib/map-pins";

const pin = (name: string, lat: number, lng: number, cat = "Sights"): Pin => ({
  id: name, name, lat, lng, local: null, kind: "sight", cat, placeId: null,
});

describe("worldPixel", () => {
  it("puts the null island at the centre of the zoom-0 world tile", () => {
    expect(worldPixel(0, 0, 0)).toEqual({ x: 128, y: 128 });
  });

  it("doubles resolution per zoom level", () => {
    const a = worldPixel(37.5, 127, 10);
    const b = worldPixel(37.5, 127, 11);
    expect(b.x).toBeCloseTo(a.x * 2, 6);
    expect(b.y).toBeCloseTo(a.y * 2, 6);
  });

  it("survives a pole without returning NaN — a typo'd coordinate must not vanish", () => {
    const p = worldPixel(90, 0, 8);
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
  });
});

describe("clusterPins", () => {
  /* Three real Seoul places: the palace and the samgyetang restaurant across the road from it
     are ~450m apart; Gangnam is ~10km south. At street zoom all three are distinct; zoomed out
     the two neighbours merge and Gangnam does not. */
  const palace = pin("Gyeongbokgung", 37.5796, 126.977);
  const tosokchon = pin("Tosokchon", 37.5779, 126.9718, "Food & shopping");
  const gangnam = pin("Gangnam", 37.4979, 127.0276);

  it("keeps neighbours apart at street zoom", () => {
    const out = clusterPins([palace, tosokchon, gangnam], 16);
    expect(out).toHaveLength(3);
  });

  it("merges close pins as you zoom out, and leaves distant ones alone", () => {
    const out = clusterPins([palace, tosokchon, gangnam], 12);
    const sizes = out.map((c) => c.pins.length).sort((a, b) => b - a);
    expect(sizes).toEqual([2, 1]);
    // The merged pair keeps both members — clustering hides markers, never data.
    const merged = out.find((c) => c.pins.length === 2)!;
    expect(merged.pins.map((p) => p.name).sort()).toEqual(["Gyeongbokgung", "Tosokchon"]);
  });

  it("returns a real coordinate for the cluster centre, usable as a Directions target", () => {
    const [c] = clusterPins([palace, tosokchon], 12);
    expect(c.lat).toBeCloseTo((37.5796 + 37.5779) / 2, 6);
    expect(c.lng).toBeCloseTo((126.977 + 126.9718) / 2, 6);
  });

  it("is order-independent — the same pins always group the same way", () => {
    const a = clusterPins([palace, tosokchon, gangnam], 12).map((c) => c.pins.length).sort();
    const b = clusterPins([gangnam, tosokchon, palace], 12).map((c) => c.pins.length).sort();
    expect(a).toEqual(b);
  });

  it("clusters by SCREEN distance, applying the Mercator projection to latitude", () => {
    /* The reason this file projects instead of comparing raw degrees. Mercator stretches the
       y-axis by 1/cos(latitude), so at Copenhagen (55.68°) a degree of latitude covers ~1.77x
       the pixels it covers at the equator. The SAME 0.016° separation is therefore ~47px near
       the equator (inside a 60px radius → one cluster) and ~83px in Denmark (outside → two).
       Comparing degrees directly would merge both, clustering Danish pins that are visibly far
       apart on screen. */
    const equator = clusterPins([pin("a", 0, 0), pin("b", 0.016, 0)], 12);
    const denmark = clusterPins([pin("c", 55.68, 12.57), pin("d", 55.696, 12.57)], 12);
    expect(equator).toHaveLength(1);
    expect(denmark).toHaveLength(2);
  });

  it("drops non-finite coordinates instead of poisoning a cluster with NaN", () => {
    const bad = { ...pin("broken", NaN, NaN) };
    const out = clusterPins([palace, bad], 14);
    expect(out).toHaveLength(1);
    expect(out[0].pins).toHaveLength(1);
    expect(Number.isFinite(out[0].lat)).toBe(true);
  });

  it("returns an empty list for no pins", () => {
    expect(clusterPins([], 12)).toEqual([]);
  });

  /* Two finished clusters closer together than the radius render as two discs stacked on the same
     spot. The greedy pass compares each pin against a cluster's RUNNING centre, and that centre
     drifts as pins join — so it is not OBVIOUS that the separation survives to the end, and this
     pins it down.

     It is a guard, not a bug report: a merge pass was written for the drift this describes, and
     then deleted, because it could not be made to fail — neither this chain nor 20,000 randomised
     layouts produced a single overlapping pair. Unreproduced, the extra pass was complexity
     without a defect. If a future change to the grouping breaks the separation, this fails. */
  it("leaves no two finished clusters closer together than the radius", () => {
    const zoom = 14;
    const radius = 60;
    const chain = [
      pin("a1", 37.5796, 126.9770),
      pin("a2", 37.5796, 126.9764),
      pin("a3", 37.5796, 126.9758),
      pin("a4", 37.5796, 126.9752),
      pin("b1", 37.5796, 126.9740),
      pin("b2", 37.5796, 126.9734),
    ];
    const out = clusterPins(chain, zoom, radius);

    /* Assert the PROPERTY, not a cluster count: the point is that nothing overlaps, however the
       algorithm chooses to group them. */
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = worldPixel(out[i].lat, out[i].lng, zoom);
        const b = worldPixel(out[j].lat, out[j].lng, zoom);
        const gap = Math.hypot(a.x - b.x, a.y - b.y);
        expect(gap, `clusters ${i} and ${j} are ${gap.toFixed(1)}px apart`).toBeGreaterThan(radius);
      }
    }
    // and nothing was lost on the way
    expect(out.reduce((n, c) => n + c.pins.length, 0)).toBe(chain.length);
  });
});
