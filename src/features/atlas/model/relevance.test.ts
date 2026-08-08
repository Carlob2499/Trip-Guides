import { describe, it, expect } from "vitest";
import { relevanceOrder, quickCardKicker } from "./relevance";

const d = (s: string) => new Date(s);

describe("relevanceOrder", () => {
  it("puts ongoing first, then upcoming (soonest first), then past (most recent first), undated last", () => {
    const records = [
      { code: "past-old", status: "past" as const, start: d("2025-01-01"), end: d("2025-01-08") },
      { code: "undated", status: "undated" as const, start: null, end: null },
      { code: "upcoming-far", status: "upcoming" as const, start: d("2027-06-01"), end: d("2027-06-08") },
      { code: "ongoing", status: "ongoing" as const, start: d("2026-08-01"), end: d("2026-08-10") },
      { code: "upcoming-near", status: "upcoming" as const, start: d("2026-09-01"), end: d("2026-09-08") },
      { code: "past-recent", status: "past" as const, start: d("2026-01-01"), end: d("2026-01-08") },
    ];
    expect(relevanceOrder(records).map((r) => r.code)).toEqual([
      "ongoing", "upcoming-near", "upcoming-far", "past-recent", "past-old", "undated",
    ]);
  });

  it("does not mutate the input array", () => {
    const records = [
      { status: "upcoming" as const, start: d("2027-01-01"), end: d("2027-01-08") },
      { status: "ongoing" as const, start: d("2026-01-01"), end: d("2026-01-08") },
    ];
    const copy = [...records];
    relevanceOrder(records);
    expect(records).toEqual(copy);
  });

  it("never throws on a null tiebreak date", () => {
    const records = [
      { status: "upcoming" as const, start: null, end: null },
      { status: "upcoming" as const, start: d("2026-01-01"), end: d("2026-01-08") },
    ];
    expect(() => relevanceOrder(records)).not.toThrow();
  });
});

describe("quickCardKicker", () => {
  it("maps each live status to its exact spec string", () => {
    expect(quickCardKicker("ongoing")).toBe("ON THIS TRIP NOW");
    expect(quickCardKicker("upcoming")).toBe("NEXT TRIP");
    expect(quickCardKicker("past")).toBe("MOST RECENT");
  });
  it("null for undated — no guessed feature", () => {
    expect(quickCardKicker("undated")).toBeNull();
  });
});
