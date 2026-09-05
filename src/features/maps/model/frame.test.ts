/* ⌁ The regression: the Korea guide opened on Korea AND Japan because one Tokyo pin sat 1,150 km
   from the other ninety-nine, and fitBounds treats every point as equally entitled to decide the
   frame. Seoul rendered too small to read on the first screen a reader ever sees. */
// @protects-file One outlying place must not decide where the whole map opens.

import { describe, expect, it } from "vitest";
import { openingBounds, TRIM, WORTH_TRIMMING, type LatLng } from "./frame";

const SEOUL = { lat: 37.5665, lng: 126.978 };
const BUSAN = { lat: 35.1796, lng: 129.0756 };
const TOKYO = { lat: 35.6762, lng: 139.6503 };

const around = (c: LatLng, n: number, jitter = 0.05): LatLng[] =>
  Array.from({ length: n }, (_, i) => ({ lat: c.lat + ((i % 5) - 2) * jitter, lng: c.lng + ((i % 3) - 1) * jitter }));

const contains = (b: NonNullable<ReturnType<typeof openingBounds>>, p: LatLng) =>
  p.lat >= b.south && p.lat <= b.north && p.lng >= b.west && p.lng <= b.east;

describe("openingBounds", () => {
  it("returns nothing for no pins, and the pin itself for one", () => {
    expect(openingBounds([])).toBeNull();
    expect(openingBounds([SEOUL])).toEqual({ south: SEOUL.lat, north: SEOUL.lat, west: SEOUL.lng, east: SEOUL.lng });
  });

  it("⌁ one far-flung pin does not decide the frame", () => {
    const b = openingBounds([...around(SEOUL, 40), TOKYO])!;
    expect(contains(b, SEOUL), "Seoul must be in frame").toBe(true);
    expect(contains(b, TOKYO), "Tokyo dragged the frame across the sea").toBe(false);
  });

  it("keeps a genuinely two-city trip whole — this is not a crop", () => {
    // Half the places in Seoul, half in Busan: neither half is a tail, so nothing is dropped.
    const b = openingBounds([...around(SEOUL, 20), ...around(BUSAN, 20)])!;
    expect(contains(b, SEOUL)).toBe(true);
    expect(contains(b, BUSAN)).toBe(true);
  });

  it("leaves a tight cluster exactly as it found it", () => {
    const pts = around(SEOUL, 30);
    const b = openingBounds(pts)!;
    for (const p of pts) expect(contains(b, p)).toBe(true);
  });

  it("does not trim below five pins — there a tail is just a place", () => {
    const pts = [...around(SEOUL, 3), TOKYO]; // four pins — under the floor
    expect(contains(openingBounds(pts)!, TOKYO)).toBe(true);
  });

  it("every pin inside the trimmed box is still fully inside the returned frame", () => {
    const pts = [...around(SEOUL, 40), TOKYO];
    const b = openingBounds(pts)!;
    for (const p of pts) {
      if (p === TOKYO) continue;
      expect(contains(b, p), `${p.lat},${p.lng} fell outside a frame drawn by a quantile`).toBe(true);
    }
  });

  it("the two knobs are the documented ones", () => {
    expect(TRIM).toBe(0.08);
    expect(WORTH_TRIMMING).toBe(1.6);
  });
});
