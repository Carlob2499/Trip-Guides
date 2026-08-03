/* Grid clustering for the guide map — pure, so it is testable without a browser or an API key.

   Why hand-rolled rather than @googlemaps/markerclusterer: the input here is at most a few
   hundred pins from a static file, the whole job is "group points that are within N screen
   pixels of each other at this zoom", and the library's value is the parts this map does not
   use (viewport-incremental rendering, algorithm plugins, its own marker lifecycle). A tested
   40-line function costs less than a runtime dependency inside a lazily-loaded, config-gated
   bundle, and it keeps the clustering decision inspectable in a unit test rather than
   observable only by looking at a map.

   The grid is computed in WORLD PIXELS at the given zoom — the same projection Google Maps
   uses — so a cluster radius expressed in pixels means the same visual distance everywhere,
   which a naive degrees-based grid does not: 0.01° of longitude is ~1.1 km at the equator and
   ~560 m in Copenhagen. A guide that clusters correctly in Seoul and wrongly in Denmark would
   be the exact class of bug this file exists to prevent. */

import type { Pin } from "../../../lib/map-pins";

/** Google's world is 256px square at zoom 0 and doubles each level. */
const TILE = 256;

/** Web-Mercator world-pixel coordinates for a lat/lng at a given zoom. */
export function worldPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = TILE * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  // Clamp before the log: |lat| = 90 is infinite in Mercator, and a guide with a typo'd
  // coordinate must not produce NaN that silently drops the pin from every cluster.
  const s = Math.min(Math.max(Math.sin((Math.min(Math.max(lat, -85.05112878), 85.05112878) * Math.PI) / 180), -0.9999), 0.9999);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale;
  return { x, y };
}

export interface PinCluster {
  /** Weighted centre of the members — where the marker is drawn. */
  lat: number;
  lng: number;
  pins: Pin[];
}

/**
 * Group pins that fall within `radiusPx` of each other at `zoom`.
 * A cluster of one is returned as a cluster of one: callers decide whether to draw a single
 * pin or a count bubble, and that keeps this function's output shape uniform.
 *
 * Greedy over a deterministically SORTED input, not a snapped grid. A grid is cheaper, but it
 * splits on cell boundaries rather than on distance — Gyeongbokgung and the samgyetang place
 * across the road from it are 15 screen pixels apart at zoom 12 and still landed either side
 * of a boundary, which is exactly the pair a reader expects to see merge. Sorting first is
 * what buys back the property a grid gets for free: the same pins always group the same way,
 * regardless of the order they arrived in.
 */
export function clusterPins(pins: Pin[], zoom: number, radiusPx = 60): PinCluster[] {
  const pts = pins
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map((p) => ({ p, ...worldPixel(p.lat, p.lng, zoom) }))
    // North-to-south, then west-to-east, then by id so identical coordinates still order
    // stably. Without this the grouping would depend on section order in the content file.
    .sort((a, b) => b.p.lat - a.p.lat || a.p.lng - b.p.lng || a.p.id.localeCompare(b.p.id));

  const r2 = radiusPx * radiusPx;
  const acc: { x: number; y: number; pins: Pin[] }[] = [];
  for (const { p, x, y } of pts) {
    // Compare against each cluster's RUNNING CENTRE, so a chain of near-neighbours grows into
    // one cluster instead of fragmenting into pairs.
    let joined = false;
    for (const c of acc) {
      const cx = c.x / c.pins.length, cy = c.y / c.pins.length;
      if ((cx - x) ** 2 + (cy - y) ** 2 <= r2) {
        c.x += x; c.y += y; c.pins.push(p);
        joined = true;
        break;
      }
    }
    if (!joined) acc.push({ x, y, pins: [p] });
  }

  // Average in DEGREES for the returned centre: across a cluster this small the difference
  // from a proper Mercator centroid is far below the marker's own size, and it keeps the
  // result a real coordinate a caller can hand straight to a Directions link.
  return acc.map((c) => {
    let lat = 0, lng = 0;
    for (const p of c.pins) { lat += p.lat; lng += p.lng; }
    return { lat: lat / c.pins.length, lng: lng / c.pins.length, pins: c.pins };
  });
}
