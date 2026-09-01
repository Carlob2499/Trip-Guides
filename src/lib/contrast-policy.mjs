// The ONE contrast policy every accent gate answers to — page grounds + floor.
//
// Three consumers must agree or a guide can pass one gate and fail the next:
//   • src/content.config.ts       — zod gate on an explicit guide `theme.primary`
//   • scripts/extract-palette.mjs — generates src/data/palettes/<slug>.json from a cover photo
//   • scripts/validate-palettes.mjs — re-checks every COMMITTED src/data/palettes/*.json
//
// Plain .mjs (not .ts) so it loads unchanged in both Astro's TS content-config loader and bare
// `node` scripts — the same sharing trick src/lib/facts.mjs already uses (imported by both
// content.config.ts and extract-palette.mjs today). This removes the duplicated-constant drift
// PR #72 found and fixed once (extract-palette.mjs had silently drifted a full design pass off
// content.config.ts's grounds) rather than adding a third copy to keep in sync by hand.
//
// Light page background (base.css `--bg`). A guide's resolved accent is painted as link/tab/
// label text on this surface, so it must stay legible against it. Keep in sync with base.css if
// that token changes.
export const LIGHT_BG = "#e3e7dc";

// Dark page background (base.css dark-mode `--bg`). The accent is NOT re-mapped in dark mode, so
// an accent must stay legible on BOTH grounds — a light-only gate shipped a 2.33:1 dark-mode bug
// in WayPoint-V2; gate both, always.
// D5 warm-charcoal remap: #0f1317 → #17120e at EQUAL relative luminance (0.0063 vs 0.0065), so
// every previously blessed palette measures the same ratio to two decimals against this ground.
export const DARK_BG = "#17120e";

// 3.0:1 is WCAG's minimum for large-text / UI-component contrast, and is the empirically-
// calibrated floor of the project's own country accent palette (the tightest, #a6721b, sits at
// ~3.20:1 on the R2 ground). Below this, accent UI turns illegible on the cream background —
// fail loudly rather than ship it.
export const MIN_ACCENT_CONTRAST = 3.0;
