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

export const OBJECTIVE_SOURCE_KINDS = new Set(["official", "operator", "reference"]);
export const EXPERIENTIAL_FORBIDDEN = new Set(["official", "operator"]);

// Reader/mirror/proxy services: useful for discovery, never the origin. Kept NARROW and exact —
// ordinary first-party sites and CDNs must not be swept up. web.archive.org is a legitimate
// snapshot archive, but a snapshot is not the live origin for a perishable claim.
export const PROXY_HOSTS = [
  "r.jina.ai",
  "webcache.googleusercontent.com",
  "cachedview.nl",
  "12ft.io",
  "web.archive.org",
  "translate.googleusercontent.com",
];

export function isProxyHost(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PROXY_HOSTS.some((p) => host === p || host.endsWith(`.${p}`));
  } catch {
    return false;
  }
}

// Objective recheck windows by shelf-life class (exported so the generated agent contract and
// the validator can never drift apart — one map, two consumers).
export const OBJECTIVE_RECHECK_MAX_DAYS = { fx: 7, transit: 90, hours: 90, venue: 180, default: 90 };

/** Months between two YYYY-MM-DD / ISO strings; null when either is unparseable. */
function monthsBetween(a, b) {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return null;
  return Math.abs(tb - ta) / (1000 * 60 * 60 * 24 * 30.44);
}

export const EXPERIENTIAL_STALE_MONTHS = 24;

/** A record can support deterministic truth only when the cited origin was actually fetched and
    its typed source is appropriate for the claim. Independence keys collapse copied families
    first, then same-origin URLs; two model passes are never themselves two sources. */
export function qualifyingEvidence(record) {
  if (record?.source?.access !== "fetched") return false;
  if (record.kind === "objective") return OBJECTIVE_SOURCE_KINDS.has(record.source?.kind);
  return record.kind === "experiential" && record.source?.kind === "firsthand" && record.firsthand === true;
}

export function sourceIndependenceKey(record) {
  if (!qualifyingEvidence(record)) return null;
  if (record.source?.family) return `family:${record.source.family.toLocaleLowerCase()}`;
  if (record.source?.independent !== true) return null;
  try { return `origin:${new URL(record.source.url).href.toLocaleLowerCase()}`; }
  catch { return null; }
}

/** Rule: evidence kind ↔ source kind. */
export function evidenceKindProblems(doc) {
  const problems = [];
  for (const e of doc.evidence || []) {
    if (!e.source?.url || !/^https?:\/\//i.test(e.source.url)) {
      problems.push(`evidence "${e.id}" has no usable http(s) source URL — a typed source kind is not evidence`);
    }
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

/** Rule: every experiential claim that enters the artifact is potentially guide-bearing, so it
    owes ≥2 independent firsthand records even when it is cross-cutting or later rejected. */
export function corroborationProblems(doc) {
  const problems = [];
  const candidates = new Map((doc.candidates || []).map((c) => [c.id, c]));
  const guideBearing = new Set((doc.candidates || []).filter((c) => ["shipped", "detour"].includes(c.status)).map((c) => c.id));
  const byClaim = new Map();
  for (const e of doc.evidence || []) {
    if (e.kind !== "experiential" || (e.candidateId && !guideBearing.has(e.candidateId))) continue;
    const claimKey = String(e.claim).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const key = `${e.candidateId || "general"}\u0000${claimKey}`;
    if (!byClaim.has(key)) byClaim.set(key, []);
    byClaim.get(key).push(e);
  }
  for (const [key, records] of byClaim) {
    const candidateId = key.split("\u0000")[0];
    const candidate = candidates.get(candidateId);
    const candidateName = candidate?.name || "General guide claim";
    const nonFirsthand = records.filter((r) => r.source?.kind !== "firsthand" || r.firsthand !== true);
    if (nonFirsthand.length) {
      problems.push(`"${candidateName}" (${candidateId}) experiential claim "${records[0].claim.slice(0, 60)}" includes non-firsthand evidence — firsthand must be explicit`);
    }
    const independentSources = new Set();
    for (const r of records) {
      const key = sourceIndependenceKey(r);
      if (key) independentSources.add(key);
    }
    const independentCount = independentSources.size;
    if (independentCount < 2) {
      problems.push(
        `"${candidateName}" (${candidateId}) claim "${records[0].claim.slice(0, 60)}" relies on ${records.length === 1 ? "a single" : "unproven-independent"} experiential source set — ` +
          `crowd/atmosphere claims need ≥2 recent independent firsthand sources (copied families count once)`,
      );
    }
  }
  return problems;
}

/** Pass A + Pass B convergence is never itself corroboration.

    R-E scar (Tottori): the 600 m viewpoint distance carried `family: "misasa-town"` and
    `family: "misasaonsen-official"` — two municipal surfaces of one body, `independent: null` on
    both — and two passes converging on the same misattributed number counted as two independent
    sources. So (1) a row declaring FACTUAL corroboration (2.3) is checked against the records it
    NAMES, since the historical claims are worded differently and wording proves nothing: every
    member must be qualifying fetched evidence, and a set spanning both passes needs ≥2 sources
    whose independence is ESTABLISHED (`independent: true`, not a family label per hostname). A
    `recommendation` kind asserts no factual support and may stay single-sourced (accepted
    Uruguay's `agree` leads). (2) The older text-identical case still fails on its own. */
export function independentAgreementProblems(doc) {
  const problems = [];
  const established = (record) => record?.source?.independent === true ? sourceIndependenceKey(record) : null;
  const byId = new Map((doc.evidence || []).map((record) => [record.id, record]));
  for (const row of doc.reconciliation || []) {
    if (row.corroborates?.kind !== "factual") continue;
    const declared = row.corroborates.evidenceIds || [];
    if (!declared.length) continue;
    const finding = byId.get(row.findingId);
    const named = declared.map((id) => byId.get(id)).filter(Boolean);
    if (!finding || named.length !== declared.length) continue; // dispositionProblems owns dangling refs
    const set = [finding, ...named];
    if (!set.some((r) => r.origin === "passA") || !set.some((r) => r.origin === "passB")) continue;
    const unqualified = set.filter((r) => !qualifyingEvidence(r));
    const keys = new Set(set.map(established).filter(Boolean));
    if (unqualified.length || keys.size < 2) {
      problems.push(
        `reconciliation claims "${row.findingId}" corroborates ${declared.join(", ")} on "${finding.claim.slice(0, 70)}" — ` +
          `Pass A and Pass B converging is not itself independent corroboration: ` +
          (unqualified.length
            ? `${unqualified.map((r) => r.id).join(", ")} is not qualifying fetched evidence`
            : `only ${keys.size} source basis has established independence (source.independent must be true on ≥2 distinct families/origins)`),
      );
    }
  }
  const groups = new Map();
  for (const record of doc.evidence || []) {
    if (!["passA", "passB"].includes(record.origin)) continue;
    const claim = String(record.claim).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const key = `${record.candidateId || "general"}\0${claim}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  for (const records of groups.values()) {
    if (!records.some((r) => r.origin === "passA") || !records.some((r) => r.origin === "passB")) continue;
    const a = records.filter((r) => r.origin === "passA" && qualifyingEvidence(r));
    const b = records.filter((r) => r.origin === "passB" && qualifyingEvidence(r));
    const keys = new Set([...a, ...b].map(sourceIndependenceKey).filter(Boolean));
    if (!a.length || !b.length || keys.size < 2) {
      problems.push(
        `Pass A/Pass B agreement on "${records[0].claim.slice(0, 70)}" is not independent corroboration — ` +
          `each pass needs qualifying fetched support from a genuinely distinct source family/origin`,
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
    const verifiedYear = Number(String(e.verifiedOn).slice(0, 4));
    for (const m of String(e.claim).matchAll(/\b(20\d{2})\b/g)) {
      const claimYear = Number(m[1]);
      const isFuture = Number.isFinite(verifiedYear) && claimYear > verifiedYear;
      const laterThanKnownPublication = Number.isFinite(pubYear) && claimYear > pubYear;
      if ((isFuture || laterThanKnownPublication) && !(e.source?.appliesToYears || []).includes(claimYear)) {
        problems.push(
          `"${e.claim.slice(0, 70)}" (${e.id}) names ${claimYear}${Number.isFinite(pubYear) ? ` but its source was published in ${pubYear}` : " without a dated publication"} — ` +
            `a prior-year source is a LEAD unless it explicitly records appliesToYears:[${claimYear}]`,
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
  const shipped = new Set((doc.candidates || []).filter((c) => c.status === "shipped").map((c) => c.id));
  for (const e of doc.evidence || []) {
    if (e.kind !== "experiential") continue;
    if (!e.source?.publishedAt) {
      if (e.candidateId && shipped.has(e.candidateId)) {
        problems.push(`experiential claim "${e.claim.slice(0, 60)}" (${e.id}) has no source date — recency is unproven for a shipped recommendation`);
      }
      continue;
    }
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

export function objectiveFreshnessProblems(doc) {
  const problems = [];
  const maxDays = OBJECTIVE_RECHECK_MAX_DAYS;
  const today = new Date().toISOString().slice(0, 10);
  for (const e of doc.evidence || []) {
    if (e.kind !== "objective") continue;
    if (!e.freshness) {
      problems.push(`objective evidence "${e.id}" has no freshness classification — perishable facts need a category and recheck date`);
      continue;
    }
    if (e.freshness.perishable) {
      if (!e.freshness.shelfLife || !e.freshness.recheckOn) {
        problems.push(`perishable objective evidence "${e.id}" needs shelfLife + recheckOn`);
      } else if (Date.parse(e.freshness.recheckOn) <= Date.parse(e.verifiedOn)) {
        problems.push(`objective evidence "${e.id}" recheckOn must be after verifiedOn`);
      } else {
        const limit = maxDays[e.freshness.shelfLife];
        const days = Math.round((Date.parse(e.freshness.recheckOn) - Date.parse(e.verifiedOn)) / 86_400_000);
        if (days > limit) problems.push(`objective evidence "${e.id}" ${e.freshness.shelfLife} recheck window is ${days} days; maximum is ${limit}`);
        if (e.freshness.recheckOn < today) problems.push(`objective evidence "${e.id}" recheck date ${e.freshness.recheckOn} has expired`);
      }
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
    if (r.importance === "anchor") {
      for (const [field, label] of [
        ["partyRules", "party-size rules"], ["deposit", "deposit/prepayment terms"],
        ["cancellation", "cancellation/no-show terms"], ["foreignFriction", "foreign-user friction"],
      ]) if (!r[field]) problems.push(`anchor reservation for ${r.candidateId} has no ${label}`);
      if (!(r.walkIn || r.alternatives)) problems.push(`anchor reservation for ${r.candidateId} has no walk-in verdict or alternative booking method`);
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

/** Full-pass depth cannot disappear by omitting every reservation/transport row. The agent must
    enumerate required ids or state why the class is not applicable; required ids must resolve. */
export function depthScopeProblems(doc) {
  const problems = [];
  const depth = doc.depth;
  if (!depth) return ["research depth assessment is missing — reservation/transport obligations were never enumerated"];
  const candidateIds = new Set((doc.candidates || []).map((c) => c.id));
  const reservationIds = new Set((doc.reservations || []).map((r) => r.candidateId));
  const requiredReservations = depth.reservations?.requiredCandidateIds || [];
  if (!requiredReservations.length && !depth.reservations?.notApplicableReason?.trim()) {
    problems.push("reservation depth lists no required candidates and no not-applicable reason");
  }
  for (const id of requiredReservations) {
    if (!candidateIds.has(id)) problems.push(`reservation depth requires unknown candidate "${id}"`);
    if (!reservationIds.has(id)) problems.push(`reservation depth requires "${id}" but no reservation record exists`);
  }
  const routeIds = new Set((doc.transport || []).map((t) => t.id));
  const requiredRoutes = depth.transport?.requiredRouteIds || [];
  if (!requiredRoutes.length && !depth.transport?.notApplicableReason?.trim()) {
    problems.push("transport depth lists no required routes and no not-applicable reason");
  }
  for (const id of requiredRoutes) if (!routeIds.has(id)) problems.push(`transport depth requires route "${id}" but no transport record exists`);
  return problems;
}

export function passBSubstanceProblems(doc) {
  const audit = doc.passB?.nativeLanguage;
  const problems = [];
  if (!audit) problems.push("Pass B native-language audit is missing");
  else if (!audit.why?.trim()) problems.push("Pass B native-language audit does not explain why local-language research was or was not used");
  else if (audit.used && (!audit.searchClasses.length || !audit.yield?.trim())) {
    problems.push("Pass B says native-language research was used but records no search classes or useful yield");
  }
  const passBRecords = (doc.evidence || []).filter((e) => e.origin === "passB");
  if (!passBRecords.length && !doc.passB?.noYieldReason?.trim()) {
    problems.push("Pass B produced no evidence and no typed noYieldReason — a missing resident angle cannot pass as an empty array");
  }
  return problems;
}

export function disagreementProblems(doc) {
  const problems = [];
  const byId = new Map((doc.evidence || []).map((e) => [e.id, e]));
  for (const d of doc.disagreements || []) {
    if (d.impact !== "recommendation-changing") continue;
    if (!d.resolution?.trim()) {
      problems.push(`recommendation-changing disagreement "${d.topic}" (${d.id}) has no resolution`);
    }
    const ids = [...new Set(d.evidenceIds || [])];
    if (ids.length < 2) {
      problems.push(
        `recommendation-changing disagreement "${d.topic}" (${d.id}) must cite at least two distinct evidence records — ` +
          `prose alone cannot prove a conflict`,
      );
      continue;
    }
    for (const id of ids) {
      if (!byId.has(id)) {
        problems.push(`recommendation-changing disagreement "${d.topic}" (${d.id}) cites unknown evidence id "${id}"`);
      }
    }
  }
  return problems;
}

/** Rule: a search-result preview is discovery, not a read of the page (Core Proof finding).
    Citing official/operator authority requires the origin to have actually been fetched — or
    the block recorded honestly. A mirror/proxy URL is never the origin. */
export function sourceAccessProblems(doc) {
  const problems = [];
  const evidence = doc.evidence || [];
  const byId = new Map(evidence.map((e) => [e.id, e]));

  for (const e of evidence) {
    const access = e.source?.access || "unknown";
    if (e.source?.url && isProxyHost(e.source.url)) {
      problems.push(
        `evidence "${e.id}" cites a reader/mirror/proxy URL (${new URL(e.source.url).hostname}) as its source — ` +
          `a mirror cannot count as the origin; cite the true origin (fetched) or record it blocked`,
      );
    }
    if (e.kind === "objective" && ["official", "operator"].includes(e.source?.kind) && !["fetched", "blocked"].includes(access)) {
      problems.push(
        `objective claim "${e.claim.slice(0, 60)}" (${e.id}) cites an ${e.source.kind} source with access "${access}" — ` +
          `a search preview referencing the official page is not a read of it; fetch the origin or record the block`,
      );
    }
    if (e.kind === "objective" && (e.source?.appliesToYears || []).length && access !== "fetched") {
      problems.push(
        `event-date claim "${e.claim.slice(0, 60)}" (${e.id}) records appliesToYears without access "fetched" — ` +
          `an announced date must come from an announcement that was actually read`,
      );
    }
  }

  // Important/anchor reservation mechanics rest on at least one genuinely fetched objective
  // record for that candidate — or an honestly recorded block.
  for (const r of doc.reservations || []) {
    if (!["anchor", "important"].includes(r.importance)) continue;
    const records = evidence.filter((e) => e.candidateId === r.candidateId && e.kind === "objective");
    if (!records.length) continue; // reservationProblems already polices missing answers
    const ok = records.some((e) => e.source?.access === "fetched")
      || records.some((e) => e.source?.access === "blocked");
    if (!ok) {
      problems.push(
        `${r.importance} reservation for ${r.candidateId} rests only on search-preview/unknown-access sources — ` +
          `booking mechanics need a fetched origin or a recorded block`,
      );
    }
  }

  // High-risk transport facts name their evidence and at least one record was genuinely read.
  for (const t of doc.transport || []) {
    if (t.risk < 3) continue;
    const ids = t.evidenceIds || [];
    if (!ids.length) {
      problems.push(`high-risk route "${t.route}" (${t.id}, R${t.risk}) names no evidence records — R3+ transport facts must cite the evidence they rest on`);
      continue;
    }
    const missing = ids.filter((id) => !byId.has(id));
    for (const id of missing) problems.push(`high-risk route "${t.route}" (${t.id}) cites unknown evidence id "${id}"`);
    const resolved = ids.filter((id) => byId.has(id)).map((id) => byId.get(id));
    if (resolved.length && !resolved.some((e) => e.source?.access === "fetched")) {
      problems.push(
        `high-risk route "${t.route}" (${t.id}, R${t.risk}) has no evidence with a fetched origin — ` +
          `a trip-critical connection cannot rest on search previews alone`,
      );
    }
  }
  return problems;
}

/** A blocked fetch is honest HISTORY, never current factual authority. Keep the record for the
    audit trail, but retire it explicitly: either reject that evidence record or supersede it with
    a qualifying fetched replacement. This prevents a model from clearing a search-preview finding
    by merely relabeling the same unsupported record "blocked". */
export function blockedCurrentEvidenceProblems(doc) {
  const problems = [];
  const reconciliation = doc.reconciliation || [];
  const byId = new Map((doc.evidence || []).map((record) => [record.id, record]));
  const rejected = new Set(
    reconciliation
      .filter((row) => row.disposition === "reject")
      .map((row) => row.findingId),
  );
  const supersededByQualifyingReplacement = new Set();
  for (const row of reconciliation) {
    if (row.disposition !== "replace" || row.supersedes?.kind !== "evidence") continue;
    const replacement = byId.get(row.findingId);
    if (!qualifyingEvidence(replacement)) continue;
    for (const retiredId of row.supersedes.evidenceIds || []) {
      supersededByQualifyingReplacement.add(retiredId);
    }
  }

  for (const e of doc.evidence || []) {
    if (e.source?.access !== "blocked") continue;
    if (rejected.has(e.id) || supersededByQualifyingReplacement.has(e.id)) continue;
    problems.push(
      `blocked evidence "${e.id}" remains current for "${e.claim.slice(0, 70)}" — blocked access is audit bookkeeping, not proof; fetch a qualifying replacement and supersede this record, or reject it explicitly`,
    );
  }
  return problems;
}

/** Rule: high-risk transport owes the physical reality; routine transit stays simple. */
export function transportProblems(doc) {
  const problems = [];
  for (const t of doc.transport || []) {
    if (t.risk < 3) continue; // forgiving transport stays simple — by design
    const missing = [];
    if (!t.doorToDoor) missing.push("door-to-door route");
    if (!t.transferReality) missing.push("physical transfer reality");
    if (!t.groupLuggageMobility) missing.push("group/luggage/mobility effect");
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
    ...independentAgreementProblems(doc),
    ...yearSafetyProblems(doc),
    ...freshnessProblems(doc),
    ...objectiveFreshnessProblems(doc),
    ...reservationProblems(doc),
    ...sourceAccessProblems(doc),
    ...blockedCurrentEvidenceProblems(doc),
    ...transportProblems(doc),
    ...depthScopeProblems(doc),
    ...passBSubstanceProblems(doc),
    ...disagreementProblems(doc),
  ];
}
