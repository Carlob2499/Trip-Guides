import { describe, it, expect } from "vitest";
import { computeBudgetPact } from "./pact";

describe("computeBudgetPact", () => {
  const items = [
    { basis: "day" as const, est: 100 }, // $100/day
    { basis: "trip" as const, est: 600 }, // one-off $600 (e.g. flights)
  ];

  it("returns null with nothing entered yet — honest blank, not a guessed $0", () => {
    expect(computeBudgetPact({ items, days: 7, daysElapsed: 3, actualSoFar: 0, currency: "$" })).toBeNull();
  });

  it("returns null for a section with no items at all", () => {
    expect(computeBudgetPact({ items: [], days: 7, daysElapsed: 3, actualSoFar: 500, currency: "$" })).toBeNull();
  });

  it("counts trip-basis costs from day one, day-basis costs only for elapsed days", () => {
    // Day 3: plan so far = 600 (trip) + 100*3 (day) = 900
    const result = computeBudgetPact({ items, days: 7, daysElapsed: 3, actualSoFar: 900, currency: "$" });
    expect(result?.planSoFar).toBe(900);
    expect(result?.status).toBe("on");
    expect(result?.deltaAmount).toBe(0);
  });

  it("flags over-plan spend with the unsigned delta and 'over' status", () => {
    const result = computeBudgetPact({ items, days: 7, daysElapsed: 3, actualSoFar: 961, currency: "$" });
    expect(result?.status).toBe("over");
    expect(result?.deltaAmount).toBe(61); // matches the plan doc's own worked example
  });

  it("flags under-plan spend with the unsigned delta and 'under' status", () => {
    const result = computeBudgetPact({ items, days: 7, daysElapsed: 3, actualSoFar: 800, currency: "$" });
    expect(result?.status).toBe("under");
    expect(result?.deltaAmount).toBe(100);
  });

  it("before departure (daysElapsed 0), only trip-basis costs are expected", () => {
    const result = computeBudgetPact({ items, days: 7, daysElapsed: 0, actualSoFar: 600, currency: "$" });
    expect(result?.planSoFar).toBe(600);
    expect(result?.status).toBe("on");
    expect(result?.dayLabel).toBe("Before you go");
  });

  it("clamps elapsed days to the section's own trip length once the trip is over", () => {
    const result = computeBudgetPact({ items, days: 7, daysElapsed: 30, actualSoFar: 1300, currency: "$" });
    expect(result?.planSoFar).toBe(600 + 100 * 7); // never prorates past the full trip
    expect(result?.dayLabel).toBe("Day 7");
  });

  it("never lets a negative daysElapsed (shouldn't happen, but defensive) underflow the plan", () => {
    const result = computeBudgetPact({ items, days: 7, daysElapsed: -2, actualSoFar: 600, currency: "$" });
    expect(result?.planSoFar).toBe(600);
  });

  it("carries the currency through untouched", () => {
    expect(computeBudgetPact({ items, days: 7, daysElapsed: 1, actualSoFar: 700, currency: "€" })?.currency).toBe("€");
  });
});
