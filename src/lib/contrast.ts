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

// Move `fg` just far enough AWAY from `bg` to clear `target` contrast, and return that shade.
//
// This exists because a token used for TEXT needs a CONTRACT, not a constant. The guide layout
// used to derive its text accent as `darken(accent, 0.14)` — an arbitrary amount that guarantees
// nothing — and Denmark's gold (#a77e3e) landed at 3.32:1 on card surfaces, shipping unreadable
// link text to the live site. Deriving the shade FROM the requirement instead makes that class of
// bug unrepresentable: whatever accent a future guide brings, its text shade passes by construction.
//
// DIRECTION IS CHOSEN FROM THE SURFACE, which is what makes this work in dark mode too. Darkening
// unconditionally would be actively wrong there: the same accent measured 2.87:1 on the dark card,
// and darkening it further would push it toward the background, not away. So on a dark surface this
// lightens toward white and on a light surface it darkens toward black.
//
// Hue is preserved because each step scales the channels (or their distance to white) by the same
// factor. Terminates: the value converges on black or white, and the loop is capped regardless.
// Minimal intervention is deliberate — it stops at the FIRST shade that clears the bar, so a
// guide's identity colour is never pushed further than legibility requires.
export function readableOn(fg: string, bg: string, target = 4.5): string {
  if (contrastRatio(fg, bg) >= target) return fg;
  const n = parseInt(fg.slice(1), 16);
  let [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  // A mid-grey surface is the tipping point: below it, text must get lighter to separate.
  const lighten = relativeLuminance(bg) < 0.18;
  const hex = () => "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  for (let i = 0; i < 96; i++) {
    if (lighten) {
      r = Math.min(255, Math.ceil(r + (255 - r) * 0.06) + 1);
      g = Math.min(255, Math.ceil(g + (255 - g) * 0.06) + 1);
      b = Math.min(255, Math.ceil(b + (255 - b) * 0.06) + 1);
    } else {
      r = Math.floor(r * 0.94);
      g = Math.floor(g * 0.94);
      b = Math.floor(b * 0.94);
    }
    const out = hex();
    if (contrastRatio(out, bg) >= target) return out;
    if (lighten ? r === 255 && g === 255 && b === 255 : r === 0 && g === 0 && b === 0) return out;
  }
  return hex();
}
