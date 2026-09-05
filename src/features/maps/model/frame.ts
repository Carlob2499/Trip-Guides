/* WHERE THE MAP OPENS — pure, so the decision is inspectable in a test rather than only by
   looking at a map.

   The problem it solves: the Map surface used to open on `fitBounds` over EVERY pin, and a
   guide's pins are not a tidy cloud. South Korea's guide carries one Tokyo pin, ~1,150 km from
   the other ninety-nine, so the opening frame was Korea AND Japan with Seoul too small to read.
   One outlying place decided the first thing a reader sees.

   The fix is not to hide the outlier — it is still a pin, still in the index, and selecting it
   still pans there. The fix is to open on where the guide actually IS: the box holding the bulk
   of its places. That is a trimmed extent — drop a fraction from each end of each axis and take
   what remains, the standard robust-statistics answer to "the average is fine but one value is
   dragging the range".

   Two guards keep it honest:
     · trimming only applies when it actually helps. If dropping the tails barely shrinks the
       box, the pins were spread all along and cropping them would be a lie about the trip —
       a genuine Seoul-to-Busan guide must still open on both.
     · the result is always widened back to include every pin within it, so no pin sits just
       outside the frame's edge by a hair. */

export type LatLng = { lat: number; lng: number };
export type Bounds = { south: number; west: number; north: number; east: number };

/** Fraction dropped from EACH end of each axis before measuring the extent. 0.08 keeps the
 *  middle 84%: enough to shed a lone far-flung city, never enough to shed a whole leg of a
 *  trip — a two-city guide splits roughly half and half, so neither half is in a tail. */
export const TRIM = 0.08;

/** How much smaller the trimmed box must be before it is worth using. Below this the spread is
 *  real rather than one stray point, and the full extent is the honest frame. */
export const WORTH_TRIMMING = 1.6;

const quantile = (sorted: number[], q: number) =>
  sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))];

const extentOf = (pts: readonly LatLng[]): Bounds => ({
  south: Math.min(...pts.map((p) => p.lat)),
  north: Math.max(...pts.map((p) => p.lat)),
  west: Math.min(...pts.map((p) => p.lng)),
  east: Math.max(...pts.map((p) => p.lng)),
});

const span = (b: Bounds) => Math.max(b.north - b.south, (b.east - b.west) * 0.6);

/**
 * The box the map should open on: every pin when they hang together, the trimmed core when a
 * handful of outliers would otherwise decide the frame. Returns null for no pins at all.
 */
export function openingBounds(pins: readonly LatLng[]): Bounds | null {
  const pts = pins.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (!pts.length) return null;
  const full = extentOf(pts);
  /* Below five points a "tail" is one or two places, and dropping them is not statistics, it is
     just losing somewhere the reader asked for. */
  if (pts.length < 5) return full;

  const lats = pts.map((p) => p.lat).sort((a, b) => a - b);
  const lngs = pts.map((p) => p.lng).sort((a, b) => a - b);
  const core: Bounds = {
    south: quantile(lats, TRIM),
    north: quantile(lats, 1 - TRIM),
    west: quantile(lngs, TRIM),
    east: quantile(lngs, 1 - TRIM),
  };
  if (span(core) <= 0 || span(full) / span(core) < WORTH_TRIMMING) return full;

  /* Widen back over everything the trimmed box already contains, so nothing sits a hair outside
     an edge that was drawn by a quantile rather than by a place. */
  const inside = pts.filter((p) => p.lat >= core.south && p.lat <= core.north && p.lng >= core.west && p.lng <= core.east);
  return inside.length ? extentOf(inside) : core;
}
