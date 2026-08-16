/**
 * Route-map geometry for the New Guide progress cockpit (src/pages/progress/).
 *
 * The cockpit's centrepiece is a great-circle-looking flight path across the North Atlantic with
 * one station per pipeline stage and a plane that eases along it as stages clear. Every number
 * here is fixed by the approved design (the retired handoff bundle's `design/Waypoint V2.dc.html`
 * — docs/archive/INDEX.md → PLAN_PIPELINE_SURFACES carries the git path to it, and these numbers
 * are now the record, not a copy of one) — the curve's three control points, the six station
 * parameters, the 600×260 viewBox, and the 4px-per-degree equirectangular projection that turns
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

/** One country in the topology. `id` is the ISO 3166-1 NUMERIC code as a string ("208" Denmark,
 *  "410" South Korea) — Natural Earth's own key, and the one src/data/countries.mjs resolves to. */
export interface Geometry {
  type: string;
  id?: string | number;
  arcs?: unknown;
}

/** The slice of public/data/countries-110m.json this module actually reads. */
export interface Topology {
  transform: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: Record<string, { geometries: Geometry[] }>;
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

/** How a decoded lon/lat pair becomes a drawing coordinate. */
type Projection = (lon: number, lat: number) => Point;

/** The route map's own projection: 4px/° equirectangular over the whole globe. */
const ROUTE_PROJECTION: Projection = (lon, lat) => [lonToX(lon), latToY(lat)];
/** Identity: keep degrees, for callers that fit their own box (see fitCountryCard). */
const LON_LAT: Projection = (lon, lat) => [lon, lat];

/** TopoJSON stores arcs as quantised deltas; decode to absolute lon/lat, then project. */
function decodeArcs(topo: Topology, project: Projection = ROUTE_PROJECTION): Point[][] {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  return topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return project(x * sx + tx, y * sy + ty);
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

/* ── Country cards ──────────────────────────────────────────────────────────────────────── */

/**
 * The change-request picker draws each guide as a small country silhouette, and those cards do
 * NOT use the projection above. At 4px/° Denmark is 14 units wide and South Korea 12 — a smudge,
 * not a country. Each card instead gets its own fit: bounding box, cos-latitude correction,
 * scale-to-longest-edge, centre. Same arithmetic as the approved prototype's loadGeo().
 *
 * The cos-latitude term is the part that stops the silhouette lying. A degree of longitude at
 * 56°N is 56% the length of a degree of latitude, so drawing the two 1:1 gives a Denmark half
 * again too wide — recognisably wrong to anyone who knows the shape, which is everyone the card
 * is for. Multiplying longitude by cos(mid-latitude) is the cheapest correction that gets the
 * proportions right at country scale.
 */
export const CARD_BOX = { width: 64, height: 70 } as const;
/** The longest edge of the fitted outline, leaving air on the narrow axis. */
export const CARD_FIT = 56;
/** Radius of a map pin drawn on the card, in the same units. */
export const PIN_RADIUS = 3;

const CARD_CX = CARD_BOX.width / 2;
const CARD_CY = CARD_BOX.height / 2;
/** Below this, a span is a rounding artefact rather than an extent, and dividing by it would
 *  hand the caller Infinity. */
const MIN_DEGREE_SPAN = 1e-6;
/** A country spanning more longitude than this has wrapped the antimeridian (Russia, Fiji): its
 *  bounding box covers most of the planet and no honest fit exists. The caller gets null. */
const MAX_CARD_LON_SPAN = 180;

export interface CountryCard {
  /** One `d` string — every ring as a subpath — for a single `<path fill-rule="evenodd">` in a
   *  `0 0 64 70` viewBox. One path, so holes cut instead of filling. */
  d: string;
  /** Real coordinates → the same box, so a pin lands where the place actually is rather than
   *  where a designer guessed. */
  project: Projection;
}

/**
 * Every ring of one country, in raw lon/lat degrees.
 *
 * `id` is the ISO 3166-1 numeric code — Natural Earth's key, which src/data/countries.mjs
 * resolves a country name to. Matching on `properties.name` instead would tie the picker to
 * Natural Earth's spelling of "South Korea", which is not the guide's spelling of it.
 */
export function countryRings(topo: Topology, id: string | number, object = "countries"): Point[][] {
  const collection = topo?.objects?.[object];
  if (!collection || id === null || id === undefined || id === "") return [];
  const wanted = String(id);

  const arcs = decodeArcs(topo, LON_LAT);
  const out: Point[][] = [];
  for (const geometry of collection.geometries) {
    if (String(geometry.id ?? "") !== wanted) continue;
    for (const polygon of ringsOf(geometry)) {
      for (const ring of polygon) {
        // Points exactly on the antimeridian are Natural Earth's seam, not coastline.
        const points = stitchRing(ring, arcs).filter(([lon]) => Math.abs(lon) < 180);
        if (points.length > 2) out.push(points);
      }
    }
  }
  return out;
}

/** Fit lon/lat rings into the card box. Null when there is nothing honest to draw. */
export function fitCountryCard(rings: Point[][]): CountryCard | null {
  const points = rings.flat();
  if (points.length < 3) return null;

  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of points) {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  if (maxLon - minLon > MAX_CARD_LON_SPAN) return null;

  // Never negative for a real latitude; the clamp is against malformed data, not against maths.
  const k = Math.max(0, Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180));
  const width = (maxLon - minLon) * k;
  const height = maxLat - minLat;
  const byWidth = width > MIN_DEGREE_SPAN ? CARD_FIT / width : Infinity;
  const byHeight = height > MIN_DEGREE_SPAN ? CARD_FIT / height : Infinity;
  const scale = Math.min(byWidth, byHeight);
  if (!Number.isFinite(scale) || scale <= 0) return null; // a single point has no shape

  const ox = CARD_CX - (width * scale) / 2;
  const oy = CARD_CY + (height * scale) / 2;
  const project: Projection = (lon, lat) => [ox + (lon - minLon) * k * scale, oy - (lat - minLat) * scale];

  const d = rings
    .map((ring) => {
      const pts = ring.map((p) => {
        const [x, y] = project(p[0], p[1]);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      });
      return "M" + pts.join("L") + "Z";
    })
    .join("");

  return { d, project };
}

/** The card for one country, or null if the topology has no drawable geometry under that id. */
export function countryCard(topo: Topology, id: string | number, object = "countries"): CountryCard | null {
  return fitCountryCard(countryRings(topo, id, object));
}

/**
 * Whether a projected point can be drawn as a pin without being clipped by the card edge.
 *
 * This is a real filter, not a formality: the Korea guide's map centres include Tokyo, which sits
 * 10° east of anything on a card fitted to South Korea. Drawing it would either smear the pin
 * across the card border or silently rescale the country to fit a city in another one. Dropping
 * it is the honest option — the card shows Korea, and Tokyo is not in Korea.
 */
export function insideCard(point: Point, pad = PIN_RADIUS): boolean {
  const [x, y] = point;
  return x >= pad && x <= CARD_BOX.width - pad && y >= pad && y <= CARD_BOX.height - pad;
}
