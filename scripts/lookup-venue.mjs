// Deterministic venue → operating-truth verifier. Given a venue name (and optional country),
// returns whether the place STILL EXISTS, its address/coords, and — on demand — its posted
// opening hours and official website, straight from Google Places. So the guide generator
// NEVER gets "is it still open" or an hours string from the language model: those are the two
// facts most likely to be confidently wrong (the MangoPlate lesson — a dead-since-2020
// aggregator shipped from training data). Authoritative source, never the LLM.
//
// Importable:  lookupVenue("Daruma, Fukuoka", { cc: "JP", check: "hours" })
//                -> { business_status, hours, website, ... } | { notFound } | { error }
// CLI:         node scripts/lookup-venue.mjs "Daruma, Fukuoka" --cc JP --check hours
//
// ── COST (verified 2026-08-02, re-check before widening any field mask) ──────────────
// developers.google.com/maps/documentation/places/web-service/data-fields
// Google replaced the flat $200 credit (Mar 2025) with per-SKU monthly free caps:
//   Essentials 10,000 · Pro 5,000 · Enterprise 1,000 calls/month, each SKU counted separately.
// A request billing spans EVERY tier its field mask touches, so the mask is the cost knob:
//   --check status  → Essentials + Pro        (businessStatus is Pro)      → 5,000/mo headroom
//   --check hours   → ...+ Enterprise         (regularOpeningHours is Ent) → 1,000/mo headroom
// At ~50-150 venues per guide that is 6-20 fully-hours-verified guides per month at $0, so
// NEVER ask for hours when you only need to know whether a venue still exists. The key is
// expected to carry a hard daily quota cap in Google Cloud — a cap refuses, a budget alert
// only reports.
//
// Inert until configured: with no PLACES_API_KEY this returns a clean { error } and never
// throws, exactly like every other lookup script here.

import { isoCodeFor } from "../src/data/countries.mjs";
import { parseArgs } from "./lib/cli.mjs";
import { pathToFileURL } from "node:url";

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// Field masks, grouped by the SKU tier each field triggers (see COST above). Every entry is
// annotated because moving one line between these arrays changes what the repo pays.
const ESSENTIALS = ["places.id", "places.formattedAddress", "places.location", "places.types"];
const PRO = ["places.displayName", "places.businessStatus"];
const ENTERPRISE = ["places.regularOpeningHours", "places.nationalPhoneNumber", "places.websiteUri"];

export const CHECKS = ["status", "hours"];

// Which SKUs a given check bills against — surfaced in the result so a caller (or a run
// report) can see what it spent without reverse-engineering the mask.
export function skusFor(check) {
  return check === "hours" ? ["Essentials", "Pro", "Enterprise"] : ["Essentials", "Pro"];
}

export function fieldMaskFor(check) {
  const fields = check === "hours" ? [...ESSENTIALS, ...PRO, ...ENTERPRISE] : [...ESSENTIALS, ...PRO];
  return fields.join(",");
}

// Places uses a 2-letter CLDR region code; accept either a code ("JP") or a country name
// the site already knows ("Japan"), same contract as lookup-place.mjs's --cc.
function toRegion(hint) {
  if (!hint) return null;
  if (/^[A-Za-z]{2}$/.test(hint)) return hint.toUpperCase();
  return isoCodeFor(hint)?.toUpperCase() || null;
}

// Pure: Places `place` object → the flat shape a guide fact wants. Exported for tests.
export function normalizePlace(place, check, query, today) {
  const hours = place.regularOpeningHours || null;
  const status = place.businessStatus || null;
  const out = {
    query,
    name: place.displayName?.text || place.displayName || query,
    address: place.formattedAddress ?? null,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    place_id: place.id ?? null,
    types: place.types ?? [],
    business_status: status,
    // The whole point of the status check, stated as a boolean the caller can branch on
    // without knowing Google's enum. null when the field wasn't returned at all.
    still_operating: status == null ? null : status === "OPERATIONAL",
    verified_on: today,
    skus_billed: skusFor(check),
  };
  if (check === "hours") {
    out.hours = hours?.weekdayDescriptions ?? null;
    out.open_now = hours?.openNow ?? null;
    out.phone = place.nationalPhoneNumber ?? null;
    // The venue's own site is the T0 citation a perishable fact should carry.
    out.website = place.websiteUri ?? null;
    out.source_url = place.websiteUri ?? null;
  }
  return out;
}

export async function lookupVenue(query, opts = {}) {
  const q = String(query || "").trim();
  if (!q) return { query: q, error: "empty query" };

  const check = CHECKS.includes(opts.check) ? opts.check : "status";
  const key = opts.apiKey ?? process.env.PLACES_API_KEY;
  if (!key) {
    return {
      query: q,
      error: "PLACES_API_KEY not set — venue verification skipped (inert until configured)",
    };
  }

  const body = { textQuery: q, pageSize: 1 };
  const region = toRegion(opts.cc);
  if (region) body.regionCode = region;
  if (opts.lang) body.languageCode = opts.lang;

  // Injectable so the network contract is testable without a key or a live call — the same
  // seam verify-live.mjs uses for its retry loop.
  const doFetch = opts.fetch ?? fetch;

  try {
    const res = await doFetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
        "x-goog-fieldmask": fieldMaskFor(check),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Surface Google's own reason — a 403 here is almost always "API not enabled" or a key
      // restriction, and the message is the fastest path to the fix. Never leaks the key.
      const detail = await res.text().catch(() => "");
      const reason = detail.slice(0, 300).replace(/\s+/g, " ").trim();
      return { query: q, error: `Places HTTP ${res.status}${reason ? `: ${reason}` : ""}` };
    }
    const data = await res.json();
    const place = Array.isArray(data.places) ? data.places[0] : null;
    if (!place) return { query: q, notFound: true, skus_billed: skusFor(check) };
    const today = opts.today ?? new Date().toISOString().slice(0, 10);
    return normalizePlace(place, check, q, today);
  } catch (err) {
    return { query: q, error: String(err.message || err) };
  }
}

// ── CLI ──

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const query = a._.join(" ");
  if (!query) {
    console.error('Usage: node scripts/lookup-venue.mjs "<venue name>" [--cc JP] [--check status|hours]');
    console.error("  --check status (default) — does it still exist? Essentials+Pro SKUs");
    console.error("  --check hours            — ...plus posted hours/site. Also Enterprise SKU (1,000/mo free)");
    process.exit(1);
  }
  const result = await lookupVenue(query, { cc: a.cc, check: a.check, lang: a.lang });
  console.log(JSON.stringify(result, null, 2));
  if (result.error) process.exit(1);
}
