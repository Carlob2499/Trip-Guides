// PIPELINE V2 — the research-quality rules, validated on the evidence artifact (M5).
//
// M2's evidence.mjs enforces STRUCTURE (funnel, dispositions, an earned saturation stop).
// This module enforces the locked research RULES from DECISIONS.md, machine-checkably:
//
//   OBJECTIVE vs EXPERIENTIAL   objective facts (hours, prices, rules, schedules) cite
//                               official/operator/reference sources; experiential claims
//                               (crowds, atmosphere, feel) may NOT cite an official site —
//                               that is a fabricated citation — and, on a shipped candidate,
//                               need ≥2 corroborating firsthand records from distinct source
//                               families.
//   RECURRING-EVENT YEAR SAFETY a claim naming a year later than its source was published is
//                               last year's pattern dressed as this year's schedule.
//   FRESHNESS                   experiential evidence goes stale; a known-old firsthand
//                               report cannot carry a current claim.
//   RESERVATION DEPTH           anchors and important finalists owe real booking answers;
//                               `confirmed` leads owe current evidence; casual stops owe
//                               nothing (forensic detail for a casual lunch is its own bug).
//   TRANSPORT ROBUSTNESS        risk R3+ routes owe the door-to-door reality (fallback,
//                               missed-connection consequence, and a buffer/next-service/
//                               last-return answer); routine transit stays simple and owes
//                               nothing.
//
// Everything here returns human-readable problems; empty = clean. Honesty limits are
// deliberate: where a fact is UNKNOWABLE (a null publish date, a null family), the rule does
// not fail it — unknown is unknown, and inventing a verdict would be the exact sin these
// rules exist to catch.

const OBJECTIVE_SOURCE_KINDS = new Set(["official", "operator", "reference"]);
const EXPERIENTIAL_FORBIDDEN = new Set(["official", "operator"]);

/** Months between two YYYY-MM-DD / ISO strings; null when either is unparseable. */
function monthsBetween(a, b) {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return null;
  return Math.abs(tb - ta) / (1000 * 60 * 60 * 24 * 30.44);
}

export const EXPERIENTIAL_STALE_MONTHS = 24;

/** Rule: evidence kind ↔ source kind. */
export function evidenceKindProblems(doc) {
  const problems = [];
  for (const e of doc.evidence || []) {
    if (e.kind === "objective" && !OBJECTIVE_SOURCE_KINDS.has(e.source?.kind)) {
      problems.push(
        `objective claim "${e.claim.slice(0, 60)}" (${e.id}) cites a ${e.source?.kind ?? "missing"} source — ` +
          `hours/prices/rules/schedules need an official, operator or canonical reference source`,
      );
    }
    if (e.kind === "experiential" && EXPERIENTIAL_FORBIDDEN.has(e.source?.kind)) {
      problems.push(
        `experiential claim "${e.claim.slice(0, 60)}" (${e.id}) cites an ${e.source.kind} source — ` +
          `an official site cannot testify to crowds/atmosphere/feel; that is a fabricated citation`,
      );
    }
  }
  return problems;
}

/** Rule: experiential corroboration on shipped candidates — ≥2 records, distinct families. */
export function corroborationProblems(doc) {
  const problems = [];
  const shipped = new Map((doc.candidates || []).filter((c) => c.status === "shipped").map((c) => [c.id, c]));
  const byCandidate = new Map();
  for (const e of doc.evidence || []) {
    if (e.kind !== "experiential" || !e.candidateId) continue;
    if (!byCandidate.has(e.candidateId)) byCandidate.set(e.candidateId, []);
    byCandidate.get(e.candidateId).push(e);
  }
  for (const [candidateId, records] of byCandidate) {
    const candidate = shipped.get(candidateId);
    if (!candidate) continue; // corroboration is owed where the claim SHIPS
    // Records sharing a known family count once; null families can't be collapsed (honesty
    // limit: unknown independence is not assumed shared OR independent — each stands alone).
    const families = new Set();
    let unknowns = 0;
    for (const r of records) {
      if (r.source?.family) families.add(r.source.family);
      else unknowns += 1;
    }
    const independentCount = families.size + unknowns;
    if (independentCount < 2) {
      problems.push(
        `"${candidate.name}" (${candidateId}) ships on ${records.length === 1 ? "a single" : "one family of"} experiential source(s) — ` +
          `crowd/atmosphere claims need ≥2 recent independent firsthand sources (copied families count once)`,
      );
    }
  }
  return problems;
}

/** Rule: recurring-event year safety — a claim naming a year AFTER the source's publish year. */
export function yearSafetyProblems(doc) {
  const problems = [];
  for (const e of doc.evidence || []) {
    if (e.kind !== "objective") continue;
    const published = e.source?.publishedAt;
    const pubYear = published ? Number(String(published).slice(0, 4)) : null;
    if (!pubYear || !Number.isFinite(pubYear)) continue; // unknowable — no invented verdict
    for (const m of String(e.claim).matchAll(/\b(20\d{2})\b/g)) {
      const claimYear = Number(m[1]);
      if (claimYear > pubYear) {
        problems.push(
          `"${e.claim.slice(0, 70)}" (${e.id}) names ${claimYear} but its source was published in ${pubYear} — ` +
            `a prior-year source is a LEAD for a recurring event, never a confirmed future-year date`,
        );
        break;
      }
    }
  }
  return problems;
}

/** Rule: experiential freshness — a known-old firsthand report cannot carry a current claim. */
export function freshnessProblems(doc, { staleMonths = EXPERIENTIAL_STALE_MONTHS } = {}) {
  const problems = [];
  for (const e of doc.evidence || []) {
    if (e.kind !== "experiential" || !e.source?.publishedAt) continue;
    const age = monthsBetween(e.source.publishedAt, e.verifiedOn);
    if (age !== null && age > staleMonths) {
      problems.push(
        `experiential claim "${e.claim.slice(0, 60)}" (${e.id}) rests on a source ~${Math.round(age)} months old — ` +
          `crowd/queue/atmosphere reality older than ${staleMonths} months is a lead to re-verify, not current evidence`,
      );
    }
  }
  return problems;
}

/** Rule: reservation depth scales with importance; confirmed leads owe current evidence. */
export function reservationProblems(doc) {
  const problems = [];
  for (const r of doc.reservations || []) {
    const bookingAnswer = r.bookingUrl || r.walkIn || r.alternatives;
    if ((r.importance === "anchor" || r.importance === "important") && !bookingAnswer) {
      problems.push(
        `${r.importance} reservation for ${r.candidateId} answers no booking question — ` +
          `an important finalist owes at least a booking method, walk-in verdict or alternative`,
      );
    }
    if (r.importance === "anchor" && !(r.actionDate || r.releaseWindow) ) {
      problems.push(
        `anchor reservation for ${r.candidateId} has no release window or action date — ` +
          `the one non-negotiable booking needs the WHEN, not just the how`,
      );
    }
    if (r.importance === "anchor" && !r.fallback) {
      problems.push(`anchor reservation for ${r.candidateId} has no fallback — the anchor failing is the trip failing`);
    }
    for (const lead of r.leads || []) {
      if (lead.status === "confirmed" && !(lead.verifiedOn && lead.source)) {
        problems.push(
          `booking lead "${lead.claim.slice(0, 50)}" on ${r.candidateId} is marked confirmed without current evidence ` +
            `(source + verifiedOn) — an unconfirmed lead is never promoted by relabeling it`,
        );
      }
    }
  }
  return problems;
}

/** Rule: high-risk transport owes the physical reality; routine transit owes nothing. */
export function transportProblems(doc) {
  const problems = [];
  for (const t of doc.transport || []) {
    if (t.risk < 3) continue; // forgiving transport stays simple — by design
    const missing = [];
    if (!t.fallback) missing.push("fallback");
    if (!t.missedConnection) missing.push("missed-connection consequence");
    if (!(t.buffer || t.nextService || t.lastPracticalReturn)) missing.push("buffer / next service / last practical return");
    if (missing.length) {
      problems.push(
        `high-risk route "${t.route}" (${t.id}, R${t.risk}) is missing: ${missing.join(", ")} — ` +
          `a timetable connection is not automatically a good connection`,
      );
    }
  }
  return problems;
}

/** All research-rule problems in one list — layered on top of evidenceProblems() by the gate. */
export function researchRuleProblems(doc) {
  return [
    ...evidenceKindProblems(doc),
    ...corroborationProblems(doc),
    ...yearSafetyProblems(doc),
    ...freshnessProblems(doc),
    ...reservationProblems(doc),
    ...transportProblems(doc),
  ];
}
