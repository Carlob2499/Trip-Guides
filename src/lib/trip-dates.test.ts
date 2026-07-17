import { describe, it, expect } from "vitest";
import { resolveTripDate, tripWindow } from "./trip-dates";

const iso = (d: Date | null) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : null);

describe("resolveTripDate", () => {
  it("resolves a normal label to the current year", () => {
    expect(iso(resolveTripDate("Wed Jul 8", new Date(2026, 5, 1)))).toBe("2026-07-08");
  });

  it("keeps a RECENTLY past date in the current year — a just-finished trip is not upcoming", () => {
    // Korea ended Jul 15; viewed Jul 17 it must stay in the past, or the guide would
    // claim to be upcoming and the countdown/weather would both lie.
    expect(iso(resolveTripDate("Wed Jul 15", new Date(2026, 6, 17)))).toBe("2026-07-15");
  });

  it("rolls a LONG-past date forward to next year — the December-writing-for-January case", () => {
    // Written 2026-12-20 for a Jan trip: "Fri Jan 8" must mean Jan 2027, not the Jan 2026
    // that already happened. This is the whole reason the function exists.
    expect(iso(resolveTripDate("Fri Jan 8", new Date(2026, 11, 20)))).toBe("2027-01-08");
  });

  it("pivots at the 180-day boundary, not at 'any past date'", () => {
    const now = new Date(2026, 6, 1); // Jul 1 2026
    // ~179 days back (early Jan) → still >180? check both sides explicitly.
    const justInside = resolveTripDate("Thu Feb 5", now)!;  // ~146 days back → stay
    expect(justInside.getFullYear()).toBe(2026);
    const wellOutside = resolveTripDate("Thu Jan 1", now)!; // ~181 days back → roll
    expect(wellOutside.getFullYear()).toBe(2027);
  });

  it("returns null for relative labels — those guides legitimately have no trip dates", () => {
    expect(resolveTripDate("Day 1", new Date(2026, 6, 1))).toBeNull();
    expect(resolveTripDate("Day 12", new Date(2026, 6, 1))).toBeNull();
  });

  it("returns null for absent/garbage input rather than an Invalid Date", () => {
    // An Invalid Date would poison every comparison downstream while looking like a Date.
    expect(resolveTripDate(null, new Date(2026, 6, 1))).toBeNull();
    expect(resolveTripDate(undefined, new Date(2026, 6, 1))).toBeNull();
    expect(resolveTripDate("", new Date(2026, 6, 1))).toBeNull();
    expect(resolveTripDate("Wed Juk 8", new Date(2026, 6, 1))).toBeNull();   // bad month
    expect(resolveTripDate("Wed Jul xx", new Date(2026, 6, 1))).toBeNull();  // bad day
    expect(resolveTripDate("nonsense", new Date(2026, 6, 1))).toBeNull();
  });
});

describe("tripWindow", () => {
  const KOREA = ["Wed Jul 8", "Wed Jul 15"] as const;

  it("reports a concluded trip as past — the guard that stops weather forecasting a finished trip", () => {
    const w = tripWindow(KOREA[0], KOREA[1], new Date(2026, 6, 17)); // Jul 17, trip ended Jul 15
    expect(w.isPast).toBe(true);
    expect(w.isOngoing).toBe(false);
    expect(w.lengthDays).toBe(8);
  });

  it("reports an ongoing trip", () => {
    const w = tripWindow(KOREA[0], KOREA[1], new Date(2026, 6, 10));
    expect(w.isOngoing).toBe(true);
    expect(w.isPast).toBe(false);
  });

  it("the last day is INCLUSIVE — a trip is not past on its final day", () => {
    const w = tripWindow(KOREA[0], KOREA[1], new Date(2026, 6, 15));
    expect(w.isPast).toBe(false);
    expect(w.isOngoing).toBe(true);
  });

  it("counts days until an upcoming trip", () => {
    const w = tripWindow(KOREA[0], KOREA[1], new Date(2026, 6, 1));
    expect(w.daysUntilStart).toBe(7);
    expect(w.isOngoing).toBe(false);
    expect(w.isPast).toBe(false);
  });

  it("clamps a malformed range (end before start) instead of yielding a negative length", () => {
    // A negative lengthDays would poison the weather window slice and the countdown.
    const w = tripWindow("Wed Jul 15", "Wed Jul 8", new Date(2026, 6, 1));
    expect(w.lengthDays).toBe(1);
    expect(iso(w.end)).toBe(iso(w.start));
  });

  it("a single-day trip is 1 day, not 0", () => {
    expect(tripWindow("Wed Jul 8", "Wed Jul 8", new Date(2026, 6, 1)).lengthDays).toBe(1);
  });

  it("no usable dates → hasDates false and every derived flag safe", () => {
    const w = tripWindow("Day 1", "Day 9", new Date(2026, 6, 1));
    expect(w).toMatchObject({ hasDates: false, lengthDays: 0, isPast: false, isOngoing: false, daysUntilStart: 0 });
    expect(w.start).toBeNull();
  });

  it("a missing lastDayDate falls back to the start day, not null", () => {
    const w = tripWindow("Wed Jul 8", null, new Date(2026, 6, 1));
    expect(iso(w.end)).toBe("2026-07-08");
    expect(w.lengthDays).toBe(1);
  });
});
