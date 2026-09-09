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
    // Floor lowered 600→200 on 2026-09-04 (D7 Phase 1): the TYPE rule finally recognises the
    // system's own var(--font-*) tokens, so ~500 always-exempt font-family hits stopped being
    // hits at all. 296 remain; an empty run still scores 0.
    expect(real.length + exempt.length).toBeGreaterThan(200);
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
    // Ceilings tightened 153 -> 16 and 41 -> 4 on 2026-09-08. They had been left at the high-water
    // mark of an earlier era while the real figure fell to 16, which meant 137 violations could
    // have been baselined one at a time and this test — the one whose whole job is to notice
    // that — would have passed every time. A ceiling far above the floor is not a ratchet, it is
    // a number. Lower these WITH the baseline every time the debt actually shrinks.
    const total = Object.values(baseline).reduce((n, c) => n + c, 0);
    expect(total, "recorded design drift is meant to shrink, never grow").toBeLessThanOrEqual(16);
    expect(Object.keys(baseline).length).toBeLessThanOrEqual(4);
  });

  it("the baseline holds no entry the checker has stopped reporting", () => {
    // regressions() only compares in one direction — it reports what is NEW or WORSE and says
    // nothing about a key whose violations are gone. So a fixed violation silently left its
    // allowance behind, and the same violation could return to the same file and category and
    // pass. Found 2026-09-08: the baseline still allowed src/styles/guide.css::TYPE, fixed at
    // some earlier point, so the recorded debt read 17 against a real 16.
    const stale = Object.keys(baseline).filter((k) => !(k in current));
    expect(
      stale,
      "These baseline entries no longer occur, so they are pure headroom for the same drift to " +
        "come back unnoticed. Run: node scripts/drift-real.mjs --update",
    ).toEqual([]);
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
    const v = parseOutput("  src/styles/about.css:82  [TYPE — only Literata (--fd) exists]\n    .ab-cta-btn{display")[0];
    expect(v.text.length).toBeGreaterThan(100);
    expect(classify([v]).exempt.map((x) => x.exemption)).toEqual(["type-token-naming"]);
  });
});
