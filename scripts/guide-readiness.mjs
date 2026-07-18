// Guide readiness gate — the self-correction LOOP's evaluator. Runs the mechanical research
// checks + a source-coverage metric against one guide and prints a single verdict + punch-list
// the researcher (a Claude session, or the research-pass Action) iterates against: research →
// readiness → fix each finding by re-researching against a PRIMARY source → re-run until PASS.
//
// It does NOT check the JSON schema — that's `npm run build` (the content-collection gate). The
// two run together in the guide-author skill's done-gate: build proves shape, readiness proves
// research quality. Advisory + read-only, like every scripts/audit/* module.
//
// Usage:  node scripts/guide-readiness.mjs --slug kyoto-japan [--min-coverage 0.8]
//         npm run readiness -- --slug kyoto-japan

import { readGuides, flatten, isMain } from "./audit/lib.mjs";
import { checkResearchGuide } from "./audit/check-research.mjs";

// Prose-like sections carry perishable facts AND support provenance (source_url/verified_on) —
// they're the ones the skill's strict mode gates. The coverage proxy is measured over these.
const FACT_TYPES = new Set(["panel", "prose", "list", "routes"]);
const strip = (html) => String(html || "").replace(/<[^>]+>/g, "").trim();

// A fact section is "sourced" if it carries a structured source_url OR an inline <a href>
// citation anywhere in its content (the skill treats both as live citations).
function isSourced(section) {
  if (section.source_url) return true;
  return /href=['"]https?:\/\//i.test(JSON.stringify(section));
}

// Only count fact sections that actually have content — an empty scaffold section isn't a
// missing citation, it's an unfilled section (check-research already flags those).
function isContentfulFactSection(s) {
  if (!FACT_TYPES.has(s.type)) return false;
  if (String(s.group || "").toLowerCase() === "references") return false; // sources live here by design
  const hasBody = strip(s.body).length >= 3;
  const hasItems = Array.isArray(s.items) && s.items.length > 0;
  const hasSteps = Array.isArray(s.steps) && s.steps.length > 0;
  const hasChecklist = Array.isArray(s.checklist) && s.checklist.length > 0;
  return hasBody || hasItems || hasSteps || hasChecklist;
}

// Citation context (NOT a gate): of the contentful fact sections, how many carry a citation.
// Reported for context only — calibration against the graduated guides (korea/denmark) showed
// them at ~43–47%, because much fact-prose is DURABLE narrative (etiquette, "what to eat") that
// legitimately needs no per-section source. Gating on a % here would just train the loop to
// fake-cite durable prose. The real gate is zero check-research `warn` findings.
export function sourceCoverage(guide) {
  const fact = flatten(guide.sections).filter(isContentfulFactSection);
  const sourced = fact.filter(isSourced);
  return { total: fact.length, sourced: sourced.length, pct: fact.length ? sourced.length / fact.length : 1 };
}

export function evaluateReadiness(guide, slug) {
  const { findings } = checkResearchGuide(guide, slug);
  const warns = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity !== "warn");
  const pass = warns.length === 0;
  return { slug, pass, warns, infos, coverage: sourceCoverage(guide) };
}

function report(r) {
  const c = r.coverage;
  const lines = [];
  lines.push(`[readiness] ${r.slug} — ${r.pass ? "PASS ✓" : "NEEDS WORK"}`);
  lines.push(`  schema      · not checked here — run \`npm run build\` (the schema gate)`);
  lines.push(`  research    · ${r.warns.length} blocking (warn), ${r.infos.length} advisory (info)`);
  lines.push(`  citations   · ${c.sourced}/${c.total} fact-prose sections cite a source (context only — durable narrative needs none)`);
  if (r.warns.length) {
    lines.push(`  fix these (blocking) — re-research each against a PRIMARY source, then re-run:`);
    for (const f of r.warns) lines.push(`    ⚠ ${f.msg}`);
  }
  if (r.infos.length) {
    lines.push(`  consider (advisory):`);
    for (const f of r.infos) lines.push(`    · ${f.msg}`);
  }
  if (r.pass) lines.push(`  → PASS: zero blocking findings. Confirm \`npm run build\` is clean too (schema), and keep any deliberate gaps ⚠-flagged.`);
  return lines.join("\n");
}

export async function readiness(slug) {
  const guides = await readGuides();
  const targets = slug ? guides.filter((g) => g.slug === slug) : guides;
  if (slug && !targets.length) return { results: [], error: `no guide with slug "${slug}"` };
  return { results: targets.map(({ guide, slug: s }) => evaluateReadiness(guide, s)), error: null };
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const slug = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
  const { results, error } = await readiness(slug);
  if (error) { console.error(`[readiness] ${error}`); process.exit(1); }
  for (const r of results) console.log(report(r) + "\n");
  const anyFail = results.some((r) => !r.pass);
  // Non-zero exit when NOT ready, so the loop / CI can gate on it.
  process.exit(anyFail ? 1 : 0);
}
