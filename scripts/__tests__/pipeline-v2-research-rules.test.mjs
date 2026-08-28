// M5 of Pipeline V2 — the locked research rules (DECISIONS.md), validated on the V2 evidence
// artifact. Each describe block is one rule with its passing fixture and its violation, so a
// future edit that weakens a rule fails a test that NAMES the decision it came from.

// @protects-file The research rules the creator locked are enforced by code, not prose.

import { describe, it, expect } from "vitest";
import {
  evidenceKindProblems, corroborationProblems, yearSafetyProblems, freshnessProblems,
  objectiveFreshnessProblems, reservationProblems, transportProblems, researchRuleProblems,
  disagreementProblems,
  independentAgreementProblems,
} from "../pipeline/v2/research-rules.mjs";

const record = (over = {}) => ({
  id: "e-1", candidateId: "c-daruma", claim: "Open 11:00–22:00", kind: "objective", origin: "passA",
  source: { url: "https://official.example", kind: "official", language: "ja", publishedAt: "2026-07-01", family: null, independent: null, access: "fetched" },
  verifiedOn: "2026-08-01", firsthand: null,
  freshness: { perishable: true, shelfLife: "hours", recheckOn: "2026-10-30" },
  ...over,
});

const doc = (over = {}) => ({
  schemaVersion: "wp-evidence/2.0", slug: "x", runId: "r",
  candidates: [{ id: "c-daruma", name: "Daruma", branch: null, priority: "food", status: "shipped", shortlisted: true, reason: null, worth: null }],
  evidence: [], reservations: [], transport: [], disagreements: [],
  saturation: null,
  depth: {
    reservations: { requiredCandidateIds: [], notApplicableReason: "no bookable anchor in this fixture" },
    transport: { requiredRouteIds: [], notApplicableReason: "no fragile route in this fixture" },
  },
  passB: {
    nativeLanguage: { used: false, why: "rule fixture does not model destination-language research", searchClasses: [], yield: null },
    noYieldReason: "rule fixture does not model Pass B",
  }, reconciliation: [],
  ...over,
});

describe("objective vs experiential (DECISIONS: 'Objective facts vs traveler experience')", () => {
  it("objective + official/operator/reference passes; objective + firsthand/aggregator fails", () => {
    expect(evidenceKindProblems(doc({ evidence: [record()] }))).toEqual([]);
    expect(evidenceKindProblems(doc({ evidence: [record({ source: { ...record().source, kind: "operator" } })] }))).toEqual([]);
    const bad = evidenceKindProblems(doc({ evidence: [record({ source: { ...record().source, kind: "firsthand" } })] }));
    expect(bad.join()).toMatch(/official, operator or canonical reference/);
    expect(evidenceKindProblems(doc({ evidence: [record({ source: { ...record().source, kind: "aggregator" } })] }))).not.toEqual([]);
  });

  it("an official site pasted onto an experiential claim is a FABRICATED CITATION", () => {
    const bad = evidenceKindProblems(doc({
      evidence: [record({ kind: "experiential", claim: "Never crowded at lunch", source: { ...record().source, kind: "official" } })],
    }));
    expect(bad.join()).toMatch(/fabricated citation/);
  });

  it("experiential + firsthand is the correct pairing", () => {
    expect(evidenceKindProblems(doc({
      evidence: [record({ kind: "experiential", source: { ...record().source, kind: "firsthand" } })],
    }))).toEqual([]);
  });
});

describe("experiential corroboration on shipped candidates (≥2 independent firsthand)", () => {
  const exp = (id, family) => record({
    id, kind: "experiential", claim: "Queue clears by 14:00",
    source: { url: `https://${id}.example`, kind: "firsthand", access: "fetched", language: "ja", publishedAt: "2026-06-01", family, independent: null },
    firsthand: true,
  });

  it("two records from distinct families pass; unknown independence does not", () => {
    expect(corroborationProblems(doc({ evidence: [exp("e-1", "blogA"), exp("e-2", "forumB")] }))).toEqual([]);
    const unknownFamily = [exp("e-1", null), exp("e-2", null)];
    expect(corroborationProblems(doc({ evidence: unknownFamily })).join()).toMatch(/unproven-independent/);
    const sameOrigin = [exp("e-1", null), exp("e-2", null)].map((e, index) => ({
      ...e, source: { ...e.source, url: `https://same.example/post-${index}`, independent: true },
    }));
    expect(corroborationProblems(doc({ evidence: sameOrigin }))).toEqual([]);
    const explicit = [exp("e-1", null), exp("e-2", null)].map((e) => ({ ...e, source: { ...e.source, independent: true } }));
    expect(corroborationProblems(doc({ evidence: explicit }))).toEqual([]); // distinct real origins
  });

  it("a single experiential source on a shipped candidate fails", () => {
    const bad = corroborationProblems(doc({ evidence: [exp("e-1", "blogA")] }));
    expect(bad.join()).toMatch(/≥2 recent independent firsthand/);
  });

  it("copied families count ONCE — two records from one SEO family fail", () => {
    const bad = corroborationProblems(doc({ evidence: [exp("e-1", "seo-listicle-family"), exp("e-2", "seo-listicle-family")] }));
    expect(bad.join()).toMatch(/copied families count once/);
  });

  it("corroboration is owed only where the claim SHIPS — a rejected candidate owes nothing", () => {
    const d = doc({ evidence: [exp("e-1", "blogA")] });
    d.candidates[0].status = "rejected";
    d.candidates[0].reason = "tourist trap";
    expect(corroborationProblems(d)).toEqual([]);
  });
});

describe("cross-pass agreement is not source independence (R-E)", () => {
  const numeric = (id, origin, access, family, host) => record({
    id, origin, claim: "The walk is 600 m", kind: "objective",
    source: { ...record().source, url: `https://${host}/route`, access, family },
  });

  it("rejects the same unsupported number repeated by Pass A and Pass B", () => {
    const records = [
      numeric("a", "passA", "search-preview", null, "official.example"),
      numeric("b", "passB", "search-preview", null, "other.example"),
    ];
    expect(independentAgreementProblems(doc({ evidence: records })).join()).toMatch(/not independent corroboration/);
  });

  it("keeps genuine corroboration from two qualifying independent fetched sources", () => {
    const records = [
      numeric("a", "passA", "fetched", "operator-a", "operator.example"),
      numeric("b", "passB", "fetched", "authority-b", "authority.example"),
    ];
    expect(independentAgreementProblems(doc({ evidence: records }))).toEqual([]);
  });

  it("does not call two passes independent when both cite the same underlying source family", () => {
    const records = [
      numeric("a", "passA", "fetched", "shared-origin", "one.example"),
      numeric("b", "passB", "fetched", "shared-origin", "two.example"),
    ];
    expect(independentAgreementProblems(doc({ evidence: records })).join()).toMatch(/distinct source family/);
  });
});

describe("recurring-event year safety (DECISIONS: 'Freshness')", () => {
  it("a claim naming a year AFTER the source's publish year fails, naming the rule", () => {
    const bad = yearSafetyProblems(doc({
      evidence: [record({ claim: "Festival runs Oct 10–12, 2027", source: { ...record().source, publishedAt: "2026-05-01" } })],
    }));
    expect(bad.join()).toMatch(/appliesToYears/);
  });

  it("a current official advance announcement can explicitly support the future season", () => {
    expect(yearSafetyProblems(doc({
      evidence: [record({ claim: "Festival runs Oct 10–12, 2027", source: { ...record().source, publishedAt: "2026-05-01", appliesToYears: [2027] } })],
    }))).toEqual([]);
  });

  it("a current-year announcement of a current-year date passes", () => {
    expect(yearSafetyProblems(doc({
      evidence: [record({ claim: "Festival runs Oct 10–12, 2026", source: { ...record().source, publishedAt: "2026-05-01" } })],
    }))).toEqual([]);
  });

  it("an undated source cannot confirm a future season without explicit applicability", () => {
    expect(yearSafetyProblems(doc({
      evidence: [record({ claim: "Festival runs Oct 10–12, 2027", source: { ...record().source, publishedAt: null } })],
    })).join()).toMatch(/appliesToYears/);
  });
});

describe("experiential freshness (category-specific aging)", () => {
  it("a firsthand report older than the stale window fails; recent passes; unknown recency cannot ship", () => {
    const old = record({ kind: "experiential", source: { ...record().source, kind: "firsthand", publishedAt: "2023-01-01" }, verifiedOn: "2026-08-01" });
    expect(freshnessProblems(doc({ evidence: [old] })).join()).toMatch(/lead to re-verify/);
    const recent = record({ kind: "experiential", source: { ...record().source, kind: "firsthand", publishedAt: "2026-01-01" }, verifiedOn: "2026-08-01" });
    expect(freshnessProblems(doc({ evidence: [recent] }))).toEqual([]);
    const unknown = record({ kind: "experiential", source: { ...record().source, kind: "firsthand", publishedAt: null } });
    expect(freshnessProblems(doc({ evidence: [unknown] })).join()).toMatch(/recency is unproven/);
  });
});

describe("objective freshness classification", () => {
  it("requires category + future recheck for perishable facts", () => {
    expect(objectiveFreshnessProblems(doc({ evidence: [record({ freshness: null })] })).join()).toMatch(/no freshness classification/);
    expect(objectiveFreshnessProblems(doc({ evidence: [record({ freshness: { perishable: true, shelfLife: "hours", recheckOn: null } })] })).join()).toMatch(/shelfLife/);
    expect(objectiveFreshnessProblems(doc({ evidence: [record()] }))).toEqual([]);
  });
});

describe("reservation depth by importance (DECISIONS: 'Reservations')", () => {
  const reservation = (over = {}) => ({
    candidateId: "c-daruma", importance: "important",
    bookingUrl: "https://book.example", releaseWindow: null, actionDate: null, partyRules: null,
    deposit: null, cancellation: null, foreignFriction: null, lastSeating: null, walkIn: null,
    leads: [], alternatives: null, fallback: null,
    ...over,
  });

  it("casual stops owe nothing — forensic detail for a casual lunch is its own bug", () => {
    expect(reservationProblems(doc({ reservations: [reservation({ importance: "casual", bookingUrl: null })] }))).toEqual([]);
  });

  it("an important finalist with no booking answer fails", () => {
    const bad = reservationProblems(doc({ reservations: [reservation({ bookingUrl: null })] }));
    expect(bad.join()).toMatch(/owes at least a booking method/);
  });

  it("an anchor owes the WHEN (release window/action date) and a fallback", () => {
    const bad = reservationProblems(doc({ reservations: [reservation({ importance: "anchor" })] }));
    expect(bad.join()).toMatch(/no release window or action date/);
    expect(bad.join()).toMatch(/no fallback/);
    const good = reservationProblems(doc({
      reservations: [reservation({
        importance: "anchor", actionDate: "2026-09-01", fallback: "backup venue",
        partyRules: "up to six", deposit: "none", cancellation: "24 hours",
        foreignFriction: "foreign cards accepted", walkIn: "possible at 17:00",
      })],
    }));
    expect(good).toEqual([]);
  });

  it("an unconfirmed lead can NEVER be promoted by relabeling — confirmed owes evidence", () => {
    const bad = reservationProblems(doc({
      reservations: [reservation({ leads: [{ claim: "concierge can book", status: "confirmed", source: null, verifiedOn: null }] })],
    }));
    expect(bad.join()).toMatch(/never promoted by relabeling/);
    const ok = reservationProblems(doc({
      reservations: [reservation({
        leads: [
          { claim: "concierge can book", status: "unconfirmed-lead", source: null, verifiedOn: null },
          { claim: "walk-in works before 18:00", status: "confirmed", source: { url: "https://official.example", kind: "official", language: "en", publishedAt: null, family: null, independent: null }, verifiedOn: "2026-08-01" },
        ],
      })],
    }));
    expect(ok).toEqual([]);
  });
});

describe("high-risk transport robustness (DECISIONS: 'Transportation')", () => {
  const route = (over = {}) => ({
    id: "t-1", route: "Airport → mountain ryokan", risk: 3,
    doorToDoor: "3h10 incl. transfer", transferReality: "8-min platform change with stairs",
    groupLuggageMobility: "six travelers with luggage need the lift route", buffer: "25-min buffer", missedConnection: "next bus +3h",
    nextService: null, lastPracticalReturn: null, fallback: "taxi ¥18,000 flat",
    ...over,
  });

  it("routine transit (R0–R2) owes nothing — it stays simple by design", () => {
    expect(transportProblems(doc({ transport: [route({ risk: 1, fallback: null, missedConnection: null, buffer: null })] }))).toEqual([]);
  });

  it("an R3+ route missing fallback / missed-connection / buffer answers fails, naming each", () => {
    const bad = transportProblems(doc({ transport: [route({ fallback: null, missedConnection: null, buffer: null })] }));
    expect(bad.join()).toMatch(/fallback/);
    expect(bad.join()).toMatch(/missed-connection/);
    expect(bad.join()).toMatch(/timetable connection is not automatically a good connection/);
  });

  it("a complete R4 route passes", () => {
    expect(transportProblems(doc({ transport: [route({ risk: 4 })] }))).toEqual([]);
  });
});

describe("recommendation-changing disagreement", () => {
  it("must resolve before reconciliation can finish", () => {
    expect(disagreementProblems(doc({ disagreements: [{ id: "d-1", topic: "queue reality", impact: "recommendation-changing", investigation: "sources diverged", resolution: null }] })).join()).toMatch(/no resolution/);
  });
});

describe("researchRuleProblems — one call, every rule", () => {
  it("a clean document returns no problems", () => {
    expect(researchRuleProblems(doc({ evidence: [record()] }))).toEqual([]);
  });

  it("aggregates across rules", () => {
    const messy = doc({
      evidence: [
        record({ id: "e-1", kind: "experiential", source: { ...record().source, kind: "official" } }),
        record({ id: "e-2", claim: "Runs May 2027", source: { ...record().source, publishedAt: "2026-01-01" } }),
      ],
      transport: [{ id: "t-1", route: "X", risk: 4, doorToDoor: null, transferReality: null, groupLuggageMobility: null, buffer: null, missedConnection: null, nextService: null, lastPracticalReturn: null, fallback: null }],
    });
    const problems = researchRuleProblems(messy);
    expect(problems.length).toBeGreaterThanOrEqual(3);
  });
});
