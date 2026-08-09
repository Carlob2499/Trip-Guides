/* Atlas token contract — the Phase 1.1 gate (issue #34).

   Two jobs, and they are different in kind:

   1. CONTRAST. The design handoff shipped two pairings marked unverified — the Panel kicker's
      oxide on a card surface, and --ochre at 9.5-10.5px. Both are SMALL text at those sizes, so
      the bar is 4.5:1, the same one contrast.ts and the accent gate already enforce. Verified
      here in BOTH themes, because a pairing that passes on paper and fails on slate is the
      exact bug --accent-ink was invented to stop.

   2. THE ALIAS PROPERTY. --sunken/--aink/--on-aink/--ochre are meant to be var() aliases of
      tokens that already ship, not copies of their hexes. That distinction is invisible in a
      screenshot and decisive in practice: a copy misses the dark-mode re-map and a guide's
      per-page inline accent, and nothing would notice until a Panel rendered the wrong colour
      on one theme. So the alias-ness itself is asserted, not just the resulting ratios.

   Everything is PARSED out of base.css, never mirrored. A hand-copied palette in a test looks
   harmless and rots silently — it would keep reporting green about values the stylesheet no
   longer holds. Same rule type-scale.test.ts follows for the type scale. */
// @protects-file The design system's colours stay above the readability floor in both themes.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastRatio } from "../lib/contrast";

const SRC = fileURLToPath(new URL("..", import.meta.url));
const BASE = readFileSync(join(SRC, "styles/base.css"), "utf8");

/* The theme scopes, sliced apart so a token can be read per theme. The light scope stops where
   the first dark block begins; the dark scope is the [data-theme="dark"] rule's own body,
   bounded by its closing brace so trailing stylesheet rules can never leak into it. */
const LIGHT_END = BASE.indexOf("@media(prefers-color-scheme:dark)");
const LIGHT = BASE.slice(0, LIGHT_END);
const DARK_AT = BASE.indexOf('[data-theme="dark"]{');
const DARK = BASE.slice(DARK_AT, BASE.indexOf("}", DARK_AT));

/** Read a declared custom-property value out of one scope. Null when it isn't declared there. */
function decl(scope: string, token: string): string | null {
  const m = scope.match(new RegExp(`${token}:\\s*([^;}]+)`));
  return m ? m[1].trim() : null;
}

/** Same, but throws rather than returning a wrong type — every contrast assertion depends on it. */
function hex(scope: string, token: string): string {
  const v = decl(scope, token);
  if (!v || !/^#[0-9a-f]{6}$/.test(v)) {
    throw new Error(`${token} is not declared as a #RRGGBB hex in this theme scope (got ${v})`);
  }
  return v;
}

/** The three surfaces text lands on, per theme, read from the stylesheet rather than restated. */
const surfaces = (scope: string) => ({
  card: hex(scope, "--card"),
  page: hex(scope, "--bg"),
  // Read through --bg2, the token that holds the value: asserting on --sunken's own name here
  // would only be testing that a var() reference is spelled correctly, which is its own test.
  sunken: hex(scope, "--bg2"),
});

describe("Atlas token contract — parse guard", () => {
  /* Guards the guard. Everything below reads these slices, and most of it would pass cheerfully
     against an empty string — the failure mode where a test protects nothing and reports green. */
  it("actually sliced the light and dark scopes out of base.css", () => {
    /* Both slices key off an EXACT unspaced selector string. A formatter that rewrites
       "@media(prefers-color-scheme:dark)" with spaces would send indexOf to -1, and
       slice(0,-1) would silently hand the light scope the whole file — dark declarations
       included — where every lookup below would still find the :root value first and pass.
       That is the rot this assertion exists to catch; a length check alone would not. */
    expect(LIGHT_END, "the dark @media selector string moved or was reformatted").toBeGreaterThan(0);
    expect(LIGHT.length, "light scope did not parse").toBeGreaterThan(1000);
    expect(DARK_AT, '[data-theme="dark"] block not found').toBeGreaterThan(0);
    expect(DARK.length, "dark scope did not parse").toBeGreaterThan(100);
    expect(DARK).not.toContain("@media");
    expect(surfaces(LIGHT).card).not.toBe(surfaces(DARK).card);
  });
});

describe("Atlas token contract — aliases, not new colours", () => {
  /* The acceptance property, one line each: these four names must POINT at the shipped tokens.
     A hex here instead of a var() would pass every contrast check in this file today and still
     be wrong tomorrow. */
  it.each([
    ["--sunken", "--bg2"],
    ["--aink", "--accent-ink"],
    ["--on-aink", "--on-accent"],
    ["--ochre", "--warn"],
  ])("%s is declared as var(%s), not a copied hex", (alias, source) => {
    expect(decl(LIGHT, alias)).toBe(`var(${source})`);
  });

  it("never re-declares an alias in a dark block", () => {
    /* An alias resolves against the element it is declared on, and the dark blocks re-map that
       element's source tokens — so the alias follows for free. Re-declaring it here would
       reintroduce exactly the second source of truth the alias exists to remove. */
    for (const alias of ["--sunken", "--aink", "--on-aink", "--ochre"]) {
      expect(DARK, `${alias} is re-declared in the dark block`).not.toContain(`${alias}:`);
    }
  });

  it("leaves every superseded token name working, unchanged", () => {
    // This phase adds names BESIDE the old ones; it renames no call site. If one of these ever
    // disappears without its call sites moving first, the site loses the value silently.
    for (const token of ["--bg2", "--accent-ink", "--on-accent", "--warn"]) {
      expect(decl(LIGHT, token), `${token} vanished from :root`).not.toBeNull();
    }
  });
});

describe("Atlas token contract — Panel kicker legibility", () => {
  it("sits in the 9.5-10.5px band the handoff flagged, which is SMALL text", () => {
    const rem = parseFloat(decl(LIGHT, "--text-panel-kicker") as string);
    expect(rem * 16).toBeGreaterThanOrEqual(9.5);
    expect(rem * 16).toBeLessThanOrEqual(10.5);
    // Why the 4.5 bar and not 3.0 below: WCAG grades text as LARGE (dropping the bar to 3:1)
    // only from 18.7px bold / 24px regular. The whole band is far under either, so the
    // small-text bar applies at every size in it and no weight change can move it.
    expect(10.5).toBeLessThan(18.7);
    expect(decl(LIGHT, "--tracking-panel-kicker")).toBe(".22em");
  });

  it("clears 4.5:1 on every surface, in both themes, as var(--aink)", () => {
    const inkLight = hex(LIGHT, "--accent-ink-light");
    const inkDark = hex(LIGHT, "--accent-ink-dark");
    for (const [name, bg] of Object.entries(surfaces(LIGHT))) {
      expect(contrastRatio(inkLight, bg), `kicker ink on light ${name}`).toBeGreaterThanOrEqual(4.5);
    }
    for (const [name, bg] of Object.entries(surfaces(DARK))) {
      expect(contrastRatio(inkDark, bg), `kicker ink on dark ${name}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("would FAIL if the kicker used the identity colour instead — the reason it uses --aink", () => {
    /* The handoff describes the kicker as "oxide", and the obvious reading of that is
       var(--accent). Measured, that reading is unshippable: the identity colour is not
       contrast-gated by design, and it misses on the light sunken well and on every dark
       surface. Pinned as a FAILURE so a later phase cannot "simplify" the kicker back onto
       --accent and lose the contract silently. */
    const oxide = hex(LIGHT, "--accent");
    expect(contrastRatio(oxide, surfaces(LIGHT).sunken)).toBeLessThan(4.5);
    expect(contrastRatio(oxide, surfaces(DARK).card)).toBeLessThan(4.5);
    // --aink rescues exactly those two, which is the whole argument for the token.
    expect(contrastRatio(hex(LIGHT, "--accent-ink-light"), surfaces(LIGHT).sunken))
      .toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(hex(LIGHT, "--accent-ink-dark"), surfaces(DARK).card))
      .toBeGreaterThanOrEqual(4.5);
  });
});

describe("Atlas token contract — ochre at 9.5-10.5px", () => {
  it.each([
    ["light", () => LIGHT],
    ["dark", () => DARK],
  ])("clears 4.5:1 on every %s surface", (theme, scope) => {
    // --ochre is the ⚠/"unconfirmed" pigment, read at label sizes — the flag beside a figure,
    // not a paragraph. Same small-text bar as the kicker, same band.
    const ochre = hex(scope(), "--warn");
    for (const [name, bg] of Object.entries(surfaces(scope()))) {
      expect(contrastRatio(ochre, bg), `ochre on ${theme} ${name}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("has a token in that band to be read at — --text-nano, the existing floor", () => {
    const nano = parseFloat(decl(LIGHT, "--text-nano") as string) * 16;
    expect(nano).toBeGreaterThanOrEqual(9.5);
    expect(nano).toBeLessThanOrEqual(10.5);
  });
});

describe("Atlas token contract — the primary CTA pair", () => {
  it.each([
    ["light", () => LIGHT],
    ["dark", () => DARK],
  ])("is legible and findable in the %s theme", (_theme, scope) => {
    const cta = hex(scope(), "--cta");
    const ctaInk = hex(scope(), "--cta-ink");
    const page = hex(scope(), "--bg");
    // Text on the button: the ordinary small-text 4.5:1.
    expect(contrastRatio(ctaInk, cta)).toBeGreaterThanOrEqual(4.5);
    /* The button AGAINST ITS PAGE: WCAG 1.4.11 asks 3:1 of a UI component's own boundary, and
       this is the check a fixed-value reading of the handoff would have failed — in dark mode
       chart-room-slate IS --bg, so a non-inverting --cta would score 1.00:1 here and paint an
       invisible button. That is why the pair inverts. */
    expect(contrastRatio(cta, page)).toBeGreaterThanOrEqual(3);
  });

  it("inverts between themes rather than holding one fixed value", () => {
    expect(hex(LIGHT, "--cta")).not.toBe(hex(DARK, "--cta"));
    expect(hex(LIGHT, "--cta")).toBe(hex(DARK, "--cta-ink"));
  });
});

describe("Atlas token contract — ink on a --green fill", () => {
  /* Stage F feature 6 found the learnings survey painting #fff on --green in two places (the
     "went" toggle and the percentage chip). That is 6.90:1 on the light green and 2.73:1 on
     the dark one — under even the 3:1 large-text floor, and invisible unless someone measures
     it, because both themes look fine at a glance. --on-green exists so there is one answer
     instead of a literal at each call site, and it has to RE-MAP, unlike --on-accent and
     --crit-fill: those sit on a fill that holds one value across themes, and --green does not. */
  it.each([
    ["light", () => LIGHT],
    ["dark", () => DARK],
  ])("clears 4.5:1 on the %s theme's green", (_theme, scope) => {
    expect(contrastRatio(hex(scope(), "--on-green"), hex(scope(), "--green"))).toBeGreaterThanOrEqual(4.5);
  });

  it("re-maps between themes — a fixed #fff is exactly the bug this replaced", () => {
    expect(hex(LIGHT, "--on-green")).not.toBe(hex(DARK, "--on-green"));
    expect(contrastRatio("#ffffff", hex(DARK, "--green"))).toBeLessThan(3);
  });
});

describe("Atlas token contract — declared-but-unconsumed tokens", () => {
  it("declares the four safe-area insets with a 0px fallback", () => {
    /* The fallback is not decoration. env() with no fallback resolves to nothing on a browser
       that doesn't support the inset, and a calc() containing nothing is invalid at
       computed-value time — the whole declaration using it drops. Every consumer in a later
       phase wraps these in calc()/max(), so the fallback has to be here, once. */
    for (const side of ["top", "bottom", "left", "right"]) {
      expect(decl(LIGHT, `--safe-${side}`)).toBe(`env(safe-area-inset-${side},0px)`);
    }
  });

  it("declares --hdr-h with a static fallback and no JS writer yet", () => {
    expect(decl(LIGHT, "--hdr-h")).toMatch(/^\d+px$/);
    /* Deliberately NOT gated any harder than this. The decision (2026-08-06) is that the JS
       writer ships with whichever phase first consumes the value — a resize observer nobody
       reads is cost with no benefit — but that is a decision about THIS phase, and a test
       forbidding the writer would have to be deleted by the phase that correctly adds it. The
       static fallback being present is the part that stays true either way. */
  });
});
