/* Every trip is a DIRECTORY — the catalog has exactly one shape.
   Guides once existed in two shapes: a flat <slug>.json and a directory of _guide.json +
   NN-<group>.json. BOTH built, which is exactly why the split survived unnoticed — three of five
   guides were still flat and nothing said so. Two shapes means every consumer (the content
   loader, the publication path, the audit suite, any future catalog view) carries a branch, and a
   stray flat file silently shadowed the directory beside it. Every flat-shape branch is deleted
   now, so a stray flat guide would be silently IGNORED rather than served — this test is what
   makes that failure loud. */
// @protects-file Every guide is stored in the same shape, with no exceptions.

import { describe, expect, test } from "vitest";
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const GUIDES_DIR = fileURLToPath(new URL("../../src/content/guides", import.meta.url));
const entries = readdirSync(GUIDES_DIR);

describe("guide catalog shape", () => {
  test("there is at least one guide to check (guards a vacuous pass)", () => {
    expect(entries.length, `no entries under ${GUIDES_DIR}`).toBeGreaterThan(0);
  });

  test("no guide is a flat <slug>.json — every trip is a directory", () => {
    const flat = entries.filter((e) => e.endsWith(".json") && statSync(join(GUIDES_DIR, e)).isFile());
    expect(
      flat,
      "A guide is a flat .json. Nothing reads that shape any more — move it to " +
        "<slug>/_guide.json + NN-<group>.json by hand. Drafts are NOT an exception: " +
        "scaffold-guide.mjs emits directories for new guides precisely so draft and published " +
        "never diverge in shape",
    ).toEqual([]);
  });

  test("every guide directory has a _guide.json and at least one NN-<group>.json", () => {
    const broken = [];
    for (const slug of entries.filter((e) => statSync(join(GUIDES_DIR, e)).isDirectory())) {
      const files = readdirSync(join(GUIDES_DIR, slug));
      if (!existsSync(join(GUIDES_DIR, slug, "_guide.json"))) broken.push(`${slug}: missing _guide.json`);
      if (!files.some((f) => /^\d{2}-.+\.json$/.test(f))) broken.push(`${slug}: no NN-<group>.json section files`);
    }
    expect(
      broken,
      "A guide directory is missing the files the content loader assembles it from. The NN- " +
        "prefix is load-bearing: plain filename sort has to reproduce tab-group order",
    ).toEqual([]);
  });

  test("every guide directory carries a facts.json — the perishable-fact registry", () => {
    // Same argument as the flat-vs-directory rule above: two shapes means every consumer
    // carries a branch. The registry is optional to the LOADER (a guide without one simply
    // skips interpolation), and that tolerance is what would let the catalog drift back into
    // "some guides have one, some don't". scaffold-guide.mjs emits an empty {} for every new
    // guide precisely so it never has to be retrofitted; migrate an existing one with
    // `node scripts/migrate-facts.mjs --slug <slug> --write`.
    const missing = entries
      .filter((e) => statSync(join(GUIDES_DIR, e)).isDirectory())
      .filter((slug) => !existsSync(join(GUIDES_DIR, slug, "facts.json")));
    expect(
      missing,
      "A guide has no facts.json. An EMPTY one ({}) is valid and is what the scaffolder writes — " +
        "the point is that every guide has the same shape, so a price always has one place to live",
    ).toEqual([]);
  });
});
