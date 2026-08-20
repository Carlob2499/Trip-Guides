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
// P13.1 correction: the P12.1 rewrite itself still promoted the walking prohibition into bus
// exclusivity (the claim text called the bus the one obligatory onward mode, and treated a
// missed bus as an automatic failed same-night arrival). The fetched japan-guide page in fact
// says Kōyasan Station "is a ten minute bus or taxi ride from Koyasan's town center" — so the
// sourced fact is that the final leg must be MOTORIZED (walking is prohibited), with bus and
// taxi BOTH documented modes, and the late-evening availability of either being a per-day fact
// the cited pages do not establish. The fixture now says exactly that, and a scar below pins
// the exclusivity wording out for good.
//
// The route: a late Kansai Airport (KIX) arrival trying to reach Kōyasan (Mt. Kōya) the same
// night. Why this is R3+ — each pillar SOURCED (mapping below), none invented. (Re-evaluated
// at P13.1 without the bus-exclusivity premise: the rating stands on what remains.)
//   • It is a four-segment chain with three physical transfers: KIX → Namba (Nankai airport
//     line) → Kōya Line to Gokurakubashi (most expresses require a transfer at Hashimoto) →
//     Kōyasan Cable Car → a final motorized leg into the temple town.
//   • The final leg must be motorized: japan-guide states (twice) that walking the street
//     connecting the cable-car station with the town centre is not permitted, and documents
//     the onward modes as a ~10-minute bus or taxi ride. A traveller cannot recover on foot;
//     whether a bus or taxi remains at a given evening hour is a per-day fact the cited pages
//     do not establish (required re-check).
//   • The comfortable reserved-seat Limited Express runs only ~2/day; the every-20–30-min
//     express is the realistic evening service and usually adds the Hashimoto transfer.
//   • Kōyasan Station sits at 867 m; luggage crosses every transfer, a cable car, and the
//     final motorized leg.
//   • Consequence: the chain is timing-sensitive end to end. A late miss leaves recovery
//     resting on unverified remaining bus/taxi options, and if the day's motorized options are
//     exhausted the same-night ascent fails and the group re-plans around an overnight stay
//     lower down. (What the sources do NOT establish — and this fixture therefore does NOT
//     claim: that the bus is the exclusive onward mode, that a taxi is or is not available at
//     any particular hour, or any exact last-departure time.)
//
// SOURCE-TO-CLAIM MAPPING (all fetched 2026-08-20, this correction pass):
//   1. https://www.nankai.co.jp/en_railway/traffic/station/gokurakubashi.html (operator, fetched)
//      SUPPORTS: Gokurakubashi is the Kōya Line/cable-car interchange; an on-premises passage
//        connects the train platform to the cable-car platform (physical transfer reality).
//      DOES NOT PROVE: exclusivity of access, timetables, last departures, road/taxi presence.
//   2. https://www.japan-guide.com/e/e4904.html (reference, fetched)
//      SUPPORTS: Limited Express ~2/day, 80 min Namba→Gokurakubashi; express every 20–30 min,
//        ~100 min, most requiring a Hashimoto transfer; cable car ~5 min (¥500); Kōyasan
//        Station is a ~10-minute bus or taxi ride from the town centre (bus ¥460 to
//        Senjuinbashi); walking the connecting street into the town centre is not permitted
//        (stated twice on the page) — so the onward leg is motorized, with bus and taxi the
//        documented modes.
//      DOES NOT PROVE: bus exclusivity (taxi is equally documented); first/last service times;
//        cable-car operating hours; late-evening bus or taxi availability; that a missed bus
//        guarantees a failed same-night arrival.
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
// defer per-day times to its timetable search, and no cited page speaks to late-evening bus or
// taxi availability — so the day's last cable car, last onward bus, and realistic taxi recovery
// are recorded as REQUIRED TRAVELER RE-CHECKS (the ⚠ discipline) and the leg's freshness carries
// a transit recheck date. What is asserted is the structural fragility the fetched sources
// support, and that the validator demands — and accepts — the full door-to-door treatment for it.

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
    "Hashimoto; the cable car up takes about five minutes (¥500). Kōyasan Station is about a " +
    "ten-minute bus or taxi ride from the town centre (bus ¥460 to Senjuinbashi), and walking " +
    "the street connecting the cable-car station with the town centre is not permitted — the " +
    "final leg into town is motorized.",
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
    "most with a Hashimoto transfer) → Kōyasan Cable Car (~5 min) → a ~10-min motorized leg " +
    "into the temple town (bus, ¥460 to Senjuinbashi, or taxi). Segment times sum to ≈2¼–2½ h " +
    "before waits and transfers.",
  transferReality:
    "Three physical transfers: Namba (airport line → Kōya Line), usually Hashimoto (most " +
    "expresses require it), and Gokurakubashi (train platform → cable-car platform via the " +
    "station's own connecting passage). The final leg into the town centre must be motorized — " +
    "walking the connecting street is not permitted — with a ~10-minute bus or taxi ride the " +
    "documented modes.",
  groupLuggageMobility:
    "Suitcases must cross all three transfers, board the cable car, and then a final motorized " +
    "leg (bus or taxi); the chain compounds for low-mobility travellers. A group with luggage " +
    "should not plan this chain against the day's final connections.",
  buffer:
    "Plan the ascent with daylight margin: sourced segment times sum to ≈2¼–2½ h before waits, " +
    "and the reserved-seat Limited Express runs only ~2/day, so an evening KIX arrival leaves " +
    "little slack. Before committing to a same-night ascent, confirm the day's last cable car " +
    "and last onward bus on Nankai's timetable search, and do not lean on a taxi without " +
    "checking locally — none of those per-day facts is published on the pages cited here " +
    "(required re-check).",
  missedConnection:
    "If the planned final connection is missed, recovery on foot is not an option (walking the " +
    "connecting street is not permitted); the documented recoveries are a later bus or a taxi, " +
    "and the cited pages establish neither the day's remaining services nor evening taxi " +
    "availability. A late miss therefore puts the same-night ascent at serious risk: the group " +
    "must verify what bus/taxi options remain in the moment, and if the day's motorized " +
    "options are exhausted, re-plan around an overnight stay lower down.",
  nextService:
    "Not asserted from the cited pages — Nankai defers per-day times to its timetable search, " +
    "and no cited page speaks to evening taxi availability. Required traveler re-check: the " +
    "day's remaining and next-morning cable car and onward bus times, plus realistic taxi " +
    "recovery if the plan would lean on it.",
  lastPracticalReturn:
    "The last practical same-night ascent is the day's final train → cable car → onward bus or " +
    "taxi sequence; its exact times vary by day and are not stated on the cited pages — " +
    "confirm on Nankai's timetable search (and locally, for the final leg) before travel " +
    "(required re-check).",
  fallback:
    "If the evening chain is at risk, stop for the night in Osaka or along the Kōya Line (e.g. " +
    "Hashimoto, the usual transfer point) and ascend in the morning — a fallback that fails " +
    "independently of the same-night timetable. A road-taxi ascent of the mountain itself from " +
    "Gokurakubashi is left as an unverified lead, never the plan: the cited pages document bus " +
    "and taxi only between Kōyasan Station and the town centre, not a valley-to-summit road " +
    "transfer.",
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

  it("P13.1 — a walking prohibition is never promoted into bus exclusivity", () => {
    // Codex's re-inspection caught the P12.1 rewrite doing exactly this: the fetched
    // japan-guide page says the town centre is "a ten minute bus or taxi ride" from the
    // cable-car station, so the sourced fact is a required MOTORIZED transfer, not a required
    // bus — and unknown late-evening availability stays unknown in both directions. Pin the
    // exclusivity wording (and its unavailability mirror-image) out of the fixture for good.
    const text = JSON.stringify(baseDoc());
    expect(text).not.toMatch(/bus is (a )?(mandatory|required)/i);
    expect(text).not.toMatch(/required segment/i);
    expect(text).not.toMatch(/only (the )?bus/i);
    expect(text).not.toMatch(/only access/i);
    expect(text).not.toMatch(/\bno taxi\b/i);
    expect(text).not.toMatch(/taxi(s)?( is| are)? unavailable/i);
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
    // door-to-door obligations lift. The R3 rating here is earned by the sourced fragility
    // stack (timing-sensitive multi-transfer chain, motorized-only final leg with unverified
    // evening recovery, overnight re-plan if the day's options exhaust), not by inflating a
    // routine leg.
    const doc = baseDoc({ transport: [{ ...structuredClone(LEG), risk: 2, evidenceIds: [], fallback: null }] });
    expect(transportProblems(doc)).toEqual([]);
    expect(sourceAccessProblems(doc)).toEqual([]);
  });
});
