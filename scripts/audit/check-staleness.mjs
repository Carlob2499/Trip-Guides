// Staleness flagger — parses each non-draft guide's free-text `verified` field for
// a "Mon YYYY" date and flags anything older than the threshold. Draft guides
// (draft: true) are skipped from age scoring — they're unverified by design, not
// "stale"; that's already visible via the draft flag and the masthead ⚠ pill.
// This script does NOT re-verify anything itself — it produces the punch list a
// human (or a Tier 2 research pass) acts on.

import { readGuides, parseVerifiedDate, daysSince, isMain } from "./lib.mjs";

export const DEFAULT_THRESHOLD_DAYS = 90;

export async function checkStaleness({ thresholdDays = DEFAULT_THRESHOLD_DAYS } = {}) {
  const guides = await readGuides();
  const stale = [];
  const noDate = [];
  const drafts = [];

  for (const { slug, guide } of guides) {
    if (guide.draft) { drafts.push(slug); continue; }
    const date = parseVerifiedDate(guide.verified);
    if (!date) { noDate.push(slug); continue; }
    const age = daysSince(date);
    if (age > thresholdDays) stale.push({ slug, date: date.toISOString().slice(0, 10), ageDays: age });
  }

  return { thresholdDays, stale, noDate, drafts, totalGuides: guides.length };
}

if (isMain(import.meta.url)) {
  const { thresholdDays, stale, noDate, drafts } = await checkStaleness();
  console.log(`[staleness] threshold ${thresholdDays}d — ${stale.length} stale, ${noDate.length} no parseable date, ${drafts.length} drafts (skipped)`);
  for (const s of stale) console.log(`  ✗ ${s.slug} — last verified ${s.date} (${s.ageDays}d ago)`);
  for (const s of noDate) console.log(`  ? ${s.slug} — has a \`verified\` field but no "Mon YYYY" found in it`);
}
