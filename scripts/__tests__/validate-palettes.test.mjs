// Repo-wide contrast validation for src/data/palettes/*.json (the committed extracted palettes).
//
// PR #72 corrected extract-palette.mjs's page grounds; that correction exposed
// src/data/palettes/denmark.json, extracted under the stale, more forgiving grounds and never
// re-checked once committed. This suite pins the defect, the fix, and the gate that stops the
// next one: a bad palette landing in src/data/palettes/ must fail CI, not just the next
// `npm run extract-palette` run.
// @protects-file Every committed extracted palette's primary reads legibly on both page grounds.

import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contrast } from "../extract-palette.mjs";
import { validatePalettes } from "../validate-palettes.mjs";
import { LIGHT_BG, DARK_BG, MIN_ACCENT_CONTRAST } from "../../src/lib/contrast-policy.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const REAL_PALETTES_DIR = path.join(ROOT, "src", "data", "palettes");
const readSource = (rel) => readFile(path.join(ROOT, rel), "utf8");

let tmpDirs = [];
async function fixtureDir(files) {
  const dir = await mkdtemp(path.join(tmpdir(), "waypoint-palettes-"));
  tmpDirs.push(dir);
  for (const [name, contents] of Object.entries(files)) {
    await writeFile(path.join(dir, name), typeof contents === "string" ? contents : JSON.stringify(contents, null, 2));
  }
  return dir;
}
afterEach(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
  tmpDirs = [];
});

describe("Denmark's old vs regenerated primary (TASK 1 regression)", () => {
  it("the OLD #a77e3e fails the floor against the current light ground", () => {
    expect(contrast("#a77e3e", LIGHT_BG)).toBeLessThan(MIN_ACCENT_CONTRAST);
  });

  it("the regenerated committed primary passes BOTH current grounds", async () => {
    const denmark = JSON.parse(await readSource("src/data/palettes/denmark.json"));
    expect(denmark.primary).not.toBe("#a77e3e"); // proves it was actually regenerated, not left alone
    expect(contrast(denmark.primary, LIGHT_BG)).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
    expect(contrast(denmark.primary, DARK_BG)).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
  });

  it("regenerating preserved the palette file's shape and did not touch guide metadata", async () => {
    const denmark = JSON.parse(await readSource("src/data/palettes/denmark.json"));
    expect(denmark).toMatchObject({
      primary: expect.stringMatching(/^#[0-9a-fA-F]{6}$/),
      secondary: expect.stringMatching(/^#[0-9a-fA-F]{6}$/),
      accent: expect.stringMatching(/^#[0-9a-fA-F]{6}$/),
      source_file: "Nyhavn-Copenhagen.JPG", // same cover — regenerated, not hand-picked from elsewhere
      extracted_on: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    const guideMeta = JSON.parse(await readSource("src/content/guides/denmark/_guide.json"));
    expect(guideMeta.theme).toBeUndefined(); // still no explicit override — the extracted palette is what renders
  });
});

describe("validatePalettes — diagnostics", () => {
  it("a known-invalid palette file fails with an actionable diagnostic", async () => {
    const dir = await fixtureDir({ "bad-guide.json": { primary: "#a77e3e", secondary: "#000000", accent: "#ffffff" } });
    const { violations } = await validatePalettes(dir);
    expect(violations).toHaveLength(1);
    const v = violations[0];
    expect(v.file).toMatch(/bad-guide\.json$/);
    expect(v.primary).toBe("#a77e3e");
    expect(v.lightContrast).toBeCloseTo(contrast("#a77e3e", LIGHT_BG), 5);
    expect(v.darkContrast).toBeCloseTo(contrast("#a77e3e", DARK_BG), 5);
    expect(v.threshold).toBe(MIN_ACCENT_CONTRAST);
    expect(v.reason).toMatch(/light/);
  });

  it("flags a non-hex primary with a diagnostic naming what was actually found", async () => {
    const dir = await fixtureDir({ "malformed.json": { primary: "not-a-color" } });
    const { violations } = await validatePalettes(dir);
    expect(violations).toHaveLength(1);
    expect(violations[0].reason).toContain("not-a-color");
    expect(violations[0].lightContrast).toBeNull();
  });

  it("flags invalid JSON without throwing", async () => {
    const dir = await fixtureDir({ "broken.json": "{ not json" });
    const { violations, checked } = await validatePalettes(dir);
    expect(checked).toHaveLength(1);
    expect(checked[0]).toMatch(/broken\.json$/);
    expect(violations).toHaveLength(1);
    expect(violations[0].reason).toMatch(/invalid JSON/i);
  });

  it("a valid palette passes with no violations", async () => {
    // #8a6a4d measures ≥3:1 on BOTH current grounds (verified against the same contrast() the
    // validator uses — 3.94:1 light, 3.77:1 dark), unlike the earlier failing fixtures above.
    const dir = await fixtureDir({ "good-guide.json": { primary: "#8a6a4d", secondary: "#5a4530", accent: "#a68a63" } });
    const { violations, checked } = await validatePalettes(dir);
    expect(violations).toEqual([]);
    expect(checked).toHaveLength(1);
  });

  it("checks ALL committed palette files, not a sample", async () => {
    const dir = await fixtureDir({
      "a.json": { primary: "#8a6a4d" }, // passes both grounds
      "b.json": { primary: "#a77e3e" }, // fails — the Denmark-shaped defect
      "c.json": { primary: "#4d7a6a" }, // passes both grounds
    });
    const { checked, violations } = await validatePalettes(dir);
    expect(checked.sort()).toEqual(expect.arrayContaining([expect.stringContaining("a.json"), expect.stringContaining("b.json"), expect.stringContaining("c.json")]));
    expect(checked).toHaveLength(3);
    expect(violations).toHaveLength(1);
    expect(violations[0].file).toMatch(/b\.json$/);
  });

  it("never repairs a failing file — the fixture on disk is untouched after validation", async () => {
    const dir = await fixtureDir({ "bad-guide.json": { primary: "#a77e3e", secondary: "#000000", accent: "#ffffff" } });
    await validatePalettes(dir);
    const stillOnDisk = JSON.parse(await readFile(path.join(dir, "bad-guide.json"), "utf8"));
    expect(stillOnDisk.primary).toBe("#a77e3e"); // unchanged — validation never silently rewrites
  });

  it("an empty/missing directory checks cleanly rather than erroring", async () => {
    const dir = await fixtureDir({});
    const { checked, violations } = await validatePalettes(dir);
    expect(checked).toEqual([]);
    expect(violations).toEqual([]);
  });
});

describe("no existing committed palette regresses", () => {
  it("every real src/data/palettes/*.json passes today (korea + denmark, and any future addition)", async () => {
    const { checked, violations } = await validatePalettes(REAL_PALETTES_DIR);
    expect(checked.length).toBeGreaterThanOrEqual(2); // korea.json + denmark.json, at minimum
    expect(violations).toEqual([]);
  });
});

describe("extractor and validator agree with the schema (TASK 3 — one shared policy)", () => {
  it("validate-palettes.mjs imports the same contrast-policy module as extract-palette.mjs and content.config.ts", async () => {
    const validator = await readSource("scripts/validate-palettes.mjs");
    for (const name of ["LIGHT_BG", "DARK_BG", "MIN_ACCENT_CONTRAST"]) {
      expect(validator).toMatch(
        new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["']\\.\\./src/lib/contrast-policy\\.mjs["']`)
      );
      expect(validator).not.toMatch(new RegExp(`const\\s+${name}\\s*=`));
    }
  });

  it("validate-palettes.mjs reuses extract-palette.mjs's contrast() rather than a third copy of the WCAG math", async () => {
    const validator = await readSource("scripts/validate-palettes.mjs");
    expect(validator).toMatch(/import\s*\{[^}]*\bcontrast\b[^}]*\}\s*from\s*["']\.\/extract-palette\.mjs["']/);
  });
});
