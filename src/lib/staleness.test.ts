import { describe, it, expect } from "vitest";
import { staleness, SHELF_LIFE_DAYS } from "./staleness";

// Fixed clock — never the real one (injected-clock rule).
const NOW = new Date(Date.UTC(2026, 6, 10)); // 2026-07-10

describe("staleness", () => {
  it("fresh fact well inside its shelf life", () => {
    const s = staleness("2026-07-01", 90, NOW)!;
    expect(s.ageDays).toBe(9);
    expect(s.stale).toBe(false);
    expect(s.remainingDays).toBe(81);
  });

  it("verified today is age 0 and fresh", () => {
    const s = staleness("2026-07-10", 7, NOW)!;
    expect(s.ageDays).toBe(0);
    expect(s.stale).toBe(false);
  });

  it("exactly at the shelf-life boundary is NOT yet stale (> not >=)", () => {
    const s = staleness("2026-07-03", 7, NOW)!; // age 7, life 7
    expect(s.ageDays).toBe(7);
    expect(s.stale).toBe(false);
    expect(s.remainingDays).toBe(0);
  });

  it("one day past the boundary is stale", () => {
    const s = staleness("2026-07-02", 7, NOW)!; // age 8, life 7
    expect(s.stale).toBe(true);
    expect(s.remainingDays).toBe(-1);
  });

  it("accepts a named category", () => {
    const s = staleness("2026-01-01", "fx", NOW)!; // 190 days vs 7-day fx life
    expect(s.stale).toBe(true);
    expect(SHELF_LIFE_DAYS.fx).toBe(7);
  });

  // The categories only started being USED once `shelf_life` reached the schema and
  // staleness-ui.js stopped hardcoding "default". These lock in the behaviour that
  // makes them worth having: the same date is stale or fresh depending on the category.
  it("the SAME date is judged differently per category — the whole point of having them", () => {
    const on = "2026-06-28"; // 12 days before NOW (2026-07-10)
    expect(staleness(on, "fx", NOW)!.stale).toBe(true);       // 7d  → stale
    expect(staleness(on, "transit", NOW)!.stale).toBe(false); // 90d → fresh
    expect(staleness(on, "hours", NOW)!.stale).toBe(false);   // 90d → fresh
    expect(staleness(on, "venue", NOW)!.stale).toBe(false);   // 180d → fresh
    expect(staleness(on, "default", NOW)!.stale).toBe(false); // 90d → fresh
  });

  // staleness-ui.js reads the category off a DOM attribute, and the DOM is not the
  // schema — a hand-edited page, an old cached build, or a future schema value can put
  // anything there. It guards with hasOwnProperty and falls back to "default"; this
  // pins the contract that an unknown key must not silently resolve to undefined days
  // (which would make `ageDays > undefined` false and mark every fact permanently fresh).
  it("SHELF_LIFE_DAYS has no inherited-key collisions (the UI's hasOwnProperty guard)", () => {
    expect(Object.prototype.hasOwnProperty.call(SHELF_LIFE_DAYS, "toString")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(SHELF_LIFE_DAYS, "constructor")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(SHELF_LIFE_DAYS, "default")).toBe(true);
    // every category the schema's shelf_life enum allows must exist here
    for (const k of ["fx", "transit", "hours", "venue", "default"]) {
      expect(Object.prototype.hasOwnProperty.call(SHELF_LIFE_DAYS, k)).toBe(true);
    }
  });

  it("null/undefined/malformed dates return null (caller decides rendering)", () => {
    expect(staleness(null, 90, NOW)).toBeNull();
    expect(staleness(undefined, 90, NOW)).toBeNull();
    expect(staleness("July 2026", 90, NOW)).toBeNull();
    expect(staleness("2026-7-1", 90, NOW)).toBeNull();
  });

  it("a future verified_on yields negative age and is not stale", () => {
    const s = staleness("2026-07-20", 90, NOW)!;
    expect(s.ageDays).toBe(-10);
    expect(s.stale).toBe(false);
  });
});
