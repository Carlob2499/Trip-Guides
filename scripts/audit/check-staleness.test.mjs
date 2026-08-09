// P6 regression test: check-staleness.mjs must catch a stale verified_on both at
// section level AND one level deeper, on an individual items[] entry (days/sights/
// budget) — previously only the section-level field was scanned, so a stale
// per-item fact sat invisible to recert forever even though the schema had been
// carrying its date all along.
// @protects-file Old facts are caught before a guide is republished.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkStaleness, SHELF_LIFE_DAYS } from "./check-staleness.mjs";
import { SHELF_LIFE_DAYS as SHELF_LIFE_DAYS_TS } from "../../src/lib/staleness.ts";

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

  // A DIRECTORY guide carrying a perishable-fact registry. Interpolation inlines a fact's
  // VALUE into the prose but leaves its verified_on behind, so unless checkStaleness reads
  // facts.json directly, moving a price out of prose and into the registry would silently
  // remove it from the recert punch list while it kept aging.
  const { mkdir } = await import("node:fs/promises");
  const gdir = path.join(dir, "registry-guide");
  await mkdir(gdir, { recursive: true });
  await writeFile(path.join(gdir, "_guide.json"), JSON.stringify({ title: "Registry Guide", country: "Testland" }), "utf8");
  await writeFile(
    path.join(gdir, "01-plan.json"),
    JSON.stringify([{ type: "prose", group: "Plan", title: "Costs", body: "<p>Entry {{fact:stale-price}}, bus {{fact:fresh-price}}.</p>" }]),
    "utf8",
  );
  await writeFile(
    path.join(gdir, "facts.json"),
    JSON.stringify({
      "stale-price": { claim: "Museum admission", value: "DKK 145", source_url: "https://example.com/p", verified_on: oldDate, shelf_life: "venue" },
      "fresh-price": { claim: "Bus fare", value: "DKK 24", source_url: "https://example.com/b", verified_on: new Date().toISOString().slice(0, 10), shelf_life: "transit" },
    }),
    "utf8",
  );
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

describe("checkStaleness — the perishable-fact registry", () => {
  it("flags a stale fact that lives in facts.json, not in a section", async () => {
    const { sections } = await checkStaleness({ guidesDir: dir });
    const hit = sections.find((s) => s.title.startsWith("fact:stale-price"));
    expect(hit).toBeTruthy();
    expect(hit.slug).toBe("registry-guide");
    expect(hit.date).toBe("2020-01-01");
    expect(hit.category).toBe("venue");
    // The punch list must carry the source to re-check against, like any other finding.
    expect(hit.source).toBe("https://example.com/p");
  });

  it("names the fact by id AND claim, so the punch list is greppable", async () => {
    const { sections } = await checkStaleness({ guidesDir: dir });
    const hit = sections.find((s) => s.title.startsWith("fact:stale-price"));
    expect(hit.title).toBe("fact:stale-price → Museum admission");
  });

  it("leaves a fact inside its shelf life alone", async () => {
    const { sections } = await checkStaleness({ guidesDir: dir });
    expect(sections.find((s) => s.title.includes("fresh-price"))).toBeFalsy();
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

describe("E8·1 — SHELF_LIFE_DAYS stays in sync across its two copies", () => {
  it("check-staleness.mjs's copy deep-equals src/lib/staleness.ts's", () => {
    expect(SHELF_LIFE_DAYS).toEqual(SHELF_LIFE_DAYS_TS);
  });
});
