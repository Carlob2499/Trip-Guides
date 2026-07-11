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
