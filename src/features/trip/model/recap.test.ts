// @protects-file Recap atoms are counts of what the guide recorded, never synthetic scores.

import { describe, it, expect } from "vitest";
import { deriveRecap } from "./recap";
import { deriveReadiness, openCount } from "./readiness";

const days = [
  { date: "Wed Jul 8", stops: [1, 2, 3] },
  { date: "Thu Jul 9", stops: [1, 2] },
];

describe("deriveRecap", () => {
  it("is absent without a post-mortem", () => {
    expect(deriveRecap(days, null)).toBeNull();
    expect(deriveRecap(days, { keyLearnings: [] })).toBeNull();
  });
  it("counts planned, skipped and hit stops from the curated record", () => {
    const r = deriveRecap(days, {
      summary: "Held where clustered.",
      days: [{ date: "Wed Jul 8", actually: "Rain.", skipped: [{ stop: "Garden", reason: "rain" }, { stop: "Walk" }] }],
    })!;
    expect(r.plannedStops).toBe(5);
    expect(r.skippedStops).toBe(2);
    expect(r.hitStops).toBe(3);
    expect(r.daysReviewed).toBe(1);
    expect(r.dayCount).toBe(2);
    expect(r.changedDays[0].skipped).toEqual([{ stop: "Garden", reason: "rain" }, { stop: "Walk", reason: null }]);
  });
  it("gives no hit count when only a summary exists", () => {
    const r = deriveRecap(days, { summary: "Fine." })!;
    expect(r.hitStops).toBeNull();
    expect(r.changedDays).toEqual([]);
  });
});

describe("deriveReadiness", () => {
  it("splits booking items from the rest and counts open ones", () => {
    const s = deriveReadiness([
      { type: "panel", title: "Plan", checklist: ["Book the ferry", "Pack layers"] },
    ]);
    expect(s.bookAhead.map((r) => r.text)).toEqual(["Book the ferry"]);
    expect(s.other.map((r) => r.text)).toEqual(["Pack layers"]);
    expect(openCount(s.reminders, { [s.bookAhead[0].id]: 1 })).toBe(1);
  });
});
