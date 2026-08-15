// Tests for scripts/audit/check-facts-hygiene.mjs (B3, docs/PLAN_EVIDENCE_FIRST.md): three
// structural, deterministic flags over a facts.json registry — misattribution candidates,
// malformed (trailing-punctuation) values, and bare section-path echoes. ADVISORY only; this
// checker never fails a build or a `npm run verify` run on its own.
//
// Every threshold here was calibrated against the REAL corpus (korea/us/denmark's actual
// facts.json), not just the Japan regression fixture — see check-facts-hygiene.mjs's own
// comments for the false positives each design choice rules out.

// @protects-file Two facts.json rows sharing a value from different sources, a malformed
// value, or a claim generic enough to cover several different numbers all get surfaced.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  misattributionCandidates,
  malformedValueRows,
  bareEchoRows,
  checkFactsHygiene,
} from "../audit/check-facts-hygiene.mjs";

const FIXTURE_FACTS = fileURLToPath(
  new URL("../../tests/fixtures/japan-regression/guide/facts.json", import.meta.url),
);
const japanFixtureFacts = JSON.parse(readFileSync(FIXTURE_FACTS, "utf8"));

function realFacts(slug) {
  const p = fileURLToPath(new URL(`../../src/content/guides/${slug}/facts.json`, import.meta.url));
  return JSON.parse(readFileSync(p, "utf8"));
}

describe("misattributionCandidates", () => {
  it("catches the frozen fixture's case 9: ¥11,410 attributed to two different sources", () => {
    const found = misattributionCandidates(japanFixtureFacts);
    expect(found).toHaveLength(1);
    expect(found[0].ids.sort()).toEqual(["budget-daily-costs-11-410", "day-by-day-11-410"]);
    expect(found[0].value).toBe("¥11,410");
    expect(found[0].shared.sort()).toEqual(["sendai", "tokyo"]);
  });

  it("does not flag the same value from the SAME source (that's a normal shared fact)", () => {
    const facts = {
      "a-1": { claim: "Sights → Museum entry — $10", value: "$10", source_url: "https://x.example/", verified_on: "2026-01-01", shelf_life: "venue" },
      "a-2": { claim: "Day plan → Museum stop — $10", value: "$10", source_url: "https://x.example/", verified_on: "2026-01-01", shelf_life: "venue" },
    };
    expect(misattributionCandidates(facts)).toEqual([]);
  });

  it("does not flag the same value under UNRELATED claims (no shared significant words)", () => {
    const facts = {
      "a-1": { claim: "Food & dining → Dinner at Trattoria Roma — $50", value: "$50", source_url: "https://a.example/", verified_on: "2026-01-01", shelf_life: "default" },
      "a-2": { claim: "Sights → Museum entry — $50", value: "$50", source_url: "https://b.example/", verified_on: "2026-01-01", shelf_life: "venue" },
    };
    expect(misattributionCandidates(facts)).toEqual([]);
  });

  it("does not flag on a SINGLE shared word — the threshold is 2, on purpose", () => {
    const facts = {
      "a-1": { claim: "Getting around → Seoul metro day pass — ₩5,000", value: "₩5,000", source_url: "https://a.example/", verified_on: "2026-01-01", shelf_life: "transit" },
      "a-2": { claim: "Day by day → Seoul city walk — ₩5,000", value: "₩5,000", source_url: "https://b.example/", verified_on: "2026-01-01", shelf_life: "transit" },
    };
    expect(misattributionCandidates(facts)).toEqual([]);
  });

  it("ignores the reserved traveler-origin row", () => {
    const facts = {
      "traveler-origin": { claim: "Traveler origin", value: "EWR", state: "confirmed" },
      "a-1": { claim: "Flights → Tokyo Sendai route — $90", value: "$90", source_url: "https://a.example/", verified_on: "2026-01-01", shelf_life: "transit" },
    };
    expect(misattributionCandidates(facts)).toEqual([]);
  });

  it("produces ZERO findings across every real, shipped guide's facts.json", () => {
    for (const slug of ["korea", "us", "denmark"]) {
      expect(misattributionCandidates(realFacts(slug)), `${slug} should have no misattribution candidates`).toEqual([]);
    }
  });
});

describe("malformedValueRows", () => {
  it("catches the frozen fixture's three known malformed values", () => {
    const found = malformedValueRows(japanFixtureFacts).map((f) => f.id).sort();
    expect(found).toEqual(["budget-daily-costs-80", "money-currency-1", "phone-data-19"]);
  });

  it("does not flag a clean value", () => {
    const facts = { a: { claim: "X — $10", value: "$10" } };
    expect(malformedValueRows(facts)).toEqual([]);
  });

  it("flags a trailing period as well as a trailing comma", () => {
    const facts = { a: { claim: "X — ₩6,000.", value: "₩6,000." } };
    expect(malformedValueRows(facts).map((f) => f.id)).toEqual(["a"]);
  });

  it("the whole published corpus is now free of malformed values — the five B3 found are FIXED", () => {
    // B3 flagged 5 rows that predated B2's regex fix (korea 4: day-by-day-6-000,
    // day-by-day-22-000-2, where-to-eat-1-500, where-to-eat-2-500; us 1:
    // budget-daily-costs-143). E1 promoted that flag toward a gate, so they were repaired
    // rather than carried: in every case the swallowed character was load-bearing SENTENCE
    // punctuation, so the fix MOVED it out of `value`/`claim` and back into the prose after
    // the {{fact:}} token — never a silent delete, which would have produced
    // "Taxi: ~10 min, ₩6,000" with no full stop and "spa, ₩22,000 22 sauna rooms".
    // This assertion is the guard that they stay fixed.
    for (const slug of ["korea", "us", "denmark"]) {
      expect(malformedValueRows(realFacts(slug)), `${slug} malformed`).toEqual([]);
    }
  });
});

describe("bareEchoRows", () => {
  it("catches the frozen fixture's three bare, repeated stems", () => {
    const found = bareEchoRows(japanFixtureFacts).map((b) => b.stem).sort();
    expect(found).toEqual(["Local essentials", "Money & currency", "Phone & data"]);
  });

  it("does not flag a bare stem used for only ONE value", () => {
    const facts = { a: { claim: "Visiting tips — $10", value: "$10" } };
    expect(bareEchoRows(facts)).toEqual([]);
  });

  it("does not flag a claim WITH a leaf (a → segment) even if it repeats", () => {
    // Two different Namsan cable car prices ($10 / ₩12,000) sharing a specific leaf claim is
    // normal (adult vs child pricing, or two currencies) — the leaf makes it identifiable.
    const facts = {
      a: { claim: "Budget & daily costs → Namsan cable car (round-trip) — $10", value: "$10" },
      b: { claim: "Budget & daily costs → Namsan cable car (round-trip) — ₩12,000", value: "₩12,000" },
    };
    expect(bareEchoRows(facts)).toEqual([]);
  });

  it("stays clean across the shipped corpus (guard against new bare-echo groups)", () => {
    // korea and denmark used to carry real structural section-path echoes — e.g. Korea's
    // "Money & currency" covering five different FX benchmarks with nothing to tell them
    // apart. Fixed 2026-08-15 by giving every claim a disambiguating leaf phrase. This
    // assertion is the guard that they stay fixed; a new bare-echo group here means a new
    // claim was written without a leaf, not that the checker regressed.
    for (const slug of ["korea", "us", "denmark"]) {
      expect(bareEchoRows(realFacts(slug)), `${slug} bare echo`).toEqual([]);
    }
  });
});

describe("checkFactsHygiene (roll-up)", () => {
  it("reports n/a for a guide with no facts.json", () => {
    expect(checkFactsHygiene(null)).toEqual({ status: "n/a", misattribution: [], malformed: [], bareEcho: [] });
  });

  it("reports clean when a facts.json has none of the three defect classes", () => {
    const facts = { a: { claim: "Sights → Museum entry — $10", value: "$10", source_url: "https://x.example/" } };
    const r = checkFactsHygiene(facts);
    expect(r.status).toBe("clean");
    expect(r.misattribution).toEqual([]);
    expect(r.malformed).toEqual([]);
    expect(r.bareEcho).toEqual([]);
  });

  it("the frozen Japan fixture triggers all three distinct flag classes (≥3 findings)", () => {
    const r = checkFactsHygiene(japanFixtureFacts);
    expect(r.status).toBe("advisory");
    expect(r.misattribution.length).toBeGreaterThanOrEqual(1);
    expect(r.malformed.length).toBeGreaterThanOrEqual(1);
    expect(r.bareEcho.length).toBeGreaterThanOrEqual(1);
    const total = r.misattribution.length + r.malformed.length + r.bareEcho.length;
    expect(total).toBeGreaterThanOrEqual(3);
  });

  it("the published corpus now carries ONLY bare-echo findings — every acting-on-a-wrong-fact class is clear", () => {
    // The corpus snapshot moved once E1 repaired the five malformed values. What remains is
    // `bareEcho` alone: claims shaped like their section path ("Local essentials — ¥1,000"),
    // defect D4. That is a NAMING smell, not a wrong fact, which is exactly why E1 left it
    // advisory while promoting misattribution and malformed values toward a gate.
    // us came out fully clean; korea (7) and denmark (3) keep bare-echo rows only.
    for (const slug of ["korea", "us", "denmark"]) {
      const r = checkFactsHygiene(realFacts(slug));
      expect(r.misattribution, `${slug} misattribution`).toEqual([]);
      expect(r.malformed, `${slug} malformed`).toEqual([]);
      expect(r.status, `${slug} status`).toBe(r.bareEcho.length ? "advisory" : "clean");
    }
    expect(checkFactsHygiene(realFacts("us")).status).toBe("clean");
  });
});
