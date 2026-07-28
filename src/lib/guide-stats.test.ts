import { describe, it, expect } from "vitest";
import { computeGuideStats, latestVerifiedOn } from "./guide-stats";

describe("computeGuideStats (pure)", () => {
  it("counts guides, source_url occurrences (at any depth), and distinct hostnames", () => {
    const guides = [
      {
        title: "A",
        sections: [
          { source_url: "https://www.fs.usda.gov/alerts", verified_on: "2026-07-19" },
          { items: [{ source_url: "https://kayak.com/x" }, { source_url: "https://fs.usda.gov/other" }] },
        ],
      },
      { title: "B", sections: [{ source_url: "https://kayak.com/y" }] },
    ];
    // 4 source_url occurrences total; hostnames: fs.usda.gov (www- stripped, dedup with bare), kayak.com → 2 distinct
    expect(computeGuideStats(guides)).toEqual({ guideCount: 2, verifiedFactCount: 4, sourceCount: 2 });
  });

  it("ignores a source_url with an empty/falsy value", () => {
    const guides = [{ sections: [{ source_url: "" }, { source_url: "https://real.example/" }] }];
    expect(computeGuideStats(guides)).toEqual({ guideCount: 1, verifiedFactCount: 1, sourceCount: 1 });
  });

  it("does not throw on a malformed source_url — skips it from the source count but still counts the fact", () => {
    const guides = [{ sections: [{ source_url: "not a url" }] }];
    const stats = computeGuideStats(guides);
    expect(stats.verifiedFactCount).toBe(1);
    expect(stats.sourceCount).toBe(0);
  });

  it("returns zeros for an empty guide list, without throwing", () => {
    expect(computeGuideStats([])).toEqual({ guideCount: 0, verifiedFactCount: 0, sourceCount: 0 });
  });

  it("normalizes www. so it doesn't double-count the same real-world source", () => {
    const guides = [{ sections: [{ source_url: "https://www.example.com/a" }, { source_url: "https://example.com/b" }] }];
    expect(computeGuideStats(guides).sourceCount).toBe(1);
  });

  it("matches the real repo content's order of magnitude (sanity check against actual guides)", async () => {
    const { readdir, readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const DIR = path.join(process.cwd(), "src", "content", "guides");
    const entries = await readdir(DIR, { withFileTypes: true });
    const guidesData: unknown[] = [];
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".json")) {
        guidesData.push(JSON.parse(await readFile(path.join(DIR, e.name), "utf8")));
      } else if (e.isDirectory()) {
        const files = (await readdir(path.join(DIR, e.name))).filter((f) => f.endsWith(".json"));
        if (!files.includes("_guide.json")) continue;
        const meta = JSON.parse(await readFile(path.join(DIR, e.name, "_guide.json"), "utf8"));
        const sections: unknown[] = [];
        for (const f of files.filter((f) => f !== "_guide.json").sort()) {
          sections.push(...JSON.parse(await readFile(path.join(DIR, e.name, f), "utf8")));
        }
        guidesData.push({ ...meta, sections });
      }
    }
    const stats = computeGuideStats(guidesData);
    expect(stats.guideCount).toBeGreaterThanOrEqual(3); // korea, denmark, us today — never fewer
    expect(stats.verifiedFactCount).toBeGreaterThan(0);
    expect(stats.sourceCount).toBeGreaterThan(0);
  });
});

describe("latestVerifiedOn (pure)", () => {
  it("finds the most recent verified_on at any depth", () => {
    const guide = {
      sections: [
        { type: "panel", verified_on: "2026-06-28" },
        { type: "sights", items: [{ name: "A", verified_on: "2026-07-07" },
                                  { name: "B", verified_on: "2026-05-01" }] },
      ],
    };
    expect(latestVerifiedOn([guide])).toBe("2026-07-07");
  });
  it("returns null when nothing carries a date — the honest blank, not a fabricated today", () => {
    expect(latestVerifiedOn([{ sections: [{ type: "prose", body: "<p>x</p>" }] }])).toBeNull();
    expect(latestVerifiedOn([])).toBeNull();
  });
  it("ignores non-ISO values rather than ranking them as dates", () => {
    const guide = { sections: [{ verified_on: "Checked Jun 2026" }, { verified_on: "2026-01-09" }] };
    expect(latestVerifiedOn([guide])).toBe("2026-01-09");
  });
  it("compares across guides, not just within one", () => {
    expect(latestVerifiedOn([{ verified_on: "2025-12-31" }, { verified_on: "2026-02-02" }])).toBe("2026-02-02");
  });
});
