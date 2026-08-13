/* The fixture is STANDALONE evidence: Japan is being re-run through the rebuilt pipeline with
   confirmed bookings (creator, 2026-08-13), so the live guide is expected to change and is no
   longer asserted against. What must never drift is the fixture itself — the MANIFEST cites line
   numbers, and those citations die the moment the frozen copies move — hence the CITATIONS table
   below. Proving each case is DETECTED is packet H1's job, once the B/C/E checkers exist. */
// @protects-file The frozen Japan defect evidence, independent of the live guide's fate.

import { describe, expect, test } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FIXTURE = fileURLToPath(new URL("../../tests/fixtures/japan-regression", import.meta.url));


/* Keep in sync with the MANIFEST's "What is frozen" table. */
const FROZEN = [
  "guide/facts.json",
  "guide/_guide.json",
  "guide/01-plan.json",
  "guide/03-sights.json",
  "guide/06-days.json",
  "guide/08-health-and-safety.json",
  "intake/japan.md",
  "intake/japan.state.json",
];

/* Every line number the MANIFEST cites as evidence, and the substring that must still be on it.
   These citations ARE the fixture's value — if a line moves, the MANIFEST starts lying. */
const CITATIONS = [
  ["guide/facts.json", 25, '"value": "$19,"', "case 10 — malformed value"],
  ["guide/facts.json", 73, "https://www.jreast.co.jp/e/", "case 9 — the railway attribution"],
  ["guide/facts.json", 88, '"value": "$1,"', "case 10 — truncated FX fragment"],
  ["guide/facts.json", 119, '"value": "$80,"', "case 10 — malformed value"],
  ["guide/facts.json", 128, "https://www.ana.co.jp/en/us/", "case 9 — the airline attribution"],
  ["intake/japan.md", 16, "His birthday is Sept 25", "case 1a — the companion's birthday"],
  ["intake/japan.md", 25, "2026-10-15 – 2026-11-10", "case 2 — the flat start date"],
  ["intake/japan.md", 28, "Anchor event", "case 3 — the anchor"],
];

const read = (rel) => readFileSync(`${FIXTURE}/${rel}`, "utf8");
const line = (rel, n) => read(rel).split("\n")[n - 1] ?? "";

describe("japan regression fixture — existence and integrity", () => {
  test("the fixture list is non-empty (guards a vacuous pass)", () => {
    expect(FROZEN.length).toBe(8);
  });

  test.each(FROZEN)("%s exists in the fixture", (rel) => {
    expect(existsSync(`${FIXTURE}/${rel}`), `missing fixture file: ${rel}`).toBe(true);
  });

  test.each(FROZEN.filter((rel) => rel.endsWith(".json")))("%s parses as JSON", (rel) => {
    expect(() => JSON.parse(read(rel))).not.toThrow();
  });

  test.each(CITATIONS)("%s:%d still carries the evidence for %s", (rel, n, needle, why) => {
    expect(
      line(rel, n),
      `The MANIFEST cites ${rel}:${n} as evidence for ${why}, but that line no longer ` +
        `contains ${JSON.stringify(needle)}.\n\n` +
        "The fixture is FROZEN evidence — it is not edited to make a checker pass. If you " +
        "genuinely need to re-freeze it, re-verify every line number the MANIFEST cites, " +
        "because moving one line moves them all.",
    ).toContain(needle);
  });
});

describe("japan regression fixture — the manifest", () => {
  const manifest = read("MANIFEST.md");

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
    for (const rel of FROZEN) {
      expect(manifest, `MANIFEST.md never mentions ${rel}`).toContain(rel);
    }
  });
});
