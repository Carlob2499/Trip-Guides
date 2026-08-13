// E1 (docs/PLAN_EVIDENCE_FIRST.md) — risk-weighted verification gates.
//
// WHY THIS IS NOT KEYED ON `risk` ALONE (creator ruling 2026-08-13, "decouple detection").
// E1 was specified as "R2+ must be a fact row, R3/R4 need tier+evidence, R4 must be
// surfaced" — all keyed on the `risk` field B1 added. But an audit of the whole corpus
// found ZERO rows carrying `risk` (korea 83, denmark 27, us 10, japan 25, fixture 25), and
// the regression fixture is frozen evidence that can never be re-annotated. A gate keyed
// only on `risk` would therefore fire on nothing at all, today and until every guide is
// regenerated. So each defect class gets a RISK-INDEPENDENT detector that works on the
// corpus as it actually is, and `risk` — where a research pass has supplied it — only
// ESCALATES. The gate is useful now and gets sharper as guides regenerate under D2.
//
// WARN-FIRST POSTURE (creator ruling, matching the plan's own Phase E header). Findings
// BLOCK on drafts and advise on published guides. That split is deliberate, not timidity:
// a draft's verify is what `graduate-guide.yml` gates on, so blocking there stops a
// defective guide from ever being published, while the three already-published guides
// carry pre-existing debt that turning red retroactively would only obstruct. Publication
// is the chokepoint — which is how E1 delivers the safety that struck packet G was for.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ROOT } from "./lib.mjs";

const DESTINATIONS_DIR = path.join(ROOT, "src", "data", "destinations");

/** Read a destination config, or null when the slug has none (denmark today). A missing
    config disables only the checks that need it — never a finding in itself, since "we
    haven't written the config yet" says nothing about the guide. */
export async function readDestinationConfig(slug, { destinationsDir = DESTINATIONS_DIR } = {}) {
  try {
    return JSON.parse(await readFile(path.join(destinationsDir, `${slug}.json`), "utf8"));
  } catch {
    return null;
  }
}

/** Regression case 6 — an R4 safety claim that exists only as prose.
 *
 * Japan's guide handles its travel advisory HONESTLY ("could not be independently confirmed
 * — its page is bot-gated") but as free prose in a health-and-safety body. That honesty is
 * the Honest pillar working; the defect is that the claim's unresolved state is invisible to
 * every gate, un-re-attemptable by recert, and unrenderable as the advisory pill.
 *
 * The risk-independent signal: the DESTINATION CONFIG (D1) declares whether this destination
 * has a travel advisory worth carrying. If it does and the guide has no typed `advisory`
 * object, the guide is either missing it or has buried it in prose. A destination with no
 * `travelAdvisory` in its config — the `us.json` case, a domestic trip — never trips this,
 * which is why the rule needs no per-guide exemption list.
 */
export function checkAdvisorySurfaced(guide, destinationConfig) {
  if (!destinationConfig?.travelAdvisory) return null;
  if (guide?.advisory) return null;
  return {
    code: "advisory-not-surfaced",
    msg:
      `destination config declares a travel advisory (${destinationConfig.travelAdvisory.url}) ` +
      `but the guide carries no typed \`advisory\` object — an R4 safety claim in prose is ` +
      `invisible to recert and never renders the advisory pill`,
  };
}

/** E1(c), the `risk`-keyed escalation of the same idea: once a research pass DOES label rows,
    an R4 row that no rendered group references is a fact researched and then dropped. B4's
    usage index already computes exactly this set, so `unused` arrives ready-made. */
export function checkR4Surfaced(facts, unused = []) {
  const findings = [];
  const unusedSet = new Set(unused);
  for (const [id, row] of Object.entries(facts ?? {})) {
    if (Number(row?.risk) !== 4) continue;
    if (unusedSet.has(id)) {
      findings.push({
        code: "r4-unsurfaced",
        msg: `R4 fact "${id}" is in the registry but referenced by no rendered group — an omitted mandatory-surface fact is worse than an unconfirmed one`,
      });
    }
  }
  return findings;
}

/** E1(b) — tier/evidence requirements, active only on rows a research pass has risk-labelled.
    R2+ owes a `tier`; R3+ additionally owes `tier: primary` and an `evidence` snippet (the
    locator E2's drift check will search the page for). */
export function checkTierEvidence(facts) {
  const findings = [];
  for (const [id, row] of Object.entries(facts ?? {})) {
    const risk = Number(row?.risk);
    if (!Number.isInteger(risk) || risk < 2) continue;
    if (!row.tier) {
      findings.push({ code: "tier-missing", msg: `R${risk} fact "${id}" has no \`tier\`` });
    }
    if (risk >= 3) {
      if (row.tier && row.tier !== "primary") {
        findings.push({ code: "tier-not-primary", msg: `R${risk} fact "${id}" is tier "${row.tier}" — plan-critical and safety facts need a primary source` });
      }
      if (!row.evidence) {
        findings.push({ code: "evidence-missing", msg: `R${risk} fact "${id}" has no \`evidence\` snippet — a URL that still 200s is not proof the page still says this` });
      }
    }
  }
  return findings;
}

/** E1(d) — B3's hygiene detectors, promoted from advisory to gate-eligible.
    B3 already finds these on the fixture (the ¥11,410 jreast-vs-ana misattribution, and the
    `$19,` / `$1,` / `$80,` malformed values); this only decides which of them a gate should
    act on. `bareEcho` stays advisory at every risk level: a section-path-shaped claim is a
    naming smell (defect D4), not a wrong fact, and blocking on it would gate style. */
export function hygieneFindings(hygiene) {
  const findings = [];
  for (const m of hygiene?.misattribution ?? []) {
    findings.push({
      code: "misattribution",
      msg: `value ${m.value} is cited to ${m.sources.length} different sources across ${m.ids.join(", ")} — at most one can be right`,
    });
  }
  for (const m of hygiene?.malformed ?? []) {
    findings.push({ code: "malformed-value", msg: `fact "${m.id}" has a malformed value ${JSON.stringify(m.value)} — it renders to the reader verbatim` });
  }
  return findings;
}

/**
 * Roll-up. `enforce` decides blocker-vs-advisory and is the warn-first switch: verify passes
 * `guide.draft === true`, so drafts (the graduation chokepoint) block and published guides
 * advise. Returns "n/a" only when there was genuinely nothing to check.
 */
export function evaluateRiskGates({ guide, facts = null, unused = [], hygiene = null, destinationConfig = null, enforce = false } = {}) {
  const findings = [];
  const advisory = checkAdvisorySurfaced(guide, destinationConfig);
  if (advisory) findings.push(advisory);
  findings.push(...checkR4Surfaced(facts, unused));
  findings.push(...checkTierEvidence(facts));
  findings.push(...hygieneFindings(hygiene));

  if (!findings.length) return { status: "pass", findings: [], enforce };
  return { status: enforce ? "fail" : "advisory", findings, enforce };
}
