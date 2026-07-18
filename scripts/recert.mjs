// Recert work-list — the ACTING half of self-freshening (pipeline REFRESH stage, dynamic #1).
//
// check-staleness.mjs is the DETECTOR: it sweeps every non-draft guide and flags each fact past its
// own shelf life (+ the guide-level stamp past threshold). This turns that scan into a per-guide
// work-list the recert agent acts on, and the flat slug list that drives recert.yml's matrix so the
// scheduled run covers ALL currently-stale guides, not one.
//
// It never edits anything and never hits a network (check-staleness reads local files) — it produces
// the punch list; the agent (recert.yml, on Max) re-verifies each fact against a primary source,
// updates + re-dates it, or downgrades it to ⚠, then the verify gate must PASS before merge.
//
// Recert is POST-graduation maintenance and is deliberately separate from the GENERATE checkpoint
// spine (scripts/pipeline.mjs): a published guide's freshness is recorded by the facts' own
// verified_on dates + the guide stamp, not by pipeline stages. Drafts are the research pass's job,
// not recert's — check-staleness skips them, so recert only ever touches published guides.
//
// Usage:  node scripts/recert.mjs                 # summary of every stale guide
//         node scripts/recert.mjs --slug korea    # one guide's re-verify punch list (agent reads this)
//         node scripts/recert.mjs --json          # { slugs, byGuide } for the workflow matrix

import { checkStaleness } from "./audit/check-staleness.mjs";
import { isMain } from "./audit/lib.mjs";

// Pure transform: staleness scan → { slugs, byGuide }. A guide needs recert if it has ANY section
// past its shelf life OR its guide-level stamp is past threshold. Kept pure (no I/O) so it's unit-
// testable with a mock, independent of today's date.
export function toWorklist(staleness) {
  const byGuide = {};
  const bucket = (slug) => (byGuide[slug] ??= { guideStale: null, sections: [] });
  for (const g of staleness.stale || []) bucket(g.slug).guideStale = g;
  for (const s of staleness.sections || []) bucket(s.slug).sections.push(s);
  const slugs = Object.keys(byGuide).sort();
  return { slugs, byGuide };
}

export async function recertList() {
  return toWorklist(await checkStaleness());
}

// Human/agent-readable punch list for one guide: which facts to re-verify + against what.
export function formatGuide(slug, entry) {
  const lines = [];
  if (!entry || (!entry.guideStale && !entry.sections.length)) {
    lines.push(`[recert] ${slug} — current, nothing past shelf life.`);
    return lines.join("\n");
  }
  const n = entry.sections.length + (entry.guideStale ? 1 : 0);
  lines.push(`[recert] ${slug} — ${n} item(s) to re-verify:`);
  for (const s of entry.sections) {
    lines.push(`  §${s.index} "${s.title}" — ${s.category} fact verified ${s.date} (${s.ageDays}d old vs ${s.life}d shelf life)`);
    if (s.source) lines.push(`      re-check against: ${s.source}`);
  }
  if (entry.guideStale) {
    lines.push(`  guide stamp — last verified ${entry.guideStale.date} (${entry.guideStale.ageDays}d old vs threshold)`);
  }
  lines.push(`  → Re-verify EACH against a PRIMARY (T0) source (start from the source_url). If the value changed,`);
  lines.push(`    update it and re-date verified_on to today; if you cannot confirm, downgrade to ⚠ or omit — never`);
  lines.push(`    leave it presenting as verified. Run the continuity sweep (a changed fact ripples). Then loop`);
  lines.push(`    \`npm run verify -- --slug ${slug}\` + \`npm run build\` until PASS. Keep the guide's published status.`);
  return lines.join("\n");
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const slug = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
  const asJson = argv.includes("--json");
  const { slugs, byGuide } = await recertList();

  if (asJson) {
    console.log(JSON.stringify({ slugs, byGuide }, null, 2));
  } else if (slug) {
    console.log(formatGuide(slug, byGuide[slug]));
  } else if (!slugs.length) {
    console.log("[recert] all guides current — nothing past shelf life. Nothing to recert.");
  } else {
    console.log(`[recert] ${slugs.length} guide(s) need recert: ${slugs.join(", ")}\n`);
    for (const s of slugs) console.log(formatGuide(s, byGuide[s]) + "\n");
  }
}
