// E3 (docs/PLAN_EVIDENCE_FIRST.md) — contradiction + uncertainty in the verify roll-up.
//
// WHY, AND HOW IT DIFFERS FROM C2. C2 gates the INTAKE at scaffold time: it asks whether the
// traveler's own answers contradict each other. E3 asks the next question — whether the
// GUIDE ships those contradictions and uncertainties silently. A guide can be perfectly
// honest in prose ("⚠ every koyo date here is a multi-year average") and still be
// structurally defective, because prose an author remembered to write is not a field
// anything can re-check, expire, or act on. Every case below is exactly that shape: the
// japan guide DISCLOSES the problem and still fails, because disclosure isn't structure.
//
// SAME DECOUPLING AS E1 (creator ruling 2026-08-13). No row in the corpus carries `risk`,
// so nothing here keys on it. Each detector works on the artifacts as they actually exist,
// and each was calibrated against the real corpus BEFORE being trusted — the B3 lesson,
// where a first design produced 71 false positives on korea's live facts.
//
// WARN-FIRST, as E1: findings block on drafts (the graduation chokepoint) and advise on
// published guides. `evaluateUncertainty` takes `enforce` and never decides that itself.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ROOT, GUIDES_INTAKE_DIR } from "./lib.mjs";
import { MIN_GAP_SECONDS } from "../check-run-integrity.mjs";

/** The pipeline's stage order — the sequence whose gaps case 8 is about. */
const STAGE_ORDER = ["scaffold", "passA", "passB", "reconcile", "verified"];

/** Forecast/seasonal vocabulary: claims that are inherently a FORECAST, not a fixed fact.
    Deliberately a short closed list of terms whose whole meaning is "this shifts year to
    year" — a wider net (every "peak", "season") drowns in itinerary prose. */
const FORECAST_TERM = "(koyo|foliage|cherry blossom|sakura|jangma|monsoon|peak bloom|autumn colou?rs?)";
const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*";
// A DATE here is a month-anchored one only. "mid-", "early-", "late-" are restricted to
// month names on purpose: an unrestricted `mid-\w+` matches "mid-morning", which is a time
// of day in an itinerary and has nothing to do with a seasonal forecast (caught in calibration).
const FORECAST_DATE = `((?:mid|early|late)-${MONTH}|${MONTH}\\.? ?\\d{1,2})`;
// Bidirectional: guides write it both ways — "koyo average peak (Oct 28–Nov 5)" and
// "a reliable mid-Oct–early-Nov foliage peak". Matching only one order missed half the
// fixture's own evidence.
const FORECAST_NEAR = new RegExp(
  `\\b${FORECAST_TERM}\\b[^"]{0,90}?${FORECAST_DATE}|${FORECAST_DATE}[^"]{0,90}?\\b${FORECAST_TERM}\\b`,
  "i",
);

/** Regression case 4 — a forecast-class date living only in prose.
 *
 * The japan guide states koyo peaks as prose dates with no `facts.json` row: no
 * `state: "approx"`, no `source_url`, no `verified_on`. So when JMC publishes the actual
 * 2026 forecast, nothing expires the multi-year averages the guide is quoting. The guide's
 * own ⚠ note is honest and changes nothing mechanically.
 *
 * Detection is risk-independent: a forecast TERM near a month-anchored DATE, where no
 * facts.json row mentions that term at all. Calibrated to zero findings on korea (whose
 * monsoon claims ARE fact-backed) and denmark.
 */
export function forecastFactsUnregistered(sections = [], facts = null) {
  const factText = JSON.stringify(facts ?? {}).toLowerCase();
  const findings = [];
  const seen = new Set();
  for (const s of sections) {
    const m = JSON.stringify(s).match(FORECAST_NEAR);
    if (!m) continue;
    // The alternation puts the term in group 1 or group 4 depending on which order matched.
    const term = (m[1] || m[4] || "").toLowerCase();
    if (!term || factText.includes(term)) continue;
    if (seen.has(term)) continue;
    seen.add(term);
    findings.push({
      code: "forecast-unregistered",
      msg:
        `"${term}" is quoted with dates in §"${s.title || s.group || "(untitled)"}" but no facts.json row covers it — ` +
        `a forecast with no \`state: "approx"\`, source or \`verified_on\` is a multi-year average nothing will ever expire`,
    });
  }
  return findings;
}

/** Regulatory-change vocabulary: a RULE that changes on a date. Deliberately excludes "as of"
    and "no longer", which calibration showed are verification-stamp language ("as of Jul 24",
    "no longer operates") and generated every false positive in the first two attempts at this
    detector — 7 across the published guides. What remains are verbs that can only mean a rule
    changing, which produced zero false positives on korea, us and denmark. */
const CHANGE_TERM =
  "(effective|takes effect|switch(?:es|ing)? (?:from|to)|changes? on|last day|cutover|is replaced|will be replaced|ends on|begins on)";
const CHANGE_NEAR = new RegExp(
  `${CHANGE_TERM}[^"]{0,80}?${FORECAST_DATE}|${FORECAST_DATE}[^"]{0,80}?${CHANGE_TERM}`,
  "i",
);

/** Regression case 5 — a mid-trip regulatory change tracked only in prose.
 *
 * Japan's tax-free system switches from instant-discount to refund-at-departure on Nov 1 2026,
 * inside the trip. The guide says so in three places and carries a related ¥5,000-threshold
 * fact row — but no row for the CUTOVER DATE itself, the plan-critical datum. Nothing expires
 * it, nothing re-checks it, and the section is `verified_on`-stamped so the existing
 * prose-provenance check correctly stays silent.
 *
 * This was deferred out of E1 (the first heuristic fired 7× on published guides) and completed
 * once E3's proximity technique replaced section-level matching. Its live value is already
 * proven: it finds a real Coconino National Forest closure order in the `us` guide — effective
 * Jul 13–Sep 30 2026, covering trails that guide recommends, "unless rescinded early", with no
 * fact row to ever notice the rescission.
 */
export function regulatoryChangeUnregistered(sections = [], facts = null) {
  const factText = JSON.stringify(facts ?? {}).toLowerCase();
  const findings = [];
  for (const s of sections) {
    // Day sections are itinerary structure, not rule statements (SKILL.md: clock times in a day
    // plan are never registry facts), so they are not scanned.
    if (s?.type === "days") continue;
    const m = JSON.stringify(s).match(CHANGE_NEAR);
    if (!m) continue;
    const date = m[2] || m[3] || "";
    // Covered when some fact row already carries that same date.
    if (date && factText.includes(date.toLowerCase())) continue;
    findings.push({
      code: "regulatory-change-unregistered",
      msg:
        `§"${s.title || s.group || "(untitled)"}" states a rule change around ${date || "a date"} ` +
        `("${(m[1] || m[4] || "").trim()}") with no facts.json row — a plan-critical change nothing will re-check or expire`,
    });
  }
  return findings;
}

/** Regression case 8 — research stages checkpointed in a burst.
 *
 * Pass A and Pass B are architecturally required to be INDEPENDENT research acts, and
 * reconcile consumes both. The japan state file records all three inside 71 ms, which is a
 * batched write at the end of a run: the artifact cannot evidence that independence ever
 * happened, so the property the whole two-pass design rests on is unfalsifiable.
 *
 * `check-run-integrity.mjs` already detects this shape in CI, but only from git history —
 * it cannot judge a state file on its own, which is all the frozen fixture has. This is the
 * history-free counterpart, and it reuses that module's MIN_GAP_SECONDS so there is one
 * number, not two. Calibrated against the real state files: genuine gaps are 4823 s and
 * 53198 s, the defective ones are sub-second, so there is no grey zone.
 */
export function stageBurst(state, { minGapSeconds = MIN_GAP_SECONDS } = {}) {
  const findings = [];
  const stages = state?.stages ?? {};
  for (let i = 1; i < STAGE_ORDER.length; i++) {
    const prev = STAGE_ORDER[i - 1];
    const cur = STAGE_ORDER[i];
    if (!stages[prev] || !stages[cur]) continue;
    const gap = (Date.parse(stages[cur]) - Date.parse(stages[prev])) / 1000;
    if (!Number.isFinite(gap) || gap >= minGapSeconds) continue;
    findings.push({
      code: "stage-burst",
      msg:
        `"${prev}" and "${cur}" were checkpointed ${gap.toFixed(3)}s apart (floor ${minGapSeconds}s) — ` +
        `real research stages cannot complete that fast, so the state file cannot evidence that they ran independently`,
    });
  }
  return findings;
}

/** Regression case 7 — an anchor-adjacent pick resting on Pass B convergence alone.
 *
 * The reconciliation ledger records its own weakness in words: "B-only", "⚠ not directly
 * fetched", "flagged for a direct re-check". A celebration-anchor venue with no primary
 * source and no Pass A counterpart shipped anyway, with a recorded intent to re-check that
 * nothing tracks. Detection reads the ledger's own admission rather than guessing at
 * source quality — the guide told us; nothing was listening. */
export function weaklySupportedLedgerRows(intakeMd = "") {
  const findings = [];
  const section = String(intakeMd).split(/^## Research reconciliation.*$/m)[1];
  if (section === undefined) return findings;
  for (const line of section.split(/^## /m)[0].split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    if (!/\bB-only\b/i.test(line)) continue;
    if (!/not directly fetched|couldn't fetch|could not fetch|unverified|not researched in A/i.test(line)) continue;
    const name = line.split("|").map((c) => c.trim())[1] || "(unnamed row)";
    findings.push({
      code: "weak-support",
      msg: `reconciliation row "${name}" is B-only AND self-flagged as not directly fetched — it shipped on convergence alone, with a re-check intent nothing tracks`,
    });
  }
  return findings;
}

/** Regression case 2 — C2 found a contradiction that the intake never resolved.
 *
 * C2 emits a structured question block per contradiction; `references/pipeline-roles.md`
 * makes `**Assumed:**` the load-bearing part, because it is what actually gets built. A
 * contradiction with no question block recording an assumption means the guide picked a
 * side silently — the exact thing the Clarifying-Questions doctrine forbids. */
export function unresolvedContradictions(intakeMd = "", contradictions = []) {
  const questionIds = new Set(
    [...String(intakeMd).matchAll(/^###\s+(q-[a-z0-9-]+)\s*$/gim)].map((m) => m[1].toLowerCase()),
  );
  const hasAnyAssumption = /^\s*-\s*\*\*Assumed:\*\*/im.test(String(intakeMd));
  const findings = [];
  for (const c of contradictions) {
    // Resolved when the intake carries question blocks with assumptions at all — C2's own
    // ids are generated per run, so requiring an exact id match would fail every intake that
    // was answered and then re-run. Presence of the resolution structure is the signal.
    if (questionIds.size && hasAnyAssumption) continue;
    findings.push({
      code: "contradiction-unresolved",
      msg: `intake contradiction "${c.id}" has no \`### q-…\` block with an \`**Assumed:**\` line — the guide picked a side silently`,
    });
  }
  return findings;
}

/** Read a guide's pipeline state file, or null. */
export async function readState(slug, { intakeDir = GUIDES_INTAKE_DIR } = {}) {
  try {
    return JSON.parse(await readFile(path.join(intakeDir, `${slug}.state.json`), "utf8"));
  } catch {
    return null;
  }
}

/** Read a guide's intake doc, or "" when it has none. */
export async function readIntake(slug, { intakeDir = GUIDES_INTAKE_DIR } = {}) {
  try {
    return await readFile(path.join(intakeDir, `${slug}.md`), "utf8");
  } catch {
    return "";
  }
}

/** Roll-up. Pure: verify() does the reading and passes artifacts in, matching how the
    candidates and staleness rows already work. */
export function evaluateUncertainty({
  sections = [],
  facts = null,
  intakeMd = "",
  state = null,
  contradictions = [],
  enforce = false,
} = {}) {
  const findings = [
    ...forecastFactsUnregistered(sections, facts),
    ...regulatoryChangeUnregistered(sections, facts),
    ...stageBurst(state),
    ...weaklySupportedLedgerRows(intakeMd),
    ...unresolvedContradictions(intakeMd, contradictions),
  ];
  if (!findings.length) return { status: "pass", findings: [], enforce };
  return { status: enforce ? "fail" : "advisory", findings, enforce };
}

export { ROOT };
