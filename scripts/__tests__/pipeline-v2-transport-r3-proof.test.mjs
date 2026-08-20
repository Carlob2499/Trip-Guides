// P12-D — targeted R3+ fragile-transport proof.
//
// The kansai-proof canary never carried a genuine R3+ transport leg (its live transport examples
// were classified below R3), so the R3+ transport architecture was regression-tested at the unit
// level but never proven to ACCEPT a real, robust, fragile route end-to-end. This is that proof,
// taken at the cheapest rung of the Validation Pack ladder that still exercises the real logic:
// a controlled artifact carrying a genuinely fragile transfer, backed by SOURCES ACTUALLY FETCHED
// during this pass, run through the REAL research-rule validator (researchRuleProblems — the same
// function `pipeline-v2 validate` layers on the evidence artifact).
//
// The route: a late Kansai Airport (KIX) arrival trying to reach Kōyasan (Mt. Kōya) the same
// night. Why this is genuinely R3+ (risk earned by consequence, not inflated to satisfy a test):
//   • Kōyasan town sits on a mountain reachable ONLY by the Nankai Kōya Line to Gokurakubashi,
//     then the Kōyasan cable car up, then a bus into the temple town — a single-mode chain with
//     no parallel road/rail at the cable-car segment (Nankai's own station page: the cable car
//     is THE link from Gokurakubashi).
//   • The comfortable reserved-seat "Limited Express Kōya" runs only ~2 trains/day; the ordinary
//     express/rapid runs every 20–30 min (japan-guide access page). Namba→Kōyasan is ~2 h before
//     the 5-min cable car and 10-min bus into town.
//   • The cable car does not run overnight. Miss the last one and there is no rail/cable access to
//     the mountain town until the next morning — a missed connection means no bed on the mountain,
//     not merely a later arrival. Luggage over a transfer + cable car + mountain bus compounds it.
//
// SOURCES (fetched 2026-08-20, this pass):
//   • https://www.nankai.co.jp/en_railway/traffic/station/gokurakubashi.html (Nankai, operator) —
//     confirms the Kōyasan cable car is the link up from Gokurakubashi Station. HTTP 200, read.
//   • https://www.japan-guide.com/e/e4904.html (reference) — Kōya Line every 20–30 min, Limited
//     Express only 2 trains/day, ~2 h Namba→Kōyasan + 5-min cable car + 10-min bus (460 yen to
//     Senjuinbashi). HTTP 200, read.
//
// The exact last-cable-car clock time is NOT asserted here — Nankai defers per-day times to its
// Ekitan timetable, so a specific departure minute is left as a re-check (the ⚠ discipline), and
// the leg's freshness carries a transit recheck date. What is asserted is the STRUCTURAL fragility
// the fetched sources support, and that the validator demands — and accepts — the full door-to-door
// treatment for it.

import { describe, it, expect } from "vitest";
import { parseOrThrow, evidenceDocSchema } from "../pipeline/v2/contracts.mjs";
import { researchRuleProblems, transportProblems, sourceAccessProblems } from "../pipeline/v2/research-rules.mjs";

const VERIFIED = "2026-08-20";
const RECHECK = "2026-11-15"; // transit-perishable, 87 days — within the 90-day transit window.

// Two evidence records resting on sources genuinely fetched this pass.
const NANKAI = {
  id: "ev-koya-cable",
  candidateId: null,
  claim:
    "From Gokurakubashi Station, the only way up to Kōyasan Station and the temple town is the " +
    "Nankai Kōyasan cable car — the mountain segment has no parallel road or rail link.",
  kind: "objective",
  origin: "passA",
  source: {
    url: "https://www.nankai.co.jp/en_railway/traffic/station/gokurakubashi.html",
    kind: "operator",
    access: "fetched",
    language: "en",
    publishedAt: null,
    family: "nankai",
    independent: true,
    appliesToYears: [],
  },
  verifiedOn: VERIFIED,
  firsthand: null,
  freshness: { perishable: true, shelfLife: "transit", recheckOn: RECHECK },
};

const JG_FREQ = {
  id: "ev-koya-frequency",
  candidateId: null,
  claim:
    "The Nankai Kōya Line runs every 20–30 minutes by express/rapid but the reserved-seat Limited " +
    "Express Kōya runs only about two services a day; Namba to Kōyasan is roughly two hours before " +
    "the short cable car and the bus into the temple town.",
  kind: "objective",
  origin: "passA",
  source: {
    url: "https://www.japan-guide.com/e/e4904.html",
    kind: "reference",
    access: "fetched",
    language: "en",
    publishedAt: null,
    family: "japan-guide",
    independent: true,
    appliesToYears: [],
  },
  verifiedOn: VERIFIED,
  firsthand: null,
  freshness: { perishable: true, shelfLife: "transit", recheckOn: RECHECK },
};

// The R3+ transport leg — every door-to-door field populated, both fetched records cited.
const LEG = {
  id: "t-kix-koyasan",
  route: "KIX (evening arrival) → Namba → Gokurakubashi → cable car → Kōyasan temple town",
  risk: 3,
  evidenceIds: ["ev-koya-cable", "ev-koya-frequency"],
  doorToDoor:
    "KIX → Nankai to Namba (~45 min) → Kōya Line to Gokurakubashi (~1h40 by express, transfer at " +
    "Hashimoto off-peak) → Kōyasan cable car (5 min) → Nankai Rinkan bus to Senjuinbashi (~10 min, " +
    "460 yen). Budget ~3h door to door, more with an evening arrival and luggage.",
  transferReality:
    "Three physical transfers (Namba concourse, Hashimoto/Gokurakubashi platform-to-cable, cable-to-bus). " +
    "The cable car and mountain bus are small; a group with suitcases boards slowly and may not all make one car.",
  groupLuggageMobility:
    "Suitcases must be hauled up station stairs and squeezed onto the cable car and a compact mountain " +
    "bus; low-mobility travellers find the evening chain hard. A daytime departure removes most of this risk.",
  buffer:
    "Leave Namba by early-to-mid afternoon to hold a full margin before the last cable car; an evening KIX " +
    "arrival erodes that buffer and should not be attempted the same night without confirming the last service.",
  missedConnection:
    "Miss the last cable car and there is no rail/cable access to the mountain town until the next morning — " +
    "the consequence is no bed on the mountain that night, not a later arrival.",
  nextService: "First cable car the following morning; overnight there is no way up.",
  lastPracticalReturn:
    "The last practical same-night ascent is the final evening cable car (exact minute varies by day — " +
    "confirm on Nankai's Ekitan timetable before travel); after it, plan to stay near Gokurakubashi/Hashimoto.",
  fallback:
    "If the last cable car is at risk, stop for the night in Hashimoto or central Osaka and ascend in the " +
    "morning, or (daytime only, budget permitting) take a road taxi toward the mountain — slower and costly " +
    "but road-independent of the cable timetable. Do not gamble the last connection with luggage and a group.",
};

function baseDoc(overrides = {}) {
  return {
    schemaVersion: "wp-evidence/2.1",
    slug: "transport-r3-proof",
    runId: "p12d-proof",
    candidates: [],
    evidence: [structuredClone(NANKAI), structuredClone(JG_FREQ)],
    reservations: [],
    transport: [structuredClone(LEG)],
    disagreements: [],
    depth: {
      reservations: {
        requiredCandidateIds: [],
        notApplicableReason: "This proof exercises the R3+ transport rule only; no reservations are in scope.",
      },
      transport: { requiredRouteIds: ["t-kix-koyasan"], notApplicableReason: null },
    },
    saturation: { stopped: true, trend: "duplicates", unresolvedCouldChange: false, note: "Transport-only proof slug." },
    passB: {
      nativeLanguage: { used: false, why: "Structural route facts came from the operator and an English reference; no resident-only angle was needed for this proof.", searchClasses: [], yield: null },
      noYieldReason: "This proof exercises the transport rule only; no Pass B research was run.",
    },
    reconciliation: [],
    ...overrides,
  };
}

describe("P12-D — a genuine R3+ fragile transfer is schema-valid and the real validator accepts it", () => {
  it("the artifact parses against the live evidence schema (wp-evidence/2.1)", () => {
    expect(() => parseOrThrow(evidenceDocSchema, baseDoc(), { what: "P12-D evidence" })).not.toThrow();
  });

  it("the real research-rule validator accepts the route with NO problems", () => {
    const doc = parseOrThrow(evidenceDocSchema, baseDoc(), { what: "P12-D evidence" });
    // The two rules that govern R3+ transport are clean...
    expect(transportProblems(doc)).toEqual([]);
    expect(sourceAccessProblems(doc)).toEqual([]);
    // ...and so is the whole layered research-rule pass (no problem hides among the others).
    expect(researchRuleProblems(doc)).toEqual([]);
  });

  it("the R3+ leg names evidence that resolves to at least one genuinely fetched origin", () => {
    const doc = baseDoc();
    const ids = new Set(doc.evidence.map((e) => e.id));
    const leg = doc.transport[0];
    expect(leg.risk).toBeGreaterThanOrEqual(3);
    expect(leg.evidenceIds.every((id) => ids.has(id))).toBe(true);
    const cited = doc.evidence.filter((e) => leg.evidenceIds.includes(e.id));
    expect(cited.some((e) => e.source.access === "fetched")).toBe(true);
  });
});

// The acceptance above is EARNED, not vacuous: degrade any pillar of the door-to-door treatment and
// the same real validator rejects the route. Each control flips exactly one field.
describe("P12-D — the validator rejects a degraded version of the same route (acceptance is earned)", () => {
  it("dropping the fallback is rejected", () => {
    const doc = baseDoc({ transport: [{ ...structuredClone(LEG), fallback: null }] });
    expect(transportProblems(doc).some((p) => /fallback/.test(p))).toBe(true);
  });

  it("dropping every timing anchor (buffer + next service + last return) is rejected", () => {
    const doc = baseDoc({ transport: [{ ...structuredClone(LEG), buffer: null, nextService: null, lastPracticalReturn: null }] });
    expect(transportProblems(doc).some((p) => /buffer \/ next service \/ last practical return/.test(p))).toBe(true);
  });

  it("dropping the missed-connection consequence is rejected", () => {
    const doc = baseDoc({ transport: [{ ...structuredClone(LEG), missedConnection: null }] });
    expect(transportProblems(doc).some((p) => /missed-connection consequence/.test(p))).toBe(true);
  });

  it("citing no evidence for an R3+ leg is rejected", () => {
    const doc = baseDoc({ transport: [{ ...structuredClone(LEG), evidenceIds: [] }] });
    expect(sourceAccessProblems(doc).some((p) => /names no evidence/.test(p))).toBe(true);
  });

  it("resting the leg only on a search-preview source (nothing fetched) is rejected", () => {
    const doc = baseDoc();
    doc.evidence = doc.evidence.map((e) => ({ ...e, source: { ...e.source, access: "search-preview" } }));
    expect(sourceAccessProblems(doc).some((p) => /no evidence with a fetched origin/.test(p))).toBe(true);
  });

  it("a mirror/proxy URL can never stand in as the fetched origin", () => {
    const doc = baseDoc();
    doc.evidence[0] = { ...doc.evidence[0], source: { ...doc.evidence[0].source, url: "https://web.archive.org/web/2026/https://www.nankai.co.jp/x" } };
    expect(sourceAccessProblems(doc).some((p) => /mirror cannot count as the origin/.test(p))).toBe(true);
  });

  it("the SAME route below R3 owes nothing — depth is risk-earned, not always-on", () => {
    // Proof the rule does not simply demand detail everywhere: drop the route to R2 and the
    // door-to-door obligations lift. The R3 rating here is earned by the missed-connection
    // consequence (no bed on the mountain), not by inflating a routine leg.
    const doc = baseDoc({ transport: [{ ...structuredClone(LEG), risk: 2, evidenceIds: [], fallback: null }] });
    expect(transportProblems(doc)).toEqual([]);
    expect(sourceAccessProblems(doc)).toEqual([]);
  });
});
