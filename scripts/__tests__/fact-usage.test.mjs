// Tests for scripts/audit/fact-usage.mjs (B4, docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST): the derived,
// never-stored bidirectional index — fact-id -> every location that references it, and the
// inverse list of sourced money mentions with no {{fact:id}} token at all.

// @protects-file Changing a fact tells you every day/section that depends on it; a sourced
// money figure never silently ships outside the fact registry.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildFactUsage } from "../audit/fact-usage.mjs";

describe("buildFactUsage — synthetic guide dir", () => {
  let dir;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "fact-usage-fixture-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function guideDir(slug, files) {
    const guide = path.join(dir, slug);
    await mkdir(guide, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      await writeFile(path.join(guide, name), JSON.stringify(content));
    }
    return guide;
  }

  it("locates a token reference inside a `days` section, capturing file/section/day", async () => {
    await guideDir("test-slug", {
      "06-days.json": [
        {
          type: "days",
          group: "Days",
          title: "Day by day",
          items: [{ date: "Sat Oct 17", title: "Sendai", body: "The pass costs {{fact:transit-pass-30}}." }],
        },
      ],
      "facts.json": {
        "transit-pass-30": { claim: "Transit pass — $30", value: "$30", source_url: "https://x.example/", verified_on: "2026-01-01", shelf_life: "transit" },
      },
    });

    const { usage } = await buildFactUsage("test-slug", dir);
    expect(usage["transit-pass-30"]).toEqual([
      { file: "06-days.json", section: "Day by day", day: "Sat Oct 17", item: null, field: "body" },
    ]);
  });

  it("locates a token reference inside a non-days section, capturing the item name instead of a day", async () => {
    await guideDir("test-slug", {
      "03-sights.json": [
        {
          type: "sights",
          group: "Sights",
          title: "Top sights",
          items: [{ name: "Old Fort", body: "Entry runs {{fact:old-fort-500}}." }],
        },
      ],
      "facts.json": {
        "old-fort-500": { claim: "Old Fort — ¥500", value: "¥500", source_url: "https://x.example/", verified_on: "2026-01-01", shelf_life: "venue" },
      },
    });

    const { usage } = await buildFactUsage("test-slug", dir);
    expect(usage["old-fort-500"]).toEqual([
      { file: "03-sights.json", section: "Top sights", day: null, item: "Old Fort", field: "body" },
    ]);
  });

  it("a fact referenced from TWO different files/sections gets both locations", async () => {
    await guideDir("test-slug", {
      "01-plan.json": [{ type: "prose", group: "Overview", title: "Local essentials", body: "Cash up to {{fact:shared-1000}} is fine." }],
      "07-money.json": [{ type: "prose", group: "Budget", title: "Money & currency", body: "Budget {{fact:shared-1000}} for incidentals." }],
      "facts.json": {
        "shared-1000": { claim: "Local essentials — ¥1,000", value: "¥1,000", source_url: "https://x.example/", verified_on: "2026-01-01", shelf_life: "default" },
      },
    });

    const { usage } = await buildFactUsage("test-slug", dir);
    expect(usage["shared-1000"]).toHaveLength(2);
    expect(usage["shared-1000"].map((l) => l.file).sort()).toEqual(["01-plan.json", "07-money.json"]);
  });

  it("a fact defined but never referenced anywhere has no usage entry at all", async () => {
    await guideDir("test-slug", {
      "01-plan.json": [{ type: "prose", group: "Overview", title: "About", body: "No token here." }],
      "facts.json": {
        "unused-row": { claim: "Unused — $5", value: "$5", source_url: "https://x.example/", verified_on: "2026-01-01", shelf_life: "default" },
      },
    });

    const { usage } = await buildFactUsage("test-slug", dir);
    expect(usage["unused-row"]).toBeUndefined();
  });

  it("finds a sourced, untokenized money mention as a candidate", async () => {
    await guideDir("test-slug", {
      "01-plan.json": [{ type: "prose", group: "Overview", title: "About", source_url: "https://x.example/", verified_on: "2026-01-01", body: "Entry costs $40, cash only." }],
    });

    const { candidates } = await buildFactUsage("test-slug", dir);
    expect(candidates).toEqual([
      { file: "01-plan.json", section: "About", day: null, item: null, field: "body", value: "$40" },
    ]);
  });

  it("does NOT flag a money mention already inside a {{fact:id}} token as a candidate", async () => {
    await guideDir("test-slug", {
      "01-plan.json": [{ type: "prose", group: "Overview", title: "About", source_url: "https://x.example/", verified_on: "2026-01-01", body: "Entry costs {{fact:entry-40}}." }],
      "facts.json": {
        "entry-40": { claim: "About — $40", value: "$40", source_url: "https://x.example/", verified_on: "2026-01-01", shelf_life: "default" },
      },
    });

    const { candidates } = await buildFactUsage("test-slug", dir);
    expect(candidates).toEqual([]);
  });

  it("does NOT flag a money mention in a unit with no source_url/verified_on (not migratable)", async () => {
    await guideDir("test-slug", {
      "01-plan.json": [{ type: "prose", group: "Overview", title: "About", body: "Roughly $40, unsourced." }],
    });

    const { candidates } = await buildFactUsage("test-slug", dir);
    expect(candidates).toEqual([]);
  });

  it("does NOT scan a Sources list as a candidate source (mirrors migrate-facts.mjs's isReferenceUnit)", async () => {
    await guideDir("test-slug", {
      "10-sources.json": [{ type: "prose", group: "Sources", title: "Sources & links", source_url: "https://x.example/", verified_on: "2026-01-01", body: "See the $40 entry fee above." }],
    });

    const { candidates } = await buildFactUsage("test-slug", dir);
    expect(candidates).toEqual([]);
  });
});

/* ⌁ A "real Japan guide" ACCEPTANCE block stood here: two fact rows sharing the ¥11,410 value
   (day-by-day-11-410, budget-daily-costs-11-410) each resolving to a different group file. It
   read the LIVE japan guide on purpose, because the frozen fixture carries only a subset of
   japan's group files and not 07-money-and-budget.json. That guide was deleted for a fresh
   redo, so the block has no subject; the defect itself stays frozen as case 9 of
   tests/fixtures/japan-regression/ (see scripts/__tests__/japan-regression.test.mjs). The
   BEHAVIOUR it exercised — one fact referenced from two files yielding both locations — is
   covered synthetically above and loses nothing here. */
