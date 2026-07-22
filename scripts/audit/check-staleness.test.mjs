// P6 regression test: check-staleness.mjs must catch a stale verified_on both at
// section level AND one level deeper, on an individual items[] entry (days/sights/
// budget) — previously only the section-level field was scanned, so a stale
// per-item fact sat invisible to recert forever even though the schema had been
// carrying its date all along.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkStaleness } from "./check-staleness.mjs";

let dir;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "staleness-fixture-"));
  const oldDate = "2020-01-01"; // long past every shelf life
  const guide = {
    title: "Fixture Guide",
    country: "Testland",
    sections: [
      {
        type: "sights",
        group: "Sights",
        title: "Sights",
        items: [
          { name: "Fresh Sight", body: "x" },
          { name: "Stale Sight", body: "x", verified_on: oldDate, shelf_life: "venue", source_url: "https://example.com/a" },
        ],
      },
      {
        type: "prose",
        group: "Overview",
        title: "Section-level stale",
        body: "x",
        verified_on: oldDate,
        shelf_life: "default",
      },
    ],
  };
  await writeFile(path.join(dir, "fixture-guide.json"), JSON.stringify(guide), "utf8");

  // D4: an archived guide's facts are stale by definition (the trip concluded) and must be
  // skipped entirely, not flagged forever with no path to "current".
  const archivedGuide = {
    title: "Concluded Trip",
    country: "Testland",
    archived: true,
    sections: [{ type: "prose", group: "Overview", title: "Old fact", body: "x", verified_on: oldDate }],
  };
  await writeFile(path.join(dir, "archived-guide.json"), JSON.stringify(archivedGuide), "utf8");
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("checkStaleness — nested item-level provenance (P6)", () => {
  it("flags a stale verified_on on a section itself", async () => {
    const { sections } = await checkStaleness({ guidesDir: dir });
    const hit = sections.find((s) => s.title === "Section-level stale");
    expect(hit).toBeTruthy();
    expect(hit.date).toBe("2020-01-01");
  });

  it("flags a stale verified_on nested inside a section's items[]", async () => {
    const { sections } = await checkStaleness({ guidesDir: dir });
    const hit = sections.find((s) => s.title.includes("Stale Sight"));
    expect(hit).toBeTruthy();
    expect(hit.title).toBe("Sights → Stale Sight");
    expect(hit.category).toBe("venue");
  });

  it("does not flag an item with no verified_on", async () => {
    const { sections } = await checkStaleness({ guidesDir: dir });
    const hit = sections.find((s) => s.title.includes("Fresh Sight"));
    expect(hit).toBeFalsy();
  });
});

describe("checkStaleness — archived guide state (D4)", () => {
  it("skips an archived guide entirely, listing it in `archived` not `sections`/`stale`", async () => {
    const { archived, sections, stale } = await checkStaleness({ guidesDir: dir });
    expect(archived).toContain("archived-guide");
    expect(sections.some((s) => s.slug === "archived-guide")).toBe(false);
    expect(stale.some((s) => s.slug === "archived-guide")).toBe(false);
  });
});
