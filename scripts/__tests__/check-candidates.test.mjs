// Tests for the candidates-table gate (standards S2/S3), floor-free by doctrine: pre-standard
// guides are n/a (never retro-failed); an empty section on a post-standard guide FAILS; a
// "shipped" row whose name appears nowhere in the guide is a finding; and NO quantity ever is
// (DECISIONS.md "Research breadth" — the 2026-08-20 correction pass removed the env-gated V1
// floors that had outlived the 2026-08-17 repo-wide removal decision).

// @protects-file Proposed venues are checked before they can enter a guide.

import { describe, it, expect } from "vitest";
import { parseCandidates, judgeCandidates } from "../check-candidates.mjs";

const table = (rank, name, rows) =>
  `### Priority ${rank}: ${name}\n\n| Candidate | Verdict |\n|-----------|---------|\n` +
  rows.map(([c, v]) => `| ${c} | ${v} |`).join("\n") + "\n";

// D3: the 3-column format — rows are [name, verdict, shortlist ("y"/"n"/"")].
const table3 = (rank, name, rows) =>
  `### Priority ${rank}: ${name}\n\n| Candidate | Verdict | Shortlist |\n|---|---|---|\n` +
  rows.map(([c, v, s]) => `| ${c} | ${v} | ${s} |`).join("\n") + "\n";

const doc = (...tables) => `# Intake\n\n## Candidates considered (fill DURING research)\n> blurb\n\n${tables.join("\n")}\n## Amendments\n- none\n`;

describe("parseCandidates", () => {
  it("returns null when the section is absent — a pre-standard guide is n/a, never failed", () => {
    expect(parseCandidates("# Intake\n\n## Amendments\n")).toBeNull();
  });

  it("parses per-priority tables, skipping header and separator rows", () => {
    const t = parseCandidates(doc(table(1, "Food", [["Shin Shin", "shipped"], ["Ippudo", "rejected: chain, tourist-priced"]])));
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ rank: 1, priority: "Food" });
    expect(t[0].rows).toEqual([
      { name: "Shin Shin", verdict: "shipped", shortlisted: null },
      { name: "Ippudo", verdict: "rejected: chain, tourist-priced", shortlisted: null },
    ]);
  });

  it("stops at the next ## section — Amendments rows never leak in", () => {
    const t = parseCandidates(doc(table(1, "Food", [["A", "shipped"]])));
    expect(t[0].rows).toHaveLength(1);
  });
});

describe("judgeCandidates", () => {
  const rows = (n, shipped) => Array.from({ length: n }, (_, i) => [`Cand ${i}`, i < shipped ? "shipped" : "rejected: no source"]);
  const bigTable = parseCandidates(doc(table(1, "Food", rows(16, 8))));
  const guideText = rows(16, 8).filter(([, v]) => v === "shipped").map(([c]) => c).join(" ");

  it("passes a big honest table, with every shipped name present in the guide", () => {
    const r = judgeCandidates(bigTable, { guideText });
    expect(r.status).toBe("pass");
    expect(r.summary[0]).toMatchObject({ considered: 16, shipped: 8 });
  });

  it("a SMALL honest consideration set passes — no quantity is ever a finding (floorless doctrine)", () => {
    // Andorra la Vella's 5 serious culture candidates are not a defect; a floor of 16 was.
    // Thinness protection is the saturation record + the structural anti-fabrication checks
    // (DECISIONS.md "Research breadth"; the 2026-08-20 correction pass removed the last floors).
    const r = judgeCandidates(parseCandidates(doc(table(1, "Food", rows(5, 5)))), { guideText: "Cand 0 Cand 1 Cand 2 Cand 3 Cand 4" });
    expect(r.status).toBe("pass");
    expect(r.findings.join("\n")).not.toMatch(/floor/i);
  });

  it("fails a shipped row that appears nowhere in the guide — the anti-padding cross-check", () => {
    const r = judgeCandidates(bigTable, { guideText: guideText.replace("Cand 0", "") });
    expect(r.status).toBe("fail");
    expect(r.findings.join("\n")).toMatch(/"Cand 0" is marked shipped but appears nowhere/);
  });

  it("a branch-qualified ledger name matches its base name in the guide (V2 canary scar)", () => {
    // "Wanaka (Dotonbori)" in the ledger ships as plain "Wanaka" in the guide — the qualifier
    // must not read as a phantom recommendation; a genuinely absent name must still fail.
    const table1 = table(1, "Food", [["Wanaka (Dotonbori)", "shipped"], ...rows(16, 8).slice(1)]);
    const present = judgeCandidates(parseCandidates(doc(table1)), { guideText: `Wanaka ${guideText}` });
    expect(present.findings.join("\n")).not.toMatch(/Wanaka/);
    const absent = judgeCandidates(parseCandidates(doc(table1)), { guideText });
    expect(absent.findings.join("\n")).toMatch(/"Wanaka \(Dotonbori\)" is marked shipped but appears nowhere/);
  });

  it("a canonical shipped-name contract accepts formatting noise but rejects descriptive labels (R-D)", () => {
    const canonicalNames = new Set(["Tsukiji Outer Market", "Tottori Sand Dunes"]);
    const formatted = parseCandidates(doc(table(1, "Food", [["**Tsukiji Outer Market**", "shipped"]])));
    expect(judgeCandidates(formatted, { guideText: "Tsukiji Outer Market", canonicalNames }).status).toBe("pass");

    const descriptive = parseCandidates(doc(table(1, "Transit", [["Camel commute", "shipped"]])));
    const result = judgeCandidates(descriptive, { guideText: "Try the Camel commute option", canonicalNames });
    expect(result.status).toBe("fail");
    expect(result.findings.join()).toMatch(/not a canonical shipped entity name/);
  });

  it("legitimate unshipped leads remain valid under the canonical shipped-name contract", () => {
    const t = parseCandidates(doc(table(1, "Food", [["Unverified alley lead", "rejected: no qualifying source"]])));
    expect(judgeCandidates(t, { guideText: "", canonicalNames: new Set(["Real Venue"]) }).status).toBe("pass");
  });

  it("no floors exist to honor or override — small sets pass in EVERY context (amended scar)", () => {
    // Amended from the researchFloors-override test: the override existed to soften floors,
    // and both died together (the skill-parity suite separately pins researchFloors out of the
    // skill). The structural checks still bite the same small table when a name is fake.
    const small = parseCandidates(doc(table(1, "Food", rows(6, 3))));
    expect(judgeCandidates(small, { guideText: "Cand 0 Cand 1 Cand 2" }).status).toBe("pass");
    expect(judgeCandidates(small, { guideText: "Cand 1 Cand 2" }).status).toBe("fail"); // Cand 0 fake
  });

  it("tiny sets pass with structural checks intact — the old V2-adaptive posture is now the ONLY posture", () => {
    const small = parseCandidates(doc(table(1, "Food", rows(3, 2))));
    const r = judgeCandidates(small, { guideText: "Cand 0 Cand 1" });
    expect(r.status).toBe("pass");
    expect(r.summary[0].floor).toBeUndefined(); // the floor concept itself is gone from the summary
  });

  it("gates only ranks 1-3; a fourth table is bonus depth", () => {
    const t = parseCandidates(doc(table(1, "Food", rows(16, 8)), table(4, "Bonus", [["X", "shipped"]])));
    const r = judgeCandidates(t, { guideText: guideText + " X" });
    expect(r.status).toBe("pass");
  });

  it("FAILS an empty section on a post-standard guide — the thinness this exists to measure", () => {
    const r = judgeCandidates([], { guideText: "" });
    expect(r.status).toBe("fail");
    expect(r.findings[0]).toMatch(/no priority tables/);
  });

  it("the floors are GONE from the module surface — the doctrine has one home (amended scar)", async () => {
    // Amended from the 16/8·10/5·6/3 shape pin: what is pinned now is their ABSENCE, so a
    // future "helpful" quota cannot slip back in without tripping this.
    const mod = await import("../check-candidates.mjs");
    expect(mod.DEFAULT_FLOORS).toBeUndefined();
    const { readFileSync } = await import("node:fs");
    const src = readFileSync(new URL("../check-candidates.mjs", import.meta.url), "utf8");
    expect(src).not.toMatch(/DEFAULT_FLOORS|researchFloors/);
  });
});

describe("judgeCandidates — D3 shortlist stage (shipped ⊆ shortlist ⊆ considered)", () => {
  const rows3 = (n, shipped, shortlistExtra = 0) =>
    Array.from({ length: n }, (_, i) => [
      `Cand ${i}`,
      i < shipped ? "shipped" : "rejected: no source",
      i < shipped + shortlistExtra ? "y" : "n",
    ]);
  const names = (n) => Array.from({ length: n }, (_, i) => `Cand ${i}`).join(" ");

  it("valid: every shipped row is also marked shortlisted → passes", () => {
    const t = parseCandidates(doc(table3(1, "Food", rows3(16, 8))));
    const r = judgeCandidates(t, { guideText: names(8) });
    expect(r.status).toBe("pass");
    expect(r.summary[0]).toMatchObject({ shipped: 8, shortlisted: 8 });
  });

  it("superset: shortlist marks MORE than shipped (extra candidates promoted, not shipped) → still passes", () => {
    const t = parseCandidates(doc(table3(1, "Food", rows3(16, 8, 4))));
    const r = judgeCandidates(t, { guideText: names(8) });
    expect(r.status).toBe("pass");
    expect(r.summary[0]).toMatchObject({ shipped: 8, shortlisted: 12 });
  });

  it("missing: a shipped row is NOT marked shortlisted → fails, naming the row (ACCEPTANCE)", () => {
    const rows = rows3(16, 8);
    rows[0][2] = "n"; // Cand 0 ships but was never shortlisted
    const t = parseCandidates(doc(table3(1, "Food", rows)));
    const r = judgeCandidates(t, { guideText: names(8) });
    expect(r.status).toBe("fail");
    expect(r.findings.join("\n")).toMatch(/"Cand 0" is marked shipped but not shortlisted/);
  });

  it("legacy 2-column tables (no Shortlist cell) are never gated on shortlist — backward compatible", () => {
    const rows2 = Array.from({ length: 16 }, (_, i) => [`Cand ${i}`, i < 8 ? "shipped" : "rejected: no source"]);
    const t = parseCandidates(doc(table(1, "Food", rows2)));
    expect(t[0].rows.every((r) => r.shortlisted === null)).toBe(true);
    const r = judgeCandidates(t, { guideText: names(8) });
    expect(r.status).toBe("pass");
  });

  it("shortlist counts are reported, never gated by number — the funnel RELATION is the check (amended scar)", () => {
    // Amended from the shortlist-floor test: the optional count floor died with every floor.
    // What survives is the relation (shipped ⊆ shortlist, above) and the honest count report.
    const t = parseCandidates(doc(table3(1, "Food", rows3(16, 8, 0))));
    const r = judgeCandidates(t, { guideText: names(8) });
    expect(r.status).toBe("pass");
    expect(r.summary[0]).toMatchObject({ shipped: 8, shortlisted: 8 });
    expect(r.findings.join("\n")).not.toMatch(/floor/i);
  });
});
