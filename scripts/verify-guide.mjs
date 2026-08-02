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

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readGuides, isMain } from "./audit/lib.mjs";
import { evaluateReadiness } from "./guide-readiness.mjs";
import { checkStaleness } from "./audit/check-staleness.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// P3/R15: coverage gate — every intake ask must map to guide content or a logged skip/amendment.
// Pre-P3 guides without coverage.json pass trivially (the gate only bites guides scaffolded after P3).
export function checkCoverage(slug) {
  const p = path.join(ROOT, "guides-intake", `${slug}.coverage.json`);
  if (!existsSync(p)) return { status: "n/a", uncovered: [] };
  let cov;
  try { cov = JSON.parse(readFileSync(p, "utf8")); } catch { return { status: "n/a", uncovered: [] }; }
  const uncovered = (cov.asks || []).filter((a) => !a.coveredBy);
  return { status: uncovered.length ? "fail" : "pass", uncovered };
}

// P6: voice gate — process language / self-referential framing must not leak into
// traveler-facing prose. Scans body, why, crowd_tip, intro fields.
const VOICE_BANNED = [
  /\bthis\s+pass\b/i, /\bthis\s+research\b/i, /\bthis\s+review\b/i,
  /\bour\s+research\b/i, /\bour\s+pass\b/i, /\bduring\s+research\b/i,
  /\bhonest\s+note\b/i, /\bhonest\s+call-?out\b/i,
  /\bworth\s+flagging\b/i, /\bworth\s+noting\s+that\b/i,
  /\bdisproved\s+claim\b/i,
  /\ba\s+generic\s+guide\s+couldn/i, /\ba\s+generic\s+AI\b/i,
  /\bno\s+generic\s+guide\b/i, /\bonly\s+a\s+local\s+would\s+know\b/i,
];

export function checkVoice(guide) {
  const hits = [];
  const sections = Array.isArray(guide.sections) ? guide.sections : (guide.sections || []).flat();
  for (const sec of sections) {
    const texts = [sec.body, sec.intro, sec.why, sec.crowd_tip].filter(Boolean);
    if (Array.isArray(sec.items)) {
      for (const it of sec.items) {
        if (it.why) texts.push(it.why);
        if (it.crowd_tip) texts.push(it.crowd_tip);
      }
    }
    for (const t of texts) {
      for (const rx of VOICE_BANNED) {
        const m = rx.exec(t);
        if (m) hits.push({ section: sec.title || sec.group || "(untitled)", match: m[0] });
      }
    }
  }
  return { status: hits.length ? "fail" : "pass", hits };
}

// The rubric rows the machine can only defer to a human. Kept here as the graduation checklist the
// scorecard prints — mirrors docs/GUIDE_RUBRIC.md so the two stay legible together.
const HUMAN_ROWS = [
  ["#6", "Anchor verified against a T0 source (dates + venue), trip built around it — anchor trips"],
  ["#8", "Top-2–3 ranked priorities got real depth; low-ranked ones are light or cut"],
  ["#9", "Party fit — a generic AI could NOT have written this (the bar test); right TRAVELER_PATTERNS party"],
  ["#12", "Authenticity — marquee recs carry crowd/off-peak notes; novel local picks (the dual-pass angle)"],
];

// Roll the three sources up for one guide into a verdict + structured scorecard.
export function evaluateGuide(guide, slug, staleness, net, facts = null, unused = []) {
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
  // A checker that couldn't run at all (Commons API down, or every link probe failed —
  // a network outage on this run) is NOT the same as "checked, found nothing wrong" —
  // report it as unverifiable so a fail-open outage never reads as a clean pass.
  let content = { status: "skipped" };
  if (net) {
    const linksChecked = net.links.checked ?? 0;
    const linksErrored = net.links.error?.length ?? 0;
    if (net.photos.apiError) {
      content = { status: "unverifiable", reason: `Commons API: ${net.photos.apiError}`, deadLinks: [], missingPhotos: [] };
    } else if (linksChecked > 0 && linksErrored === linksChecked) {
      content = { status: "unverifiable", reason: "all link probes failed — network outage", deadLinks: [], missingPhotos: [] };
    } else {
      const deadLinks = net.links.dead.filter((l) => l.guides.includes(slug));
      const missingPhotos = net.photos.missing.filter((p) => p.guides.includes(slug));
      content = { status: (deadLinks.length || missingPhotos.length) ? "fail" : "pass", deadLinks, missingPhotos };
    }
  }

  // S1: venue operating status (network only). CLOSED_PERMANENTLY blocks — a recommended
  // venue that no longer exists is concrete breakage, same class as a dead link.
  const venueStatus = net?.venuesBySlug?.[slug] ?? { status: "skipped" };

  // P3/R15: coverage — every intake ask addressed or explicitly skipped.
  const coverage = checkCoverage(slug);

  // P6: voice gate — process language must not leak into traveler-facing prose.
  const voice = checkVoice(guide);

  // Blocking gates → the exit-code verdict. Recency is intentionally NOT blocking.
  const blockers = [];
  if (!readiness.pass) blockers.push("research");
  if (content.status === "fail") blockers.push("content");
  if (content.status === "unverifiable") blockers.push("content-unverifiable");
  if (venueStatus.status === "fail") blockers.push("venues");
  if (coverage.status === "fail") blockers.push("coverage");
  if (voice.status === "fail") blockers.push("voice");
  const pass = blockers.length === 0;

  // Registry visibility (informational, never a gate): a guide with no facts.json is normal,
  // and a guide with one should show at a glance how much of it is sourced data rather than prose.
  const registry = facts ? { count: Object.keys(facts).length, unused } : null;

  return { slug, draft, pass, blockers, readiness, recency, content, venueStatus, coverage, voice, noVerifiedDate, registry };
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
    // S1 (2026-08-02): structural venue verification. Per-guide (unlike links/photos, which
    // scan globally) because each call costs Places quota — only the target slugs pay.
    const { checkVenueStatus } = await import("./audit/check-venue-status.mjs");
    net.venuesBySlug = {};
    for (const t of targets) net.venuesBySlug[t.slug] = await checkVenueStatus(t.guide);
  }

  const results = targets.map(({ guide, slug: s, facts, unusedFacts }) => evaluateGuide(guide, s, staleness, net, facts, unusedFacts));
  return { results, error: null, network };
}

// Plain-text CLI renderer — the default `npm run verify` output. Exported (alongside
// renderMarkdown) so its branches are unit-testable without shelling out.
export function report(r) {
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
  } else if (r.content.status === "unverifiable") {
    L.push(`  P0 content    · UNVERIFIABLE — ${r.content.reason} — could not check, do NOT publish on this run`);
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

  // S1: venue operating status (network only). Optional-chained: a result object built
  // before this field existed (older JSON, hand-built test fixtures) must render, not throw.
  if (r.venueStatus?.status === "n/a") {
    L.push(`  P0 venues     · n/a — ${r.venueStatus.reason}`);
  } else if (r.venueStatus && r.venueStatus.status !== "skipped") {
    const v = r.venueStatus;
    L.push(`  P0 venues     · ${v.status === "pass" ? "PASS" : "FAIL"} — ${v.checked} status-checked, ${v.closed.length} closed, ${v.flagged.length} flagged`);
    for (const c of v.closed) L.push(`      ✗ ${c.name} (${c.section}) — ${c.why}`);
    for (const f of v.flagged) L.push(`      ⚠ ${f.name} (${f.section}) — ${f.why}`);
  }

  // Perishable-fact registry (informational — not a gate)
  if (r.registry) {
    L.push(`  -- registry   · ${r.registry.count} perishable fact(s) in facts.json — sourced, dated, edited in one place`);
    // Advisory, never blocking: a row can legitimately be registered ahead of the prose that
    // will cite it. But an unreferenced row keeps its date, keeps reading as "verified", and
    // keeps costing a recert check for a number no traveler can see — so say so out loud.
    const unused = r.registry.unused ?? [];
    if (unused.length) {
      L.push(`  -- registry   · ${unused.length} row(s) referenced by nothing: ${unused.join(", ")} — cite them or drop them`);
    }
  }

  // P3/R15: coverage
  if (r.coverage.status === "n/a") {
    L.push(`  P0 coverage   · n/a — pre-P3 guide (no coverage.json)`);
  } else if (r.coverage.status === "pass") {
    L.push(`  P0 coverage   · PASS — every intake ask addressed`);
  } else {
    L.push(`  P0 coverage   · FAIL — ${r.coverage.uncovered.length} intake ask(s) not addressed:`);
    for (const a of r.coverage.uncovered) L.push(`      ⚠ ${a.id}: "${a.label}" = "${a.value}" — set coveredBy in coverage.json or log a skip`);
  }

  // P6: voice gate
  if (r.voice) {
    if (r.voice.status === "pass") {
      L.push(`  P6 voice      · PASS — no process language in traveler-facing prose`);
    } else {
      L.push(`  P6 voice      · FAIL — ${r.voice.hits.length} process-language leak(s):`);
      for (const h of r.voice.hits) L.push(`      ⚠ "${h.match}" in §"${h.section}"`);
    }
  }

  L.push(`  #1 schema     · not checked here — run \`npm run build\` (the content-collection gate)`);

  // Human checklist
  L.push(`  ── Human judgment (graduation checklist — the machine can't score these) ──`);
  for (const [num, desc] of HUMAN_ROWS) L.push(`  [ ] ${num.padEnd(3)} ${desc}`);

  L.push(r.pass
    ? `  → verdict: PASS (blocking gates green). Graduation still needs the human checklist + \`npm run build\`.`
    : `  → verdict: NEEDS WORK — fix the blocking gate(s): ${r.blockers.join(", ")}. Re-research each against a primary source, then re-run.`);
  return L.join("\n");
}

// GitHub-flavored-markdown scorecard for a single guide — the artifact posted on the research/recert
// PR and on the graduation issue, so a guide is judged against visible evidence (pipeline P4). The
// leading HTML-comment marker lets a poster find-or-update it in place instead of duplicating.
export function renderMarkdown(r) {
  const L = [];
  const rd = r.readiness;
  L.push(`<!-- waypoint-scorecard:${r.slug} -->`);
  L.push(`## Verify scorecard — \`${r.slug}\``);
  L.push("");
  L.push(`**Verdict: ${r.pass ? "✅ PASS" : "❌ NEEDS WORK"}** · draft: ${r.draft ? "yes" : "no"} · _generated by \`npm run verify\`_`);
  L.push("");
  L.push(`### Automated gates (machine verdict)`);
  L.push(`| Gate | Tier | Result |`);
  L.push(`| --- | --- | --- |`);
  L.push(`| Research — fabrication · provenance · completeness · itinerary | P0 | ${rd.pass ? "✅ PASS" : "❌ FAIL"} — ${rd.warns.length} blocking, ${rd.infos.length} advisory |`);
  let content;
  if (r.content.status === "skipped") content = "⏭ skipped — run `--network`";
  else if (r.content.status === "unverifiable") content = `⚠ UNVERIFIABLE — ${r.content.reason} — could not check, do NOT publish on this run`;
  else content = `${r.content.status === "pass" ? "✅ PASS" : "❌ FAIL"} — ${r.content.deadLinks.length} dead link(s), ${r.content.missingPhotos.length} missing photo(s)`;
  L.push(`| Content — links · Commons photos | P0 | ${content} |`);
  let recency;
  if (r.recency.status === "n/a") recency = "— n/a (draft)";
  else if (r.recency.status === "current") recency = "✅ current";
  else recency = `⚠ ${r.recency.staleSections.length} past shelf life (advisory)`;
  L.push(`| Recency — facts within shelf life | P1 | ${recency} |`);
  let coverageCell;
  if (r.coverage.status === "n/a") coverageCell = "— n/a (pre-P3)";
  else if (r.coverage.status === "pass") coverageCell = "✅ PASS — every ask addressed";
  else coverageCell = `❌ FAIL — ${r.coverage.uncovered.length} ask(s) uncovered`;
  L.push(`| Coverage — intake asks addressed | P0 | ${coverageCell} |`);
  L.push(`| Schema | P0 | ▶ \`npm run build\` |`);
  L.push("");
  if (rd.warns.length) {
    L.push(`<details><summary>⚠ ${rd.warns.length} blocking finding(s) — fix each against a primary source</summary>`, "");
    for (const f of rd.warns) L.push(`- ${f.msg}`);
    L.push("", `</details>`, "");
  }
  if (r.content.status !== "skipped" && (r.content.deadLinks.length || r.content.missingPhotos.length)) {
    L.push(`<details><summary>Broken content</summary>`, "");
    for (const l of r.content.deadLinks) L.push(`- dead link: ${l.url}`);
    for (const p of r.content.missingPhotos) L.push(`- missing photo: ${p.file}`);
    L.push("", `</details>`, "");
  }
  if (r.coverage.status === "fail") {
    L.push(`<details><summary>⚠ ${r.coverage.uncovered.length} uncovered intake ask(s)</summary>`, "");
    for (const a of r.coverage.uncovered) L.push(`- **${a.label}**: "${a.value}" — set \`coveredBy\` in \`coverage.json\` or log a skip/amendment`);
    L.push("", `</details>`, "");
  }
  L.push(`### Human judgment — graduation checklist (the machine can't score these)`);
  for (const [num, desc] of HUMAN_ROWS) L.push(`- [ ] **${num}** ${desc}`);
  L.push("");
  L.push(`> Verdict PASS = blocking gates green. Graduation still needs the checklist above + \`npm run build\` (schema).`);
  return L.join("\n");
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const slug = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
  const network = argv.includes("--network");
  const asJson = argv.includes("--json");
  const asMarkdown = argv.includes("--markdown");
  const { results, error } = await verify({ slug, network });
  if (error) { console.error(`[verify] ${error}`); process.exit(1); }
  if (asJson) {
    console.log(JSON.stringify({ results, network }, null, 2));
  } else if (asMarkdown) {
    console.log(results.map(renderMarkdown).join("\n\n---\n\n"));
  } else {
    for (const r of results) console.log(report(r) + "\n");
  }
  // Exit code still reflects pass/fail in every mode, so a gate can `npm run verify … --markdown`
  // and branch on the status while capturing the scorecard.
  process.exit(results.some((r) => !r.pass) ? 1 : 0);
}
