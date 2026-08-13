/* Why byte-identical: the MANIFEST cites line numbers as evidence, and those citations die the
   moment the copies drift. Full case documentation lives in the fixture's MANIFEST.md; proving
   each case is DETECTED is packet H1's job, once the B/C/E checkers exist. */
// @protects-file The Japan regression fixture is byte-identical evidence and is never repaired.

import { describe, expect, test } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FIXTURE = fileURLToPath(new URL("../../tests/fixtures/japan-regression", import.meta.url));
const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/* Keep in sync with the MANIFEST's "What is frozen" table. */
const FROZEN = [
  ["guide/facts.json", "src/content/guides/japan/facts.json"],
  ["guide/_guide.json", "src/content/guides/japan/_guide.json"],
  ["guide/01-plan.json", "src/content/guides/japan/01-plan.json"],
  ["guide/03-sights.json", "src/content/guides/japan/03-sights.json"],
  ["guide/06-days.json", "src/content/guides/japan/06-days.json"],
  ["guide/08-health-and-safety.json", "src/content/guides/japan/08-health-and-safety.json"],
  ["intake/japan.md", "guides-intake/japan.md"],
  ["intake/japan.state.json", "guides-intake/japan.state.json"],
];

const read = (base, rel) => readFileSync(`${base}/${rel}`, "utf8");

describe("japan regression fixture — existence and integrity", () => {
  test("the fixture list is non-empty (guards a vacuous pass)", () => {
    expect(FROZEN.length).toBe(8);
  });

  test.each(FROZEN)("%s exists in the fixture", (rel) => {
    expect(existsSync(`${FIXTURE}/${rel}`), `missing fixture file: ${rel}`).toBe(true);
  });

  test.each(FROZEN.filter(([rel]) => rel.endsWith(".json")))("%s parses as JSON", (rel) => {
    expect(() => JSON.parse(read(FIXTURE, rel))).not.toThrow();
  });

  test.each(FROZEN)("%s is byte-identical to its live source (%s)", (rel, live) => {
    expect(
      read(FIXTURE, rel),
      `tests/fixtures/japan-regression/${rel} has drifted from ${live}.\n\n` +
        "If you EDITED THE LIVE GUIDE: don't. Japan is regression evidence and is never " +
        "repaired (creator ruling 2026-08-13, CONTEXT.md). Its defects are the point. Revert " +
        "the guide edit.\n\n" +
        "If a repo-wide migration legitimately rewrote every guide: re-copy the file, then " +
        "re-verify every line number the MANIFEST cites for it — a migration moves them.",
    ).toBe(read(ROOT, live));
  });
});

describe("japan regression fixture — the manifest", () => {
  const manifest = read(FIXTURE, "MANIFEST.md");

  test("documents all 12 cases, one `## Case N` heading each", () => {
    const headings = manifest.match(/^## Case \d+/gm) ?? [];
    expect(headings.length, `found: ${headings.join(", ")}`).toBe(12);
    for (let n = 1; n <= 12; n++) {
      expect(manifest, `no "## Case ${n}" heading`).toMatch(new RegExp(`^## Case ${n}\\b`, "m"));
    }
  });

  test("case 1 is split into the 1a/1b sub-cases", () => {
    for (const sub of ["1a", "1b"]) {
      expect(manifest, `no "### Case ${sub}" sub-heading`).toMatch(
        new RegExp(`^### Case ${sub}\\b`, "m"),
      );
    }
  });

  // Tripwire: stops the plan's original (verified-false) "birthday contradiction" framing from
  // creeping back in and making C2 fire on every multi-traveller guide.
  test("records case 1a as a NEGATIVE case — the C2 false-positive guard", () => {
    expect(manifest).toMatch(/### Case 1a[\s\S]*?C2 must NOT fire/);
  });

  test("every frozen file is listed in the manifest's table", () => {
    for (const [rel] of FROZEN) {
      expect(manifest, `MANIFEST.md never mentions ${rel}`).toContain(rel);
    }
  });
});
