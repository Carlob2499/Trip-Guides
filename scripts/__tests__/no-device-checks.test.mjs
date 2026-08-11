/* ACCEPTANCE (R5): "Zero device checks — grep -rn 'userAgent|innerWidth|isMobile|isIOS' src/
   returns nothing in guide code."

   That grep does not return nothing, and the honest answer is not to widen the guide until it
   does. The rule is about LAYOUT: R5's whole navigation argument is that one build serves phone,
   tablet and desktop off container queries, with no device branch deciding which model a reader
   gets. Measuring where a popover fits, or how far a thumb dragged, is not that — those are
   geometry, they have to read a real number, and a container query cannot answer them.

   So this gate asserts the rule the acceptance line was reaching for, and names every surviving
   use so a NEW one has to be justified out loud rather than blending into a grep result nobody
   reads. Adding an entry is a decision; the file it sits in is the argument for it. */
// @protects-file One build serves every screen — no device decides which layout a reader gets.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PATTERN = /\b(navigator\.userAgent|window\.innerWidth|innerWidth|isMobile|isIOS|isAndroid)\b/;

/** Every site that may read a viewport number, and the reason it is not a layout branch. */
const ALLOWED = {
  "src/features/atlas/ui/world-view.js":
    "The HUB's globe, not a guide. Its three matchMedia('(max-width: 759px)') calls choose " +
    "tap-to-pick over hover-to-preview — a pointer-capability question this file happens to " +
    "phrase as a width. It decides an interaction, never which layout renders, and the guide " +
    "body it is not part of has no such call.",
  "src/scripts/provenance-dot.js":
    "Popover placement. The bubble is clamped so it cannot open past the right edge, which " +
    "means subtracting its own width from the viewport's. There is no CSS that can do this: " +
    "the number is only knowable at open time, from the dot's measured position.",
  "src/features/field-tools/ui/field-tools.js":
    "The same clamp for the field-tools popover. Same reason, same shape.",
  "src/features/mobile-nav/ui/swipe-tabs.js":
    "Gesture geometry: how far a swipe travelled as a fraction of the screen, and the commit " +
    "threshold that follows from it. A swipe is measured in the pixels a thumb actually moved.",
  "src/features/firebase/sync.js":
    "navigator.userAgent in an ERROR BEACON payload, truncated to 200 chars. It is diagnostic " +
    "data about a failure the maker is trying to reproduce — it branches on nothing.",
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "prototypes" || name === "node_modules") continue;
      walk(p, out);
    } else if (/\.(ts|js|astro|mjs)$/.test(name) && !/\.test\.[tm]?[js]s?$/.test(name)) {
      out.push(p.replace(/\\/g, "/"));
    }
  }
  return out;
}

describe("no device decides which layout a reader gets", () => {
  const files = walk("src");

  it("found the source tree", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("⌁ no unlisted file branches on a device or a viewport number", () => {
    /* ⌁ The R5 regression this guards: R4 switched the guide's whole navigation model on
       viewport media queries, and the rail, the day scrubber and the body could disagree about
       which model they were in at the same width. Container queries removed the disagreement by
       removing the question. A new innerWidth read in guide code is how it comes back. */
    const unlisted = files.filter((f) => {
      if (ALLOWED[f]) return false;
      const src = readFileSync(f, "utf8");
      // Strip comments first: this file's own rule is about CODE, and a comment explaining why
      // something is not an innerWidth check should not itself trip the gate.
      const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      return PATTERN.test(code);
    });
    expect(
      unlisted,
      "a device or viewport check appeared in a file that has no stated reason for one. If it " +
        "decides geometry (where a popover fits, how far a gesture went), add it to ALLOWED " +
        "with that reason. If it decides a LAYOUT, it is the bug this gate exists for — the " +
        "guide body switches on container width, and nothing else may.",
    ).toEqual([]);
  });

  it("⌁ every allowance still points at a file that exists and still needs it", () => {
    /* An allowance for a file that no longer contains the thing is worse than no allowance: it
       reads as a considered exception when it is really a leftover, and it silently permits the
       next one added to that file. */
    const stale = Object.keys(ALLOWED).filter((f) => {
      try {
        return !PATTERN.test(readFileSync(f, "utf8"));
      } catch {
        return true;   // gone entirely
      }
    });
    expect(stale, "an allowance names a file that no longer needs one — delete the entry").toEqual([]);
  });

  it("⌁ the guide body itself has none at all", () => {
    // The narrowest and most important form of the rule: the files that decide what a guide
    // looks like read no viewport number whatsoever.
    const guideCore = [
      "src/layouts/GuideLayout.astro",
      "src/scripts/guide-ui.js",
      "src/features/guide-rail/ui/rail.js",
      "src/features/guide-rail/model/stations.ts",
    ];
    for (const f of guideCore) {
      const code = readFileSync(f, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      expect(PATTERN.test(code), `${f} branches on a device — the R5 layout contract is broken`).toBe(false);
    }
  });
});
