// B4 (docs/PLAN_EVIDENCE_FIRST.md) — fact-usage index: bidirectional traceability over a
// guide's perishable-fact registry, derived at query time and never stored.
//
// `{{fact:id}}` interpolation (src/lib/facts.mjs) answers fact→prose at build — substitute the
// value wherever the token appears — but nothing ever answered the two questions that matter
// for maintenance: "which days/sections actually DEPEND on fact X" (so changing it tells you
// what to re-read) and "which shipped claims look like perishable figures but have NO fact
// row at all" (so they're not silently exempt from recert/verification).
//
// Two outputs, one pass over a guide's group files:
//   USAGE   fact id -> every {file, section, day, item, field} location that references it.
//   CANDIDATES  a raw money-shaped value (same MONEY_RE migrate-facts.mjs uses — one detector,
//               not two that can drift) sitting in a PROVENANCE-BEARING unit (source_url +
//               verified_on, same precondition migrate-facts.mjs requires) with NO
//               {{fact:id}} token anywhere in that same string. These are candidates for
//               `migrate-facts.mjs`, not blockers — this script only reports.
//
// "R2+-looking" (the plan's own phrasing) can't be filtered by actual risk yet — `risk` is an
// optional B1 field nothing populates until D2 runs. Every money-shaped, sourced, untokenized
// value is a candidate; a human (or a later, risk-aware packet) triages from there.
//
// DO NOT TOUCH (packet boundary): no stored index file, ever — every call rebuilds this from
// the group files on disk. If this script and facts.json ever disagree, the group files are
// the truth; there is nothing here to go stale.
//
// Usage:
//   node scripts/audit/fact-usage.mjs --slug korea             human table
//   node scripts/audit/fact-usage.mjs --slug korea --json      machine JSON

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { GUIDES_DIR, isMain } from "./lib.mjs";
import { isSectionFile, collectTokens } from "../../src/lib/facts.mjs";
import { findMoney, isReferenceUnit, TEXT_FIELDS } from "../migrate-facts.mjs";

/** Every {{fact:id}} token span in a string, so findMoney can be run on what's LEFT once they're
    masked out — otherwise a token's own digits (e.g. an id like `budget-daily-costs-90`) could
    be misread as a raw, untokenized money mention sitting right next to itself. */
function maskTokens(text) {
  return text.replace(/\{\{fact:[a-z0-9][a-z0-9-]*\}\}/g, (m) => " ".repeat(m.length));
}

/**
 * Build the bidirectional index for one guide.
 * Returns { usage: { [factId]: Location[] }, candidates: Candidate[] }, where
 *   Location  = { file, section, day, item, field }   (day/item are null when not applicable)
 *   Candidate = { file, section, day, item, field, value }
 */
export async function buildFactUsage(slug, guidesDir = GUIDES_DIR) {
  const dir = path.join(guidesDir, slug);
  const files = (await readdir(dir)).filter(isSectionFile).sort();
  const usage = {};
  const candidates = [];

  const addUsage = (id, loc) => {
    (usage[id] ??= []).push(loc);
  };

  for (const file of files) {
    const sections = JSON.parse(await readFile(path.join(dir, file), "utf8"));

    const scanUnit = (unit, section, day, item) => {
      for (const field of TEXT_FIELDS) {
        const text = unit?.[field];
        if (typeof text !== "string") continue;
        for (const id of collectTokens(text)) addUsage(id, { file, section, day, item, field });
        if (unit.source_url && unit.verified_on) {
          for (const hit of findMoney(maskTokens(text))) {
            candidates.push({ file, section, day, item, field, value: hit.value });
          }
        }
      }
    };

    for (const s of sections) {
      if (isReferenceUnit(s)) continue; // a Sources list restates a figure — not a new candidate
      const section = s.title ?? s.group ?? "section";
      const isDays = s.type === "days";
      scanUnit(s, section, null, null);
      for (const it of s.items ?? []) {
        const day = isDays ? (it.date ?? it.title ?? null) : null;
        const item = isDays ? null : (it.name ?? it.title ?? it.label ?? null);
        scanUnit(it, section, day, item);
      }
    }
  }

  return { usage, candidates };
}

function formatLoc(loc) {
  const parts = [loc.file, loc.section];
  if (loc.day) parts.push(`day ${loc.day}`);
  if (loc.item) parts.push(loc.item);
  return parts.join(" → ");
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const slug = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
  const asJson = argv.includes("--json");
  if (!slug) {
    console.error("Usage: node scripts/audit/fact-usage.mjs --slug <slug> [--json]");
    process.exit(1);
  }
  const { usage, candidates } = await buildFactUsage(slug);
  if (asJson) {
    console.log(JSON.stringify({ slug, usage, candidates }, null, 2));
  } else {
    const ids = Object.keys(usage).sort();
    console.log(`[fact-usage] ${slug}: ${ids.length} referenced fact(s), ${candidates.length} untokenized money candidate(s)\n`);
    for (const id of ids) {
      console.log(`  ${id}`);
      for (const loc of usage[id]) console.log(`     ${formatLoc(loc)}`);
    }
    if (candidates.length) {
      console.log(`\n  -- candidates (sourced money mentions with no {{fact:id}} token) --`);
      for (const c of candidates) console.log(`  ${JSON.stringify(c.value)}  ${formatLoc(c)}`);
    }
  }
}
