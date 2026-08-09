/* Accent-as-text goes through --accent-ink, never around it — the source-side gate
   for issue #38.

   src/lib/accent-tokens.ts derives the ONE accent shade that is legible as text on
   every surface, and ships it as --accent-ink (alias --aink). Twice, a style improvised
   its own accent text instead:

   1. `.topbar-search` built accent text with color-mix() from --accent — passed at
      4.63:1, dropped to 4.45:1 when the palette moved under it (session #33).
   2. The hub cards read --accent-ink correctly, but the cascade discarded their inline
      candidates (issue #38) — caught by this gate's RENDERED partner in
      tests/visual/a11y.spec.ts, which asserts each carrier resolves its own ink.

   This file catches shape 1: a `color:` (text) declaration deriving from --accent
   directly, whether raw or through color-mix(). Fills, borders, accent-color and
   shadows may use --accent freely — identity is its job; only TEXT is contrast-gated.
   Together the two gates cover both past occurrences. */

// @protects-file Every guide's accent colour keeps its text readable.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SRC = join(ROOT, "src");

/* Verified exceptions — each entry names WHY --accent-ink would be WRONG there, not
   merely inconvenient. Grows only with a reason; an entry without one is a violation. */
const ALLOWLIST = new Map([
  /* Story mode is a fixed-palette dark takeover (#0b0e12 ground, literal inks, no
     theme re-map). --accent-ink follows the PAGE theme, so on a light page it would
     paint the light ink onto the fixed near-black overlay — wrong on exactly one side,
     the same trap --on-accent exists for. Its accent-toward-white mixes are derived
     against the overlay's own fixed ground. RESIDUAL RISK, accepted: those mixes still
     move with each guide's --accent over that fixed ground — occurrence 1's mechanism —
     and no rendered gate scans the (initially hidden) overlay. Revisit if story mode
     ever gets its own contrast gate. */
  ["src/styles/story-mode.css", "fixed dark takeover; page-theme ink would be wrong on light"],
]);

/* Anchored so `border-color:`/`text-decoration-color:`/`accent-color:` never match —
   only the bare `color:` property, i.e. text. A DENYLIST, stated plainly: it names the
   improvisation shapes seen so far (raw --accent, color-mix from --accent, reading a
   candidate directly instead of the resolved ink). A literal hex as text is
   indistinguishable from a legitimate non-accent ink by grep and stays out of scope —
   the rendered partner in tests/visual/a11y.spec.ts and the axe contrast gate cover
   what this cannot. */
const RAW_ACCENT_TEXT = /(^|[;{])\s*color\s*:\s*var\(--accent\)\s*[;}!]/;
const MIXED_ACCENT_TEXT = /(^|[;{])\s*color\s*:\s*color-mix\([^;}]*var\(--accent\)/;
const CANDIDATE_TEXT = /(^|[;{])\s*color\s*:\s*var\(--accent-ink-(light|dark)\)/;

function cssSources(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) cssSources(p, out);
    else if ([".css", ".astro"].includes(extname(name))) out.push(p);
  }
  return out;
}

describe("accent-as-text contract", () => {
  it("no stylesheet paints text straight from --accent — --accent-ink/--aink only", () => {
    const offenders = [];
    const allowlistHits = new Set();
    for (const file of cssSources(SRC)) {
      const rel = relative(ROOT, file).replaceAll("\\", "/");
      const css = readFileSync(file, "utf8");
      if (ALLOWLIST.has(rel)) {
        if ([RAW_ACCENT_TEXT, MIXED_ACCENT_TEXT, CANDIDATE_TEXT].some((re) => re.test(css))) {
          allowlistHits.add(rel);
        }
        continue;
      }
      for (const [name, re] of [
        ["raw", RAW_ACCENT_TEXT],
        ["color-mix", MIXED_ACCENT_TEXT],
        ["candidate", CANDIDATE_TEXT],
      ]) {
        const m = css.match(re);
        if (m) {
          offenders.push(`${rel} (${name}): ${m[0].trim().slice(0, 80)}`);
        }
      }
    }
    expect(
      offenders,
      "Accent used as TEXT without going through --accent-ink/--aink. --accent is " +
        "identity (fills, borders, display type) and is never contrast-gated; the " +
        "moment it colours text, use var(--accent-ink) — src/lib/accent-tokens.ts " +
        "derived it to hold >=4.5:1 on every surface, and improvised shades have " +
        "already failed twice (see issue #38).",
    ).toEqual([]);
    // Closed allowlist: an entry whose file no longer trips any pattern is stale —
    // remove it, or the exemption outlives the exception and quietly widens.
    const stale = [...ALLOWLIST.keys()].filter((rel) => !allowlistHits.has(rel));
    expect(stale, "Allowlisted file(s) no longer contain any denied pattern — remove the entry").toEqual([]);
  });
});
