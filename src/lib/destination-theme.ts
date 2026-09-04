/* The deterministic destination composer's THEME step (design-system.md §11, §13).

   One guide's identity tokens are derived here, from data the repository already holds — the
   country's accent (src/data/countries.mjs) or the guide's own extracted palette — and
   nothing is invented at render time. The manifest decides what a destination MAY colour:
   the accent family (via accent-tokens.ts) and the dark-mode atmosphere, a warm-charcoal
   ground tinted a few percent toward the destination accent so Seoul at night is not Rome at
   night. It may never touch safety semantics, price/time meaning or critical contrast: the
   tint is refused (the neutral ground stands) if the quiet ink would fall under 4.5:1 on it. */

import { contrastRatio, mix } from "./contrast";
import { DARK_SURFACES, DARK_QUIET_INK } from "./accent-tokens";

/* base.css's dark ground and its quiet ink — the pair the atmosphere is measured against. */
const DARK_GROUND = DARK_SURFACES[2];
const DARK_MUTED = DARK_QUIET_INK;
const ATMOSPHERE_TINT = 0.07;

export interface DestinationTheme {
  /** The accent the rest of the token family is derived from. */
  accent: string;
  /** Dark-mode page ground tinted toward the accent, or null when the tint would cost contrast. */
  darkGround: string | null;
  /** The seed the cartographic texture (Painted Atlas) draws from — the guide's own slug. */
  textureSeed: string;
}

export function destinationTheme(slug: string, accent: string): DestinationTheme {
  // contrast.ts's mix(a, b, t) weights `a` by t: the accent at 7%, the charcoal at 93%.
  const tinted = mix(accent, DARK_GROUND, ATMOSPHERE_TINT);
  const safe = contrastRatio(DARK_MUTED, tinted) >= 4.5;
  return { accent, darkGround: safe ? tinted : null, textureSeed: slug };
}

/** Inline custom properties for the guide's <html>: only what the manifest allows. */
export function destinationThemeStyle(theme: DestinationTheme): Record<string, string> {
  return theme.darkGround ? { "--atmo-ground": theme.darkGround } : {};
}
