// @protects-file The site keeps looking like one designed thing — no new stray corner, colour or shadow.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { run, summarize, regressions, classify, parseOutput, EXEMPTIONS } from "../drift-real.mjs";

const baseline = JSON.parse(readFileSync("scripts/drift-baseline.json", "utf8"));
const { real, exempt } = run();
const current = summarize(real);

describe("design drift", () => {
  it("actually reaches the checker instead of scoring an empty run", () => {
    // A subprocess that fails to start returns no output, and no output classifies as no drift.
    // The corpus has known debt; a low number here means the scan broke, not that the repo got
    // clean. This caught a real one: piped, the checker's own process.exit(1) truncated its
    // report on Linux and CI classified 465 of 788 hits while Windows saw them all.
    // Floor lowered 700→600 on 2026-08-14: the panel/progress-preview design-study
    // stylesheets (and their exemption class) were deleted in the cleanup, taking
    // ~100 always-exempt hits with them. Still far above an empty-run score.
    expect(real.length + exempt.length).toBeGreaterThan(600);
    expect(Object.keys(baseline).length).toBeGreaterThan(0);
  });

  it("introduces no new drift and makes no existing file worse", () => {
    expect(
      regressions(current, baseline),
      "A style landed outside the Atlas system.\n\n" +
        "RADIUS: only 0 and 999px exist — 0 on things that hold content, 999px on things you " +
        "press. ELEVATION: edges are 1px rules, not shadows. COLOUR: use a token. MOTION: only " +
        "transform and opacity may change per frame.\n\n" +
        "If this hit is a documented false positive of the vendored kit checker, add it to " +
        "EXEMPTIONS in scripts/drift-real.mjs WITH its justification — a class, never a mute.\n" +
        "If the drift is deliberate, run: node scripts/drift-real.mjs --update",
    ).toEqual([]);
  });

  it("the recorded drift debt only ever shrinks", () => {
    // Same guard as the prose-shape and comment-density baselines: catches the baseline being
    // padded to silence a failure, which is the one way a gate like this stops meaning anything.
    const total = Object.values(baseline).reduce((n, c) => n + c, 0);
    expect(total, "recorded design drift is meant to shrink, never grow").toBeLessThanOrEqual(153);
    expect(Object.keys(baseline).length).toBeLessThanOrEqual(41);
  });

  it("every exemption is a named class carrying its own justification", () => {
    // An exemption without a written reason is indistinguishable from a mute button, and a mute
    // button is how the two real MOTION violations survived a whole closeout stage.
    for (const e of EXEMPTIONS) {
      expect(typeof e.id).toBe("string");
      expect(e.why.length, `${e.id} needs a real reason`).toBeGreaterThan(60);
    }
  });

  it("classifies against the real source line, not the checker's truncated echo", () => {
    // The echo is cut at 100 characters. This repo writes one-line CSS blocks, so the token that
    // proves a hit harmless usually sits past that cut — reading the echo scored ~60 known-good
    // rules as real drift.
    const v = parseOutput("  src/styles/about.css:86  [TYPE — only Literata (--fd) exists]\n    .ab-cta-btn{display")[0];
    expect(v.text.length).toBeGreaterThan(100);
    expect(classify([v]).exempt.map((x) => x.exemption)).toEqual(["type-token-naming"]);
  });
});
