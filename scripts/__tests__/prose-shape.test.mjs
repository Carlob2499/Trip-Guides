/* A BASELINE, not a bulk rewrite: shipped guides are verified historical records, and
   reshaping their prose is a content edit under the continuity discipline. The recorded
   offences can only shrink. */
// @protects-file Guide writing stays readable — no new wall-of-text paragraphs, no sentence-shaped prices.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { findOffenders, summarize, regressions, MAX_WORDS, MAX_PRICE_CHARS } from "../prose-shape.mjs";

const baseline = JSON.parse(readFileSync("scripts/prose-shape-baseline.json", "utf8"));
const current = summarize(findOffenders("src/content/guides"));

describe("prose shape", () => {
  it("scans real guide content rather than passing on an empty set", () => {
    // A glob that silently matches nothing is the classic way a gate like this goes green
    // forever. The corpus has known offenders; if this ever reads zero, the scan broke.
    expect(Object.keys(baseline).length).toBeGreaterThan(0);
    expect(findOffenders("src/content/guides").length).toBeGreaterThan(0);
  });

  it("thresholds still reflect the corpus they were measured from", () => {
    // Measured across 1087 paragraphs: median 28, p75 48, p90 80, p95 104. These ceilings are
    // the distribution's tail, not a preference — if someone raises them to quiet a failure,
    // that is a decision worth making deliberately, so it is pinned.
    expect(MAX_WORDS).toBe(120);
    expect(MAX_PRICE_CHARS).toBe(60);
  });

  it("introduces no new over-long paragraph and no new sentence-shaped price", () => {
    expect(
      regressions(current, baseline),
      "Guide prose got worse in shape, not in fact.\n\n" +
        `A paragraph over ${MAX_WORDS} words is doing more than one job — split it, make it a ` +
        "list, or promote it to a typed section. A `price` over " + MAX_PRICE_CHARS + " characters " +
        "is a sentence, not a value: it renders as a pill, and an unbreakable pill wider than " +
        "the phone widened the page until overflow-x:clip cut the end off every line of prose " +
        "beside it. Put the caveat in the venue's note, where it can wrap.\n\n" +
        "If the change is deliberate and the prose is genuinely better, run:\n" +
        "  node scripts/prose-shape.mjs --update\n" +
        "and say in the commit why the baseline grew — it is meant to shrink.",
    ).toEqual([]);
  });

  it("the baseline never grows silently", () => {
    // Distinct from the check above: that one catches a file getting worse, this catches the
    // baseline itself being padded out to make a failure go away.
    const total = Object.values(baseline).reduce((n, b) => n + b.count, 0);
    expect(total, "the recorded prose-shape debt is meant to shrink, never grow").toBeLessThanOrEqual(43);
  });
});
