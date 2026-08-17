// Recert work-list — the ACTING half of self-freshening (pipeline REFRESH stage, dynamic #1).
//
// check-staleness.mjs is the DETECTOR: it sweeps every non-draft guide and flags each fact past its
// own shelf life (+ the guide-level stamp past threshold). This turns that scan into a per-guide
// work-list the recert agent acts on, and the flat slug list that drives recert.yml's matrix so the
// scheduled run covers ALL currently-stale guides, not one.
//
// It never edits anything and never hits a network (check-staleness reads local files) — it produces
// the punch list. Acting on it is the CHANGE lifecycle's job: `--dispatch` starts one change.yml run
// per stale guide (source `staleness`), which re-verifies each fact against a primary source,
// updates + re-dates it or downgrades it to ⚠, and always lands as a PR for a human.
//
// Recert is maintenance on a PUBLISHED guide and is deliberately separate from the GENERATE checkpoint
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

  if (argv.includes("--dispatch")) {
    // The ACTING half now lives in the change lifecycle: one change.yml run per stale guide,
    // source `staleness`, which always lands as a PR for a human. A single dispatch failing must
    // not stop the others — comprehensiveness is the point of the sweep.
    const { gh } = await import("./lib/cli.mjs");
    const { isValidSlug } = await import("./lib/slug.mjs");
    const only = (process.env.INPUT_SLUG || "").trim();
    if (only && !isValidSlug(only)) { console.error(`[recert] "${only}" isn't a valid slug`); process.exit(1); }
    const targets = only ? [only] : slugs;
    if (!targets.length) { console.log("[recert] all guides current — nothing to dispatch."); process.exit(0); }
    let failed = 0;
    for (const s of targets) {
      try {
        gh(["workflow", "run", "change.yml", "-f", `slug=${s}`, "-f", "source=staleness", "-f", "land=pr"]);
        console.log(`[recert] dispatched a staleness change run for ${s}`);
      } catch (err) {
        failed++;
        console.error(`[recert] could not dispatch ${s}: ${err.message}`);
      }
    }
    // A PARTIAL failure is a failure (M6): the sweep's whole point is comprehensiveness, and a
    // green run that silently skipped guides is a sweep that lied. Every successful dispatch
    // above still went out — nothing is rolled back — but the run reports the gap.
    if (failed) {
      console.error(`[recert] ${failed} of ${targets.length} dispatch(es) FAILED — the sweep is incomplete; re-run for the failed slug(s).`);
      process.exit(1);
    }
    process.exit(0);
  }

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
