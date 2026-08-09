// Tests for scripts/validate-revision-plan.mjs — the deterministic gate on Agent P's revision
// plan. The two cases the plan doc calls out by name MUST be here: (1) a plan naming a section
// that doesn't exist in the guide (the silent-void seam), and (2) a blocking fork routing to
// exit-3 semantics (the Clarifying-Questions Doctrine gate).

// @protects-file A revision plan is checked before anything is changed.

import { describe, it, expect } from "vitest";
import { validateRevisionPlan, MAX_RERESEARCH } from "../validate-revision-plan.mjs";

const SECTIONS = ["01-plan.json", "03-sights.json", "06-days.json"];

const goodPlan = () => ({
  slug: "korea",
  issue: 42,
  status: "planned",
  summary: "Dates moved to April; re-research seasonal picks in Sights, re-cut Days.",
  reResearch: [
    { group: "03-sights.json", why: "seasonal picks stale", questions: ["what blooms in April?"], passB: true, priority: 1 },
  ],
  rippleCheck: [{ group: "06-days.json", greps: ["October", "koyo"], why: "day plan references autumn" }],
  reconcile: [{ item: "foliage timing", current: "guide says October peak", signal: "trip is now April" }],
  forks: [],
  outOfScope: ["Food & shopping — cuisine doesn't shift with the date change"],
  budget: { maxSelfCorrectRounds: 3, expectedGroupsTouched: 2 },
});

describe("validateRevisionPlan (pure)", () => {
  it("accepts a well-formed plan with no blocking forks", () => {
    expect(validateRevisionPlan(goodPlan(), SECTIONS)).toEqual({ errors: [], blockingForks: [] });
  });

  it("rejects a plan naming a section that does not exist (the silent-void seam)", () => {
    const p = goodPlan();
    p.reResearch[0].group = "99-imaginary.json";
    const { errors } = validateRevisionPlan(p, SECTIONS);
    expect(errors.some((e) => e.includes("99-imaginary.json") && e.includes("does not exist"))).toBe(true);
  });

  it("rejects a nonexistent rippleCheck group too", () => {
    const p = goodPlan();
    p.rippleCheck[0].group = "42-nope.json";
    expect(validateRevisionPlan(p, SECTIONS).errors.length).toBeGreaterThan(0);
  });

  it("rejects an over-cap plan with the route-to-research-pass message (Q5 default)", () => {
    const p = goodPlan();
    p.reResearch = SECTIONS.concat(SECTIONS, SECTIONS).slice(0, MAX_RERESEARCH + 1).map((g, i) => ({
      group: SECTIONS[i % SECTIONS.length], why: "x", questions: ["q"],
    }));
    const { errors } = validateRevisionPlan(p, SECTIONS);
    expect(errors.some((e) => e.includes("research-pass"))).toBe(true);
  });

  it("rejects an empty reResearch with the route-to-modify message", () => {
    const p = goodPlan();
    p.reResearch = [];
    expect(validateRevisionPlan(p, SECTIONS).errors.some((e) => e.includes("modify-guide"))).toBe(true);
  });

  it("surfaces blocking forks as exit-3 semantics — valid plan, forks returned", () => {
    const p = goodPlan();
    p.forks = [
      { question: "Keep the ryokan splurge night in April (no foliage) or move it?", options: ["keep", "move"], recommendation: "keep — onsen is season-proof", blocking: true },
      { question: "cosmetic naming", blocking: false },
    ];
    const { errors, blockingForks } = validateRevisionPlan(p, SECTIONS);
    expect(errors).toEqual([]);
    expect(blockingForks.length).toBe(1);
    expect(blockingForks[0].question).toMatch(/ryokan/);
  });

  it("a blocking fork without options/recommendation is a plan ERROR, not a gate", () => {
    const p = goodPlan();
    p.forks = [{ question: "which?", blocking: true }];
    const { errors, blockingForks } = validateRevisionPlan(p, SECTIONS);
    expect(errors.length).toBeGreaterThan(0);
    expect(blockingForks).toEqual([]);
  });

  it("rejects a self-correct budget above the cap", () => {
    const p = goodPlan();
    p.budget.maxSelfCorrectRounds = 6;
    expect(validateRevisionPlan(p, SECTIONS).errors.some((e) => e.includes("maxSelfCorrectRounds"))).toBe(true);
  });

  it("rejects garbage without throwing", () => {
    expect(validateRevisionPlan(null, SECTIONS).errors.length).toBeGreaterThan(0);
    expect(validateRevisionPlan("nope", SECTIONS).errors.length).toBeGreaterThan(0);
    expect(validateRevisionPlan({}, SECTIONS).errors.length).toBeGreaterThan(0);
  });
});
