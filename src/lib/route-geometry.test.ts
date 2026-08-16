// @protects-file The progress cockpit's route curve, its six stage stations, and the
// equirectangular projection of countries-110m.json all land where the design says — a drift
// that renders as "a slightly different map" instead of an error.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  ROUTE_START, ROUTE_CONTROL, ROUTE_END, ROUTE_PATH_D, OCEAN_RECT,
  bezierPoint, bezierAngle, bezierLength, arcLengthFraction,
  STATION_T, routeStations,
  clamp01, dampToward, planeDrift, PLANE_DAMPING,
  lonToX, latToY, graticulePath, projectLand, type Topology,
  CARD_BOX, CARD_FIT, PIN_RADIUS, countryRings, fitCountryCard, countryCard, insideCard,
} from "./route-geometry";
import { STAGE_ORDER } from "../features/pipeline-progress/model/progress";

/* A hand-built topology in the same shape TopoJSON emits: identity-ish transform so the delta
   decode is readable, and one arc per shape. scale 1/translate 0 means arc values ARE lon/lat. */
function topo(
  geometries: { type: string; id?: string | number; arcs?: unknown }[],
  arcs: number[][][],
): Topology {
  return {
    transform: { scale: [1, 1], translate: [0, 0] },
    arcs: arcs as [number, number][][],
    objects: { countries: { geometries } },
  };
}

/** Deltas for a closed box in lon/lat, as TopoJSON stores them (first point absolute). */
function boxArc(lon: number, lat: number, w: number, h: number): number[][] {
  return [[lon, lat], [w, 0], [0, h], [-w, 0], [0, -h]];
}

function numbersIn(d: string): number[] {
  return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

describe("the route curve", () => {
  it("starts, ends and bends where the path data says", () => {
    expect(ROUTE_PATH_D).toBe("M230.5,209.5 Q420,30 629.6,104.1");
    expect(bezierPoint(0)).toEqual([...ROUTE_START]);
    expect(bezierPoint(1)).toEqual([...ROUTE_END]);
    // Midpoint of a quadratic is (P0 + 2·PC + P1) / 4.
    const [mx, my] = bezierPoint(0.5);
    expect(mx).toBeCloseTo((ROUTE_START[0] + 2 * ROUTE_CONTROL[0] + ROUTE_END[0]) / 4, 6);
    expect(my).toBeCloseTo((ROUTE_START[1] + 2 * ROUTE_CONTROL[1] + ROUTE_END[1]) / 4, 6);
  });

  it("arcs north: every sampled point sits above the straight line between the endpoints", () => {
    const slope = (ROUTE_END[1] - ROUTE_START[1]) / (ROUTE_END[0] - ROUTE_START[0]);
    for (let i = 1; i < 20; i++) {
      const [x, y] = bezierPoint(i / 20);
      const chordY = ROUTE_START[1] + (x - ROUTE_START[0]) * slope;
      expect(y).toBeLessThan(chordY); // SVG y grows downward, so "above" is "smaller"
    }
  });

  it("stays inside the viewBox", () => {
    for (let i = 0; i <= 40; i++) {
      const [x, y] = bezierPoint(i / 40);
      expect(x).toBeGreaterThanOrEqual(OCEAN_RECT.x);
      expect(x).toBeLessThanOrEqual(OCEAN_RECT.x + OCEAN_RECT.width);
      expect(y).toBeGreaterThanOrEqual(OCEAN_RECT.y);
      expect(y).toBeLessThanOrEqual(OCEAN_RECT.y + OCEAN_RECT.height);
    }
  });

  it("turns the plane from climbing-north-east to levelling-east, monotonically", () => {
    // +90 offset: the glyph is drawn nose-up, so 90° is due east.
    expect(bezierAngle(0)).toBeCloseTo(46.55, 1);
    expect(bezierAngle(1)).toBeCloseTo(109.47, 1);
    let prev = -Infinity;
    for (let i = 0; i <= 20; i++) {
      const a = bezierAngle(i / 20);
      expect(a).toBeGreaterThan(prev);
      prev = a;
    }
  });

  it("measures its own length, converging as samples rise", () => {
    const coarse = bezierLength(32);
    const fine = bezierLength(2048);
    expect(fine).toBeGreaterThan(Math.hypot(ROUTE_END[0] - ROUTE_START[0], ROUTE_END[1] - ROUTE_START[1]));
    expect(Math.abs(fine - coarse)).toBeLessThan(0.5);
    expect(bezierLength()).toBeCloseTo(fine, 1);
  });
});

describe("arcLengthFraction", () => {
  it("pins the ends, rises monotonically, and lands between them everywhere else", () => {
    expect(arcLengthFraction(0)).toBe(0);
    expect(arcLengthFraction(1)).toBeCloseTo(1, 6);
    expect(arcLengthFraction(-2)).toBe(0);
    expect(arcLengthFraction(9)).toBeCloseTo(1, 6);
    let prev = -1;
    for (let i = 0; i <= 40; i++) {
      const f = arcLengthFraction(i / 40);
      expect(f).toBeGreaterThan(prev);
      expect(f).toBeLessThanOrEqual(1);
      prev = f;
    }
  });

  it("differs from t by enough to matter — which is why the dash uses it", () => {
    // The bend front-loads the arc, so half the parameter is more than half the line.
    expect(arcLengthFraction(0.5)).toBeGreaterThan(0.5);
    expect(Math.abs(arcLengthFraction(0.5) - 0.5)).toBeGreaterThan(0.01);
  });

  it("agrees with a direct measurement of the sub-curve", () => {
    // Independent check: length(0→.32) measured by re-sampling, over the total.
    let partial = 0;
    let prev = bezierPoint(0);
    for (let i = 1; i <= 400; i++) {
      const next = bezierPoint((i / 400) * 0.32);
      partial += Math.hypot(next[0] - prev[0], next[1] - prev[1]);
      prev = next;
    }
    expect(arcLengthFraction(0.32, 2048)).toBeCloseTo(partial / bezierLength(2048), 3);
  });
});

describe("stations", () => {
  it("has exactly one per pipeline stage", () => {
    // The invariant that makes "the plane is at station 4" mean "four stages cleared".
    expect(STATION_T.length).toBe(STAGE_ORDER.length);
  });

  it("marches east along the route and ends at the arrival point", () => {
    const stations = routeStations();
    expect(stations).toHaveLength(6);
    expect(stations.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5]);
    for (let i = 1; i < stations.length; i++) {
      expect(stations[i].x).toBeGreaterThan(stations[i - 1].x);
    }
    expect([stations[5].x, stations[5].y]).toEqual([...ROUTE_END]);
  });

  it("drops the two labels that would collide with the curve below their dot", () => {
    const stations = routeStations();
    stations.forEach((s) => {
      expect(s.labelX).toBe(s.x);
      const below = s.t === 0.32 || s.t === 0.66;
      expect(s.labelY).toBe(s.y + (below ? 18 : -11));
    });
  });
});

describe("plane easing", () => {
  it("clamps, including the non-finite values a divide-by-zero can produce", () => {
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(NaN)).toBe(0);
    expect(clamp01(Infinity)).toBe(0);
  });

  it("approaches the target without overshooting it", () => {
    let t = 0;
    for (let i = 0; i < 200; i++) t = dampToward(t, 1);
    expect(t).toBeGreaterThan(0.99);
    expect(t).toBeLessThanOrEqual(1);
    expect(dampToward(0, 1, PLANE_DAMPING)).toBeCloseTo(0.06, 10);
    expect(dampToward(0.5, 0.5)).toBe(0.5);
  });

  it("sways within its amplitude, and not at all when amplitude is zero", () => {
    for (let ms = 0; ms < 6000; ms += 37) {
      expect(Math.abs(planeDrift(ms))).toBeLessThanOrEqual(0.0012);
    }
    // A stalled run gets amplitude 0 — motion.md: a pulse over a dead run is the page lying.
    expect(planeDrift(1234, 0)).toBe(0);
  });
});

describe("the equirectangular projection", () => {
  it("puts the poles and the antimeridian where 4px-per-degree says", () => {
    expect(lonToX(-180)).toBe(0);
    expect(lonToX(0)).toBe(720);
    expect(lonToX(180)).toBe(1440);
    expect(latToY(90)).toBe(0);
    expect(latToY(0)).toBe(360);
    expect(latToY(-90)).toBe(720);
  });

  it("rules a graticule clipped to the ocean plate", () => {
    const d = graticulePath();
    expect(d.startsWith("M190,20 V280")).toBe(true);
    expect(d).toContain("M750,20 V280");
    expect(d).toContain("M150,80 H750");
    expect(d).toContain("M150,240 H750");
    expect(d).not.toContain("M150,320"); // never past the plate
  });

  it("projects a polygon inside the window and closes it", () => {
    // lon -30..-20, lat 60..65 → x 600..640, y 100..120: mid-Atlantic, inside the window.
    const paths = projectLand(topo([{ type: "Polygon", arcs: [[0]] }], [boxArc(-30, 60, 10, 5)]));
    expect(paths).toHaveLength(1);
    expect(paths[0].startsWith("M600.0,120.0")).toBe(true);
    expect(paths[0].endsWith("Z")).toBe(true);
    expect(numbersIn(paths[0]).some(Number.isNaN)).toBe(false);
  });

  it("drops polygons entirely outside the window", () => {
    // lon 140..150, lat -40..-35 → x 1280..1320: Australia, nowhere near the North Atlantic.
    expect(projectLand(topo([{ type: "Polygon", arcs: [[0]] }], [boxArc(140, -40, 10, 5)]))).toEqual([]);
  });

  it("drops polygons that wrap the antimeridian rather than banding the map", () => {
    const wide = projectLand(topo([{ type: "Polygon", arcs: [[0]] }], [boxArc(-175, 60, 350, 5)]));
    expect(wide).toEqual([]);
  });

  it("keeps holes as extra subpaths so evenodd can cut them out", () => {
    const paths = projectLand(
      topo([{ type: "Polygon", arcs: [[0], [1]] }], [boxArc(-30, 60, 10, 5), boxArc(-28, 61, 2, 2)]),
    );
    expect(paths).toHaveLength(1);
    expect(paths[0].match(/M/g)).toHaveLength(2);
  });

  it("reverses an arc referenced with a negative index", () => {
    const forward = projectLand(topo([{ type: "Polygon", arcs: [[0]] }], [boxArc(-30, 60, 10, 5)]))[0];
    const reversed = projectLand(topo([{ type: "Polygon", arcs: [[~0]] }], [boxArc(-30, 60, 10, 5)]))[0];
    expect(reversed).not.toBe(forward);
    expect(numbersIn(reversed).slice(0, 2)).toEqual(numbersIn(forward).slice(-2));
  });

  it("handles MultiPolygon, and ignores geometry types and object keys it does not draw", () => {
    const multi = topo(
      [{ type: "MultiPolygon", arcs: [[[0]], [[1]]] }, { type: "Point", arcs: undefined }],
      [boxArc(-30, 60, 10, 5), boxArc(-45, 55, 6, 6)],
    );
    expect(projectLand(multi)).toHaveLength(2);
    expect(projectLand(multi, { object: "nope" })).toEqual([]);
    // A degenerate ring (fewer than 3 points) is not a shape.
    expect(projectLand(topo([{ type: "Polygon", arcs: [[0]] }], [[[10, 10], [1, 0]]]))).toEqual([]);
  });

  it("honours an explicit window and span override", () => {
    const t = topo([{ type: "Polygon", arcs: [[0]] }], [boxArc(140, -40, 10, 5)]);
    expect(projectLand(t, { window: { minX: 0, maxX: 1440, minY: 0, maxY: 720 } })).toHaveLength(1);
    expect(projectLand(topo([{ type: "Polygon", arcs: [[0]] }], [boxArc(-30, 60, 10, 5)]), { maxSpan: 10 }))
      .toEqual([]);
  });
});

describe("country cards", () => {
  /** A 10°×5° box at 60°N, tagged with an ISO-numeric id, as one country in a topology. */
  const oneCountry = (id: string | number, lon = -30, lat = 60, w = 10, h = 5) =>
    topo([{ type: "Polygon", id, arcs: [[0]] }], [boxArc(lon, lat, w, h)]);

  it("selects by ISO-numeric id and returns raw degrees, not route-map units", () => {
    const rings = countryRings(oneCountry("208"), "208");
    expect(rings).toHaveLength(1);
    // Degrees: the first point is the box corner itself. Through lonToX it would be 600.
    expect(rings[0][0]).toEqual([-30, 60]);
    expect(countryRings(oneCountry("208"), 208)).toHaveLength(1); // number id resolves the same
  });

  it("returns nothing for an id, object or topology that isn't there", () => {
    expect(countryRings(oneCountry("208"), "410")).toEqual([]);
    expect(countryRings(oneCountry("208"), "208", "nope")).toEqual([]);
    expect(countryRings(oneCountry("208"), "")).toEqual([]);
    expect(countryRings(oneCountry("208"), null as unknown as string)).toEqual([]);
  });

  it("fits the outline inside the card box, touching the long edge", () => {
    // The box spans 60–65°N, so the correction uses the MID-latitude, 62.5°: 10° of longitude
    // there measures 10·cos(62.5°) ≈ 4.62 against 5° of latitude. Height governs, the outline is
    // 56 tall, and the width follows from the correction rather than from the raw 10°.
    const card = countryCard(oneCountry("208"), "208")!;
    const n = numbersIn(card.d);
    const xs = n.filter((_, i) => i % 2 === 0);
    const ys = n.filter((_, i) => i % 2 === 1);
    const expectedWidth = 10 * Math.cos((62.5 * Math.PI) / 180) * (CARD_FIT / 5);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(CARD_FIT, 1);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(expectedWidth, 1);
    expect(expectedWidth).toBeLessThan(CARD_FIT); // the correction really does narrow it
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(CARD_BOX.width);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(CARD_BOX.height);
  });

  it("centres the outline in the box", () => {
    const n = numbersIn(countryCard(oneCountry("208"), "208")!.d);
    const xs = n.filter((_, i) => i % 2 === 0);
    const ys = n.filter((_, i) => i % 2 === 1);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(CARD_BOX.width / 2, 1);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(CARD_BOX.height / 2, 1);
  });

  it("corrects for latitude — the same box drawn near the equator is WIDER", () => {
    const arctic = numbersIn(countryCard(oneCountry("208", -30, 60), "208")!.d);
    const tropic = numbersIn(countryCard(oneCountry("208", -30, 0), "208")!.d);
    const spanX = (n: number[]) => {
      const xs = n.filter((_, i) => i % 2 === 0);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(spanX(tropic)).toBeGreaterThan(spanX(arctic));
  });

  it("puts north at the top", () => {
    const card = countryCard(oneCountry("208"), "208")!;
    expect(card.project(-30, 65)[1]).toBeLessThan(card.project(-30, 60)[1]);
    expect(card.project(-20, 60)[0]).toBeGreaterThan(card.project(-30, 60)[0]);
  });

  it("projects a real coordinate into the same box the outline was drawn in", () => {
    const card = countryCard(oneCountry("208"), "208")!;
    // The box's own centre must land on the card's centre.
    const [cx, cy] = card.project(-25, 62.5);
    expect(cx).toBeCloseTo(CARD_BOX.width / 2, 1);
    expect(cy).toBeCloseTo(CARD_BOX.height / 2, 1);
  });

  it("refuses a shape it cannot honestly fit rather than drawing a smear", () => {
    expect(fitCountryCard([])).toBeNull();
    expect(fitCountryCard([[[0, 0], [1, 1]]])).toBeNull(); // fewer than 3 points
    // A single point repeated has no extent in either axis.
    expect(fitCountryCard([[[5, 5], [5, 5], [5, 5]]])).toBeNull();
    // Antimeridian wrap: the bounding box would cover most of the planet.
    expect(fitCountryCard([[[-179, 10], [179, 10], [179, 12], [-179, 12]]])).toBeNull();
    expect(fitCountryCard([[[0, 0], [Number.NaN, 1], [2, 2]]])).toBeNull();
  });

  it("still draws a shape that is degenerate in only one axis", () => {
    // A due-north/south line has zero width but real height; latitude governs and it renders.
    const card = fitCountryCard([[[5, 0], [5, 4], [5, 8]]]);
    expect(card).not.toBeNull();
    expect(numbersIn(card!.d).every(Number.isFinite)).toBe(true);
  });

  it("keeps every ring as a subpath of ONE path, so holes cut instead of filling", () => {
    const donut = topo([{ type: "Polygon", id: "1", arcs: [[0], [1]] }], [
      boxArc(0, 0, 10, 10),
      boxArc(3, 3, 4, 4),
    ]);
    const d = countryCard(donut, "1")!.d;
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.match(/Z/g)).toHaveLength(2);
  });

  it("keeps a pin inside the card, and drops one that is somewhere else entirely", () => {
    expect(insideCard([32, 35])).toBe(true);
    expect(insideCard([0, 35])).toBe(false); // clipped by the left edge
    expect(insideCard([PIN_RADIUS, PIN_RADIUS])).toBe(true);
    expect(insideCard([CARD_BOX.width - PIN_RADIUS, CARD_BOX.height - PIN_RADIUS])).toBe(true);
    expect(insideCard([128, 35])).toBe(false);
    expect(insideCard([32, -4])).toBe(false);
  });
});

describe("against the real countries-110m.json", () => {
  const real = JSON.parse(
    readFileSync(new URL("../../public/data/countries-110m.json", import.meta.url), "utf8"),
  ) as Topology;

  it("culls most of the world and produces clean, finite paths", () => {
    const total = real.objects.countries.geometries.length;
    const paths = projectLand(real);
    expect(total).toBeGreaterThan(100);
    expect(paths.length).toBeGreaterThan(5);
    expect(paths.length).toBeLessThan(total); // the window actually excludes things
    paths.forEach((d) => {
      expect(d.startsWith("M")).toBe(true);
      expect(d.endsWith("Z")).toBe(true);
      expect(numbersIn(d).every(Number.isFinite)).toBe(true);
    });
  });

  it("fits the two published guides' countries into their cards, pins included", () => {
    // Denmark 208 / South Korea 410 — the ISO-numeric ids src/data/countries.mjs resolves to.
    // These are the exact cards the change-request picker renders, so a projection drift here
    // shows up as an unrecognisable country under a real guide's name.
    const cases: [string, [number, number]][] = [
      ["208", [12.568, 55.676]], // Copenhagen — the Denmark guide's map centre
      ["410", [126.98, 37.5707]], // Seoul — the Korea guide's first map centre
    ];
    for (const [id, [lon, lat]] of cases) {
      const card = countryCard(real, id);
      expect(card, `no card for ${id}`).not.toBeNull();
      const n = numbersIn(card!.d);
      expect(n.length).toBeGreaterThan(20);
      expect(n.every(Number.isFinite)).toBe(true);
      const xs = n.filter((_, i) => i % 2 === 0);
      const ys = n.filter((_, i) => i % 2 === 1);
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...xs)).toBeLessThanOrEqual(CARD_BOX.width);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...ys)).toBeLessThanOrEqual(CARD_BOX.height);
      // The longest axis fills the fit box: a country that renders at 12 units is the bug.
      const longest = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      expect(longest).toBeCloseTo(CARD_FIT, 1);
      expect(insideCard(card!.project(lon, lat)), `capital off the ${id} card`).toBe(true);
    }
  });

  it("drops a map centre that is in another country — Tokyo is not on the Korea card", () => {
    const korea = countryCard(real, "410")!;
    expect(insideCard(korea.project(139.6917, 35.6895))).toBe(false);
  });

  it("has no card for an id the topology doesn't carry", () => {
    expect(countryCard(real, "000")).toBeNull();
  });

  it("draws land under the arrival station (Iceland, at 22.6°W 64.0°N)", () => {
    // The single strongest anti-drift assertion available without naming a country: a sign flip
    // or a scale error in the projection moves this landmass off the arrival point immediately.
    const near = projectLand(real).some((d) => {
      const n = numbersIn(d);
      for (let i = 0; i < n.length; i += 2) {
        if (Math.abs(n[i] - ROUTE_END[0]) < 22 && Math.abs(n[i + 1] - ROUTE_END[1]) < 14) return true;
      }
      return false;
    });
    expect(near).toBe(true);
  });
});
