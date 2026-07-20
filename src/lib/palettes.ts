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

export type GuideAccents = { primary: string; secondary: string; raw: string };

/** The full 3-stop accent set for a guide (Atlas card tinting, V3 — see
 *  docs/PLAN_VISUAL_OVERHAUL.md). Same precedence as accentForGuide, but a guide with no
 *  extracted palette (explicit `theme`, or a typographic-cover guide) has no secondary/raw
 *  to give — every stop falls back to the single resolved accent so a card never renders a
 *  broken color, it just doesn't get the extra depth. */
export function paletteAccentsForGuide(
  slug: string,
  theme: { primary?: string } | undefined | null,
  country: string
): GuideAccents {
  const primary = accentForGuide(slug, theme, country);
  const extracted = theme?.primary ? null : paletteFor(slug); // an explicit theme overrides the whole set, not just primary
  return {
    primary,
    secondary: extracted?.secondary ?? primary,
    raw: extracted?.accent ?? primary,
  };
}
