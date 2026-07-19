// Deterministic coordinates → IANA time zone resolver. Given a lat/lng, returns the
// real time zone from timezone-boundary polygon data — so the guide generator NEVER
// gets a `tz` value from a country-name lookup table or the language model (both are
// wrong the moment a destination's local time differs from its country's "default" —
// Hawaii and Arizona both proved this: same country, wrong time zone by hours). Fully
// offline (bundled boundary data, no network call, no API key) — same reliability
// guarantee as scripts/lookup-place.mjs, just for time zone instead of coordinates.
//
// Importable:  lookupTz(34.8688613, -111.7614394) -> { tz, candidates } | { error }
// CLI:         node scripts/lookup-tz.mjs 34.8688613 -111.7614394
//
// A destination can straddle a time zone boundary (rare, but real near some borders) —
// `candidates` carries every zone the coordinate resolves to; `tz` is candidates[0],
// the one to use unless the destination is known to sit on the edge.

import { find } from "geo-tz";
import { pathToFileURL } from "node:url";

export function lookupTz(lat, lng) {
  const la = Number(lat), ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    return { error: `invalid coordinates: lat=${lat} lng=${lng}` };
  }
  try {
    const candidates = find(la, ln);
    if (!candidates?.length) return { error: `no time zone found for ${la},${ln}` };
    return { tz: candidates[0], candidates };
  } catch (err) {
    return { error: String(err.message || err) };
  }
}

// ── CLI ──
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [lat, lng] = process.argv.slice(2);
  if (lat === undefined || lng === undefined) {
    console.error("Usage: node scripts/lookup-tz.mjs <lat> <lng>");
    process.exit(1);
  }
  console.log(JSON.stringify(lookupTz(lat, lng), null, 2));
}
