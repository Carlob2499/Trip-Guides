import { describe, it, expect } from "vitest";
import { deriveBookByTimeline } from "./book-by";

const NOW = new Date(2026, 6, 1); // Wed Jul 1 2026 (local)

describe("deriveBookByTimeline", () => {
  it("collects dated items from panel checklists AND per-day checklists, ignoring bare strings", () => {
    const sections = [
      { type: "panel", checklist: ["no date here", { text: "Book KTX", due: "2026-07-05", source_url: "https://korail.com", verified_on: "2026-06-01" }] },
      { type: "days", items: [
        { date: "Wed Jul 8", checklist: ["also no date", { text: "Book Secret Garden tour", due: "2026-06-20", source_url: "https://cdg.go.kr", verified_on: "2026-06-01" }] },
      ] },
    ];
    const items = deriveBookByTimeline(sections, NOW);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.text)).toEqual(["Book Secret Garden tour", "Book KTX"]); // sorted soonest-first
  });

  it("buckets overdue (<0 days), soon (0-14 days), and later (>14 days) correctly", () => {
    const sections = [{ type: "panel", checklist: [
      { text: "Past due", due: "2026-06-20", source_url: "https://x.com", verified_on: "2026-06-01" }, // -11
      { text: "This week", due: "2026-07-05", source_url: "https://x.com", verified_on: "2026-06-01" }, // +4
      { text: "Next month", due: "2026-08-15", source_url: "https://x.com", verified_on: "2026-06-01" }, // +45
    ] }];
    const items = deriveBookByTimeline(sections, NOW);
    expect(items.find((i) => i.text === "Past due")?.bucket).toBe("overdue");
    expect(items.find((i) => i.text === "This week")?.bucket).toBe("soon");
    expect(items.find((i) => i.text === "Next month")?.bucket).toBe("later");
  });

  it("carries note and source_url through, defaulting to null when absent", () => {
    const sections = [{ type: "panel", checklist: [
      { text: "With note", due: "2026-07-10", note: "≈$45 booking fee", source_url: "https://x.com", verified_on: "2026-06-01" },
    ] }];
    const [item] = deriveBookByTimeline(sections, NOW);
    expect(item.note).toBe("≈$45 booking fee");
    expect(item.source_url).toBe("https://x.com");
  });

  it("returns an empty array for a guide with no dated checklist items — never invents one", () => {
    expect(deriveBookByTimeline([{ type: "panel", checklist: ["plain string only"] }], NOW)).toEqual([]);
    expect(deriveBookByTimeline([], NOW)).toEqual([]);
    expect(deriveBookByTimeline(null, NOW)).toEqual([]);
    expect(deriveBookByTimeline(undefined, NOW)).toEqual([]);
  });

  it("ignores sections of other types entirely", () => {
    const sections = [{ type: "prose", body: "hello" }, { type: "list", items: ["a", "b"] }];
    expect(deriveBookByTimeline(sections, NOW)).toEqual([]);
  });
});
