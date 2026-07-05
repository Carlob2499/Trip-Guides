// Deterministic place → coordinates enricher. Given a place name (and optional
// country), returns real coordinates + an OSM place_id from OpenStreetMap's Nominatim
// geocoder — so the guide generator NEVER gets lat/lng or place_id from the language
// model (the two fields most likely to be silently hallucinated). Authoritative source,
// never the LLM. Mirrors scripts/fetch-holidays.mjs conventions: explicit User-Agent,
// graceful failure, clean JSON on stdout / logs on stderr.
//
// Importable:  lookupPlace("Fushimi Inari, Kyoto", "JP") -> { lat, lng, place_id, ... } | { notFound } | { error }
// CLI:         node scripts/lookup-place.mjs "Fushimi Inari, Kyoto" --cc JP
//
// ⚠ Nominatim usage policy: max 1 request/second, a valid identifying User-Agent, no
// heavy bulk use. Callers looping over many places MUST throttle ≥1s between calls.

import { isoCodeFor } from "../src/data/countries.mjs";
import { pathToFileURL } from "node:url";

const UA = "waypoint-generator/1.0 (+https://github.com/Carlob2499/Trip-Guides)";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

// Resolve a country hint to an ISO2 code for the `countrycodes` filter. Accepts either
// a 2-letter code directly ("JP") or a country name the site knows ("Japan").
function toCc(hint) {
  if (!hint) return null;
  if (/^[A-Za-z]{2}$/.test(hint)) return hint.toLowerCase();
  return isoCodeFor(hint)?.toLowerCase() || null;
}

export async function lookupPlace(query, countryHint) {
  const q = String(query || "").trim();
  if (!q) return { query: q, error: "empty query" };

  const params = new URLSearchParams({ q, format: "jsonv2", limit: "1", addressdetails: "0" });
  const cc = toCc(countryHint);
  if (cc) params.set("countrycodes", cc);

  try {
    const res = await fetch(`${NOMINATIM}?${params}`, { headers: { "user-agent": UA, accept: "application/json" } });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return { query: q, notFound: true };
    const hit = data[0];
    const lat = parseFloat(hit.lat), lng = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { query: q, notFound: true };
    return {
      query: q,
      name: hit.display_name || hit.name || q,
      lat, lng,
      place_id: String(hit.osm_type?.[0]?.toUpperCase() || "") + String(hit.osm_id ?? ""), // e.g. "N123" / "W456"
      osm_type: hit.osm_type ?? null,
      category: hit.category ?? hit.class ?? null,
      type: hit.type ?? null,
    };
  } catch (err) {
    return { query: q, error: String(err.message || err) };
  }
}

// ── CLI ──
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { a[argv[i].slice(2)] = argv[i + 1]; i++; }
    else a._.push(argv[i]);
  }
  return a;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const query = a._.join(" ");
  if (!query) {
    console.error('Usage: node scripts/lookup-place.mjs "<place name>" [--cc JP]');
    process.exit(1);
  }
  const result = await lookupPlace(query, a.cc);
  console.log(JSON.stringify(result, null, 2));
}
