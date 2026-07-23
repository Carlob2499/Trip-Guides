// Tests for the deterministic assert helpers in scripts/run-skill-evals.mjs (W3 skill evals). The
// point is to PROVE the regression-catching works without spending an agent run: a correctly
// propagated price change passes; a sabotaged one (a touchpoint left stale) fails. That is the
// mechanical half of "a deliberate skill regression must fail the evals."

import { describe, it, expect } from "vitest";
import { segmentsNear, assertScopedPropagation, assertDraftPreserved } from "../run-skill-evals.mjs";

// Two touchpoints of the SPAREX price, both correctly updated to ₩14,000.
const GOOD = [
  `{"type":"budget","items":[{"desc":"SPAREX jimjilbang daytime entry","note":"₩14,000 (enter by 20:00)"}]}`,
  `{"type":"days","items":[{"title":"Day 1","body":"End at SPAREX Dongdaemun — ₩14,000 for the day."}]}`,
];
// Same guide, but the Day-1 touchpoint was left at the stale ₩12,000 (a continuity-sweep failure).
const SABOTAGED = [
  `{"type":"budget","items":[{"desc":"SPAREX jimjilbang daytime entry","note":"₩14,000 (enter by 20:00)"}]}`,
  `{"type":"days","items":[{"title":"Day 1","body":"End at SPAREX Dongdaemun — ₩12,000 for the day."}]}`,
];

describe("segmentsNear", () => {
  it("returns one window per keyword occurrence, scoped around it", () => {
    const segs = segmentsNear(GOOD, "SPAREX");
    expect(segs).toHaveLength(2);
    expect(segs.every((s) => s.includes("SPAREX"))).toBe(true);
  });
  it("finds nothing when the keyword is absent", () => {
    expect(segmentsNear(["no venue here"], "SPAREX")).toHaveLength(0);
  });
});

describe("assertScopedPropagation", () => {
  it("PASSES when every SPAREX touchpoint shows the new price and none the old", () => {
    const r = assertScopedPropagation(GOOD, "SPAREX", "₩12,000", "₩14,000", 2);
    expect(r.pass).toBe(true);
    expect(r.newHits).toBe(2);
    expect(r.oldHits).toBe(0);
  });

  it("FAILS (catches the regression) when a touchpoint is left stale", () => {
    const r = assertScopedPropagation(SABOTAGED, "SPAREX", "₩12,000", "₩14,000", 2);
    expect(r.pass).toBe(false);
    expect(r.oldHits).toBe(1); // the stale ₩12,000 near SPAREX is detected
  });

  it("FAILS when the change landed in only one place (didn't propagate)", () => {
    const oneOnly = [GOOD[0], `{"type":"days","items":[{"body":"SPAREX later"}]}`];
    expect(assertScopedPropagation(oneOnly, "SPAREX", "₩12,000", "₩14,000", 2).pass).toBe(false);
  });
});

describe("assertDraftPreserved", () => {
  it("detects a preserved draft flag and its absence", () => {
    expect(assertDraftPreserved('{"title":"x","draft":true}')).toBe(true);
    expect(assertDraftPreserved('{"title":"x"}')).toBe(false);
  });
});
