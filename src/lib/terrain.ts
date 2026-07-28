// Deterministic painted-terrain ridgelines for the Painted Atlas cover (docs/PLAN_VISUAL_REDESIGN.md,
// Move A½ №4 — the universal default cover every guide is born with). Same contract as
// contours.ts: pure and seeded at BUILD TIME, so a build is reproducible and the shape is
// unit-testable without SVG/DOM. Each guide seeds from its own slug, so every destination
// gets its own ridgeline — "living" as a property of the system, not of sourcing.

export interface TerrainParams {
  seed: number;
  /** Ridgeline layers, far-to-near (default 3 — far range, mid hills, near ground). */
  layers?: number;
  /** viewBox dimensions (default 400×150, painted with preserveAspectRatio="none"). */
  width?: number;
  height?: number;
}

export interface TerrainLayer {
  /** SVG path `d`: a closed ridge silhouette filled to the bottom edge. */
  d: string;
  /** 0 = farthest layer … layers-1 = nearest (paint order and fill depth). */
  depth: number;
}

export interface Terrain {
  width: number;
  height: number;
  layers: TerrainLayer[];
}

// Mulberry32 — same tiny deterministic PRNG contours.ts uses (duplicated 8 lines rather than
// exported across libs: both files stay dependency-free and independently readable).
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a guide slug (or any string) to a stable uint32 seed — the caller-facing way to
 *  give every guide its own terrain without inventing per-guide seed numbers. */
export function seedFromSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  return h >>> 0;
}

/** One ridgeline: a horizontal profile from summed sine harmonics (organic, not sawtooth),
 *  overshooting the viewBox ±6% on both sides so the slow CSS drift never reveals an edge.
 *  Far layers sit higher with taller relief; near layers sit low and calm — painted-backdrop
 *  perspective, matching the design study's Plate 07. */
function ridge(
  rnd: () => number,
  depth: number,
  layerCount: number,
  width: number,
  height: number,
): string {
  const t = layerCount === 1 ? 1 : depth / (layerCount - 1); // 0 = far … 1 = near
  const base = height * (0.6 + 0.28 * t);                    // ridge midline sinks as it nears
  const amp = height * (0.13 - 0.075 * t);                   // relief flattens as it nears
  const HARMONICS = 4;
  const SEGMENTS = 56;
  const waves: { w: number; k: number; p: number }[] = [];
  for (let k = 0; k < HARMONICS; k++) {
    waves.push({ w: (rnd() * 2 - 1) * amp, k: k + 1.5 + rnd(), p: rnd() * Math.PI * 2 });
  }
  const over = width * 0.06;
  const x0 = -over;
  const x1 = width + over;
  const pts: string[] = [];
  for (let s = 0; s <= SEGMENTS; s++) {
    const x = x0 + ((x1 - x0) * s) / SEGMENTS;
    const u = (x / width) * Math.PI * 2;
    let y = base;
    for (const wv of waves) y += wv.w * Math.sin(wv.k * u + wv.p);
    // Keep ridges inside the sky (never above 30% height) and above the floor.
    y = Math.min(Math.max(y, height * 0.3), height * 0.96);
    pts.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${x0.toFixed(1)},${height} ${pts.join(" ")} L${x1.toFixed(1)},${height} Z`;
}

/** Full terrain for one guide. Same seed ⇒ byte-identical output. */
export function generateTerrain(params: TerrainParams): Terrain {
  const { seed, layers: layerCount = 3, width = 400, height = 150 } = params;
  const rnd = mulberry32(seed);
  const layers: TerrainLayer[] = [];
  for (let depth = 0; depth < layerCount; depth++) {
    layers.push({ d: ridge(rnd, depth, layerCount, width, height), depth });
  }
  return { width, height, layers };
}
