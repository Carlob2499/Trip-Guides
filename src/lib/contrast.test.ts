import { describe, it, expect } from "vitest";
import { relativeLuminance, contrastRatio } from "./contrast";

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black vs white (WCAG max)", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("is 1 for identical colours", () => {
    expect(contrastRatio("#2b5d86", "#2b5d86")).toBeCloseTo(1, 5);
  });

  it("is order-independent", () => {
    expect(contrastRatio("#9c4421", "#f3ecdf")).toBeCloseTo(
      contrastRatio("#f3ecdf", "#9c4421"), 5,
    );
  });

  // Calibration guard: the tightest real country accent (#b07a1f) must stay
  // above the 3.0 build gate, and an obvious disaster (near-cream) must fail it.
  // If this ever flips, the gate in content.config.ts needs re-review.
  it("passes the tightest shipping accent and fails a pale disaster on the light bg", () => {
    expect(contrastRatio("#b07a1f", "#f3ecdf")).toBeGreaterThan(3);
    expect(contrastRatio("#f5e6a0", "#f3ecdf")).toBeLessThan(3);
  });
});
