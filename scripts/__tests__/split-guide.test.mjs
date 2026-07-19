// Tests for scripts/split-guide.mjs: the pure section-grouping/contiguity guard, the
// filename-slug helper, and splitGuide() itself against an isolated temp directory (real
// disk I/O — this script's whole job IS moving guide content between files, so a fake
// filesystem would test nothing that matters).

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileSlug, groupSections, splitGuide, SPLIT_ERRORS } from "../split-guide.mjs";

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

describe("splitGuide (filesystem, isolated temp dir)", () => {
  let guidesDir;
  beforeEach(async () => {
    guidesDir = await mkdtemp(path.join(tmpdir(), "waypoint-split-test-"));
  });
  afterEach(async () => {
    await rm(guidesDir, { recursive: true, force: true });
  });

  it("returns NOT_FOUND when the source file doesn't exist", async () => {
    const result = await splitGuide("ghost", { guidesDir });
    expect(result).toMatchObject({ ok: false, error: SPLIT_ERRORS.NOT_FOUND, slug: "ghost" });
  });

  it("returns NO_SECTIONS for a guide with no sections array", async () => {
    await writeFile(path.join(guidesDir, "empty.json"), JSON.stringify({ title: "Empty" }));
    const result = await splitGuide("empty", { guidesDir });
    expect(result).toMatchObject({ ok: false, error: SPLIT_ERRORS.NO_SECTIONS });
  });

  it("returns NON_CONTIGUOUS and leaves the source file untouched", async () => {
    const guide = {
      title: "Broken", country: "Testland",
      sections: [{ group: "Plan", type: "prose" }, { group: "Sights", type: "prose" }, { group: "Plan", type: "prose" }],
    };
    await writeFile(path.join(guidesDir, "broken.json"), JSON.stringify(guide));
    const result = await splitGuide("broken", { guidesDir });
    expect(result).toMatchObject({ ok: false, error: SPLIT_ERRORS.NON_CONTIGUOUS });
    // Refuses to split — the monolith must still be there, untouched.
    const stillThere = JSON.parse(await readFile(path.join(guidesDir, "broken.json"), "utf8"));
    expect(stillThere).toEqual(guide);
  });

  it("splits a valid guide into _guide.json + NN-<group>.json files, removing the monolith", async () => {
    const guide = {
      title: "Testland Guide", country: "Testland",
      sections: [
        { type: "prose", group: "Plan", body: "a" },
        { type: "panel", group: "Plan", body: "b" },
        { type: "map", group: "Getting around", center: { lat: 1, lng: 2 } },
      ],
    };
    await writeFile(path.join(guidesDir, "testland.json"), JSON.stringify(guide));
    const result = await splitGuide("testland", { guidesDir });

    expect(result.ok).toBe(true);
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

    // The monolith is gone.
    await expect(readFile(path.join(guidesDir, "testland.json"), "utf8")).rejects.toThrow();
  });

  it("groups a missing `group` field under the literal file name \"(none)\" → none.json", async () => {
    const guide = { title: "No Group", sections: [{ type: "prose", body: "x" }] };
    await writeFile(path.join(guidesDir, "nogroup.json"), JSON.stringify(guide));
    const result = await splitGuide("nogroup", { guidesDir });
    expect(result.groupFiles).toEqual([{ name: "01-none.json", count: 1 }]);
  });
});
