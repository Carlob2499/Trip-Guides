// Guide verification ROLL-UP — the single "is this guide shippable?" gate.
//
// The per-guide mechanical checks used to be scattered across `readiness`, `check-staleness`, and
// the audit suite, each run separately. This rolls them into ONE verdict + a rubric-shaped
// scorecard (docs/standards/guide-rubric.md), so a draft is judged against evidence instead of a
// patchwork of hand-run scripts. It is the gate the later pipeline stages (recert,
// publish-on-verify) reuse — see docs/reference/pipeline.md, VERIFY stage.
//
// What it rolls up:
//   • RESEARCH quality   → readiness (wraps check-research, folded in from the former
//                          guide-readiness.mjs): fabrication, provenance hygiene,
//                          completeness, itinerary integrity                            [P0]
//   • RECENCY            → check-staleness: per-section facts past their shelf life + the
//                          guide-level stamp age (non-draft guides only)                 [P1/#11]
//   • CONTENT (--network)→ the audit suite: dead links, missing Commons photos           [P0/#2]
//
// What it does NOT judge (stated, never silently skipped):
//   • Schema shape → `npm run build` is the content-collection gate. The scorecard says so; run it.
//   • Depth / party fit / authenticity / anchor (rubric #6,#8,#9,#12) → HUMAN judgment. The
//     scorecard lists them as advisory human review prompts; the machine cannot pass/fail them.
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

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readGuides, flatten, isMain } from "./audit/lib.mjs";
import { checkResearchGuide } from "./audit/check-research.mjs";
import { checkStaleness } from "./audit/check-staleness.mjs";
import { checkFactsHygiene } from "./audit/check-facts-hygiene.mjs";
import { evaluateRiskGates } from "./audit/check-risk-gates.mjs";
import { evaluateUncertainty } from "./audit/check-uncertainty.mjs";
import { checkRoutes } from "./audit/check-routes.mjs";
import { COVERAGE_SCHEMA, coverageDocSchema, parseOrThrow, assertVersionCompatible } from "./pipeline/v2/contracts.mjs";
import { coverageProblems, collectAnchors } from "./pipeline/v2/coverage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Guide readiness — the mechanical research checks + a source-coverage metric, folded in from
// the former scripts/guide-readiness.mjs (2026-08-15). Feeds the P0 research row below.
//
// Prose-like sections carry perishable facts AND support provenance (source_url/verified_on) —
// they're the ones the skill's strict mode gates. The coverage proxy is measured over these.
const FACT_TYPES = new Set(["panel", "prose", "list", "routes", "venues", "divergences"]);
// NOT a sanitizer, and must never be used as one — a single pass over <[^>]+> is trivially
// defeated ("<<b>>" leaves a stray ">"). Its only job is to approximate VISIBLE TEXT LENGTH for
// the coverage metric below. Nothing it returns is ever rendered or written to a page.
const stripHtml = (html) => String(html || "").replace(/<[^>]+>/g, "").trim();

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
  const hasBody = stripHtml(s.body).length >= 3;
  const hasItems = Array.isArray(s.items) && s.items.length > 0;
  const hasSteps = Array.isArray(s.steps) && s.steps.length > 0;
  const hasChecklist = Array.isArray(s.checklist) && s.checklist.length > 0;
  return hasBody || hasItems || hasSteps || hasChecklist;
}

// Citation context (NOT a gate): of the contentful fact sections, how many carry a citation.
// Reported for context only — calibration against the published guides (korea/denmark) showed
// them at ~43–47%, because much fact-prose is DURABLE narrative (etiquette, "what to eat") that
// legitimately needs no per-section source. Gating on a % here would just train the loop to
// fake-cite durable prose. The real gate is zero check-research `warn` findings.
export function sourceCoverage(guide) {
  const fact = flatten(guide.sections).filter(isContentfulFactSection);
  const sourced = fact.filter(isSourced);
  return { total: fact.length, sourced: sourced.length, pct: fact.length ? sourced.length / fact.length : 1 };
}

// Runs the mechanical research checks (check-research) + the source-coverage metric against one
// guide. It does NOT check the JSON schema — that's `npm run build` (the content-collection
// gate). It auto-enforces the P0 MECHANICAL rows of docs/standards/guide-rubric.md (fabrication,
// provenance, completeness, itinerary integrity); the P1 depth/personalization rows are the
// human's §8 judgment — a PASS means "no detectable errors," not "good".
export function evaluateReadiness(guide, slug) {
  const { findings } = checkResearchGuide(guide, slug);
  const warns = findings.filter((f) => f.severity === "warn");
  const infos = findings.filter((f) => f.severity !== "warn");
  const pass = warns.length === 0;
  return { slug, pass, warns, infos, coverage: sourceCoverage(guide) };
}

// P3/R15: coverage gate — every intake ask must map to guide content or a logged skip/amendment.
// Pre-P3 guides without coverage.json pass trivially (the gate only bites guides scaffolded after P3).
//
// V2 (Core Proof blocker 1C): when guides-intake/<slug>/coverage.v2.json exists it is the
// AUTHORITATIVE coverage record — V2 reconcile deliberately does not maintain duplicate V1
// coverage state, so this consumer reads the V2 artifact rather than demanding the legacy path.
// Fail closed: a malformed required V2 artifact, a missing material ask, or an invalid
// ref/anchor is a coverage FAIL, never "no coverage". V1 guides keep the legacy behavior.
export function checkCoverageV2(slug) {
  const p = path.join(ROOT, "guides-intake", slug, "coverage.v2.json");
  if (!existsSync(p)) return null;
  const fail = (problems) => ({ status: "fail", version: 2, problems, uncovered: [] });
  let raw;
  try { raw = JSON.parse(readFileSync(p, "utf8")); }
  catch (err) { return fail([`coverage.v2.json is not valid JSON (${err.message}) — a malformed required artifact blocks, it does not read as "covered"`]); }
  let doc;
  try {
    assertVersionCompatible(raw.schemaVersion, COVERAGE_SCHEMA, { file: p });
    doc = parseOrThrow(coverageDocSchema, raw, { file: p, what: "V2 coverage artifact" });
  } catch (err) { return fail(err.issues?.length ? err.issues : [err.message.split("\n")[0]]); }
  if (doc.slug !== slug) return fail([`coverage.v2.json belongs to "${doc.slug}", not "${slug}"`]);

  // The real relational context, built synchronously (loadCoverageContext's contract).
  const guideDir = path.join(ROOT, "src", "content", "guides", slug);
  const groups = existsSync(guideDir)
    ? readdirSync(guideDir).filter((name) => /^\d\d-[a-z0-9-]+\.json$/.test(name)).sort()
    : [];
  const groupAnchors = new Map();
  for (const name of groups) {
    try { groupAnchors.set(name, collectAnchors(JSON.parse(readFileSync(path.join(guideDir, name), "utf8")))); }
    catch { groupAnchors.set(name, new Set()); }
  }
  let expectedAskIds = null;
  let legacyCoverage = null;
  try {
    legacyCoverage = JSON.parse(readFileSync(path.join(ROOT, "guides-intake", slug, "coverage.json"), "utf8"));
    expectedAskIds = new Set((legacyCoverage.asks || []).map((a) => a.id).filter(Boolean));
  } catch { /* no legacy ask registry — the V2 document still cannot be empty */ }
  let evidenceIds = null;
  let evidenceDoc = null;
  const evidenceFile = path.join(ROOT, "guides-intake", slug, "evidence.v2.json");
  if (existsSync(evidenceFile)) {
    try {
      evidenceDoc = JSON.parse(readFileSync(evidenceFile, "utf8"));
      evidenceIds = new Set((evidenceDoc.evidence || []).map((e) => e.id));
    }
    catch { return fail(["evidence.v2.json is not valid JSON — coverage citations cannot be checked against a malformed evidence artifact"]); }
  }
  const bindingAskIds = new Set();
  for (const ask of legacyCoverage?.asks || []) {
    if (ask.id === "constraints" && String(ask.value || "").trim()) bindingAskIds.add(ask.id);
  }
  const problems = coverageProblems(doc, { groups, groupAnchors, expectedAskIds, evidenceIds, evidenceDoc, bindingAskIds });
  return problems.length ? fail(problems) : { status: "pass", version: 2, problems: [], uncovered: [] };
}

export function checkCoverage(slug) {
  const v2 = checkCoverageV2(slug);
  if (v2) return v2;
  const p = path.join(ROOT, "guides-intake", slug, "coverage.json");
  if (!existsSync(p)) return { status: "n/a", uncovered: [] };
  let cov;
  try { cov = JSON.parse(readFileSync(p, "utf8")); } catch { return { status: "n/a", uncovered: [] }; }
  const uncovered = (cov.asks || []).filter((a) => !a.coveredBy);
  return { status: uncovered.length ? "fail" : "pass", uncovered };
}

// P6: voice gate — hard process leaks and unmistakable formulaic AI-travel phrases must not
// enter traveler-facing prose. This is deliberately narrow: context-sensitive words such as
// "landscape" or "vibrant" remain a Critic judgment, not a brittle lexical ban.
const VOICE_BANNED = [
  /\bthis\s+pass\b/i, /\bthis\s+research\b/i, /\bthis\s+review\b/i,
  /\bour\s+research\b/i, /\bour\s+pass\b/i, /\bduring\s+research\b/i,
  /\bhonest\s+note\b/i, /\bhonest\s+call-?out\b/i,
  /\bworth\s+flagging\b/i, /\bworth\s+noting\s+that\b/i,
  /\bdisproved\s+claim\b/i,
  /\ba\s+generic\s+guide\s+couldn/i, /\ba\s+generic\s+AI\b/i,
  /\bno\s+generic\s+guide\b/i, /\bonly\s+a\s+local\s+would\s+know\b/i,
  /\brich\s+tapestry\b/i,
  /\bnestled\s+in\s+the\s+heart\s+of\b/i,
  /\bserves\s+as\s+a\s+testament\b/i,
  /\bhustle\s+and\s+bustle\b/i,
  /\bit\s+is\s+important\s+to\s+note\b/i,
  /\bin\s+conclusion\b/i,
  /\blet['’]?s\s+delve\b/i,
  /\bgame[-\s]+changer\b/i,
];

const VOICE_TEXT_KEYS = new Set([
  "body", "intro", "why", "crowd_tip", "how", "tldr", "tip", "strategy", "summary", "pace", "moreLabel",
]);

function collectVoiceTexts(node, out = []) {
  if (Array.isArray(node)) {
    for (const value of node) collectVoiceTexts(value, out);
    return out;
  }
  if (!node || typeof node !== "object") return out;
  for (const [key, value] of Object.entries(node)) {
    if (VOICE_TEXT_KEYS.has(key) && typeof value === "string") out.push(value);
    else if (value && typeof value === "object") collectVoiceTexts(value, out);
  }
  return out;
}

export function checkVoice(guide) {
  const hits = [];
  const sections = Array.isArray(guide.sections) ? guide.sections : (guide.sections || []).flat();
  for (const sec of sections) {
    const texts = collectVoiceTexts(sec);
    for (const t of texts) {
      for (const rx of VOICE_BANNED) {
        const m = rx.exec(t);
        if (m) hits.push({ section: sec.title || sec.group || "(untitled)", match: m[0] });
      }
    }
  }
  for (const descriptor of Object.values(guide.descriptors || {})) {
    if (typeof descriptor !== "string") continue;
    for (const rx of VOICE_BANNED) {
      const m = rx.exec(descriptor);
      if (m) hits.push({ section: "descriptor", match: m[0] });
    }
  }
  return { status: hits.length ? "fail" : "pass", hits };
}

// The rubric rows the machine can only defer to a human. Kept as the ADVISORY review prompts the
// scorecard prints — mirrors docs/standards/guide-rubric.md so the two stay legible together.
const HUMAN_ROWS = [
  ["#6", "Anchor verified against a T0 source (dates + venue), trip built around it — anchor trips"],
  ["#8", "Top-2–3 ranked priorities got real depth; low-ranked ones are light or cut"],
  ["#9", "Party fit — a generic AI could NOT have written this (the bar test); right TRAVELER_PATTERNS party"],
  ["#12", "Authenticity + voice — crowd/off-peak reality and local alternatives; traveler copy is concrete, candid, selective and not promotional/model/process narration"],
];

// Roll the three sources up for one guide into a verdict + structured scorecard.
export function evaluateGuide(guide, slug, staleness, net, facts = null, unused = [], candidates = null, sources = null, destinationConfig = null, uncertaintyInputs = null, drift = null, liveRoutes = null) {
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

  // S2/S3: the candidates table (structural checks; breadth is adaptive since V2). Async, so verify() computes
  // it and passes the result in — the same shape as the staleness scan.
  const candidatesRow = candidates ?? { status: "n/a", reason: "not computed" };

  // P3/R15: coverage — every intake ask addressed or explicitly skipped.
  const coverage = checkCoverage(slug);

  // P6: voice gate — hard process/formulaic voice patterns must not leak into traveler-facing prose.
  const voice = checkVoice(guide);

  // B3 (docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST): facts.json hygiene — misattribution candidates, malformed
  // values, bare section-path echoes. The FULL report stays advisory and is printed in whole;
  // E1's `riskGates` row below is what promotes the two acting-on-a-wrong-fact classes
  // (misattribution, malformed values) to a blocker on drafts.
  const hygiene = checkFactsHygiene(facts);

  // E1: risk-weighted gates. Warn-first by creator ruling — findings BLOCK on drafts (the
  // chokepoint the publish gate reads: a draft cannot go live over a failing verdict) and ADVISE
  // on published guides, which carry pre-existing debt that failing retroactively would obstruct.
  const riskGates = evaluateRiskGates({ guide, facts, unused, hygiene, destinationConfig, enforce: draft });

  // E3: does the guide SHIP the contradictions and uncertainties C2 gates at intake? Same
  // warn-first split as riskGates. Artifacts (intake doc, state file, C2 findings) are read
  // by verify() and passed in, like the candidates and staleness rows.
  // Case 11: transit-leg durations with no routing authority behind them. Advisory ALWAYS —
  // Routes is config-gated and default OFF (creator ruling), so this measures the gap and
  // never fails a run. Its free layers (prose count + physical floor over `days[].waypoints`)
  // run here; the live Routes matrix is network I/O, so verify() computes it and threads it
  // in as `liveRoutes` — the same split E2's drift check uses.
  const routes = checkRoutes(Array.isArray(guide.sections) ? guide.sections : (guide.sections || []).flat(), { live: liveRoutes });

  // E2: drift is computed by verify() (network I/O) and threaded in, like the staleness scan.
  const driftRow = drift ?? { status: "skipped" };

  const uncertainty = evaluateUncertainty({
    sections: Array.isArray(guide.sections) ? guide.sections : (guide.sections || []).flat(),
    facts,
    ...(uncertaintyInputs || {}),
    archived: !!guide.archived,
    enforce: draft,
  });

  // Blocking gates → the exit-code verdict. Recency is intentionally NOT blocking.
  const blockers = [];
  if (!readiness.pass) blockers.push("research");
  if (content.status === "fail") blockers.push("content");
  if (content.status === "unverifiable") blockers.push("content-unverifiable");
  if (venueStatus.status === "fail") blockers.push("venues");
  if (candidatesRow.status === "fail") blockers.push("candidates");
  if (sources?.status === "fail") blockers.push("sources");
  if (coverage.status === "fail") blockers.push("coverage");
  if (voice.status === "fail") blockers.push("voice");
  if (riskGates.status === "fail") blockers.push("risk-gates");
  if (uncertainty.status === "fail") blockers.push("uncertainty");
  const pass = blockers.length === 0;

  // Registry visibility (informational, never a gate): a guide with no facts.json is normal,
  // and a guide with one should show at a glance how much of it is sourced data rather than prose.
  const registry = facts ? { count: Object.keys(facts).length, unused } : null;

  return { slug, draft, pass, blockers, readiness, recency, content, venueStatus, candidates: candidatesRow, sources, coverage, voice, hygiene, riskGates, uncertainty, routes, drift: driftRow, noVerifiedDate, registry };
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

  // S2/S3: candidates tables are read per-target (async), then threaded into the sync evaluator.
  // NO numeric floors, anywhere (DECISIONS.md "Research breadth"; the env-gated V1 remnant was
  // removed by the 2026-08-20 correction pass) — the structural anti-fabrication checks remain.
  const { checkCandidates } = await import("./check-candidates.mjs");
  const candidatesBySlug = {};
  for (const t of targets) {
    candidatesBySlug[t.slug] = await checkCandidates(t.slug);
  }

  // S5: source-mix measurement — pure text analysis over the same raw the link sweep scans.
  const { sourceMix } = await import("./audit/check-source-mix.mjs");

  // E1: the destination config (D1) is what makes the advisory-surfacing check possible
  // without a per-guide exemption list. Read per-target; a slug without one simply disables
  // the checks that need it.
  const { readDestinationConfig } = await import("./audit/check-risk-gates.mjs");
  const destBySlug = {};
  for (const t of targets) destBySlug[t.slug] = await readDestinationConfig(t.slug);

  // E3: the intake doc, the pipeline state file, and C2's contradiction findings. Read here
  // (async) and threaded into the sync evaluator, like candidates and staleness.
  // E2: source drift — only under --network, since it reads every cited page. Advisory for
  // one release by instruction; the row names the R3+ rows that will block once enforced.
  const driftBySlug = {};
  if (network) {
    const { checkDrift, liveFetchPage } = await import("./audit/check-content-drift.mjs");
    const fetchPage = liveFetchPage();
    for (const t of targets) driftBySlug[t.slug] = await checkDrift(t.facts, { fetchPage });
  }

  // Case 11, live layer: ask Routes what each scheduled day leg actually takes. Network AND
  // key-gated — `liveRouteMatrix` returns null with no key, so an unconfigured repo does zero
  // work here and `checkRoutes` reports the free layers alone. Travel mode comes from the
  // destination config (a Korea day rides the KTX; a Sedona day drives), defaulting to TRANSIT.
  const liveRoutesBySlug = {};
  if (network) {
    const { extractDayLegs, verifyDayLegs, liveRouteMatrix } = await import("./audit/check-routes.mjs");
    const fetchMatrix = liveRouteMatrix();
    if (fetchMatrix) {
      for (const t of targets) {
        const sections = Array.isArray(t.guide.sections) ? t.guide.sections : (t.guide.sections || []).flat();
        liveRoutesBySlug[t.slug] = await verifyDayLegs(extractDayLegs(sections), {
          fetchMatrix,
          travelMode: destBySlug[t.slug]?.defaultTravelMode ?? "TRANSIT",
        });
      }
    }
  }

  const { readState, readIntake, readLedger } = await import("./audit/check-uncertainty.mjs");
  const { checkIntakeContradictions } = await import("./audit/check-intake-contradictions.mjs");
  const uncertaintyBySlug = {};
  for (const t of targets) {
    // Two documents, two jobs: contradictions are detected in the traveler's own intent
    // (intake.md), while the reconciliation rows and question blocks they resolve into are
    // research state (ledger.md).
    const intakeMd = await readIntake(t.slug);
    uncertaintyBySlug[t.slug] = {
      ledgerMd: await readLedger(t.slug),
      state: await readState(t.slug),
      contradictions: intakeMd ? (checkIntakeContradictions(intakeMd).findings ?? []) : [],
    };
  }

  const results = targets.map(({ guide, slug: s, raw, facts, unusedFacts }) =>
    evaluateGuide(guide, s, staleness, net, facts, unusedFacts, candidatesBySlug[s], sourceMix(raw, guide.country), destBySlug[s], uncertaintyBySlug[s], driftBySlug[s] ?? null, liveRoutesBySlug[s] ?? null));
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

  // S2/S3: candidates table (structural, floor-free since V2). Optional-chained for pre-standard result objects.
  if (r.candidates?.status === "n/a") {
    L.push(`  P1 candidates · n/a — ${r.candidates.reason}`);
  } else if (r.candidates && r.candidates.status !== "skipped") {
    const c = r.candidates;
    if (c.status === "pass") {
      const parts = (c.summary ?? []).map((s) => `P${s.rank} ${s.shipped}/${s.considered}`).join(" · ");
      L.push(`  P1 candidates · PASS — consideration set on record (${parts || "no gated priorities"})`);
    } else {
      L.push(`  P1 candidates · FAIL — structural integrity findings in the consideration set`);
      for (const f of c.findings ?? []) L.push(`      ✗ ${f}`);
    }
  }

  // S5: source mix. Advisory report every run; blocks only past the monoculture ceiling.
  if (r.sources) {
    const s = r.sources;
    const cc = s.ccTld ? (s.hasDestinationTld ? `${s.ccTld} sources present` : `⚠ no ${s.ccTld} source cited — was a native-language T0 consulted?`) : "ccTLD n/a";
    const head = s.status === "fail" ? "FAIL (monoculture)" : "report";
    L.push(`  P1 sources    · ${head} — ${s.domains} domains / ${s.citations} citations · top ${s.top?.domain ?? "—"} ${(100 * (s.top?.share ?? 0)).toFixed(0)}% · ${cc}`);
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
    L.push(`  P0 coverage   · PASS — every intake ask addressed${r.coverage.version === 2 ? " (V2 coverage artifact)" : ""}`);
  } else if (r.coverage.version === 2) {
    L.push(`  P0 coverage   · FAIL — V2 coverage artifact does not hold up (${r.coverage.problems.length} problem(s)):`);
    for (const p of r.coverage.problems) L.push(`      ⚠ ${p}`);
  } else {
    L.push(`  P0 coverage   · FAIL — ${r.coverage.uncovered.length} intake ask(s) not addressed:`);
    for (const a of r.coverage.uncovered) L.push(`      ⚠ ${a.id}: "${a.label}" = "${a.value}" — set coveredBy in coverage.json or log a skip`);
  }

  // P6: voice gate
  if (r.voice) {
    if (r.voice.status === "pass") {
      L.push(`  P6 voice      · PASS — no hard process/formulaic voice patterns in traveler-facing prose`);
    } else {
      L.push(`  P6 voice      · FAIL — ${r.voice.hits.length} hard voice-pattern leak(s):`);
      for (const h of r.voice.hits) L.push(`      ⚠ "${h.match}" in §"${h.section}"`);
    }
  }

  // E1: risk-weighted gates. The status already encodes the warn-first split (drafts fail,
  // published guides advise), so the row prints WHICH it was and why — a reader must never
  // have to guess whether an advisory line would have blocked publication.
  if (r.riskGates) {
    if (r.riskGates.status === "pass") {
      L.push(`  P0 risk-gates · PASS — advisory surfaced, no misattributed or malformed facts`);
    } else {
      const enforced = r.riskGates.status === "fail";
      L.push(
        `  P0 risk-gates · ${enforced ? "FAIL" : "advisory"} — ${r.riskGates.findings.length} finding(s)` +
        `${enforced ? " (draft: these BLOCK publishing)" : " (published: advisory this release, blocks once enforced)"}:`,
      );
      for (const f of r.riskGates.findings) L.push(`      ⚠ [${f.code}] ${f.msg}`);
    }
  }

  // E3: contradiction + uncertainty. Same warn-first split, stated the same way — a reader
  // must never have to guess whether an advisory line would have blocked publication.
  if (r.uncertainty) {
    if (r.uncertainty.status === "pass") {
      L.push(`  P0 uncertainty· PASS — no unregistered forecasts, burst stages, or unresolved contradictions`);
    } else {
      const enforced = r.uncertainty.status === "fail";
      L.push(
        `  P0 uncertainty· ${enforced ? "FAIL" : "advisory"} — ${r.uncertainty.findings.length} finding(s)` +
        `${enforced ? " (draft: these BLOCK publishing)" : " (published: advisory this release, blocks once enforced)"}:`,
      );
      for (const f of r.uncertainty.findings) L.push(`      ⚠ [${f.code}] ${f.msg}`);
    }
  }

  // Case 11: leg durations. Advisory by design — printed, never gating. The line states all
  // three layers, so "0 findings" can never be mistaken for "everything was checked": prose
  // legs counted, scheduled day legs measured, and how many of those a live Routes call reached.
  if (r.routes && r.routes.status !== "n/a") {
    const bits = [`${r.routes.unverified}/${r.routes.legs} prose leg(s) unattested`];
    if (r.routes.dayLegs) bits.push(`${r.routes.judgeable}/${r.routes.dayLegs} scheduled leg(s) measurable`);
    bits.push(
      r.routes.live
        ? `live: ${r.routes.live.verified} leg(s) via ${r.routes.live.queried} matrix call(s)`
        : r.routes.configured
          ? "live: key set, not run (needs --network)"
          : "live: OFF (no GOOGLE_ROUTES_KEY)",
    );
    L.push(`  P1 routes     · ${r.routes.status} — ${bits.join(" · ")}`);
    for (const f of r.routes.findings) L.push(`      ⚠ [${f.code}] ${f.msg}`);
  }

  // E2: source drift (network only). Advisory for one release by instruction — but the row
  // states which findings WILL block once enforced, so the future cost is visible now.
  if (r.drift && r.drift.status === "skipped") {
    L.push(`  P1 drift      · skipped — run with --network to re-read every cited page`);
  } else if (r.drift && r.drift.status !== "n/a") {
    const d = r.drift;
    if (d.status === "pass") {
      L.push(`  P1 drift      · PASS — ${d.checked} source page(s) still carry their stated values`);
    } else {
      L.push(`  P1 drift      · advisory — ${d.findings.length} finding(s) across ${d.checked} page(s)${d.blockers?.length ? `; ${d.blockers.length} will BLOCK once enforced (R3+)` : ""}:`);
      for (const f of d.findings) L.push(`      ⚠ [${f.code}] ${f.msg}`);
    }
  }

  // B3: facts.json hygiene (advisory only — see the field's own comment in evaluateGuide).
  if (r.hygiene && r.hygiene.status !== "n/a") {
    const h = r.hygiene;
    const n = h.misattribution.length + h.malformed.length + h.bareEcho.length;
    if (h.status === "clean") {
      L.push(`  -- hygiene    · clean — no misattribution/malformed-value/bare-echo findings`);
    } else {
      L.push(`  -- hygiene    · ${n} advisory finding(s) in facts.json (not blocking — see scripts/audit/check-facts-hygiene.mjs)`);
      for (const m of h.misattribution) L.push(`      ⚠ misattribution: ${m.ids.join(" <-> ")} both claim ${JSON.stringify(m.value)} from different sources`);
      for (const m of h.malformed) L.push(`      ⚠ malformed value: ${m.id} — ${JSON.stringify(m.value)}`);
      for (const b of h.bareEcho) L.push(`      ⚠ bare echo: "${b.stem}" covers ${b.values.length} different values — which is which?`);
    }
  }

  L.push(`  #1 schema     · not checked here — run \`npm run build\` (the content-collection gate)`);

  // Human review prompts — ADVISORY. The evidence gate (build + networked verify) is the
  // publication bar (publish.mjs: the separate human approval ceremony was removed); these rows
  // exist for the human READING a landed guide or a draft PR, and block nothing (correction
  // pass: the old footer claimed publishing "still needs the human checklist", which no
  // automation enforced — an unenforced requirement in prose is a lie in either direction).
  L.push(`  ── Human review prompts (advisory — the evidence gate is the publication bar) ──`);
  for (const [num, desc] of HUMAN_ROWS) L.push(`  ·  ${num.padEnd(3)} ${desc}`);

  L.push(r.pass
    ? `  → verdict: PASS — the blocking gates are green; a run that also passes \`npm run build\` publishes through the landing gate. The prompts above are for the human reviewing it, not conditions.`
    : `  → verdict: NEEDS WORK — fix the blocking gate(s): ${r.blockers.join(", ")}. Re-research each against a primary source, then re-run.`);
  return L.join("\n");
}

// GitHub-flavored-markdown scorecard for a single guide — the artifact `pipeline.mjs land` writes
// as the research/recert PR body, so a guide is judged against visible evidence (pipeline P4). The
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
  let hygieneCell = "— n/a (no facts.json)";
  if (r.hygiene && r.hygiene.status === "clean") hygieneCell = "✅ clean";
  else if (r.hygiene && r.hygiene.status === "advisory") {
    const n = r.hygiene.misattribution.length + r.hygiene.malformed.length + r.hygiene.bareEcho.length;
    hygieneCell = `⚠ ${n} advisory finding(s) (not blocking)`;
  }
  L.push(`| Facts hygiene — misattribution · malformed values · bare echoes | -- | ${hygieneCell} |`);
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
  if (r.coverage.status === "fail" && r.coverage.version === 2) {
    L.push(`<details><summary>⚠ V2 coverage artifact failed (${r.coverage.problems.length} problem(s))</summary>`, "");
    for (const p of r.coverage.problems) L.push(`- ${p}`);
    L.push("", `</details>`, "");
  } else if (r.coverage.status === "fail") {
    L.push(`<details><summary>⚠ ${r.coverage.uncovered.length} uncovered intake ask(s)</summary>`, "");
    for (const a of r.coverage.uncovered) L.push(`- **${a.label}**: "${a.value}" — set \`coveredBy\` in \`coverage.json\` or log a skip/amendment`);
    L.push("", `</details>`, "");
  }
  if (r.hygiene && r.hygiene.status === "advisory") {
    const h = r.hygiene;
    const n = h.misattribution.length + h.malformed.length + h.bareEcho.length;
    L.push(`<details><summary>⚠ ${n} facts.json hygiene finding(s) — advisory, not blocking</summary>`, "");
    for (const m of h.misattribution) L.push(`- misattribution: \`${m.ids.join("`, `")}\` both claim ${JSON.stringify(m.value)} from different sources (${m.sources.join(" vs ")})`);
    for (const m of h.malformed) L.push(`- malformed value: \`${m.id}\` — ${JSON.stringify(m.value)}`);
    for (const b of h.bareEcho) L.push(`- bare echo: "${b.stem}" covers ${b.values.length} different values (\`${b.ids.join("`, `")}\`) — which is which?`);
    L.push("", `</details>`, "");
  }
  L.push(`### Human review prompts — advisory (the machine can't score these; they block nothing)`);
  for (const [num, desc] of HUMAN_ROWS) L.push(`- **${num}** ${desc}`);
  L.push("");
  L.push(`> Verdict PASS = blocking gates green — the evidence gate (\`npm run build\` + networked verify, run by the landing step) is the publication bar. These prompts are for whoever reviews the landed guide; they are not unpublished requirements.`);
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
