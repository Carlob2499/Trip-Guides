// WCAG relative-luminance + contrast-ratio helpers. Pure, dependency-free.
// Used at BUILD time (content.config.ts) to reject a guide `theme` whose colour
// would be illegible as accent UI on the page background — the same fail-loud
// pattern the content schema already uses for bad data.

// Linearize one 0–255 sRGB channel per the WCAG 2.x definition.
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

// Relative luminance of a #RRGGBB hex colour (0 = black, 1 = white).
export function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// WCAG contrast ratio between two #RRGGBB hex colours (1 = identical, 21 = black/white).
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a), lb = relativeLuminance(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}
