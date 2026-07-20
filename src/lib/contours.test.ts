import { describe, it, expect } from "vitest";
import { generateContourLayer } from "./contours";

describe("generateContourLayer (pure, seeded)", () => {
  it("is deterministic — the same seed produces byte-identical rings", () => {
    const a = generateContourLayer({ seed: 7, rings: 5, cx: 500, cy: 500 });
    const b = generateContourLayer({ seed: 7, rings: 5, cx: 500, cy: 500 });
    expect(a).toEqual(b);
  });

  it("different seeds produce different rings (real variety, not one hardcoded shape)", () => {
    const a = generateContourLayer({ seed: 7, rings: 3, cx: 500, cy: 500 });
    const b = generateContourLayer({ seed: 41, rings: 3, cx: 500, cy: 500 });
    expect(a.rings).not.toEqual(b.rings);
  });

  it("returns exactly `rings` polylines, each a well-formed SVG points string", () => {
    const { rings } = generateContourLayer({ seed: 1, rings: 4, cx: 500, cy: 500 });
    expect(rings).toHaveLength(4);
    for (const points of rings) {
      expect(points).toMatch(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?( -?\d+(\.\d+)?,-?\d+(\.\d+)?)*$/);
      expect(points.split(" ").length).toBe(45); // 44 segments + closing point
    }
  });

  it("later rings are farther from center on average than earlier ones (they nest outward)", () => {
    const { rings } = generateContourLayer({ seed: 3, rings: 4, cx: 500, cy: 500, baseRadius: 40 });
    const avgDistFromCenter = (points: string) => {
      const coords = points.split(" ").map((p) => p.split(",").map(Number));
      const dists = coords.map(([x, y]) => Math.hypot(x - 500, y - 500));
      return dists.reduce((a, b) => a + b, 0) / dists.length;
    };
    const dists = rings.map(avgDistFromCenter);
    for (let i = 1; i < dists.length; i++) expect(dists[i]).toBeGreaterThan(dists[i - 1]);
  });

  it("returns an empty ring list for 0 rings, without throwing", () => {
    expect(generateContourLayer({ seed: 1, rings: 0, cx: 0, cy: 0 })).toEqual({ viewBox: 1000, rings: [] });
  });

  it("respects a custom viewBox", () => {
    expect(generateContourLayer({ seed: 1, rings: 1, cx: 0, cy: 0, viewBox: 500 }).viewBox).toBe(500);
  });
});
