// Staleness flagger — parses each non-draft guide's free-text `verified` field for
// a "Mon YYYY" date and flags anything older than the threshold. Draft guides
// (draft: true) are skipped from age scoring — they're unverified by design, not
// "stale"; that's already visible via the draft flag and the masthead ⚠ pill.
// This script does NOT re-verify anything itself — it produces the punch list a
// human (or a Tier 2 research pass) acts on.

import { readGuides, parseVerifiedDate, daysSince, isMain } from "./lib.mjs";

export const DEFAULT_THRESHOLD_DAYS = 90;

// Mirrors SHELF_LIFE_DAYS in src/lib/staleness.ts. Duplicated rather than imported
// because this script is plain .mjs run by node with no TS pipeline; the schema's
// `shelf_life` enum and the test in staleness.test.ts keep the two honest.
const SHELF_LIFE_DAYS = { fx: 7, transit: 90, hours: 90, venue: 180, default: 90 };

export async function checkStaleness({ thresholdDays = DEFAULT_THRESHOLD_DAYS } = {}) {
  const guides = await readGuides();
  const stale = [];
  const noDate = [];
  const drafts = [];
  const sections = []; // per-section findings, judged by each fact's own shelf life

  for (const { slug, guide } of guides) {
    if (guide.draft) { drafts.push(slug); continue; }

    // Per-section provenance. The guide-level stamp below can only ever say "this guide
    // is old"; these say WHICH fact is old and what to re-check it against — which is
    // the difference between a report and a punch list.
    for (const [i, s] of (guide.sections ?? []).entries()) {
      if (!s?.verified_on) continue;
      const d = new Date(s.verified_on + "T00:00:00Z");
      if (Number.isNaN(d.getTime())) continue;
      const life = SHELF_LIFE_DAYS[s.shelf_life ?? "default"] ?? SHELF_LIFE_DAYS.default;
      const age = daysSince(d);
      if (age > life) {
        sections.push({
          slug, index: i, title: s.title ?? s.group ?? `section ${i}`,
          date: s.verified_on, ageDays: age, category: s.shelf_life ?? "default",
          life, source: s.source_url ?? null,
        });
      }
    }

    const date = parseVerifiedDate(guide.verified);
    if (!date) { noDate.push(slug); continue; }
    const age = daysSince(date);
    if (age > thresholdDays) stale.push({ slug, date: date.toISOString().slice(0, 10), ageDays: age });
  }

  return { thresholdDays, stale, noDate, drafts, sections, totalGuides: guides.length };
}

if (isMain(import.meta.url)) {
  const { thresholdDays, stale, noDate, drafts, sections } = await checkStaleness();
  console.log(`[staleness] guide-level threshold ${thresholdDays}d — ${stale.length} stale, ${noDate.length} no parseable date, ${drafts.length} drafts (skipped)`);
  for (const s of stale) console.log(`  ✗ ${s.slug} — last verified ${s.date} (${s.ageDays}d ago)`);
  for (const s of noDate) console.log(`  ? ${s.slug} — has a \`verified\` field but no "Mon YYYY" found in it`);
  console.log(`[staleness] per-section — ${sections.length} fact(s) past their own shelf life`);
  for (const s of sections) {
    console.log(`  ✗ ${s.slug} §${s.index} "${s.title}" — ${s.category} fact verified ${s.date}, ${s.ageDays}d old vs ${s.life}d shelf life`);
    if (s.source) console.log(`      re-check against: ${s.source}`);
  }
}
