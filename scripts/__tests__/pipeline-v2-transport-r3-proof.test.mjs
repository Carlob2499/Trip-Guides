// P12-D / P12.1 — targeted R3+ fragile-transport proof.
//
// The kansai-proof canary never carried a genuine R3+ transport leg (its live transport examples
// were classified below R3), so the R3+ transport architecture was regression-tested at the unit
// level but never proven to ACCEPT a real, robust, fragile route end-to-end. This is that proof,
// taken at the cheapest rung of the Validation Pack ladder that still exercises the real logic:
// a controlled artifact carrying a genuinely fragile transfer, backed by SOURCES ACTUALLY FETCHED
// during this pass, run through the REAL research-rule validator (researchRuleProblems — the same
// function `pipeline-v2 validate` layers on the evidence artifact).
//
// P12.1 correction: the first version of this fixture asserted consequences STRONGER than the
// cited sources support — "the only way up", "no parallel road or rail link", "a missed
// connection means no bed on the mountain" — while its own fallback named a road taxi. Those
// claims are gone. Every material statement below maps to a fetched source, and what the sources
// do NOT prove is stated instead of papered over.
//
// The route: a late Kansai Airport (KIX) arrival trying to reach Kōyasan (Mt. Kōya) the same
// night. Why this is R3+ — each pillar SOURCED (mapping below), none invented:
//   • It is a four-segment chain with three physical transfers: KIX → Namba (Nankai airport
//     line) → Kōya Line to Gokurakubashi (most expresses require a transfer at Hashimoto) →
//     Kōyasan Cable Car → bus into the temple town.
//   • The final bus is MANDATORY, not a convenience: japan-guide states (twice) that walking the
//     street connecting the cable-car station with the town centre is not permitted. A traveller
//     who completes the rail chain but misses the onward bus cannot self-recover on foot.
//   • The comfortable reserved-seat Limited Express runs only ~2/day; the every-20–30-min
//     express is the realistic evening service and usually adds the Hashimoto transfer.
//   • Kōyasan Station sits at 867 m; luggage crosses every transfer, a cable car, and a bus.
//   • Consequence: if the day's last viable connection is missed, the same-night ascent fails
//     and the group must re-plan around an overnight stay lower down. (What the sources do NOT
//     establish — and this fixture therefore does NOT claim: that no road access exists, that a
//     taxi is or is not available in the evening, or any exact last-departure time.)
//
// SOURCE-TO-CLAIM MAPPING (all fetched 2026-08-20, this correction pass):
//   1. https://www.nankai.co.jp/en_railway/traffic/station/gokurakubashi.html (operator, fetched)
//      SUPPORTS: Gokurakubashi is the Kōya Line/cable-car interchange; an on-premises passage
//        connects the train platform to the cable-car platform (physical transfer reality).
//      DOES NOT PROVE: exclusivity of access, timetables, last departures, road/taxi presence.
//   2. https://www.japan-guide.com/e/e4904.html (reference, fetched)
//      SUPPORTS: Limited Express ~2/day, 80 min Namba→Gokurakubashi; express every 20–30 min,
//        ~100 min, most requiring a Hashimoto transfer; cable car ~5 min (¥500); bus ~10 min
//        (¥460 to Senjuinbashi); walking the connecting street into the town centre is not
//        permitted (stated twice on the page).
//      DOES NOT PROVE: first/last service times, cable-car operating hours, taxi availability.
//   3. https://www.nankai.co.jp/en_railway/traffic/kix.html (operator, fetched)
//      SUPPORTS: Nankai links KIX and Namba — Limited Express rapi:t "34 minutes the fastest";
//        Airport Express also runs (its duration is not stated on the page).
//      DOES NOT PROVE: frequencies, fares, last trains.
//   4. https://www.nankai.co.jp/en_railway/traffic/station/koyasan.html (operator, fetched)
//      SUPPORTS: Kōyasan Station sits at 867 m altitude; buses connect the station front with
//        places in Kōyasan.
//      DOES NOT PROVE: bus schedules, hours, walking rules (that is source 2).
//
// No exact last-departure minute is asserted anywhere in this fixture — Nankai's station pages
// defer per-day times to its timetable search, so the last cable car / last onward bus are
// recorded as REQUIRED TRAVELER RE-CHECKS (the ⚠ discipline) and the leg's freshness carries a
// transit recheck date. What is asserted is the structural fragility the fetched sources support,
// and that the validator demands — and accepts — the full door-to-door treatment for it.

import { describe, it, expect } from "vitest";
import { parseOrThrow, evidenceDocSchema } from "../pipeline/v2/contracts.mjs";
import { researchRuleProblems, transportProblems, sourceAccessProblems } from "../pipeline/v2/research-rules.mjs";

const VERIFIED = "2026-08-20";
const RECHECK = "2026-11-15"; // transit-perishable, 87 days — within the 90-day transit window.

// Four evidence records resting on sources genuinely fetched this pass (mapping in the header).
const NANKAI_GOKURAKUBASHI = {
  id: "ev-koya-interchange",
  candidateId: null,
  claim:
    "Gokurakubashi Station is the Kōya Line/cable-car interchange for Kōyasan: the Kōyasan Cable " +
    "Car departs there for Kōyasan Station, and an on-premises passage connects the train " +
    "platform with the cable-car platform.",
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

const JG_ACCESS = {
  id: "ev-koya-services",
  candidateId: null,
  claim:
    "Namba to Gokurakubashi is ~80 min by the reserved-seat Limited Express (about two services a " +
    "day) or ~100 min by the every-20-to-30-minute express, most of which require a transfer at " +
    "Hashimoto; the cable car up takes about five minutes (¥500) and the bus into the temple town " +
    "about ten minutes (¥460 to Senjuinbashi). Walking the street connecting the cable-car " +
    "station with the town centre is not permitted — the bus is a required segment.",
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

const NANKAI_KIX = {
  id: "ev-kix-namba",
  candidateId: null,
  claim:
    "Nankai links Kansai Airport with Namba: the Limited Express rapi:t connects them in 34 " +
    "minutes at the fastest, and Airport Express trains also run (their duration is not stated " +
    "on the operator page).",
  kind: "objective",
  origin: "passA",
  source: {
    url: "https://www.nankai.co.jp/en_railway/traffic/kix.html",
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

const NANKAI_KOYASAN = {
  id: "ev-koyasan-station",
  candidateId: null,
  claim:
    "Kōyasan Station, the cable car's upper terminus, sits at 867 m altitude and is connected " +
    "with places in the town by bus from the station front.",
  kind: "objective",
  origin: "passA",
  source: {
    url: "https://www.nankai.co.jp/en_railway/traffic/station/koyasan.html",
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

// The R3+ transport leg — every door-to-door field populated, all four fetched records cited.
// Timing fields assert NO departure times: the day's last services are explicit re-checks.
const LEG = {
  id: "t-kix-koyasan",
  route: "KIX (evening arrival) → Namba → Gokurakubashi → cable car → Kōyasan temple town",
  risk: 3,
  evidenceIds: ["ev-koya-interchange", "ev-koya-services", "ev-kix-namba", "ev-koyasan-station"],
  doorToDoor:
    "KIX → Nankai to Namba (34 min at the fastest by rapi:t; Airport Express slower) → Kōya Line " +
    "to Gokurakubashi (~80 min Limited Express at ~2/day, or ~100 min express every 20–30 min, " +
    "most with a Hashimoto transfer) → Kōyasan Cable Car (~5 min) → bus into the temple town " +
    "(~10 min, ¥460 to Senjuinbashi). Segment times sum to ≈2¼–2½ h before waits and transfers.",
  transferReality:
    "Three physical transfers: Namba (airport line → Kōya Line), usually Hashimoto (most " +
    "expresses require it), and Gokurakubashi (train platform → cable-car platform via the " +
    "station's own connecting passage). The final leg is a bus, and walking from the cable-car " +
    "station into the town centre is not permitted — the bus is a required segment, not a " +
    "convenience.",
  groupLuggageMobility:
    "Suitcases must cross all three transfers and board both the cable car and a local bus; the " +
    "chain compounds for low-mobility travellers. A group with luggage should not plan this " +
    "chain against the day's final connections.",
  buffer:
    "Plan the ascent with daylight margin: sourced segment times sum to ≈2¼–2½ h before waits, " +
    "and the reserved-seat Limited Express runs only ~2/day, so an evening KIX arrival leaves " +
    "little slack. Before committing to a same-night ascent, confirm the day's last cable car " +
    "and last onward bus on Nankai's timetable search — neither is published on the pages cited " +
    "here (required re-check).",
  missedConnection:
    "If the chain breaks past the day's last viable connection, the same-night ascent fails: " +
    "walking the final stretch into the town centre is not permitted, so a traveller cannot " +
    "self-recover on foot past a missed bus, and the group must re-plan around an overnight " +
    "stay lower down (any bed already booked on the mountain going unused that night).",
  nextService:
    "Not asserted from the cited pages — Nankai defers per-day times to its timetable search. " +
    "Required traveler re-check: the day's remaining and next-morning cable car and onward bus " +
    "times.",
  lastPracticalReturn:
    "The last practical same-night ascent is the day's final train → cable car → bus sequence; " +
    "its exact times vary by day and are not stated on the cited pages — confirm on Nankai's " +
    "timetable search before travel (required re-check).",
  fallback:
    "If the evening chain is at risk, stop for the night in Osaka or along the Kōya Line (e.g. " +
    "Hashimoto, the usual transfer point) and ascend in the morning — a fallback that fails " +
    "independently of the same-night timetable. A road taxi up the mountain is NOT asserted as " +
    "available: no cited source establishes evening taxi service at Gokurakubashi, so it is at " +
    "most an unverified lead, never the plan.",
};

function baseDoc(overrides = {}) {
  return {
    schemaVersion: "wp-evidence/2.1",
    slug: "transport-r3-proof",
    runId: "p12d-proof",
    candidates: [],
    evidence: [
      structuredClone(NANKAI_GOKURAKUBASHI),
      structuredClone(JG_ACCESS),
      structuredClone(NANKAI_KIX),
      structuredClone(NANKAI_KOYASAN),
    ],
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

  it("P12.1 — the fixture makes none of the previously-overstated claims", () => {
    // The independent review flagged these exact overstatements; pin their absence so a future
    // edit cannot quietly reintroduce prose the cited sources do not support.
    const text = JSON.stringify(baseDoc());
    expect(text).not.toMatch(/only way up/i);
    expect(text).not.toMatch(/no parallel road/i);
    expect(text).not.toMatch(/no bed on the mountain/i);
    // And no exact departure minute is asserted anywhere (times like "23:14" would be invented).
    expect(text).not.toMatch(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
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
    // door-to-door obligations lift. The R3 rating here is earned by the sourced consequence
    // stack (mandatory final bus, no walking recovery, overnight re-plan on a miss), not by
    // inflating a routine leg.
    const doc = baseDoc({ transport: [{ ...structuredClone(LEG), risk: 2, evidenceIds: [], fallback: null }] });
    expect(transportProblems(doc)).toEqual([]);
    expect(sourceAccessProblems(doc)).toEqual([]);
  });
});
