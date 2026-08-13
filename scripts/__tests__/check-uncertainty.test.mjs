// Tests for E3 (docs/PLAN_EVIDENCE_FIRST.md) — does the GUIDE ship the contradictions and
// uncertainties C2 gates at intake? Every case here is one the japan guide DISCLOSES honestly
// in prose and still fails, because prose an author remembered to write is not a field
// anything can re-check or expire. The calibration facts are pinned too: each detector was
// measured against the real corpus before being trusted (the B3 lesson).

// @protects-file A guide cannot be published quoting forecasts, weak sources, or unresolved contradictions as if they were settled.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  forecastFactsUnregistered,
  stageBurst,
  weaklySupportedLedgerRows,
  unresolvedContradictions,
  evaluateUncertainty,
} from "../audit/check-uncertainty.mjs";

const fixture = (f) =>
  JSON.parse(readFileSync(new URL(`../../tests/fixtures/japan-regression/${f}`, import.meta.url), "utf8"));
const fixtureText = (f) =>
  readFileSync(new URL(`../../tests/fixtures/japan-regression/${f}`, import.meta.url), "utf8");

describe("forecastFactsUnregistered — regression case 4", () => {
  it("flags a forecast term quoted with dates but backed by no fact row", () => {
    const sections = [{ title: "Day by day", body: "Sapporo's official koyo average peak (Oct 28–Nov 5)." }];
    expect(forecastFactsUnregistered(sections, {}).map((f) => f.code)).toEqual(["forecast-unregistered"]);
  });

  it("matches BOTH orders — guides write the date before the term as often as after", () => {
    // "a reliable mid-Oct–early-Nov foliage peak" is the fixture's own phrasing, and a
    // term-then-date-only pattern missed half its evidence.
    const after = [{ title: "A", body: "koyo peaks around Oct 28." }];
    const before = [{ title: "B", body: "a reliable mid-Oct–early-Nov foliage peak." }];
    expect(forecastFactsUnregistered(after, {})).toHaveLength(1);
    expect(forecastFactsUnregistered(before, {})).toHaveLength(1);
  });

  it("is silent when a fact row DOES cover the term — korea's fact-backed monsoon claims", () => {
    const sections = [{ title: "Holidays", body: "Monsoon season runs Jun 24 onward." }];
    const facts = { "monsoon-x": { claim: "Monsoon window", value: "late Jun" } };
    expect(forecastFactsUnregistered(sections, facts)).toEqual([]);
  });

  it("does NOT treat a time of day as a seasonal date — the mid-morning false positive", () => {
    // `mid-\w+` matches "mid-morning"; restricting the prefix to month names is what keeps
    // itinerary prose out of a seasonal-forecast gate. Caught during calibration, not review.
    const sections = [{ title: "A", body: "Autumn foliage is best viewed mid-morning here." }];
    expect(forecastFactsUnregistered(sections, {})).toEqual([]);
  });

  it("reports each term once, not once per section", () => {
    const sections = [
      { title: "A", body: "koyo peaks Oct 28." },
      { title: "B", body: "more koyo around Nov 5." },
    ];
    expect(forecastFactsUnregistered(sections, {})).toHaveLength(1);
  });
});

describe("stageBurst — regression case 8", () => {
  const burst = { stages: { passA: "2026-07-29T10:32:26.640Z", passB: "2026-07-29T10:32:26.675Z" } };

  it("flags consecutive stages checkpointed under the floor", () => {
    const f = stageBurst(burst);
    expect(f).toHaveLength(1);
    expect(f[0].code).toBe("stage-burst");
  });

  it("is silent on genuine gaps — real runs are thousands of seconds apart", () => {
    expect(stageBurst({ stages: { passA: "2026-07-29T09:12:03.464Z", passB: "2026-07-29T10:32:26.640Z" } })).toEqual([]);
  });

  it("ignores absent stages and a missing state file entirely", () => {
    expect(stageBurst({ stages: { passA: "2026-07-29T10:32:26.640Z" } })).toEqual([]);
    expect(stageBurst(null)).toEqual([]);
  });
});

describe("weaklySupportedLedgerRows — regression case 7", () => {
  const ledger = (row) => `## Research reconciliation\n\n| Item | A | B | Verdict |\n|---|---|---|---|\n${row}\n\n## Amendments\n`;

  it("flags a row that is B-only AND self-flagged as not directly fetched", () => {
    const md = ledger("| Sapporo birthday dinner | — (not researched in A) | 3 write-ups converge | B-only, ⚠ not directly fetched |");
    const f = weaklySupportedLedgerRows(md);
    expect(f).toHaveLength(1);
    expect(f[0].msg).toMatch(/Sapporo birthday dinner/);
  });

  it("does NOT flag a B-only row that WAS fetched — B-only is normal, unverified is not", () => {
    expect(weaklySupportedLedgerRows(ledger("| Ramen shop | — | official site | B-only, verified T0 |"))).toEqual([]);
  });

  it("is silent on an intake with no reconciliation ledger", () => {
    expect(weaklySupportedLedgerRows("# Intake\n\n## Amendments\n")).toEqual([]);
  });
});

describe("unresolvedContradictions — regression case 2", () => {
  const c = [{ id: "dates-range" }];

  it("flags a contradiction with no question block recording an assumption", () => {
    expect(unresolvedContradictions("# Intake\n", c).map((f) => f.code)).toEqual(["contradiction-unresolved"]);
  });

  it("is satisfied once the intake carries a q-block with an **Assumed:** line", () => {
    const md = "# Intake\n\n### q-japan-1\n- **Q:** Which start date?\n- **Assumed:** Oct 15, flagged ⚠\n- **Status:** open\n";
    expect(unresolvedContradictions(md, c)).toEqual([]);
  });

  it("says nothing when C2 found no contradictions at all", () => {
    expect(unresolvedContradictions("# Intake\n", [])).toEqual([]);
  });
});

describe("evaluateUncertainty — the warn-first split", () => {
  const inputs = { state: { stages: { passA: "2026-07-29T10:32:26.640Z", passB: "2026-07-29T10:32:26.675Z" } } };

  it("BLOCKS on a draft and only ADVISES on a published guide, with identical findings", () => {
    expect(evaluateUncertainty({ ...inputs, enforce: true }).status).toBe("fail");
    const pub = evaluateUncertainty({ ...inputs, enforce: false });
    expect(pub.status).toBe("advisory");
    expect(pub.findings).toHaveLength(1);
  });

  it("passes a guide with nothing to say — an empty artifact set is not a finding", () => {
    expect(evaluateUncertainty({ enforce: true }).status).toBe("pass");
  });
});

// ── ACCEPTANCE, against the frozen A1 fixture ────────────────────────────────────────────
// The packet's bar is "cases 2, 4, 7, 8 detected". Asserted against the real frozen evidence
// so the gate cannot drift away from the corpus it was built to catch.
describe("E3 ACCEPTANCE — the frozen japan-regression fixture", async () => {
  const { checkIntakeContradictions } = await import("../audit/check-intake-contradictions.mjs");
  const sections = ["03-sights.json", "06-days.json"].flatMap((f) => {
    const j = fixture(`guide/${f}`);
    return Array.isArray(j) ? j : j.sections || [];
  });
  const intakeMd = fixtureText("intake/japan.md");
  const r = evaluateUncertainty({
    sections,
    facts: fixture("guide/facts.json"),
    intakeMd,
    state: fixture("intake/japan.state.json"),
    contradictions: checkIntakeContradictions(intakeMd).findings ?? [],
    enforce: true,
  });

  it("fails the fixture outright", () => {
    expect(r.status).toBe("fail");
  });

  it("case 4 — koyo and foliage quoted with dates, zero fact rows covering them", () => {
    const terms = r.findings.filter((f) => f.code === "forecast-unregistered").map((f) => f.msg).join(" ");
    expect(terms).toMatch(/koyo/);
    expect(terms).toMatch(/foliage/);
  });

  it("case 8 — passA/passB/reconcile checkpointed 71ms apart across three stages", () => {
    expect(r.findings.filter((f) => f.code === "stage-burst")).toHaveLength(2);
  });

  it("case 7 — the Sapporo birthday dinner shipped on Pass B convergence alone", () => {
    expect(r.findings.find((f) => f.code === "weak-support")?.msg).toMatch(/Sapporo birthday dinner/);
  });

  it("case 2 — the unresolved Oct 15 / Oct 22 start-date range", () => {
    expect(r.findings.some((f) => f.code === "contradiction-unresolved")).toBe(true);
  });
});
