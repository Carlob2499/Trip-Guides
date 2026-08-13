// Tests for the deterministic assert helpers in scripts/run-skill-evals.mjs (W3 skill evals). The
// point is to PROVE the regression-catching works without spending an agent run: a correctly
// propagated price change passes; a sabotaged one (a touchpoint left stale) fails. That is the
// mechanical half of "a deliberate skill regression must fail the evals."

// @protects-file The guide-writing instructions are themselves tested against known cases.

import { describe, it, expect } from "vitest";
import { interpolateFacts } from "../../src/lib/facts.mjs";
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

// ── The registry seam (found by the first real run of skill-evals, 2026-08-13) ────────────
// The skill requires perishable money facts to live in facts.json and be referenced from prose
// as {{fact:<id>}}. Under that model the literal figure exists exactly ONCE — in the row — and
// every touchpoint carries a token. A propagation check reading RAW file text therefore sees the
// new value zero times and fails a correct edit, which is exactly what happened: the live gate
// reported "₩14,000 near SPAREX in 0 place(s)" against a doctrine-following agent pass.
//
// guideTexts() now resolves tokens through the same interpolation the build uses, so these
// assert the property that fix has to preserve: a reader-visible value counts wherever the
// reader meets it, and the registry row itself is NOT one of those places.
describe("token-resolved propagation — the facts-registry seam", () => {
  const FACTS = { "jjimjil-14000": { value: "₩14,000", state: "clean" } };

  it("counts a tokenized touchpoint, because the reader sees the resolved value", () => {
    const resolved = [
      JSON.stringify(interpolateFacts({ note: "SPAREX Dongdaemun — {{fact:jjimjil-14000}} daytime" }, FACTS).data),
      JSON.stringify(interpolateFacts({ body: "SPAREX Dongdaemun ({{fact:jjimjil-14000}}): arrive 17:00" }, FACTS).data),
    ];
    const r = assertScopedPropagation(resolved, "SPAREX", "₩12,000", "₩14,000", 2);
    expect(r.newHits).toBe(2);
    expect(r.pass).toBe(true);
  });

  it("still FAILS when only one touchpoint carries the value — the ≥2 floor must keep biting", () => {
    const resolved = [
      JSON.stringify(interpolateFacts({ note: "SPAREX Dongdaemun — {{fact:jjimjil-14000}} daytime" }, FACTS).data),
      JSON.stringify({ body: "SPAREX Dongdaemun: arrive 17:00, exit by 21:00" }),
    ];
    expect(assertScopedPropagation(resolved, "SPAREX", "₩12,000", "₩14,000", 2).pass).toBe(false);
  });

  it("still FAILS on a stale value left beside a correctly-tokenized one", () => {
    const resolved = [
      JSON.stringify(interpolateFacts({ note: "SPAREX Dongdaemun — {{fact:jjimjil-14000}} daytime" }, FACTS).data),
      JSON.stringify(interpolateFacts({ b: "SPAREX Dongdaemun ({{fact:jjimjil-14000}})" }, FACTS).data),
      JSON.stringify({ ref: "SPAREX Dongdaemun — Klook, ≈₩12,000–15,000" }),
    ];
    expect(assertScopedPropagation(resolved, "SPAREX", "₩12,000", "₩14,000", 2).pass).toBe(false);
  });
});
