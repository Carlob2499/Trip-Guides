// E1 (docs/PLAN_EVIDENCE_FIRST.md) — backfill the `tier` field on existing facts.json rows.
//
// WHY. `tier` has been in `src/content.config.ts` since P7/R11 (both factRecord and
// provenance) and NOTHING has ever populated it — defect D5 in the plan's audit: a schema
// field that exists, validates, and means nothing. E1(b) wants to REQUIRE it on R2+ rows,
// which is unenforceable while all 145 rows in the corpus carry it blank. This script is
// the one-time mechanical close of that gap.
//
// HOW THE TIER IS DERIVED. Purely from the row's own `source_url` against the destination
// config's `t0Domains` list (D1, `src/data/destinations/<slug>.json`):
//   · host matches a t0Domain (exactly, or as a subdomain of it) → `primary`
//   · anything else                                              → LEFT BLANK, never guessed
// The domain list is per-destination DATA, so this is not a guess about what "official"
// means in general — it is the destination's own declared set of primary domains, verified
// when D1 landed. `go.jp` matching `mlit.go.jp` is intentional: it is the Japanese
// government's TLD, and D1 recorded it deliberately.
//
// WHY NON-MATCHES STAY BLANK RATHER THAN BECOMING `secondary` (learned by running this on
// the real corpus before writing anything). `t0Domains` enumerates DESTINATION-level
// authorities — government, tourism board, transit operator. But verification-rules.md §3
// defines T0 as including "the venue's own site", which is an unbounded set no config can
// list. Defaulting non-matches to `secondary` therefore mislabels genuinely-primary sources:
// Korea Telecom's own eSIM page (roaming.kt.com), the COEX aquarium's own ticket page
// (visitsealife.com), and the US Federal Reserve's H.10 FX release are all T0 by the skill's
// own definition and none of them is a Korea t0Domain. Since E1(b) goes on to GATE on
// `tier: primary`, a wrong `secondary` would fail facts that deserve to pass — so this
// script asserts only what it can prove, and a blank tier keeps meaning "not yet judged"
// (the honest blank, per CLAUDE.md) rather than silently becoming a false negative.
//
// WHAT IT WILL NEVER DO:
//   · assign `secondary` or `corroborated`. Both are research judgments about a body of
//     evidence — whether a source is the venue's own, whether two sources corroborate — and
//     a hostname cannot prove either. They stay a human/research call.
//   · overwrite an existing `tier`. Rows already carrying one were set by a person or a
//     research pass; a mechanical sweep does not get to relitigate that. Re-running is a
//     no-op, so this is safe to run repeatedly.
//   · touch a row with no `source_url`. No evidence pointer, no derivable tier — those rows
//     stay blank and are exactly what E1's gate should still be asking about.
//   · run at all for a slug with no destination config. Denmark has no
//     `src/data/destinations/denmark.json`, so its rows are reported as skipped — "we have
//     no domain list" is not a judgment about any source.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isMain, ROOT, GUIDES_DIR } from "./audit/lib.mjs";

const DESTINATIONS_DIR = path.join(ROOT, "src", "data", "destinations");

/** Pure: does `host` fall under `domain` — as the domain itself, or a subdomain of it?
    Substring matching would be wrong ("notjreast.co.jp" must not match "jreast.co.jp"),
    so the subdomain case is anchored on a leading dot. */
export function hostMatchesDomain(host, domain) {
  const h = String(host ?? "").toLowerCase().replace(/\.$/, "");
  const d = String(domain ?? "").toLowerCase().replace(/^\.+|\.+$/g, "");
  if (!h || !d) return false;
  return h === d || h.endsWith(`.${d}`);
}

/** Pure: the tier a URL earns against a destination's t0Domains — `primary` on a match,
    null otherwise. null covers three different "cannot prove it" cases (absent URL,
    unparseable URL, host not in the list) and they are all the same answer here: this
    script does not assign a tier it cannot demonstrate. See the header for why a non-match
    is NOT `secondary`. */
export function tierForUrl(sourceUrl, t0Domains = []) {
  if (!sourceUrl) return null;
  let host;
  try {
    host = new URL(String(sourceUrl)).hostname;
  } catch {
    return null;
  }
  return t0Domains.some((d) => hostMatchesDomain(host, d)) ? "primary" : null;
}

/** Pure: decide every row's fate. Returns the proposed rows plus the reason each skipped
    row was left alone, so the propose output is a complete account of the file. */
export function proposeTiers(facts, t0Domains = []) {
  const assignments = [];
  const skipped = [];
  for (const [id, row] of Object.entries(facts ?? {})) {
    if (row?.tier) {
      skipped.push({ id, reason: `already tier: ${row.tier}` });
      continue;
    }
    const tier = tierForUrl(row?.source_url, t0Domains);
    if (!tier) {
      skipped.push({
        id,
        reason: !row?.source_url
          ? "no source_url"
          : "host is not a declared t0Domain — tier is a research call (venue-official sites are T0 too)",
      });
      continue;
    }
    assignments.push({ id, tier, source_url: row.source_url });
  }
  return { assignments, skipped };
}

/** Read the destination config for a slug. Returns null when the slug has none — the
    caller reports that as a skip, never as "no primary domains". */
async function readDestination(slug, rootDir) {
  try {
    return JSON.parse(await readFile(path.join(rootDir ?? DESTINATIONS_DIR, `${slug}.json`), "utf8"));
  } catch {
    return null;
  }
}

/** Full proposal for one slug: reads the destination config + facts.json. */
export async function proposeBackfill(slug, { guidesDir = GUIDES_DIR, destinationsDir = DESTINATIONS_DIR } = {}) {
  const dest = await readDestination(slug, destinationsDir);
  if (!dest) return { status: "n/a", reason: `no src/data/destinations/${slug}.json — cannot derive tiers` };

  let facts;
  try {
    facts = JSON.parse(await readFile(path.join(guidesDir, slug, "facts.json"), "utf8"));
  } catch {
    return { status: "n/a", reason: "no facts.json" };
  }

  const { assignments, skipped } = proposeTiers(facts, dest.t0Domains ?? []);
  return { status: "ok", facts, assignments, skipped, t0Domains: dest.t0Domains ?? [] };
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const slug = argv[argv.indexOf("--slug") + 1];
  const write = argv.includes("--write");
  if (!slug || slug === "--slug") {
    console.error("Usage: node scripts/backfill-tier.mjs --slug <slug> [--write]");
    process.exit(1);
  }
  // Regression evidence: the frozen fixture and the live japan dir it mirrors are the
  // corpus this whole plan is measured against. Mutating either would be marking our own
  // homework (plan §8.0: "Do not edit anything under src/content/guides/japan/").
  if (slug === "japan") {
    console.error("[tier] refusing: japan is regression evidence (plan §8.0) — never backfilled.");
    process.exit(1);
  }

  const r = await proposeBackfill(slug);
  if (r.status !== "ok") {
    console.log(`[tier] ${slug}: ${r.reason}`);
    process.exit(0);
  }
  console.log(`[tier] ${slug}: ${r.assignments.length} row(s) provably primary (of ${r.assignments.length + r.skipped.length} total)`);
  console.log(`[tier] t0Domains: ${r.t0Domains.join(", ") || "(none)"}\n`);
  for (const a of r.assignments) console.log(`  ${a.tier.padEnd(9)} ${a.id}\n     ${a.source_url}`);
  if (r.skipped.length) {
    console.log(`\n[tier] ${r.skipped.length} row(s) left alone:`);
    for (const s of r.skipped) console.log(`  ${s.id} — ${s.reason}`);
  }
  if (!r.assignments.length) {
    console.log(`\n[tier] nothing to write.`);
    process.exit(0);
  }
  if (!write) {
    console.log(`\n[tier] proposal only — re-run with --write to apply.`);
    process.exit(0);
  }
  for (const a of r.assignments) r.facts[a.id].tier = a.tier;
  await writeFile(path.join(GUIDES_DIR, slug, "facts.json"), JSON.stringify(r.facts, null, 2) + "\n");
  // `tier` IS reader-visible, unlike most registry metadata: renderFactValue emits it as
  // `data-tier` on the flag-chip, and provenance-dot.js shows it as the popover's "Evidence"
  // row (src/lib/facts.test.ts pins both). So dist/ legitimately CHANGES here — only for
  // rows that render a chip at all, i.e. `state: "approx"`. Diff it and confirm the only
  // deltas are added data-tier attributes.
  console.log(`\n[tier] wrote ${r.assignments.length} tier(s) to ${slug}/facts.json. Rebuild and diff dist/ — expect added data-tier="primary" attributes on ≈-state chips (they surface as the popover's "Evidence" row) and NOTHING else.`);
}
