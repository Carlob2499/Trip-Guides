// THE single derivation of a guide's accent tokens. Both surfaces that paint a guide's identity —
// the hub card (src/pages/index.astro) and the guide page (src/layouts/GuideLayout.astro) — must
// call this and nothing else.
//
// Why it exists: those two surfaces used to derive their tokens independently, and drifted. The hub
// set `--accent2` to the palette's designed secondary (#73572b for Denmark) while the guide set it
// to `darken(accent, 0.14)` (#906c35). One token name, two different colours, two different
// meanings — and the guide's shade failed WCAG on live pages at 3.32:1. A shared function makes
// that divergence unrepresentable rather than merely fixed.
//
// The naming rule: a token says what it is FOR, not what it looks like. `--accent2` described a
// position in a list; `--accent-ink` describes a job, and that job carries a contract.

import { mix, readableOn, readableOnAll } from "./contrast";

/* The real surfaces accent text lands on, read from base.css: --card, --bg2, --bg per mode. */
const LIGHT_SURFACES = ["#fbfcf6", "#ced5c4", "#e3e7dc"] as const;
const DARK_SURFACES = ["#322921", "#261f19", "#17120e"] as const;

/* Those flat surfaces are not the whole story: chips and pills sit on ACCENT-TINTED grounds
   (`color-mix(in srgb, var(--accent) N%, var(--card))`), and a tint moves the ground TOWARD the
   accent — the one direction that eats the contrast the ink was derived to have. Deriving against
   the flat card alone is how .shiny-pill landed at 4.07:1 and .tl-chip-shiny at 4.18:1 in dark
   mode: both pass on #1e242b, and neither passes on the tinted variant they are actually painted on.

   The binding case is `.stop-num:hover` (planner.css): its own text is `color:var(--accent-ink)`
   and its hover state tints 16% toward `transparent`. A tint toward `transparent` is not toward
   nothing — the browser composites the translucent result over whatever surface actually sits
   beneath, and this site has exactly three surface tokens (--card/--bg2/--bg), so that composite
   is bounded by the same LIGHT_SURFACES/DARK_SURFACES set regardless of which one it lands on.
   .ro-chip[aria-pressed] tints 18% the same way (toward `transparent`, over --card in practice) —
   it paints `--ink` rather than accent text, so it doesn't itself need this contract, but its 18%
   is the highest tint any background declaration reaches and makes a safe, provably-conservative
   ceiling for the ones that do.

   TINT_MAX is a claim ABOUT THE STYLESHEETS, not a constant of nature, so a test re-derives it from
   the CSS and fails if any rule ever tints past it — otherwise this number rots silently and the
   guarantee quietly stops being true. */
export const TINT_MAX = 0.18;

const tinted = (accent: string, surfaces: readonly string[]) =>
  surfaces.flatMap((s) => [s, mix(accent, s, TINT_MAX)]);

export type AccentTokens = {
  /** The guide's identity colour. Fills, borders, large display type. Never text-contrast-gated. */
  accent: string;
  /** Accent as TEXT in light mode. >= 4.5:1 on every light surface, flat or accent-tinted. */
  ink: string;
  /** Accent as TEXT in dark mode. >= 4.5:1 on every dark surface, flat or accent-tinted. */
  inkDark: string;
  /** Text ON an accent FILL. >= 4.5:1 against `accent` itself, and identical in both themes. */
  onAccent: string;
  /** The undarkened source colour, for imagery tinting where legibility is not at stake. */
  raw: string;
};

export function accentTokens(accent: string, raw?: string): AccentTokens {
  return {
    accent,
    ink: readableOnAll(accent, tinted(accent, LIGHT_SURFACES), 4.5),
    inkDark: readableOnAll(accent, tinted(accent, DARK_SURFACES), 4.5),
    /* Text on a solid accent fill is a THIRD job, and the site had no token for it — so every such
       rule improvised: `color:#fff`, `color:var(--bg)`, `color:#f4f6ef`. All three are wrong for the
       same reason: they follow the PAGE theme while the fill underneath them does not. --accent is
       identity and never re-maps between light and dark, so `var(--bg)` on a Denmark gold pill is
       near-white in light mode (3.06:1) and near-black in dark (fine) — the ink flips, the ground
       does not, and one of the two is always wrong.

       Deriving from the accent itself is what makes this theme-independent: readableOn takes its
       direction from the ground, so a dark accent gets pale ink and a light accent gets deep ink,
       and the answer is the same on both themes because the ground is the same on both themes. Hue
       is preserved, so a gold fill takes deep-gold text rather than a foreign black. */
    onAccent: readableOn(accent, accent, 4.5),
    raw: raw ?? accent,
  };
}

/* Render the tokens as an inline style string. Both surfaces emit the SAME property names, which is
   the point — a stylesheet can then reference --accent-ink without caring which surface it is on.
   `--accent-ink-dark` is carried alongside so base.css's dark block can remap --accent-ink to it;
   a media query cannot recompute a colour, so both shades have to travel with the element. */
export function accentStyle(t: AccentTokens, extra: Record<string, string> = {}): string {
  const props: Record<string, string> = {
    "--accent": t.accent,
    // Emit the two CANDIDATES, never the resolved `--accent-ink` itself. An inline style beats
    // every stylesheet rule, so writing --accent-ink here would shadow base.css's dark-mode
    // override and pin the light shade onto dark pages — which is exactly what happened: axe
    // measured the light ink (#5e642b) on a dark ground at 2.6:1. base.css picks between these.
    // COUPLED NAME (#38): base.css's carrier rules select on [style*="--accent-ink-light"] —
    // the literal property name in this serialized style IS the selector's hook. Renaming it
    // means updating the carrier rules and both accent gates (tests/visual/a11y.spec.ts,
    // scripts/__tests__/accent-ink-contract.test.mjs) in the same pass.
    "--accent-ink-light": t.ink,
    "--accent-ink-dark": t.inkDark,
    /* --on-accent IS emitted resolved, and that is not an inconsistency with the rule above. The
       rule is not "never inline a colour" — it is "never inline a value the theme has to re-pick".
       --accent-ink has two correct answers and the stylesheet chooses between them, so inlining one
       shadows that choice. --on-accent has exactly ONE correct answer, because its ground is
       --accent, which does not re-map between light and dark. There is nothing for a media query to
       override, so inlining it shadows nothing. */
    "--on-accent": t.onAccent,
    "--accent-raw": t.raw,
    ...extra,
  };
  return Object.entries(props)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
