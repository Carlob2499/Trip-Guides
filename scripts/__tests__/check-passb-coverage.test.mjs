// @protects-file The second research pass really covered what the first pass left open.

import { describe, it, expect } from "vitest";
import { checkCoverage, isCovered, normalize } from "../check-passb-coverage.mjs";

const LEDGER = `# japan intake

## Research reconciliation

| Item | Verdict | Note |
|---|---|---|
| Ichiran (Shibuya) | CONFLICT | B flags tourist-trap; swapped for Daruma |
| Yanaka Ginza street food walk | B-only | verified against ward tourism page |
| Gyoen off-peak entry | AGREE | both passes landed 08:00 |
| "Robot Restaurant" | rejected | closed permanently — B lead disproved |

## Amendments
`;

const entry = (item) => ({ item, category: "food", finding: "x", source_url: "https://x", verified_on: "2026-07-30" });

describe("normalize", () => {
  it("lowercases, strips punctuation and diacritics", () => {
    expect(normalize("Ichiran Ramen (Shibuya)!")).toBe("ichiran ramen shibuya");
    expect(normalize("Café-du-Marché")).toBe("cafe du marche");
  });
});

describe("isCovered", () => {
  const ledger = normalize(LEDGER);
  it("matches exact and parenthesized names", () => {
    expect(isCovered("Ichiran (Shibuya)", ledger)).toBe(true);
  });
  it("matches token-wise when the table rephrases", () => {
    expect(isCovered("Yanaka Ginza food walk", ledger)).toBe(true);
  });
  it("rejects an item that appears nowhere", () => {
    expect(isCovered("Golden Gai bar crawl", ledger)).toBe(false);
  });
});

describe("checkCoverage", () => {
  it("passes when every entry has a verdict, including explicit rejections", () => {
    const r = checkCoverage(
      [entry("Ichiran (Shibuya)"), entry("Yanaka Ginza street food walk"), entry("Robot Restaurant")],
      LEDGER,
    );
    expect(r.status).toBe("pass");
    expect(r.missing).toEqual([]);
  });

  it("fails and names the silently dropped entry", () => {
    const r = checkCoverage([entry("Ichiran (Shibuya)"), entry("Golden Gai bar crawl")], LEDGER);
    expect(r.status).toBe("fail");
    expect(r.missing).toEqual(["Golden Gai bar crawl"]);
  });

  it("fails everything when the reconciliation section is absent", () => {
    const r = checkCoverage([entry("Ichiran (Shibuya)")], "# intake with no ledger");
    expect(r.status).toBe("fail");
    expect(r.missing).toEqual(["Ichiran (Shibuya)"]);
  });

  it("only matches inside the reconciliation section, not the whole intake doc", () => {
    const doc = `## Notes\nGolden Gai is mentioned here only.\n\n## Research reconciliation\n\n| Ichiran | AGREE |\n\n## Amendments\n`;
    const r = checkCoverage([entry("Golden Gai")], doc);
    expect(r.status).toBe("fail");
  });

  it("skips cleanly on empty or missing Pass B", () => {
    expect(checkCoverage([], LEDGER).status).toBe("skip");
    expect(checkCoverage(null, LEDGER).status).toBe("skip");
  });
});

// ── S4, adaptive form (CHANGE, Pipeline V2 2026-08-17) ───────────────────────
// The fixed ≥8/≥3/≥2 quotas are deliberately gone — DECISIONS.md "Research breadth": breadth
// is adaptive, and the V2 saturation record (scripts/pipeline/v2/evidence.mjs, its own suite)
// is the replacement protection against a lazy stop. What a FULL pass still owes here is
// EXISTENCE: zero entries is not an adaptive stop, it is a pass that never happened.
import { checkSubstance } from "../check-passb-coverage.mjs";

describe("checkSubstance — a full Pass B must exist; its shape is informational", () => {
  const entry = (category, i) => ({ item: `Find ${category} ${i}`, category, finding: "x", source_url: "https://e.org", verified_on: "2026-08-02" });

  it("PRESERVE (strengthened): zero entries on a full pass FAILS", () => {
    const r = checkSubstance([]);
    expect(r.status).toBe("fail");
    expect(r.findings.join("\n")).toMatch(/ZERO Pass B entries/);
    expect(checkSubstance(null).status).toBe("fail");
  });

  it("CHANGE: a thin-but-real pass PASSES — a small town's honest six finds beat a padded eight", () => {
    const r = checkSubstance(Array.from({ length: 3 }, (_, i) => entry("food", i)));
    expect(r.status).toBe("pass");
  });

  it("category counts stay computed for the human row (timing→crowd, alternative→novel)", () => {
    const r = checkSubstance([
      ...Array.from({ length: 3 }, (_, i) => entry("timing", i)),
      ...Array.from({ length: 2 }, (_, i) => entry("alternative", i)),
      ...Array.from({ length: 3 }, (_, i) => entry("language", i)),
    ]);
    expect(r.status).toBe("pass");
    expect(r.counts).toEqual({ total: 8, crowd: 3, novel: 2 });
  });
});
