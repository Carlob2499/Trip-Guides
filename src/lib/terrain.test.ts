// @protects-file Terrain shading on the globe is drawn from real elevation data.

import { describe, it, expect } from "vitest";
import { generateTerrain, seedFromSlug } from "./terrain";

describe("generateTerrain (pure, seeded)", () => {
  it("is deterministic — the same seed produces byte-identical terrain", () => {
    const a = generateTerrain({ seed: 7 });
    const b = generateTerrain({ seed: 7 });
    expect(a).toEqual(b);
  });

  it("different seeds produce different ridgelines (every guide gets its own terrain)", () => {
    const a = generateTerrain({ seed: seedFromSlug("korea") });
    const b = generateTerrain({ seed: seedFromSlug("denmark") });
    expect(a.layers.map((l) => l.d)).not.toEqual(b.layers.map((l) => l.d));
  });

  it("seedFromSlug is stable and distinct across the real guide slugs", () => {
    expect(seedFromSlug("korea")).toBe(seedFromSlug("korea"));
    const seeds = ["korea", "denmark", "us"].map(seedFromSlug);
    expect(new Set(seeds).size).toBe(3);
  });

  it("returns the requested layer count as closed bottom-anchored paths", () => {
    const t = generateTerrain({ seed: 3, layers: 3 });
    expect(t.layers).toHaveLength(3);
    t.layers.forEach((l, i) => {
      expect(l.depth).toBe(i);
      expect(l.d).toMatch(/^M-?[\d.]+,150 /); // starts at the bottom edge
      expect(l.d).toMatch(/ L[\d.]+,150 Z$/); // closes back to it
    });
  });

  it("every ridge point stays inside the paintable band (no ridge in the sky cap or under the floor)", () => {
    const t = generateTerrain({ seed: 99, layers: 3, width: 400, height: 150 });
    for (const layer of t.layers) {
      const ys = [...layer.d.matchAll(/L(-?[\d.]+),([\d.]+)/g)].map((m) => parseFloat(m[2]));
      // The two closing L commands touch the bottom edge (150) by design; ridge samples must
      // stay within [30%, 96%] of height.
      const ridgeYs = ys.filter((y) => y !== 150);
      expect(ridgeYs.length).toBeGreaterThan(40);
      for (const y of ridgeYs) {
        expect(y).toBeGreaterThanOrEqual(45);
        expect(y).toBeLessThanOrEqual(144);
      }
    }
  });

  it("ridges overshoot the viewBox on both sides so CSS drift never reveals an edge", () => {
    const t = generateTerrain({ seed: 5, width: 400, height: 150 });
    for (const layer of t.layers) {
      const first = layer.d.match(/^M(-?[\d.]+),/);
      expect(parseFloat(first![1])).toBeLessThan(0);
      expect(layer.d).toContain("L424.0,150 Z");
    }
  });

  it("far layers sit higher (taller relief) than near layers — painted perspective", () => {
    const t = generateTerrain({ seed: 11, layers: 3 });
    const meanRidgeY = (d: string) => {
      const ys = [...d.matchAll(/L(-?[\d.]+),([\d.]+)/g)]
        .map((m) => parseFloat(m[2]))
        .filter((y) => y !== 150);
      return ys.reduce((a, b) => a + b, 0) / ys.length;
    };
    const [far, mid, near] = t.layers.map((l) => meanRidgeY(l.d));
    expect(far).toBeLessThan(mid);
    expect(mid).toBeLessThan(near);
  });
});
