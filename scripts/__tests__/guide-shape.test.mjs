// Tests for scripts/lib/guide-shape.mjs: the pure section-grouping/contiguity guard, the
// filename-slug helper, and writeGuideDir() against an isolated temp directory (real disk I/O —
// this module's whole job IS laying guide content out on disk, so a fake filesystem would test
// nothing that matters). resolveGuidePath's own cases live in pipeline-publish.test.mjs, beside
// the publication path that reads it.
//
// Ported from split-guide.test.mjs when the flat <slug>.json shape (and the splitter that
// converted it) were deleted: the grouping rules survived the cut, the flat-file input didn't.

// @protects-file Writing a guide to disk keeps its sections in the order they were authored.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileSlug, groupSections, writeGuideDir } from "../lib/guide-shape.mjs";

describe("fileSlug (pure)", () => {
  it("lowercases and hyphenates", () => {
    expect(fileSlug("Money & Budget")).toBe("money-and-budget");
  });
  it("collapses punctuation runs", () => {
    expect(fileSlug("Sights!!")).toBe("sights");
  });
  it("strips leading/trailing hyphens", () => {
    expect(fileSlug("(none)")).toBe("none");
  });
});

describe("groupSections (pure)", () => {
  it("groups contiguous sections by first-appearance order", () => {
    const sections = [
      { type: "prose", group: "Plan" },
      { type: "panel", group: "Plan" },
      { type: "map", group: "Getting around" },
    ];
    const { order, byGroup } = groupSections(sections);
    expect(order).toEqual(["Plan", "Getting around"]);
    expect(byGroup.get("Plan")).toHaveLength(2);
    expect(byGroup.get("Getting around")).toHaveLength(1);
  });

  it("treats a missing `group` as the literal group \"(none)\"", () => {
    const { order } = groupSections([{ type: "prose" }]);
    expect(order).toEqual(["(none)"]);
  });

  it("throws when a group reappears non-contiguously", () => {
    const sections = [
      { type: "prose", group: "Plan" },
      { type: "prose", group: "Sights" },
      { type: "prose", group: "Plan" }, // Plan resurfaces after Sights — not contiguous
    ];
    expect(() => groupSections(sections)).toThrow(/non-contiguous/);
  });

  it("does not throw for immediately-repeated same-group entries", () => {
    const sections = [{ group: "Plan" }, { group: "Plan" }, { group: "Plan" }];
    expect(() => groupSections(sections)).not.toThrow();
  });
});

describe("writeGuideDir (filesystem, isolated temp dir)", () => {
  let guidesDir;
  beforeEach(async () => {
    guidesDir = await mkdtemp(path.join(tmpdir(), "waypoint-guide-shape-test-"));
  });
  afterEach(async () => {
    await rm(guidesDir, { recursive: true, force: true });
  });

  it("throws for a guide with no sections array", async () => {
    await expect(writeGuideDir("empty", { title: "Empty" }, { guidesDir })).rejects.toThrow(/at least one section/);
  });

  it("throws on non-contiguous groups and writes no section files", async () => {
    const guide = {
      title: "Broken", country: "Testland",
      sections: [{ group: "Plan", type: "prose" }, { group: "Sights", type: "prose" }, { group: "Plan", type: "prose" }],
    };
    await expect(writeGuideDir("broken", guide, { guidesDir })).rejects.toThrow(/non-contiguous/);
    // Refuses before touching the disk — concatenating the group files back would silently reorder.
    await expect(readdir(path.join(guidesDir, "broken"))).rejects.toThrow();
  });

  it("writes _guide.json + NN-<group>.json files", async () => {
    const guide = {
      title: "Testland Guide", country: "Testland",
      sections: [
        { type: "prose", group: "Plan", body: "a" },
        { type: "panel", group: "Plan", body: "b" },
        { type: "map", group: "Getting around", center: { lat: 1, lng: 2 } },
      ],
    };
    const result = await writeGuideDir("testland", guide, { guidesDir });

    expect(result.groups).toBe(2);
    expect(result.groupFiles).toEqual([
      { name: "01-plan.json", count: 2 },
      { name: "02-getting-around.json", count: 1 },
    ]);

    const outDir = path.join(guidesDir, "testland");
    const files = (await readdir(outDir)).sort();
    expect(files).toEqual(["01-plan.json", "02-getting-around.json", "_guide.json"]);

    // _guide.json carries every field EXCEPT sections.
    const meta = JSON.parse(await readFile(path.join(outDir, "_guide.json"), "utf8"));
    expect(meta).toEqual({ title: "Testland Guide", country: "Testland" });

    // Filename-sort order reproduces the original section order exactly.
    const plan = JSON.parse(await readFile(path.join(outDir, "01-plan.json"), "utf8"));
    expect(plan).toEqual([{ type: "prose", group: "Plan", body: "a" }, { type: "panel", group: "Plan", body: "b" }]);
    const getAround = JSON.parse(await readFile(path.join(outDir, "02-getting-around.json"), "utf8"));
    expect(getAround).toEqual([{ type: "map", group: "Getting around", center: { lat: 1, lng: 2 } }]);

    // No flat <slug>.json is written on the way — the directory is the only shape that exists.
    await expect(readFile(path.join(guidesDir, "testland.json"), "utf8")).rejects.toThrow();
  });

  it("groups a missing `group` field under the literal file name \"(none)\" → none.json", async () => {
    const guide = { title: "No Group", sections: [{ type: "prose", body: "x" }] };
    const result = await writeGuideDir("nogroup", guide, { guidesDir });
    expect(result.groupFiles).toEqual([{ name: "01-none.json", count: 1 }]);
  });
});
