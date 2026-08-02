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

// ── S4: quantitative floors ──────────────────────────────────────────────────
import { checkFloors, PASSB_FLOORS } from "../check-passb-coverage.mjs";

describe("checkFloors (S4) — Pass B must be quantitatively real, not just reconciled", () => {
  const entry = (category, i) => ({ item: `Find ${category} ${i}`, category, finding: "x", source_url: "https://e.org", verified_on: "2026-08-02" });
  const fullPass = [
    ...Array.from({ length: 3 }, (_, i) => entry("crowd", i)),
    ...Array.from({ length: 2 }, (_, i) => entry("novel", i)),
    ...Array.from({ length: 3 }, (_, i) => entry("food", i)),
  ];

  it("passes a pass meeting every floor", () => {
    const r = checkFloors(fullPass);
    expect(r.status).toBe("pass");
    expect(r.counts).toEqual({ total: 8, crowd: 3, novel: 2 });
  });

  it("fails a thin pass on total count", () => {
    const r = checkFloors(fullPass.slice(0, 5));
    expect(r.status).toBe("fail");
    expect(r.findings.join("\n")).toMatch(/entries total — floor is 8/);
  });

  it("fails when the crowd/timing angle is missing — even with plenty of entries", () => {
    const r = checkFloors(Array.from({ length: 10 }, (_, i) => entry("food", i)));
    expect(r.status).toBe("fail");
    expect(r.findings.join("\n")).toMatch(/crowd\/timing/);
    expect(r.findings.join("\n")).toMatch(/novel\/alternative/);
  });

  it("counts `timing` toward crowd and `alternative` toward novel", () => {
    const r = checkFloors([
      ...Array.from({ length: 3 }, (_, i) => entry("timing", i)),
      ...Array.from({ length: 2 }, (_, i) => entry("alternative", i)),
      ...Array.from({ length: 3 }, (_, i) => entry("language", i)),
    ]);
    expect(r.status).toBe("pass");
  });

  it("documented floors: 8 total, 3 crowd/timing, 2 novel/alternative", () => {
    expect(PASSB_FLOORS).toEqual({ MIN_TOTAL: 8, MIN_CROWD: 3, MIN_NOVEL: 2 });
  });
});
