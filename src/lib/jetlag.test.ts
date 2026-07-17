import { describe, it, expect } from "vitest";
import { computeJetLag } from "./jetlag";

describe("computeJetLag", () => {
  it("Seoul from LA — a real eastward trip (dest +9, origin -7, 16h gap)", () => {
    const r = computeJetLag(9, -7);
    expect(r.negligible).toBe(false);
    if (!r.negligible) {
      expect(r.direction).toBe("east");
      expect(r.hours).toBe(16);
      expect(r.days).toBe(16);           // eastward: ceil(hours)
      expect(r.showMelatoninTip).toBe(true); // >=7h
    }
  });

  it("LA from Seoul — the return leg is westward and adapts faster", () => {
    const r = computeJetLag(-7, 9);
    expect(r.negligible).toBe(false);
    if (!r.negligible) {
      expect(r.direction).toBe("west");
      expect(r.hours).toBe(16);
      expect(r.days).toBe(Math.ceil(16 / 1.5)); // 11 — the asymmetry, same gap fewer days
      expect(r.days).toBe(11);
    }
  });

  it("westward is never charged more days than eastward for the SAME gap", () => {
    const east = computeJetLag(9, -7);
    const west = computeJetLag(-7, 9);
    if (!east.negligible && !west.negligible) {
      expect(west.days).toBeLessThan(east.days);
    }
  });

  it("stays inside the +0.4h dead zone — a half-hour zone crossing is not jet lag", () => {
    expect(computeJetLag(5.5, 5.0)).toEqual({ negligible: true }); // diff = 0.4 (boundary, exclusive)
    expect(computeJetLag(5.4, 5.0)).toEqual({ negligible: true }); // diff = 0.4
  });

  it("a direction past the dead zone can STILL be negligible if under 1 hour total", () => {
    // diff 0.6 clears the 0.4 direction threshold, but hours(0.6) < 1 — the two rules
    // are independent and both have to pass.
    expect(computeJetLag(5.6, 5.0)).toEqual({ negligible: true });
  });

  it("a 1+ hour gap that also exceeds the direction threshold is NOT negligible", () => {
    const r = computeJetLag(6, 5); // diff 1.0, direction 'east', hours 1
    expect(r.negligible).toBe(false);
  });

  it("negative diff at exactly -0.4 stays in the dead zone", () => {
    expect(computeJetLag(5.0, 5.4)).toEqual({ negligible: true });
  });

  it("under 1 hour is negligible even with a clear direction", () => {
    // diff 0.5 → direction 'east' by the 0.4 rule, but hours(0.5) < 1 → still negligible.
    expect(computeJetLag(5.5, 5.0)).toEqual({ negligible: true });
  });

  it("melatonin tip appears at exactly 7h and not at 6.9h", () => {
    const seven = computeJetLag(7, 0);
    const sixNine = computeJetLag(6.9, 0);
    if (!seven.negligible) expect(seven.showMelatoninTip).toBe(true);
    if (!sixNine.negligible) expect(sixNine.showMelatoninTip).toBe(false);
  });

  it("rounds the hour gap to 1 decimal place", () => {
    const r = computeJetLag(9, 5.55); // diff 3.45 -> abs*10=34.5 -> round=35 -> 3.5
    if (!r.negligible) expect(r.hours).toBe(3.5);
  });

  it("computes the body-clock-at-11pm anchor correctly for a large eastward gap", () => {
    // Seoul (+9) from LA (-7): diff=16. bodyAt11 = 23-16 = 7 -> "7am".
    const r = computeJetLag(9, -7);
    if (!r.negligible) expect(r.bodyClockAt11pmLocal).toBe("7am");
  });

  it("wraps the body-clock anchor past midnight for a westward gap", () => {
    // LA (-7) from Seoul (+9): diff=-16. bodyAt11 = 23-(-16) = 39 -> wraps to 15 -> 3pm.
    const r = computeJetLag(-7, 9);
    if (!r.negligible) expect(r.bodyClockAt11pmLocal).toBe("3pm");
  });

  it("body-clock anchor never leaves the [0,24) range regardless of gap sign", () => {
    for (const [dest, origin] of [[12, -8], [-8, 12], [10, -12], [-12, 10]] as const) {
      const r = computeJetLag(dest, origin);
      if (!r.negligible) {
        const h = parseInt(r.bodyClockAt11pmLocal, 10);
        expect(h).toBeGreaterThanOrEqual(1);
        expect(h).toBeLessThanOrEqual(12);
        expect(r.bodyClockAt11pmLocal).toMatch(/^(1[0-2]|[1-9])(am|pm)$/);
      }
    }
  });

  it("handles a fractional-offset origin (Mumbai UTC+5:30) without drifting", () => {
    const r = computeJetLag(9, 5.5); // Seoul from Mumbai, diff 3.5
    if (!r.negligible) {
      expect(r.hours).toBe(3.5);
      expect(r.direction).toBe("east");
      expect(r.days).toBe(4); // ceil(3.5)
    }
  });

  it("zero gap (same zone) is negligible", () => {
    expect(computeJetLag(9, 9)).toEqual({ negligible: true });
  });
});
