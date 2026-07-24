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

import { readableOn } from "./contrast";

/* The real surfaces accent text lands on, read from the built site. Each mode targets its DARKEST
   (light mode) or LIGHTEST (dark mode) ground, because clearing the hardest surface clears the
   others automatically — dark text on a lighter ground only gains contrast. */
const LIGHT_GROUND = "#dee2d6"; // sunken panel — the tightest light surface
const DARK_GROUND = "#1e242b"; // raised card in dark mode

export type AccentTokens = {
  /** The guide's identity colour. Fills, borders, large display type. Never text-contrast-gated. */
  accent: string;
  /** Accent as TEXT in light mode. Guaranteed >= 4.5:1 on every light surface. */
  ink: string;
  /** Accent as TEXT in dark mode. Guaranteed >= 4.5:1 on every dark surface. */
  inkDark: string;
  /** The undarkened source colour, for imagery tinting where legibility is not at stake. */
  raw: string;
};

export function accentTokens(accent: string, raw?: string): AccentTokens {
  return {
    accent,
    ink: readableOn(accent, LIGHT_GROUND, 4.5),
    inkDark: readableOn(accent, DARK_GROUND, 4.5),
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
    "--accent-ink-light": t.ink,
    "--accent-ink-dark": t.inkDark,
    "--accent-raw": t.raw,
    ...extra,
  };
  return Object.entries(props)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
