import { describe, it, expect } from "vitest";
import { buildFeedbackRecord, aggregateVisited } from "./feedback";

describe("buildFeedbackRecord", () => {
  it("clamps ratings to integer 1..5 and omits missing/invalid", () => {
    const r = buildFeedbackRecord({ ratings: { overall: 7, pacing: 3.6, food: 0 } });
    expect(r).not.toBeNull();
    expect(r!.ratings.overall).toBe(5); // above range clamps down
    expect(r!.ratings.pacing).toBe(4); // 3.6 rounds to nearest whole star
    expect("food" in r!.ratings).toBe(false); // 0 = not answered → dropped
  });

  it("returns null for wholly empty input", () => {
    expect(buildFeedbackRecord({})).toBeNull();
    expect(buildFeedbackRecord({ ratings: {}, visited: {}, skips: [], freeform: "   " })).toBeNull();
  });

  it("strips empty/anonymous skips and trims + caps text", () => {
    const r = buildFeedbackRecord({
      skips: [null, { stop: "", reason: "orphan" }, { stop: "  Gyeongbokgung  ", reason: "  rain  " }],
      freeform: "  too much walking  ",
    });
    expect(r!.skips).toEqual([{ stop: "Gyeongbokgung", reason: "rain" }]);
    expect(r!.freeform).toBe("too much walking");
  });

  it("coerces visited values to booleans", () => {
    const r = buildFeedbackRecord({ visited: { "0-0": 1, "0-1": 0, "1-0": "yes" } });
    expect(r!.visited).toEqual({ "0-0": true, "0-1": false, "1-0": true });
  });

  it("keeps an optional day only when non-empty", () => {
    expect(buildFeedbackRecord({ freeform: "x", day: " 2026-07-13 " })!.day).toBe("2026-07-13");
    expect("day" in buildFeedbackRecord({ freeform: "x" })!).toBe(false);
  });
});

describe("aggregateVisited", () => {
  it("counts done/total from the merged visited map", () => {
    const agg = aggregateVisited([{ visited: { "0-0": true, "0-1": false } }]);
    expect(agg).toMatchObject({ done: 1, total: 2 });
  });

  it("lets later records win per stop", () => {
    const agg = aggregateVisited([
      { visited: { "0-0": true, "0-1": false } },
      { visited: { "0-1": true } }, // flips 0-1 → visited
    ]);
    expect(agg.done).toBe(2);
    expect(agg.total).toBe(2);
  });

  it("collects skipped stops with the latest reason", () => {
    const agg = aggregateVisited([
      { skips: [{ stop: "Palace", reason: "tired" }] },
      { skips: [{ stop: "Palace", reason: "rain" }, { stop: "Market", reason: "" }] },
    ]);
    const byStop = Object.fromEntries(agg.skipped.map((s) => [s.stop, s.reason]));
    expect(byStop.Palace).toBe("rain"); // latest reason wins
    expect("Market" in byStop).toBe(true);
  });

  it("handles empty / nullish input", () => {
    expect(aggregateVisited([])).toEqual({ done: 0, total: 0, skipped: [] });
    expect(aggregateVisited([null, undefined])).toEqual({ done: 0, total: 0, skipped: [] });
  });
});
