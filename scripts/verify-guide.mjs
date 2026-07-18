// Guide verification ROLL-UP — the single "is this guide shippable?" gate.
//
// The per-guide mechanical checks used to be scattered across `readiness`, `check-staleness`, and
// the audit suite, each run separately. This rolls them into ONE verdict + a rubric-shaped
// scorecard (docs/GUIDE_RUBRIC.md), so a draft graduates against evidence instead of a patchwork
// of hand-run scripts. It is the gate the later pipeline stages (recert, graduate-on-evidence)
// reuse — see docs/PIPELINE.md, VERIFY stage.
//
// What it rolls up:
//   • RESEARCH quality   → guide-readiness (wraps check-research): fabrication, provenance
//                          hygiene, completeness, itinerary integrity                    [P0]
//   • RECENCY            → check-staleness: per-section facts past their shelf life + the
//                          guide-level stamp age (non-draft guides only)                 [P1/#11]
//   • CONTENT (--network)→ the audit suite: dead links, missing Commons photos           [P0/#2]
//
// What it does NOT judge (stated, never silently skipped):
//   • Schema shape → `npm run build` is the content-collection gate. The scorecard says so; run it.
//   • Depth / party fit / authenticity / anchor (rubric #6,#8,#9,#12) → HUMAN judgment. The
//     scorecard lists them as a graduation checklist; the machine cannot pass/fail them.
//
// Verdict (exit 0/1): PASS iff every AUTO gate that BLOCKS is green. Blocking = readiness (P0
// mechanical) and, under --network, dead links / missing photos (concrete breakage). Recency is
// P1/advisory in the verdict — reported, not gated — because a concluded trip's facts are stale by
// nature and hard-failing them would cry wolf (the coverage-metric lesson); the recert workflow,
// not this gate, is what acts on staleness for live guides.
//
// Usage:  npm run verify -- --slug korea             one guide, fast/offline
//         npm run verify                             all guides, fast/offline
//         npm run verify -- --slug korea --network   adds link/photo checks (slow, network)
//         npm run verify -- --slug korea --json      machine JSON (for the PR-comment step)

import { readGuides, isMain } from "./audit/lib.mjs";
import { evaluateReadiness } from "./guide-readiness.mjs";
import { checkStaleness } from "./audit/check-staleness.mjs";

// The rubric rows the machine can only defer to a human. Kept here as the graduation checklist the
// scorecard prints — mirrors docs/GUIDE_RUBRIC.md so the two stay legible together.
const HUMAN_ROWS = [
  ["#6", "Anchor verified against a T0 source (dates + venue), trip built around it — anchor trips"],
  ["#8", "Top-2–3 ranked priorities got real depth; low-ranked ones are light or cut"],
  ["#9", "Party fit — a generic AI could NOT have written this (the bar test); right TRAVELER_PATTERNS party"],
  ["#12", "Authenticity — marquee recs carry crowd/off-peak notes; novel local picks (the dual-pass angle)"],
];

// Roll the three sources up for one guide into a verdict + structured scorecard.
export function evaluateGuide(guide, slug, staleness, net) {
  const draft = !!guide.draft;
  const readiness = evaluateReadiness(guide, slug); // { pass, warns, infos, coverage }

  // Recency (P1, advisory): this guide's slice of the (global) staleness scan.
  const staleSections = staleness.sections.filter((s) => s.slug === slug);
  const guideStale = staleness.stale.find((s) => s.slug === slug) || null;
  const noVerifiedDate = staleness.noDate.includes(slug);
  const recency = draft
    ? { status: "n/a", reason: "draft — unverified by design, not stale" }
    : (staleSections.length || guideStale)
      ? { status: "stale", staleSections, guideStale }
      : { status: "current", staleSections: [], guideStale: null };

  // Content (P0, only when --network ran): this guide's dead links / missing photos.
  let content = { status: "skipped" };
  if (net) {
    const deadLinks = net.links.dead.filter((l) => l.guides.includes(slug));
    const missingPhotos = net.photos.missing.filter((p) => p.guides.includes(slug));
    content = { status: (deadLinks.length || missingPhotos.length) ? "fail" : "pass", deadLinks, missingPhotos };
  }

  // Blocking gates → the exit-code verdict. Recency is intentionally NOT blocking.
  const blockers = [];
  if (!readiness.pass) blockers.push("research");
  if (content.status === "fail") blockers.push("content");
  const pass = blockers.length === 0;

  return { slug, draft, pass, blockers, readiness, recency, content, noVerifiedDate };
}

export async function verify({ slug = null, network = false } = {}) {
  const guides = await readGuides();
  const targets = slug ? guides.filter((g) => g.slug === slug) : guides;
  if (slug && !targets.length) return { results: [], error: `no guide with slug "${slug}"` };

  // Staleness reads every guide once; we filter per-slug from the single scan.
  const staleness = await checkStaleness();

  // Network checks are lazy-imported so the default offline path never pays for them.
  let net = null;
  if (network) {
    const [{ checkLinks }, { checkPhotos }] = await Promise.all([
      import("./audit/check-links.mjs"),
      import("./audit/check-photos.mjs"),
    ]);
    const [links, photos] = await Promise.all([checkLinks(), checkPhotos()]);
    net = { links, photos };
  }

  const results = targets.map(({ guide, slug: s }) => evaluateGuide(guide, s, staleness, net));
  return { results, error: null, network };
}

function report(r) {
  const L = [];
  L.push(`[verify] ${r.slug} — ${r.pass ? "PASS ✓" : "NEEDS WORK"}   (draft: ${r.draft ? "yes" : "no"})`);
  L.push(`  ── Automated gates (this is the machine verdict) ──`);

  // P0 research (readiness)
  const rd = r.readiness;
  L.push(`  P0 research   · ${rd.pass ? "PASS" : "FAIL"} — ${rd.warns.length} blocking, ${rd.infos.length} advisory   (fabrication · provenance · completeness · itinerary)`);
  for (const f of rd.warns) L.push(`      ⚠ ${f.msg}`);

  // P0 content (network)
  if (r.content.status === "skipped") {
    L.push(`  P0 content    · skipped — run with --network to check links + Commons photos`);
  } else {
    const c = r.content;
    L.push(`  P0 content    · ${c.status === "pass" ? "PASS" : "FAIL"} — ${c.deadLinks.length} dead link(s), ${c.missingPhotos.length} missing photo(s)`);
    for (const l of c.deadLinks) L.push(`      ✗ dead link: ${l.url}`);
    for (const p of c.missingPhotos) L.push(`      ✗ missing photo: ${p.file}`);
  }

  // P1 recency (advisory)
  if (r.recency.status === "n/a") {
    L.push(`  P1 recency    · n/a — ${r.recency.reason}`);
  } else if (r.recency.status === "current") {
    L.push(`  P1 recency    · current — no fact past its shelf life`);
  } else {
    const n = r.recency.staleSections.length;
    L.push(`  P1 recency    · ${n} section(s) past shelf life${r.recency.guideStale ? ` + guide stamp ${r.recency.guideStale.ageDays}d old` : ""} (advisory — recert handles this)`);
    for (const s of r.recency.staleSections) L.push(`      ⚠ §${s.index} "${s.title}" — ${s.category} fact ${s.date}, ${s.ageDays}d vs ${s.life}d${s.source ? ` · re-check: ${s.source}` : ""}`);
  }
  if (r.noVerifiedDate) L.push(`  P1 recency    · note — has a \`verified\` field but no parseable "Mon YYYY" date`);

  L.push(`  #1 schema     · not checked here — run \`npm run build\` (the content-collection gate)`);

  // Human checklist
  L.push(`  ── Human judgment (graduation checklist — the machine can't score these) ──`);
  for (const [num, desc] of HUMAN_ROWS) L.push(`  [ ] ${num.padEnd(3)} ${desc}`);

  L.push(r.pass
    ? `  → verdict: PASS (blocking gates green). Graduation still needs the human checklist + \`npm run build\`.`
    : `  → verdict: NEEDS WORK — fix the blocking gate(s): ${r.blockers.join(", ")}. Re-research each against a primary source, then re-run.`);
  return L.join("\n");
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const slug = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
  const network = argv.includes("--network");
  const asJson = argv.includes("--json");
  const { results, error } = await verify({ slug, network });
  if (error) { console.error(`[verify] ${error}`); process.exit(1); }
  if (asJson) {
    console.log(JSON.stringify({ results, network }, null, 2));
  } else {
    for (const r of results) console.log(report(r) + "\n");
  }
  process.exit(results.some((r) => !r.pass) ? 1 : 0);
}
