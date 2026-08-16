/**
 * Route-map geometry for the New Guide progress cockpit (src/pages/progress/).
 *
 * The cockpit's centrepiece is a great-circle-looking flight path across the North Atlantic with
 * one station per pipeline stage and a plane that eases along it as stages clear. Every number
 * here is fixed by the approved design (design_handoff_pipeline_and_intake/design/Waypoint
 * V2.dc.html) — the curve's three control points, the six station parameters, the 600×260
 * viewBox, and the 4px-per-degree equirectangular projection that turns
 * public/data/countries-110m.json into the land behind it.
 *
 * Why this is a lib module rather than inline in the UI: projection arithmetic drifts silently.
 * A sign flip in latToY, an off-by-one in the TopoJSON delta decode, or a cull window that
 * quietly excludes Iceland all render as "a slightly different map" — plausible, wrong, and
 * invisible in review. Pure functions with a test are the only way that failure gets caught.
 *
 * No DOM, no fetch: the caller passes the parsed topology in and gets `d` strings back.
 */

/* ── The route ──────────────────────────────────────────────────────────────────────────── */

/** SVG user-space viewBox the whole map is drawn in: `x y w h`. */
export const ROUTE_VIEWBOX = "150 20 600 260";
/** The ocean plate, matching ROUTE_VIEWBOX exactly (tinted, not painted, by the caller). */
export const OCEAN_RECT = { x: 150, y: 20, width: 600, height: 260 } as const;

/** Quadratic Bézier: departure, control, arrival. `M230.5,209.5 Q420,30 629.6,104.1`. */
export const ROUTE_START = [230.5, 209.5] as const;
export const ROUTE_CONTROL = [420, 30] as const;
export const ROUTE_END = [629.6, 104.1] as const;

export const ROUTE_PATH_D =
  `M${ROUTE_START[0]},${ROUTE_START[1]} Q${ROUTE_CONTROL[0]},${ROUTE_CONTROL[1]} ${ROUTE_END[0]},${ROUTE_END[1]}`;

export type Point = [number, number];

/** Point on the route at parameter `t` (0 = departure, 1 = arrival). */
export function bezierPoint(t: number): Point {
  const u = 1 - t;
  const a = u * u;
  const b = 2 * t * u;
  const c = t * t;
  return [
    a * ROUTE_START[0] + b * ROUTE_CONTROL[0] + c * ROUTE_END[0],
    a * ROUTE_START[1] + b * ROUTE_CONTROL[1] + c * ROUTE_END[1],
  ];
}

/**
 * Heading of the route at `t`, in degrees, already rotated +90 so an upward-pointing plane glyph
 * (drawn nose-up at the origin) sits nose-forward along the curve without a second transform.
 */
export function bezierAngle(t: number): number {
  const dx = 2 * (1 - t) * (ROUTE_CONTROL[0] - ROUTE_START[0]) + 2 * t * (ROUTE_END[0] - ROUTE_CONTROL[0]);
  const dy = 2 * (1 - t) * (ROUTE_CONTROL[1] - ROUTE_START[1]) + 2 * t * (ROUTE_END[1] - ROUTE_CONTROL[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

/**
 * Arc length of the route, by polyline sampling. The UI prefers the browser's own
 * `SVGGeometryElement.getTotalLength()` (exact, and it is already holding the element); this is
 * the fallback for a detached/hidden SVG where that returns 0, and the thing the test can pin.
 */
export function bezierLength(samples = 256): number {
  let total = 0;
  let prev = bezierPoint(0);
  for (let i = 1; i <= samples; i++) {
    const next = bezierPoint(i / samples);
    total += Math.hypot(next[0] - prev[0], next[1] - prev[1]);
    prev = next;
  }
  return total;
}

/**
 * How far along the route, as a fraction of ARC LENGTH, the parameter `t` sits.
 *
 * The two are not the same thing, and the difference is visible: stations are placed at fixed
 * `t` (the design's own numbers), but the flown-route line is drawn with `stroke-dashoffset`,
 * which is measured in length. Feeding `t` straight into the dash — as the prototype's demo
 * did — leaves the drawn line ending several pixels away from the plane sitting on it.
 */
export function arcLengthFraction(t: number, samples = 256): number {
  const target = clamp01(t);
  if (target === 0) return 0;
  let upto = 0;
  let total = 0;
  let prev = bezierPoint(0);
  for (let i = 1; i <= samples; i++) {
    const u = i / samples;
    const next = bezierPoint(u);
    const seg = Math.hypot(next[0] - prev[0], next[1] - prev[1]);
    total += seg;
    if (u <= target) upto += seg;
    else if (u - 1 / samples < target) upto += seg * (target - (u - 1 / samples)) * samples;
    prev = next;
  }
  return total ? upto / total : 0;
}

/* ── Stations ───────────────────────────────────────────────────────────────────────────── */

/**
 * Where each pipeline stage sits on the route. Index-for-index with
 * src/features/pipeline-progress/model/progress.ts's STAGE_ORDER — six stages, six stations —
 * which is what makes "the plane is at station 4" mean "four stages have cleared" rather than
 * an animator's guess. A test asserts the two arrays stay the same length.
 */
export const STATION_T = [0.15, 0.32, 0.5, 0.66, 0.83, 1] as const;

/** Stations whose label would collide with the curve above it, so it hangs below instead. */
const LABEL_BELOW = new Set<number>([0.32, 0.66]);
const LABEL_RISE = -11;
const LABEL_DROP = 18;

export interface Station {
  /** Index into STATION_T (and therefore into STAGE_ORDER). */
  index: number;
  t: number;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
}

/** The six station dots plus their label anchors, in stage order. */
export function routeStations(): Station[] {
  return STATION_T.map((t, index) => {
    const [x, y] = bezierPoint(t);
    return {
      index,
      t,
      x,
      y,
      labelX: x,
      labelY: y + (LABEL_BELOW.has(t) ? LABEL_DROP : LABEL_RISE),
    };
  });
}

/* ── Plane easing ───────────────────────────────────────────────────────────────────────── */

/**
 * Per-frame damping toward the target `t`. The pipeline reports progress in whole stages, so the
 * raw target jumps; easing at 6% a frame turns a jump into a ~1s glide. It is deliberately NOT a
 * CSS transition: the plane's transform carries a rotation derived from the same `t`, and the two
 * have to be written in the same frame or the nose points the wrong way mid-flight.
 */
export const PLANE_DAMPING = 0.06;
/** Idle sway, in units of `t`, applied ONLY while a run is live — see docs/reference/motion.md's
 *  rule that a pulse over a dead run is the page lying. */
export const PLANE_DRIFT = 0.0012;
const DRIFT_PERIOD_MS = 900;

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** One damped step from `current` toward `target`. */
export function dampToward(current: number, target: number, factor = PLANE_DAMPING): number {
  return current + (target - current) * factor;
}

/** Sine sway at `nowMs`, in `t` units. Zero amplitude means a stalled plane truly stops. */
export function planeDrift(nowMs: number, amplitude = PLANE_DRIFT): number {
  return Math.sin(nowMs / DRIFT_PERIOD_MS) * amplitude;
}

/* ── The backdrop ───────────────────────────────────────────────────────────────────────── */

/** Degrees-of-longitude → user units. 4px/° puts the whole globe on 1440×720 and the North
 *  Atlantic squarely inside the 600×260 window. */
export const DEGREE_SCALE = 4;
export const lonToX = (lon: number): number => (lon + 180) * DEGREE_SCALE;
export const latToY = (lat: number): number => (90 - lat) * DEGREE_SCALE;

/** Graticule: meridians every 20° and parallels every 20°, clipped to the viewBox. */
export function graticulePath(): string {
  const parts: string[] = [];
  const { x, y, width, height } = OCEAN_RECT;
  for (let mx = x + 40; mx <= x + width; mx += 80) parts.push(`M${mx},${y} V${y + height}`);
  for (let my = y + 60; my <= y + height; my += 80) parts.push(`M${x},${my} H${x + width}`);
  return parts.join(" ");
}

/** The slice of public/data/countries-110m.json this module actually reads. */
export interface Topology {
  transform: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: Record<string, { geometries: { type: string; arcs?: unknown }[] }>;
}

export interface ProjectOptions {
  /** Which `objects` key to read. countries-110m.json ships exactly one: "countries". */
  object?: string;
  /** Viewport to keep, in user units. Anything wholly outside is dropped rather than drawn
   *  off-canvas — 177 countries is 177 paths the browser would otherwise still hit-test. */
  window?: { minX: number; maxX: number; minY: number; maxY: number };
  /** A polygon wider than this has wrapped the antimeridian and would draw a band across the
   *  whole map (Russia and Fiji both do it). Drop it; neither is in the North Atlantic. */
  maxSpan?: number;
}

const DEFAULT_WINDOW = { minX: 130, maxX: 770, minY: 0, maxY: 300 };
const DEFAULT_MAX_SPAN = 900;

/** TopoJSON stores arcs as quantised deltas; decode to absolute lon/lat, then project. */
function decodeArcs(topo: Topology): Point[][] {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  return topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [lonToX(x * sx + tx), latToY(y * sy + ty)] as Point;
    });
  });
}

/** Stitch an arc-index ring into one point list. A negative index means "that arc, reversed"
 *  (TopoJSON's ~i encoding), and a stitched arc repeats the previous arc's last point. */
function stitchRing(indexes: number[], arcs: Point[][]): Point[] {
  let points: Point[] = [];
  for (const i of indexes) {
    const arc = i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
    if (!arc) continue;
    points = points.concat(points.length ? arc.slice(1) : arc);
  }
  return points;
}

function ringsOf(geometry: { type: string; arcs?: unknown }): number[][][] {
  if (geometry.type === "Polygon") return [geometry.arcs as number[][]];
  if (geometry.type === "MultiPolygon") return geometry.arcs as number[][][];
  return [];
}

function subpath(points: Point[]): string {
  return "M" + points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L") + "Z";
}

/**
 * Project the topology into SVG `d` strings — one per polygon, holes included as extra subpaths
 * so the caller's `fill-rule="evenodd"` cuts them out. Polygons outside the window (or wrapped
 * across the antimeridian) never make it into the returned array.
 */
export function projectLand(topo: Topology, opts: ProjectOptions = {}): string[] {
  const win = opts.window ?? DEFAULT_WINDOW;
  const maxSpan = opts.maxSpan ?? DEFAULT_MAX_SPAN;
  const collection = topo.objects?.[opts.object ?? "countries"];
  if (!collection) return [];

  const arcs = decodeArcs(topo);
  const out: string[] = [];

  for (const geometry of collection.geometries) {
    for (const polygon of ringsOf(geometry)) {
      const rings = polygon.map((r) => stitchRing(r, arcs)).filter((r) => r.length > 2);
      if (!rings.length) continue;

      const xs = rings[0].map((p) => p[0]);
      const ys = rings[0].map((p) => p[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      if (maxX - minX > maxSpan) continue;
      if (maxX < win.minX || minX > win.maxX || maxY < win.minY || minY > win.maxY) continue;

      out.push(rings.map(subpath).join(""));
    }
  }
  return out;
}
