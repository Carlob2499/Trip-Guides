// @protects-file The plain-English list of what the tests protect stays complete and current.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { collect, render, parseTests } from "../test-index.mjs";

const files = collect();
const tests = files.flatMap((f) => f.tests.map((t) => ({ ...t, rel: f.rel })));

describe("the readable test index", () => {
  it("finds the suite at all", () => {
    expect(files.length).toBeGreaterThan(100);
    expect(tests.length).toBeGreaterThan(1500);
  });

  it("every test states, in one plain line, what it protects", () => {
    const naked = tests.filter((t) => !t.promise).map((t) => `${t.rel}:${t.line}  ${t.name}`);
    expect(
      naked.slice(0, 20),
      "A test with no `// @protects <sentence>` (or a file-level `// @protects-file`) cannot " +
        "appear in docs/WHAT_THE_TESTS_PROTECT.md as anything a non-coder can judge. Add one " +
        "line saying what breaks for a traveller if this check goes red.",
    ).toEqual([]);
  });

  it("the promises are sentences a non-coder can read, not identifiers", () => {
    const bad = [];
    for (const t of tests) {
      const p = t.promise;
      if (p.length > 140) bad.push(`${t.rel}: too long (${p.length}) — ${p.slice(0, 60)}…`);
      // A promise naming a symbol, a file or a CSS selector is describing the code, not the
      // guarantee. That is the failure mode this whole document exists to avoid.
      else if (/[{}()<>]|\.(ts|js|mjs|css)\b|--[a-z]|\bfunction\b/.test(p)) bad.push(`${t.rel}: reads like code — ${p.slice(0, 70)}`);
      else if (!/[a-z]/.test(p) || p.split(" ").length < 4) bad.push(`${t.rel}: not a sentence — ${p}`);
    }
    expect([...new Set(bad)].slice(0, 20)).toEqual([]);
  });

  it("the committed document matches what the generator produces", () => {
    // Line endings are normalised out: git hands this file back as CRLF on a Windows checkout
    // while the generator always writes LF, so an exact compare failed after any rebase and
    // passed on CI — a gate that goes red for a reason that is not the thing it guards.
    const eol = (s) => s.replace(/\r\n/g, "\n");
    const doc = readFileSync("docs/WHAT_THE_TESTS_PROTECT.md", "utf8");
    expect(eol(doc), "stale — run: node scripts/test-index.mjs").toBe(eol(render(files)));
  });

  it("reads a template-literal name and an apostrophe without truncating either", () => {
    // Both were real generator bugs: the apostrophe cut "the ping sheet's grip" to "the ping
    // sheet", and `${scheme}` printed raw. A parser this document depends on gets its own test.
    const src = [
      "// @protects-file Something a person can read.",
      "test(\"the ping sheet's grip is a real handle\", () => {});",
      "test(`passes in ${scheme} mode`, () => {});",
    ].join("\n");
    const got = parseTests(src);
    expect(got.map((t) => t.name)).toEqual(["the ping sheet's grip is a real handle", "passes in … mode"]);
    expect(got.every((t) => t.promise === "Something a person can read.")).toBe(true);
  });
});

/* The comment-density cap (creator, 2026-08-09: "slim down the amount of excessive slop text").
   The repo-wide average was 10.8%; the files written in one sitting ran 30–44%, and long
   rationale in a test file is read by nobody — it belongs next to the code it protects, where
   the person about to change that code will actually see it. */
const MAX_COMMENT_SHARE = 0.22;

function testFiles(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) testFiles(p, out);
    else if (/\.(test|spec)\.(ts|mjs|js)$/.test(name)) out.push(p.replace(/\\/g, "/"));
  }
  return out;
}

function commentShare(src) {
  const lines = src.split("\n");
  let inBlock = false, comment = 0;
  for (const raw of lines) {
    const t = raw.trim();
    if (inBlock) { comment++; if (t.includes("*/")) inBlock = false; continue; }
    if (t.startsWith("/*")) { comment++; if (!t.includes("*/")) inBlock = true; continue; }
    if (t.startsWith("//")) comment++;
  }
  return { comment, total: lines.length, share: comment / lines.length };
}

/* Files already over the cap when it was introduced. Recorded rather than rewritten in one
   sweep: several were not written in this sitting, and stripping a rationale I do not fully
   understand is how a why-note that was load-bearing gets lost. Each entry is a CEILING — the
   file may improve, never regress — and the list can only shrink. Same shape as the prose-shape
   baseline, for the same reason. */
const DENSITY_BASELINE = {
  "tests/visual/atlas-hub.spec.ts": 26,
  "tests/visual/exports.spec.ts": 26,
  "tests/visual/itinerary.spec.ts": 24,
  "tests/visual/no-h-overflow.spec.ts": 23,
  "tests/visual/offline.spec.ts": 30,
  "tests/visual/panels.spec.ts": 35,
  "tests/visual/safe-area.spec.ts": 26,
  "tests/visual/sos.spec.ts": 27,
  "src/features/firebase/rules.test.ts": 26,
  "src/lib/accent-tokens.test.ts": 24,
  "src/styles/atlas-tokens.test.ts": 31,
  "src/styles/var-defined.test.ts": 22,
  // The four worst, and the top of the list to pay down next.
  "tests/visual/a11y.spec.ts": 37,
  "scripts/__tests__/accent-ink-contract.test.mjs": 37,
  "scripts/__tests__/esbuild-pin.test.mjs": 44,
  "scripts/__tests__/lint-ci-scope.test.mjs": 26,
};

describe("test files stay readable", () => {
  it("no NEW test file is mostly explanation, and no old one gets worse", () => {
    const bad = [];
    for (const f of ["tests", "src", "scripts"].flatMap((d) => testFiles(d))) {
      const s = commentShare(readFileSync(f, "utf8"));
      if (s.total <= 40) continue;
      const pct = Math.round(s.share * 100);
      const allowed = DENSITY_BASELINE[f] ?? Math.round(MAX_COMMENT_SHARE * 100);
      if (pct > allowed) bad.push(`${f} — ${pct}% comment (${s.comment}/${s.total}), allowed ${allowed}%`);
    }
    expect(
      bad,
      `Over ${Math.round(MAX_COMMENT_SHARE * 100)}% of this file is prose. Move the reasoning ` +
        "next to the code it protects — that is where someone about to break it will look — and " +
        "leave the test with its name and its one @protects line.",
    ).toEqual([]);
  });

  it("the recorded density debt only ever shrinks", () => {
    // Stops the baseline being padded out to silence a failure, which is the one way a gate
    // like this quietly stops meaning anything.
    expect(Object.keys(DENSITY_BASELINE).length).toBeLessThanOrEqual(16);
    expect(Math.max(...Object.values(DENSITY_BASELINE))).toBeLessThanOrEqual(44);
  });
});
