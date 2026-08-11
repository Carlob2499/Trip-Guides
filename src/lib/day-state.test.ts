// @protects-file A guide never claims you are on a day of a trip you are not on.

import { describe, expect, it } from "vitest";
import { dayState } from "./trip-dates";

// A real shape: four consecutive days, as guide JSON writes them.
const TRIP = ["Wed Jul 8", "Thu Jul 9", "Fri Jul 10", "Sat Jul 11"];
const at = (iso: string) => new Date(`${iso}T12:00:00`);
const states = (now: Date) => TRIP.map((_, i) => dayState(TRIP, i, now));

describe("dayState", () => {
  it("marks today `now`, the day after `next`, and the rest around it", () => {
    expect(states(at("2026-07-09"))).toEqual(["done", "now", "next", "planned"]);
  });

  it("⌁ has NO `now` day before the trip starts — day 1 is first, not current", () => {
    /* The absence the whole design rests on: a guide read in June must not tell its reader
       they are standing in Seoul. Every day reads `planned`, and crucially day 1 is NOT
       `next` — calling it that would imply a departure the guide cannot see. */
    const before = states(at("2026-06-01"));
    expect(before).toEqual(["planned", "planned", "planned", "planned"]);
    expect(before).not.toContain("now");
    expect(before).not.toContain("next");
  });

  it("⌁ has no `now` day after the trip has finished", () => {
    const after = states(at("2026-09-01"));
    expect(after).toEqual(["done", "done", "done", "done"]);
    expect(after).not.toContain("now");
  });

  it("marks exactly one day `now` and at most one `next`", () => {
    for (const iso of ["2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11"]) {
      const s = states(at(iso));
      expect(s.filter((x) => x === "now")).toHaveLength(1);
      expect(s.filter((x) => x === "next").length).toBeLessThanOrEqual(1);
    }
  });

  it("gives the last day no `next` — there is no day after the trip", () => {
    const s = states(at("2026-07-11"));
    expect(s).toEqual(["done", "done", "done", "now"]);
  });

  it("returns null for a date it cannot resolve rather than guessing a state", () => {
    expect(dayState(["not a date"], 0, at("2026-07-09"))).toBeNull();
    expect(dayState([null], 0, at("2026-07-09"))).toBeNull();
    expect(dayState([], 0, at("2026-07-09"))).toBeNull();
  });

  it("compares calendar dates, not timestamps — 23:50 and 00:10 are different days", () => {
    /* A timestamp comparison would put a reader at 23:50 on Jul 9 and one at 00:10 on Jul 10
       within nine hours of each other and call it the same day. The reader's phone does not
       agree, and the phone is what they are looking at. */
    expect(dayState(TRIP, 1, new Date("2026-07-09T23:50:00"))).toBe("now");
    expect(dayState(TRIP, 1, new Date("2026-07-10T00:10:00"))).toBe("done");
    expect(dayState(TRIP, 2, new Date("2026-07-10T00:10:00"))).toBe("now");
  });
});
