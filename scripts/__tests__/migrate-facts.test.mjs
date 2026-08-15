// Tests for scripts/migrate-facts.mjs: the pure regex/normalization functions directly, and
// proposeMigration() against an isolated temp guide directory (real disk I/O — this script's
// whole job is reading/rewriting guide section files, so a fake filesystem tests nothing real).
//
// B2 (docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST): fixes MONEY_RE's trailing-punctuation capture (Japan
// regression fixture case 10 — "$19,", "$1,", "$80,") and adds claim-stem dedup across
// source_urls (case 9 — one entity re-discovered with a different source each time).

// @protects-file A migrated fact's value never carries a stray trailing separator, and the
// same claim cited from two sources collapses onto one row instead of minting a duplicate.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { findMoney, normalizeValue, proposeMigration } from "../migrate-facts.mjs";

describe("normalizeValue (pure)", () => {
  it("strips a trailing comma", () => {
    expect(normalizeValue("19,")).toBe("19");
  });
  it("strips a trailing period", () => {
    expect(normalizeValue("6,000.")).toBe("6,000");
  });
  it("strips a run of trailing separators", () => {
    expect(normalizeValue("80,,.")).toBe("80");
  });
  it("leaves a clean value untouched", () => {
    expect(normalizeValue("11,410")).toBe("11,410");
  });
  it("leaves an interior decimal untouched", () => {
    expect(normalizeValue("5.50")).toBe("5.50");
  });
});

describe("findMoney — the MONEY_DIGITS fix (B2, case 10)", () => {
  // These are the exact prose SHAPES that produced the Japan fixture's malformed rows
  // (tests/fixtures/japan-regression/guide/facts.json:25,88,119) — a comma-separated list of
  // options, and a value ending a sentence.
  it("does not swallow the separator in a comma-separated list of options", () => {
    const hits = findMoney("A local SIM runs $19, $65, or $18 depending on data.");
    expect(hits.map((h) => h.value)).toEqual(["$19", "$65", "$18"]);
  });

  it("does not swallow a full stop ending a sentence", () => {
    const hits = findMoney("Budget around ₩6,000. That covers the entry fee.");
    expect(hits.map((h) => h.value)).toEqual(["₩6,000"]);
  });

  it("does not swallow a trailing comma with nothing after it", () => {
    const hits = findMoney("Roughly $1, give or take, is the FX spread per transaction.");
    expect(hits.map((h) => h.value)).toEqual(["$1"]);
  });

  it("still captures a full comma-grouped, decimal value intact", () => {
    const hits = findMoney("The transfer cost $2,007.90 in total.");
    expect(hits.map((h) => h.value)).toEqual(["$2,007.90"]);
  });

  it("still captures plain thousands-grouping (¥11,410, unit-first JPY)", () => {
    const hits = findMoney("JR East quotes ¥11,410 for the route.");
    expect(hits.map((h) => h.value)).toEqual(["¥11,410"]);
  });

  it("still captures unit-last currency codes (100 DKK)", () => {
    const hits = findMoney("Entry is 100 DKK for adults.");
    expect(hits.map((h) => h.value)).toEqual(["100 DKK"]);
  });

  it("never emits a raw/value ending in a bare separator, across all three MONEY_RE branches", () => {
    const text = "$19, $65, or $18; also ¥11,410, 100 DKK, and ₩6,000. done.";
    const hits = findMoney(text);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      expect(h.value).not.toMatch(/[.,]$/);
      expect(h.raw).not.toMatch(/[.,]$/);
    }
  });
});

describe("proposeMigration — claim-stem dedup across sources (B2, case 9)", () => {
  let dir;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "migrate-facts-fixture-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function guideDir(slug, files) {
    const guide = path.join(dir, slug);
    await mkdir(guide, { recursive: true });
    for (const [name, sections] of Object.entries(files)) {
      await writeFile(path.join(guide, name), JSON.stringify(sections));
    }
    return guide;
  }

  it("collapses the SAME claim + value cited from two different source_urls into one row", async () => {
    // Reproduces the shape of the Japan fixture's case 9: the identical label ("Budget & daily
    // costs → Domestic flights…") and the identical value (¥11,410) turn up twice, sourced to
    // two different pages. The old value+source_url key would have minted two rows; B2 must not.
    const label = "Budget & daily costs";
    await guideDir("test-slug", {
      "01-budget.json": [
        {
          group: label,
          title: label,
          source_url: "https://www.ana.co.jp/en/us/",
          verified_on: "2026-07-29",
          body: "Domestic flights run about ¥11,410 one-way.",
        },
      ],
      "02-transit.json": [
        {
          group: "Day by day",
          title: label,
          source_url: "https://www.jreast.co.jp/e/",
          verified_on: "2026-07-29",
          body: "The connecting leg is priced at ¥11,410 on the JR site.",
        },
      ],
    });

    const { facts, factCount, collapsed } = await proposeMigration("test-slug", dir);

    expect(factCount).toBe(1);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0].kept).toBe("https://www.ana.co.jp/en/us/");
    expect(collapsed[0].dropped).toBe("https://www.jreast.co.jp/e/");
    // The single surviving row keeps the FIRST-seen source (file order: 01 before 02).
    const [row] = Object.values(facts);
    expect(row.source_url).toBe("https://www.ana.co.jp/en/us/");
    expect(row.value).toBe("¥11,410");
  });

  it("does NOT collapse the same value under a DIFFERENT claim label — only the stem must match", async () => {
    await guideDir("test-slug", {
      "01-a.json": [
        {
          group: "Food & dining",
          title: "Food & dining",
          source_url: "https://example.com/food",
          verified_on: "2026-07-29",
          body: "Dinner runs about $50 per person.",
        },
      ],
      "02-b.json": [
        {
          group: "Sights",
          title: "Sights",
          source_url: "https://example.com/sights",
          verified_on: "2026-07-29",
          body: "Entry to the museum is $50.",
        },
      ],
    });

    const { factCount, collapsed } = await proposeMigration("test-slug", dir);

    expect(factCount).toBe(2);
    expect(collapsed).toHaveLength(0);
  });

  it("still collapses repeats from the SAME source (the original one-fact-one-row behavior)", async () => {
    await guideDir("test-slug", {
      "01-a.json": [
        {
          group: "Transit",
          title: "Transit",
          source_url: "https://example.com/transit",
          verified_on: "2026-07-29",
          body: "The pass costs $30. Buy the $30 pass before boarding.",
        },
      ],
    });

    const { factCount, occurrences, collapsed } = await proposeMigration("test-slug", dir);

    expect(factCount).toBe(1);
    expect(occurrences).toBe(2);
    expect(collapsed).toHaveLength(0);
  });

  it("produces clean values end-to-end from fixture-shaped prose (no trailing punctuation reaches facts.json)", async () => {
    await guideDir("test-slug", {
      "01-a.json": [
        {
          group: "Phone & data",
          title: "Phone & data",
          source_url: "https://cellulardata.ubigi.com/rates-and-coverage/japan-data-plans/",
          verified_on: "2026-07-29",
          body: "Plans run $19, $65, or $18 depending on the data tier.",
        },
      ],
    });

    const { facts } = await proposeMigration("test-slug", dir);
    for (const f of Object.values(facts)) {
      expect(f.value).not.toMatch(/[.,]$/);
    }
    expect(Object.values(facts).map((f) => f.value).sort()).toEqual(["$18", "$19", "$65"]);
  });
});

describe("proposeMigration — merges into an existing facts.json instead of clobbering it", () => {
  let dir;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "migrate-facts-fixture-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function guideDir(slug, files) {
    const guide = path.join(dir, slug);
    await mkdir(guide, { recursive: true });
    for (const [name, sections] of Object.entries(files)) {
      await writeFile(path.join(guide, name), JSON.stringify(sections));
    }
    return guide;
  }

  it("preserves every pre-existing row when the guide already has a facts.json", async () => {
    // Regression for a real incident (2026-08-15): proposeMigration started `facts` as a blank
    // object, so `--write` on a guide that already had a populated registry replaced it wholesale
    // with just the newly-discovered rows — korea/facts.json went from 83 rows to 2 on a live run.
    // The bug was caught immediately by the build (unresolved {{fact:}} tokens) and hand-reverted;
    // this test is the guard that it can't happen silently again.
    const existing = {
      "already-registered-5-000": {
        claim: "Some other section — ₩5,000",
        value: "₩5,000",
        source_url: "https://example.com/already-sourced",
        verified_on: "2026-01-01",
        shelf_life: "default",
        tier: "primary",
      },
    };
    await guideDir("test-slug", {
      "01-a.json": [
        {
          group: "New section",
          title: "New section",
          source_url: "https://example.com/new",
          verified_on: "2026-07-29",
          body: "Entry costs $40.",
        },
      ],
    });
    await writeFile(path.join(dir, "test-slug", "facts.json"), JSON.stringify(existing, null, 2));

    const { facts, factCount, newIds } = await proposeMigration("test-slug", dir);

    // The pre-existing row survives untouched.
    expect(facts["already-registered-5-000"]).toEqual(existing["already-registered-5-000"]);
    // factCount/newIds report only what THIS run discovered, not the merged total.
    expect(factCount).toBe(1);
    expect(newIds.size).toBe(1);
    expect(Object.keys(facts)).toHaveLength(2);
  });

  it("never mints a new id that collides with one already in facts.json", async () => {
    const existing = {
      "new-section-40": {
        claim: "New section — $40 (unrelated pre-existing row)",
        value: "$40",
        source_url: "https://example.com/pre-existing",
        verified_on: "2026-01-01",
        shelf_life: "default",
      },
    };
    await guideDir("test-slug", {
      "01-a.json": [
        {
          group: "New section",
          title: "New section",
          source_url: "https://example.com/new",
          verified_on: "2026-07-29",
          body: "Entry costs $40.",
        },
      ],
    });
    await writeFile(path.join(dir, "test-slug", "facts.json"), JSON.stringify(existing, null, 2));

    const { facts, newIds } = await proposeMigration("test-slug", dir);

    expect(Object.keys(facts)).toHaveLength(2);
    const [mintedId] = [...newIds];
    expect(mintedId).not.toBe("new-section-40");
    expect(facts["new-section-40"]).toEqual(existing["new-section-40"]);
  });

  it("works normally (empty base) when the guide has no facts.json yet", async () => {
    await guideDir("test-slug", {
      "01-a.json": [
        {
          group: "New section",
          title: "New section",
          source_url: "https://example.com/new",
          verified_on: "2026-07-29",
          body: "Entry costs $40.",
        },
      ],
    });

    const { facts, factCount } = await proposeMigration("test-slug", dir);
    expect(factCount).toBe(1);
    expect(Object.keys(facts)).toHaveLength(1);
  });
});
