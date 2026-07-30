import { describe, it, expect } from "vitest";
import { parseCounts, recordOpen, rankOrder, promoted, seat, slotLabel, resumeLine } from "./rank";

const ORDER = ["Plan", "Days", "Food & Drink", "Stay", "Getting Around"];

describe("parseCounts", () => {
  it("parses a JSON string", () => {
    expect(parseCounts('{"Food & Drink":3}')).toEqual({ "Food & Drink": 3 });
  });
  it("returns {} for junk, arrays, null and unparseable strings", () => {
    expect(parseCounts("not json")).toEqual({});
    expect(parseCounts(null)).toEqual({});
    expect(parseCounts([1, 2])).toEqual({});
    expect(parseCounts(42)).toEqual({});
  });
  it("drops non-numeric, negative, zero and non-finite values", () => {
    expect(parseCounts({ a: "5", b: -1, c: 0, d: NaN, e: Infinity, f: 2 })).toEqual({ f: 2 });
  });
  it("floors fractional counts", () => {
    expect(parseCounts({ a: 2.9 })).toEqual({ a: 2 });
  });
});

describe("recordOpen", () => {
  it("increments without mutating the input", () => {
    const before = { Days: 1 };
    const after = recordOpen(before, "Days");
    expect(after).toEqual({ Days: 2 });
    expect(before).toEqual({ Days: 1 });
  });
  it("starts a new group at 1", () => {
    expect(recordOpen({}, "Stay")).toEqual({ Stay: 1 });
  });
  it("ignores an empty name", () => {
    const c = { Stay: 1 };
    expect(recordOpen(c, "")).toBe(c);
  });
});

describe("rankOrder", () => {
  it("falls back to guide order when nothing has been opened", () => {
    expect(rankOrder({}, ORDER)).toEqual([0, 1, 2, 3, 4]);
  });
  it("sorts most-used first", () => {
    expect(rankOrder({ Stay: 5, "Food & Drink": 9 }, ORDER)).toEqual([2, 3, 0, 1, 4]);
  });
  it("breaks ties by guide order, not counts-object insertion order", () => {
    expect(rankOrder({ "Getting Around": 4, Plan: 4 }, ORDER)).toEqual([0, 4, 1, 2, 3]);
  });
  it("ignores counts for groups this guide does not have", () => {
    expect(rankOrder({ Nightlife: 99 }, ORDER)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("promoted", () => {
  it("always seats the current group first", () => {
    expect(promoted({ "Food & Drink": 9 }, ORDER, 3)).toEqual([3, 2]);
  });
  it("does not duplicate the current group when it is also the most-used", () => {
    expect(promoted({ "Food & Drink": 9, Stay: 4 }, ORDER, 2)).toEqual([2, 3]);
  });
  it("shows the top-ranked groups when a tool panel is open (current = -1)", () => {
    expect(promoted({ Stay: 7 }, ORDER, -1)).toEqual([3, 0]);
  });
  it("ignores an out-of-range current index instead of seating a phantom slot", () => {
    expect(promoted({}, ORDER, 99)).toEqual([0, 1]);
  });
  it("honours a wider slot count and never exceeds the group count", () => {
    expect(promoted({}, ORDER, 0, 3)).toEqual([0, 1, 2]);
    expect(promoted({}, ["Only"], 0, 3)).toEqual([0]);
  });
  it("returns nothing for zero slots", () => {
    expect(promoted({}, ORDER, 1, 0)).toEqual([]);
  });
});

describe("seat", () => {
  it("keeps a surviving group in the slot it already occupies", () => {
    // Reader taps the RIGHT slot (Days). promoted() now returns [1, 2] — current first —
    // but Days must stay right and Food must stay left, or the buttons trade places.
    expect(seat([2, 1], [1, 2])).toEqual([2, 1]);
  });
  it("fills empty slots on first render", () => {
    expect(seat([null, null], [3, 0])).toEqual([3, 0]);
  });
  it("drops a group that left the set and seats the newcomer in its place", () => {
    expect(seat([2, 1], [2, 4])).toEqual([2, 4]);
  });
  it("nulls a slot with nothing left to hold", () => {
    expect(seat([2, 1], [2])).toEqual([2, null]);
  });
  it("ignores a stale slot value that is no longer promoted", () => {
    expect(seat([7, 1], [1, 3])).toEqual([3, 1]);
  });
});

describe("slotLabel", () => {
  it("leaves a short name alone", () => {
    expect(slotLabel("Days")).toBe("Days");
  });
  it("keeps the head of a compound name", () => {
    expect(slotLabel("Food & Drink")).toBe("Food");
    expect(slotLabel("Arrival and Transit")).toBe("Arrival");
  });
  it("truncates at a word boundary when the head is still too long", () => {
    expect(slotLabel("Getting Around")).toBe("Getting…");
  });
  it("cuts mid-word rather than leaving a useless stub", () => {
    expect(slotLabel("Neighbourhoods")).toBe("Neighbour…");
  });
  it("returns empty for empty input", () => {
    expect(slotLabel("")).toBe("");
  });
});

describe("resumeLine", () => {
  it("renders where the reader left off", () => {
    expect(resumeLine("Late-night eats")).toBe("you were at Late-night eats");
  });
  it("collapses whitespace from DOM text", () => {
    expect(resumeLine("\n  Late-night   eats \n")).toBe("you were at Late-night eats");
  });
  it("returns null when there is nothing remembered — an honest blank", () => {
    expect(resumeLine(null)).toBeNull();
    expect(resumeLine("")).toBeNull();
    expect(resumeLine("   ")).toBeNull();
    expect(resumeLine(12)).toBeNull();
  });
  it("truncates a very long section title", () => {
    const long = "A section title that runs on well past any sane bar width";
    expect(resumeLine(long)).toHaveLength("you were at ".length + 42);
  });
});
