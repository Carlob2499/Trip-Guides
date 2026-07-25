/* Every trip is a DIRECTORY — the catalog has exactly one shape.
   Guides existed in two shapes: a flat <slug>.json and a directory of _guide.json +
   NN-<group>.json. BOTH build, which is exactly why the split survived unnoticed — three of five
   guides were still flat and nothing said so. Two shapes means every consumer (the content
   loader, graduate-guide, the audit suite, any future catalog view) carries a branch, and the
   flat file WINS in resolveGuidePath, so a stray one silently shadows the directory beside it.
   This fails the build on a flat guide instead of quietly serving it. */
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
      "A guide is still a flat .json. Split it with `npm run split-guide -- <slug>`. Drafts are " +
        "NOT an exception: scaffold-guide.mjs emits directories for new guides precisely so draft " +
        "and published never diverge in shape",
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
});
