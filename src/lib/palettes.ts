// Per-guide palette resolution — ONE precedence, applied on every accent surface
// (GuideLayout, hub hero + cards, OG images), per the uniform-application guardrail:
//
//   explicit guide `theme` (zod-gated)  >  extracted cover palette  >  country accent
//
// Extracted palettes live in src/data/palettes/<slug>.json, generated + contrast-gated
// by `npm run extract-palette` (scripts/extract-palette.mjs) from the guide's own cover
// photo — committed data, so builds stay offline-deterministic (the holidays pattern).
// Before this helper, an explicit `theme` reached only GuideLayout while the hub and OG
// always used the country accent — the same datum rendering differently per surface.

import { accentFor } from "./themes";

export type ExtractedPalette = {
  primary: string;    // gated ≥3:1 on both grounds — safe as --accent
  secondary: string;  // deeper companion
  accent: string;     // raw vibrant — decorative use only (NOT gated)
  source_file: string;
  extracted_on: string;
};

const files = import.meta.glob("../data/palettes/*.json", { eager: true, import: "default" }) as Record<string, ExtractedPalette>;

export function paletteFor(slug: string): ExtractedPalette | null {
  return files[`../data/palettes/${slug}.json`] ?? null;
}

/** The one accent for a guide, resolved by the site-wide precedence. */
export function accentForGuide(slug: string, theme: { primary?: string } | undefined | null, country: string): string {
  return theme?.primary ?? paletteFor(slug)?.primary ?? accentFor(country);
}
