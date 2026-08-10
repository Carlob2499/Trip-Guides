// Tests for scripts/feedback-signals.mjs — the deterministic divergence thresholds behind the
// LEARN loop's auto-filed revision requests (REVISE_GUIDE V6). These numbers file issues
// in the creator's tracker, so the logic that trips them is unit-gated, not agent judgment.

// @protects-file Patterns drawn from feedback reflect what people actually reported.

import { describe, it, expect } from "vitest";
import { divergenceSignals, THRESHOLDS } from "../feedback-signals.mjs";

const summary = (over = {}) => ({
  slug: "korea",
  count: 2,
  ratings: { overall: 4.5, pacing: 4, food: 5 },
  skips: [],
  freeformCount: 0,
  freeform: [],
  ...over,
});

describe("divergenceSignals (pure)", () => {
  it("a healthy trip trips nothing", () => {
    expect(divergenceSignals([summary()])).toEqual([]);
  });

  it("low overall rating trips", () => {
    const r = divergenceSignals([summary({ ratings: { overall: 2.5, pacing: 4, food: 4 } })]);
    expect(r.length).toBe(1);
    expect(r[0].signals[0]).toMatch(/overall/);
  });

  it("low pacing trips even when overall is fine", () => {
    const r = divergenceSignals([summary({ ratings: { overall: 4, pacing: 2, food: 4 } })]);
    expect(r[0].signals[0]).toMatch(/pacing/);
  });

  it("heavy skips trip at >= 3 per submission", () => {
    const skips = Array.from({ length: 6 }, (_, i) => ({ stop: `stop ${i}`, reason: "" }));
    const r = divergenceSignals([summary({ skips })]); // 6 skips / 2 submissions = 3
    expect(r[0].signals[0]).toMatch(/skipped stops/);
  });

  it("2 skips per submission does NOT trip", () => {
    const skips = Array.from({ length: 4 }, (_, i) => ({ stop: `stop ${i}` }));
    expect(divergenceSignals([summary({ skips })])).toEqual([]);
  });

  it("multiple signals stack on one slug", () => {
    const r = divergenceSignals([
      summary({ ratings: { overall: 1, pacing: 1, food: 3 }, skips: Array.from({ length: 8 }, () => ({ stop: "x" })) }),
    ]);
    expect(r[0].signals.length).toBe(3);
  });

  it("null ratings (no numeric feedback) never trip rating signals", () => {
    expect(divergenceSignals([summary({ ratings: { overall: null, pacing: null, food: null } })])).toEqual([]);
  });

  it("ignores malformed rows without throwing", () => {
    expect(divergenceSignals([null, {}, { slug: "x" }, summary()])).toEqual([]);
    expect(divergenceSignals(undefined)).toEqual([]);
  });

  it("exports the thresholds so the workflow summary can name them", () => {
    expect(THRESHOLDS.overallMax).toBe(3);
    expect(THRESHOLDS.pacingMax).toBe(2);
    expect(THRESHOLDS.skipsPerSubmission).toBe(3);
  });
});
