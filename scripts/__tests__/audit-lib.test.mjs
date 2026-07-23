// Tests for the pure parsers in scripts/audit/lib.mjs — the helpers every audit script
// (check-links, check-photos, check-staleness) and the verify roll-up depend on. A
// regression here silently lets stale or unverified facts pass the checks the whole
// platform exists to enforce, so these are worth pinning down independent of any real
// guide content or network access.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { flatten, extractLinks, extractPhotos, parseVerifiedDate, daysSince, MONTHS, readGuides } from "../audit/lib.mjs";

describe("flatten", () => {
  it("returns top-level sections unchanged when none nest", () => {
    const sections = [{ type: "prose" }, { type: "list" }];
    expect(flatten(sections)).toEqual(sections);
  });

  it("recursively inlines nested `sections` arrays in place of their parent", () => {
    const sections = [
      { type: "prose", title: "A" },
      { sections: [{ type: "list", title: "B" }, { type: "map", title: "C" }] },
    ];
    expect(flatten(sections)).toEqual([
      { type: "prose", title: "A" },
      { type: "list", title: "B" },
      { type: "map", title: "C" },
    ]);
  });

  it("handles multiple levels of nesting", () => {
    const sections = [{ sections: [{ sections: [{ type: "prose", title: "deep" }] }] }];
    expect(flatten(sections)).toEqual([{ type: "prose", title: "deep" }]);
  });

  it("treats a missing/undefined sections array as empty", () => {
    expect(flatten(undefined)).toEqual([]);
    expect(flatten([])).toEqual([]);
  });

  it("skips falsy entries", () => {
    expect(flatten([null, { type: "prose" }, undefined])).toEqual([{ type: "prose" }]);
  });
});

describe("extractLinks", () => {
  it("extracts an inline href citation with double quotes", () => {
    expect(extractLinks('<a href="https://example.com/a">link</a>')).toEqual(["https://example.com/a"]);
  });

  it("extracts an inline href citation with single quotes", () => {
    expect(extractLinks("<a href='https://example.com/b'>link</a>")).toEqual(["https://example.com/b"]);
  });

  it("extracts a structured source_url field", () => {
    expect(extractLinks('"source_url": "https://example.com/c"')).toEqual(["https://example.com/c"]);
  });

  it("dedupes repeated citations", () => {
    const raw = '<a href="https://example.com/a">x</a> ... "source_url": "https://example.com/a"';
    expect(extractLinks(raw)).toEqual(["https://example.com/a"]);
  });

  it("collects both kinds together, in first-seen order", () => {
    const raw = '"source_url": "https://example.com/first" <a href="https://example.com/second">y</a>';
    expect(extractLinks(raw)).toEqual(["https://example.com/first", "https://example.com/second"]);
  });

  it("returns an empty array when there is nothing to extract", () => {
    expect(extractLinks("no links here")).toEqual([]);
  });

  it("ignores non-http(s) hrefs", () => {
    expect(extractLinks('<a href="/relative/path">x</a>')).toEqual([]);
  });
});

describe("extractPhotos", () => {
  it("collects img.file across sights items", () => {
    const guide = {
      sections: [
        { type: "sights", items: [{ img: { file: "A.jpg" } }, { img: { file: "B.jpg" } }] },
      ],
    };
    expect(extractPhotos(guide)).toEqual(["A.jpg", "B.jpg"]);
  });

  it("ignores non-sights sections", () => {
    const guide = { sections: [{ type: "prose", items: [{ img: { file: "ignored.jpg" } }] }] };
    expect(extractPhotos(guide)).toEqual([]);
  });

  it("ignores items with no img.file", () => {
    const guide = { sections: [{ type: "sights", items: [{ name: "no photo" }, { img: {} }] }] };
    expect(extractPhotos(guide)).toEqual([]);
  });

  it("dedupes a photo reused across multiple sights", () => {
    const guide = {
      sections: [{ type: "sights", items: [{ img: { file: "same.jpg" } }, { img: { file: "same.jpg" } }] }],
    };
    expect(extractPhotos(guide)).toEqual(["same.jpg"]);
  });

  it("looks inside nested sections (via flatten)", () => {
    const guide = {
      sections: [{ sections: [{ type: "sights", items: [{ img: { file: "nested.jpg" } }] }] }],
    };
    expect(extractPhotos(guide)).toEqual(["nested.jpg"]);
  });
});

describe("parseVerifiedDate", () => {
  it("parses a full 'D Mon YYYY' date", () => {
    const d = parseVerifiedDate("Checked 28 Jun 2026 for the trip");
    expect(d?.toISOString()).toBe(new Date(Date.UTC(2026, 5, 1)).toISOString());
  });

  it("parses a bare 'Mon YYYY' date with no day component", () => {
    const d = parseVerifiedDate("✓ Verified Jun 2026 — via official site");
    expect(d?.toISOString()).toBe(new Date(Date.UTC(2026, 5, 1)).toISOString());
  });

  it("recognizes every month abbreviation", () => {
    for (const [abbr, monthIndex] of Object.entries(MONTHS)) {
      const d = parseVerifiedDate(`Checked ${abbr} 2026`);
      expect(d?.getUTCMonth(), `month ${abbr}`).toBe(monthIndex);
    }
  });

  it("tolerates a longer word + trailing period built on the 3-letter abbreviation", () => {
    // The regex only requires MONTHS' 3-letter prefix ("Sep") followed by [a-z]*\.? —
    // so "Sept." still matches via "Sep" + "t" + ".", same as a plain "Sep 2026" would.
    const d = parseVerifiedDate("Checked Sept. 2026");
    expect(d?.getUTCMonth()).toBe(8);
  });

  it("returns null for text with no date-like content", () => {
    expect(parseVerifiedDate("unverified — needs a research pass")).toBeNull();
  });

  it("returns null for empty/falsy input", () => {
    expect(parseVerifiedDate("")).toBeNull();
    expect(parseVerifiedDate(null)).toBeNull();
    expect(parseVerifiedDate(undefined)).toBeNull();
  });

  it("returns null for an unrecognized month-like token", () => {
    expect(parseVerifiedDate("Xyz 2026")).toBeNull();
  });
});

describe("daysSince", () => {
  it("computes whole days between two dates", () => {
    const then = new Date(Date.UTC(2026, 0, 1));
    const now = new Date(Date.UTC(2026, 0, 11));
    expect(daysSince(then, now)).toBe(10);
  });

  it("defaults `now` to the current time when omitted", () => {
    const now = new Date();
    const then = new Date(now.getTime() - 5 * 86400000);
    expect(daysSince(then)).toBe(5);
  });

  it("rounds to the nearest whole day across a fractional gap", () => {
    const then = new Date(Date.UTC(2026, 0, 1));
    const now = new Date(then.getTime() + 2.6 * 86400000);
    expect(daysSince(then, now)).toBe(3);
  });

  it("returns a negative number for a date in the future relative to now", () => {
    const then = new Date(Date.UTC(2026, 0, 11));
    const now = new Date(Date.UTC(2026, 0, 1));
    expect(daysSince(then, now)).toBe(-10);
  });
});

describe("readGuides (filesystem, isolated temp dir)", () => {
  let guidesDir;
  beforeEach(async () => {
    guidesDir = await mkdtemp(path.join(tmpdir(), "waypoint-audit-readguides-test-"));
  });
  afterEach(async () => {
    await rm(guidesDir, { recursive: true, force: true });
  });

  it("reads a flat-file guide", async () => {
    await writeFile(path.join(guidesDir, "korea.json"), JSON.stringify({ title: "Korea", sections: [] }));
    const guides = await readGuides(guidesDir);
    expect(guides).toEqual([
      { file: "korea.json", slug: "korea", raw: JSON.stringify({ title: "Korea", sections: [] }), guide: { title: "Korea", sections: [] } },
    ]);
  });

  it("reads a directory-shaped (split) guide, assembling sections in filename-sort order", async () => {
    const dir = path.join(guidesDir, "denmark");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "_guide.json"), JSON.stringify({ title: "Denmark" }));
    await writeFile(path.join(dir, "02-sights.json"), JSON.stringify([{ type: "sights", group: "Sights" }]));
    await writeFile(path.join(dir, "01-plan.json"), JSON.stringify([{ type: "prose", group: "Plan" }]));

    const guides = await readGuides(guidesDir);
    expect(guides).toHaveLength(1);
    expect(guides[0].slug).toBe("denmark");
    expect(guides[0].file).toBe("denmark/");
    expect(guides[0].guide.title).toBe("Denmark");
    // 01- sorts before 02- regardless of write order above.
    expect(guides[0].guide.sections).toEqual([
      { type: "prose", group: "Plan" },
      { type: "sights", group: "Sights" },
    ]);
    // `raw` concatenates every file's text, so href/source_url regex extraction still sees everything.
    expect(guides[0].raw).toContain("Denmark");
    expect(guides[0].raw).toContain("Plan");
    expect(guides[0].raw).toContain("Sights");
  });

  it("skips a directory with no _guide.json (not a guide dir)", async () => {
    await mkdir(path.join(guidesDir, "not-a-guide"), { recursive: true });
    await writeFile(path.join(guidesDir, "not-a-guide", "readme.json"), "{}");
    expect(await readGuides(guidesDir)).toEqual([]);
  });

  it("skips a malformed guide file (invalid JSON) rather than throwing", async () => {
    await writeFile(path.join(guidesDir, "broken.json"), "{ not valid json");
    await writeFile(path.join(guidesDir, "ok.json"), JSON.stringify({ title: "OK" }));
    const guides = await readGuides(guidesDir);
    expect(guides).toHaveLength(1);
    expect(guides[0].slug).toBe("ok");
  });

  it("ignores non-JSON files at the top level", async () => {
    await writeFile(path.join(guidesDir, "README.md"), "# not a guide");
    expect(await readGuides(guidesDir)).toEqual([]);
  });

  it("E8·2: when a slug has both shapes, the flat file wins (shared tie-break, same as resolveGuidePath)", async () => {
    await writeFile(path.join(guidesDir, "dupe.json"), JSON.stringify({ title: "Flat wins" }));
    const dir = path.join(guidesDir, "dupe");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "_guide.json"), JSON.stringify({ title: "Directory loses" }));
    const guides = await readGuides(guidesDir);
    expect(guides).toHaveLength(1);
    expect(guides[0].guide.title).toBe("Flat wins");
  });
});
