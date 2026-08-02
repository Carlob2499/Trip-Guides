// Structural venue verification — standard S1 (creator-approved 2026-08-02).
//
// Every venue a guide recommends gets its operating status checked against Google Places
// (scripts/lookup-venue.mjs) before the guide can pass a networked verify: the MangoPlate
// class of defect — a dead-since-years venue shipping because it reads plausible — becomes a
// deterministic field check instead of a hope. This is the cheap `--check status` tier
// (Essentials+Pro SKUs, 5,000 free calls/month); posted hours stay a research-agent job.
//
// Verdict semantics, chosen so the gate cannot cry wolf:
//   · CLOSED_PERMANENTLY  → BLOCKING. A recommended venue that no longer exists is concrete
//     breakage, same class as a dead link.
//   · CLOSED_TEMPORARILY  → advisory. Real (renovation, seasonal), but "temporarily" is
//     Google's word for a spectrum — a hard fail would block a guide over a two-week closure.
//   · notFound            → advisory. The query is built from name+area text, and a fuzzy
//     miss (romanization, renamed area) is far likelier than a vanished venue. A human (or
//     the research agent) disambiguates; the gate must not.
//   · no PLACES_API_KEY   → n/a, skipped cleanly. Same inert-until-configured posture as the
//     canary — a fork without the secret must not go red.
//
// Throttled politely; ~10-40 calls per guide, and verify --network runs are rare
// (graduation, recert, audits), so the monthly headroom is never the constraint.

import { lookupVenue } from "../lookup-venue.mjs";
import { flatten } from "./lib.mjs";
import { isMain } from "./lib.mjs";
import { readGuides } from "./lib.mjs";

const THROTTLE_MS = 150;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pure: collect the checkable venues from a guide — venues[] items and named map points.
    Sights are deliberately OUT in v1: they're landmarks (a palace doesn't close the way a
    restaurant does) and their Commons-photo gate already anchors their existence. */
export function collectVenues(guide) {
  const out = [];
  for (const s of flatten(guide.sections)) {
    if (s.type === "venues") {
      for (const it of s.items ?? []) {
        if (!it?.name) continue;
        out.push({ name: it.name, area: it.area ?? null, section: s.title ?? s.group ?? "venues" });
      }
    }
    if (s.type === "map") {
      for (const p of s.points ?? []) {
        if (!p?.name) continue;
        out.push({ name: p.name, area: null, section: s.title ?? "map" });
      }
    }
  }
  return out;
}

/** Pure: the Places text query for one venue. Area sharpens the hit; country scopes it. */
export function queryFor(v, country) {
  return [v.name, v.area, country].filter(Boolean).join(", ");
}

/**
 * Check one guide's venues. Returns
 *   { status: "n/a"|"pass"|"fail", checked, closed[], flagged[], reason? }
 * closed = CLOSED_PERMANENTLY (blocking) · flagged = notFound/CLOSED_TEMPORARILY (advisory).
 * Injectable lookup for tests — zero network, same seam as lookup-venue's own tests.
 */
export async function checkVenueStatus(guide, { apiKey = process.env.PLACES_API_KEY, lookup = lookupVenue, throttleMs = THROTTLE_MS } = {}) {
  if (!apiKey) return { status: "n/a", reason: "no PLACES_API_KEY — venue status not checked", checked: 0, closed: [], flagged: [] };

  const venues = collectVenues(guide);
  if (!venues.length) return { status: "pass", checked: 0, closed: [], flagged: [] };

  const closed = [];
  const flagged = [];
  let errors = 0;

  for (const [i, v] of venues.entries()) {
    if (i > 0 && throttleMs) await sleep(throttleMs);
    const r = await lookup(queryFor(v, guide.country), { cc: guide.country, check: "status", apiKey });
    if (r.error) { errors++; continue; } // an API hiccup is not a finding about the venue
    if (r.notFound) { flagged.push({ ...v, why: "no Places match — verify the name/area, or the venue may be gone" }); continue; }
    if (r.business_status === "CLOSED_PERMANENTLY") {
      closed.push({ ...v, why: "Google reports CLOSED_PERMANENTLY", matched: r.name });
    } else if (r.business_status === "CLOSED_TEMPORARILY") {
      flagged.push({ ...v, why: "CLOSED_TEMPORARILY — check reopening before the trip", matched: r.name });
    }
  }

  // Every single call erroring is an outage, not a clean bill — same fail-closed reasoning
  // as the link checker's "unverifiable" state.
  if (errors === venues.length) {
    return { status: "n/a", reason: `all ${errors} Places calls failed — outage or key problem`, checked: 0, closed: [], flagged: [] };
  }

  return { status: closed.length ? "fail" : "pass", checked: venues.length - errors, closed, flagged };
}

if (isMain(import.meta.url)) {
  const slug = process.argv[process.argv.indexOf("--slug") + 1];
  const guides = await readGuides();
  const targets = slug && slug !== "--slug" ? guides.filter((g) => g.slug === slug) : guides;
  for (const { slug: s, guide } of targets) {
    const r = await checkVenueStatus(guide);
    console.log(`[venues] ${s}: ${r.status}${r.reason ? ` (${r.reason})` : ""} — ${r.checked} checked, ${r.closed.length} closed, ${r.flagged.length} flagged`);
    for (const c of r.closed) console.log(`  ✗ ${c.name} (${c.section}) — ${c.why}`);
    for (const f of r.flagged) console.log(`  ⚠ ${f.name} (${f.section}) — ${f.why}`);
  }
}
