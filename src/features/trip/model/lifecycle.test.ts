// @protects-file Trip says "now" only when the clock actually puts the traveler inside the trip.

import { describe, it, expect } from "vitest";
import { tripPhase, todayIndex, parseStartMinutes, focusFor, daysToGo, minutesUntil, untilLabel, type TripStop } from "./lifecycle";

const stop = (name: string, time: string | null = null, branch: string | null = null): TripStop =>
  ({ name, time, note: null, lat: null, lng: null, branch, leaveBy: null });

describe("minutesUntil / untilLabel", () => {
  it("counts down only to a real clock time that is still ahead", () => {
    expect(minutesUntil("~14:00", 12 * 60 + 40)).toBe(80);
    expect(minutesUntil("14:00", 14 * 60)).toBe(0);
    expect(minutesUntil("14:00", 15 * 60)).toBeNull();
    expect(minutesUntil("morning", 9 * 60)).toBeNull();
    expect(minutesUntil("14:00", null)).toBeNull();
  });
  it("labels exactly under twenty minutes and coarsely beyond", () => {
    expect(untilLabel(0)).toBe("now");
    expect(untilLabel(12)).toBe("in 12 min");
    expect(untilLabel(83)).toBe("in 1 h 25 min");
    expect(untilLabel(120)).toBe("in 2 h");
  });
});

describe("tripPhase", () => {
  it("is undated for relative day labels — no present moment is invented", () => {
    expect(tripPhase("Day 1", "Day 3", new Date(2026, 6, 10))).toBe("undated");
  });
  it("pre → active → post across a dated window", () => {
    expect(tripPhase("Wed Jul 8", "Wed Jul 15", new Date(2026, 6, 1))).toBe("pre");
    expect(tripPhase("Wed Jul 8", "Wed Jul 15", new Date(2026, 6, 10))).toBe("active");
    expect(tripPhase("Wed Jul 8", "Wed Jul 15", new Date(2026, 6, 20))).toBe("post");
  });
});

describe("todayIndex", () => {
  const dates = ["Wed Jul 8", "Thu Jul 9", "Fri Jul 10"];
  it("names the day the clock is on and -1 outside the trip", () => {
    expect(todayIndex(dates, new Date(2026, 6, 9, 14))).toBe(1);
    expect(todayIndex(dates, new Date(2026, 6, 20))).toBe(-1);
  });
});

describe("parseStartMinutes", () => {
  it("reads a clock time in any of the guide's spellings", () => {
    expect(parseStartMinutes("~06:15")).toBe(375);
    expect(parseStartMinutes("17:00–21:00")).toBe(1020);
    expect(parseStartMinutes("≈14:30")).toBe(870);
  });
  it("leaves flexible windows flexible", () => {
    expect(parseStartMinutes("morning")).toBeNull();
    expect(parseStartMinutes("from late")).toBeNull();
    expect(parseStartMinutes(null)).toBeNull();
    expect(parseStartMinutes("25:99")).toBeNull();
  });
});

describe("focusFor", () => {
  const timed = [stop("A", "08:00"), stop("B", "10:00"), stop("C", "14:00"), stop("D", "evening")];
  it("uses the clock when stops carry times", () => {
    const f = focusFor(timed, 11 * 60);
    expect(f.timed).toBe(true);
    expect(f.now?.name).toBe("B");
    expect(f.next?.name).toBe("C");
    expect(f.later.map((s) => s.name)).toEqual(["D"]);
    expect(f.done.map((s) => s.name)).toEqual(["A"]);
  });
  it("before the first timed stop, the first stop is now", () => {
    const f = focusFor(timed, 6 * 60);
    expect(f.now?.name).toBe("A");
    expect(f.next?.name).toBe("B");
    expect(f.done).toEqual([]);
  });
  it("falls back to listed order for a flexible day and respects check-offs", () => {
    const flex = [stop("Kastellet", "morning"), stop("Mermaid"), stop("Reffen", "from 11:30")];
    const f = focusFor(flex, 15 * 60, new Set([0]));
    expect(f.timed).toBe(true); // "from 11:30" is a clock time
    expect(f.done.map((s) => s.name)).toEqual(["Kastellet", "Mermaid"]);
    expect(f.now?.name).toBe("Reffen");
    const untimed = [stop("One"), stop("Two"), stop("Three")];
    const g = focusFor(untimed, 15 * 60, new Set([0]));
    expect(g.timed).toBe(false);
    expect(g.now?.name).toBe("Two");
    expect(g.next?.name).toBe("Three");
    expect(g.later).toEqual([]);
  });
  it("handles an empty day", () => {
    expect(focusFor([], 600)).toEqual({ now: null, next: null, later: [], done: [], timed: false });
  });
});

describe("daysToGo", () => {
  it("counts whole days and is null when undated", () => {
    expect(daysToGo("Wed Jul 8", "Wed Jul 15", new Date(2026, 6, 1))).toBe(7);
    expect(daysToGo("Day 1", "Day 2", new Date(2026, 6, 1))).toBeNull();
  });
});
