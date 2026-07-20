// Deterministic topographic contour lines for the Overture hero (docs/PLAN_VISUAL_OVERHAUL.md,
// session V2) — hand-drawn-feeling map contours generated at BUILD TIME (called from the hub
// page's Astro frontmatter, which runs in Node — no separate CLI script needed), never a stock
// image. Pure and seeded: the same seed always produces the same rings, so a build is
// reproducible and the shape is unit-testable without touching SVG/DOM.

export interface ContourParams {
  seed: number;
  rings: number;
  /** Center of the ring stack, in the same units as `viewBox`. */
  cx: number;
  cy: number;
  /** Square viewBox side (default 1000, matching the mock). */
  viewBox?: number;
  /** Base radius of the innermost ring before per-ring growth. */
  baseRadius?: number;
}

export interface ContourLayer {
  viewBox: number;
  /** One SVG `points` attribute value per ring, outermost-last (paint order). */
  rings: string[];
}

// Mulberry32 — tiny, fast, seed-in/deterministic-out. Good enough for organic-looking noise;
// not for anything security-sensitive (never used that way here).
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One ring: a wobbled ellipse built from a handful of summed sine harmonics, so it reads as a
 *  natural contour rather than a perfect circle. `points` count is fixed (44 segments + closing
 *  point) — enough to look smooth at hero scale without generating an unbounded string. */
function ring(rnd: () => number, cx: number, cy: number, radius: number): string {
  const SEGMENTS = 44;
  const HARMONICS = 6;
  const wobble: number[] = [];
  for (let k = 0; k < HARMONICS; k++) wobble.push(rnd() * 22 - 11);

  const pts: string[] = [];
  for (let a = 0; a <= SEGMENTS; a++) {
    const theta = (a / SEGMENTS) * Math.PI * 2;
    let w = 0;
    for (let k = 0; k < HARMONICS; k++) w += wobble[k] * Math.sin((k + 2) * theta + k);
    const r = radius + w;
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r * 0.82; // slight vertical compression — map-contour feel, not a bullseye
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

/** One full layer (a stack of concentric-ish rings) for a given seed. Same seed ⇒ byte-identical
 *  output — callers vary `seed` per layer (far/mid/near) and per contour zone. */
export function generateContourLayer(params: ContourParams): ContourLayer {
  const { seed, rings: ringCount, cx, cy, viewBox = 1000, baseRadius } = params;
  if (ringCount < 1) return { viewBox, rings: [] };
  const rnd = mulberry32(seed);
  const base = baseRadius ?? 40 + rnd() * 30;
  const rings: string[] = [];
  for (let r = 0; r < ringCount; r++) {
    const growth = 46 + rnd() * 10;
    rings.push(ring(rnd, cx, cy, base + r * growth));
  }
  return { viewBox, rings };
}
