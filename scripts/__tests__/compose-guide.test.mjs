// The Composer's contract tests (R6). The two that matter most:
//   IDENTITY — the real, untagged catalog composes to exactly itself (adopting the
//              Composer costs the existing guides zero changes, proven on the guides
//              themselves, zero-network);
//   ⚠ GUARD  — a budget-forced merge that would relocate a flagged unit fails loudly
//              (the plan's "merging may never hide a ⚠" rule, exercised, not asserted).
// @protects-file Assembling a guide from its parts loses nothing and reorders nothing.

import { describe, it, expect } from "vitest";
import {
  composeSections, unitWeight, hasWarning, assertWritable, ANCHOR_WEIGHT,
} from "../compose-guide.mjs";
import { readGuides } from "../audit/lib.mjs";

const prose = (group, title, words, extra = {}) => ({
  type: "prose", group, title,
  body: `<p>${"word ".repeat(words)}</p>`,
  ...extra,
});
// A section heavy enough to keep a tab on its own (weight ~10 — words are ~5 chars,
// weight = ceil(chars/600) — comfortably above every threshold).
const heavy = (group, title, extra = {}) => prose(group, title, 1200, extra);
// A section that keeps a tab (≥ MERGE_THRESHOLD) but is the obvious smallest merge
// candidate when the budget forces one (weight ~4).
const smallish = (group, title, extra = {}) => prose(group, title, 420, extra);

function spineGuide(extraSections = []) {
  return [
    heavy("Plan", "Groundwork"),
    heavy("Essentials", "Money"),
    heavy("Transit", "Getting around"),
    heavy("Days", "Day by day"),
    ...extraSections,
    heavy("Sources", "References"),
  ];
}

describe("composeSections — determinism & identity", () => {
  it("is deterministic: same units ⇒ byte-identical output", () => {
    const input = spineGuide([heavy("Sights", "Top sights"), prose("Nightlife", "Bars", 400)]);
    const a = composeSections(input);
    const b = composeSections(JSON.parse(JSON.stringify(input)));
    expect(JSON.stringify(a.sections)).toBe(JSON.stringify(b.sections));
    expect(a.order).toEqual(b.order);
  });

  it("is idempotent: composing a composition changes nothing further", () => {
    const input = spineGuide([prose("Tiny", "One-liner", 10, { phase: "daily" })]);
    const once = composeSections(input);
    const twice = composeSections(once.sections);
    expect(twice.changed).toBe(false);
    expect(JSON.stringify(twice.sections)).toBe(JSON.stringify(once.sections));
  });

  it("CATALOG: every real guide composes without error and without losing a single unit", async () => {
    const guides = await readGuides();
    expect(guides.length).toBeGreaterThanOrEqual(3);
    for (const g of guides) {
      const r = composeSections(g.guide.sections, { tabBudget: g.guide.tabBudget ?? 10 });
      expect(r.error, `${g.slug}: ${r.error}`).toBeUndefined();
      expect(r.sections.length, g.slug).toBe(g.guide.sections.length);
    }
  });

  it("IDENTITY: the dense guides (korea, denmark) compose to exactly themselves", async () => {
    // The compatibility canary: untagged, well-fed guides must cost zero changes. (us is
    // deliberately NOT here — it carries two genuine one-card tabs, so the Composer's
    // standing proposal for it is the system WORKING; see the R6 ledger in
    // docs/archive/visual-redesign-history.md.)
    const guides = await readGuides();
    for (const slug of ["korea", "denmark"]) {
      const g = guides.find((x) => x.slug === slug);
      expect(g, slug).toBeTruthy();
      const r = composeSections(g.guide.sections, { tabBudget: g.guide.tabBudget ?? 10 });
      expect(r.changed, `${slug} proposed: ${r.moves?.join(" | ")}`).toBe(false);
    }
  });
});

describe("composeSections — the rules", () => {
  it("SPINE: a near-empty foldable spine group folds unit-by-unit to each unit's phase host", () => {
    const input = [
      heavy("Plan", "Groundwork"),
      prose("Transit", "Rental car pickup", 20, { phase: "before" }),
      prose("Transit", "Daily driving notes", 20, { phase: "daily" }),
      heavy("Days", "Day by day"),
      heavy("Sources", "References"),
    ];
    const r = composeSections(input);
    expect(r.changed).toBe(true);
    expect(r.order).not.toContain("Transit");
    const byTitle = Object.fromEntries(r.sections.map((s) => [s.title, s.group]));
    expect(byTitle["Rental car pickup"]).toBe("Plan");   // before → Plan
    expect(byTitle["Daily driving notes"]).toBe("Days"); // daily → Days
    expect(r.sections.length).toBe(input.length);        // nothing lost
  });

  it("SPINE: Plan, Days and Sources never fold, however small", () => {
    const input = [
      prose("Plan", "P", 5), prose("Days", "D", 5), prose("Sources", "S", 5),
      heavy("Sights", "Big enough to exist"),
    ];
    const r = composeSections(input);
    expect(r.order).toEqual(expect.arrayContaining(["Plan", "Days", "Sources"]));
  });

  it("MERGE: a below-threshold theme folds; unit count is always preserved", () => {
    const input = spineGuide([prose("Trinkets", "One small note", 8, { phase: "daily" })]);
    const r = composeSections(input);
    expect(r.order).not.toContain("Trinkets");
    expect(r.sections.length).toBe(input.length);
    expect(r.sections.find((s) => s.title === "One small note").group).toBe("Days");
  });

  it("ORDER: a folded arrival never hoists its host's tab slot (the us fold's lesson)", () => {
    // Etiquette sits EARLY in the document and folds daily → Days, which sits LATE
    // (after Transit). Its arrival must not pull Days ahead of Transit — the creator
    // signs a fold, not a reorder. The host's slot comes from its native units.
    const input = [
      heavy("Plan", "Groundwork"),
      prose("Etiquette", "Manners", 8, { phase: "daily" }),
      heavy("Transit", "Getting around"),
      heavy("Days", "Day by day"),
      heavy("Sources", "References"),
    ];
    const r = composeSections(input);
    expect(r.order).toEqual(["Plan", "Transit", "Days", "Sources"]);
    expect(r.sections.find((s) => s.title === "Manners").group).toBe("Days");
  });

  it("ANCHOR: a top-2-ranked theme with real weight keeps its tab and is immune to budget merges", () => {
    const anchorUnits = [
      prose("MSI weekend", "Tickets", 600, { rank: 1, theme: "MSI weekend" }),
      { type: "list", group: "MSI weekend", theme: "MSI weekend", rank: 1,
        title: "Arena checklist", items: Array.from({ length: ANCHOR_WEIGHT }, (_, i) => `item ${i}`) },
    ];
    const filler = ["A", "B", "C", "D", "E", "F"].map((n) => heavy(n, `Filler ${n}`));
    const r = composeSections(spineGuide([...anchorUnits, ...filler]), { tabBudget: 8 });
    expect(r.error).toBeUndefined();
    expect(r.order).toContain("MSI weekend");
  });

  it("ORDER: rank pulls a tagged theme forward in the non-spine block; Sources stays last", () => {
    const input = spineGuide([
      heavy("Sights", "Top sights"),
      heavy("Food", "Eating", { rank: 1, theme: "Food" }),
    ]);
    const r = composeSections(input);
    expect(r.order.indexOf("Food")).toBeLessThan(r.order.indexOf("Sights"));
    expect(r.order[r.order.length - 1]).toBe("Sources");
  });

  it("BUDGET + ⚠ GUARD: a forced merge that would relocate a flagged unit fails loudly, not silently", () => {
    // 5 spine + 4 themes = 9 groups, budget 8 → one forced merge; the smallest
    // candidate carries a ⚠ — compose must refuse rather than move it.
    const input = spineGuide([
      heavy("Sights", "Top sights"),
      heavy("Food", "Eating"),
      heavy("Nightlife", "Bars"),
      smallish("Permits", "⚠ Permit rules unconfirmed", { phase: "before" }),
    ]);
    const r = composeSections(input, { tabBudget: 8 });
    expect(r.error).toMatch(/⚠/);
    expect(r.sections).toBeUndefined(); // no output at all — never a silently-different guide
  });

  it("BUDGET: without a ⚠ in the smallest candidate, the forced merge proceeds and lands within budget", () => {
    const input = spineGuide([
      heavy("Sights", "Top sights"),
      heavy("Food", "Eating"),
      heavy("Nightlife", "Bars"),
      smallish("Trinkets", "Clean small theme", { phase: "daily" }),
    ]);
    const r = composeSections(input, { tabBudget: 8 });
    expect(r.error).toBeUndefined();
    expect(new Set(r.sections.map((s) => s.group)).size).toBeLessThanOrEqual(8);
  });
});

describe("weight & warning derivations", () => {
  it("derives weight from items and prose length — never a stored field", () => {
    expect(unitWeight({ items: ["a", "b", "c"] })).toBe(3);
    expect(unitWeight({ body: "<p>" + "x".repeat(1200) + "</p>" })).toBe(2);
    expect(unitWeight({ steps: ["a"], body: "<p>" + "x".repeat(500) + "</p>" })).toBe(2);
  });
  it("sees a ⚠ anywhere in the unit", () => {
    expect(hasWarning({ body: "fine" })).toBe(false);
    expect(hasWarning({ checklist: ["⚠ confirm times"] })).toBe(true);
  });
});

describe("assertWritable — the proposal-only gate for live guides", () => {
  it("lets drafts through", () => {
    expect(() => assertWritable({ draft: true })).not.toThrow();
  });
  it("refuses a live guide without the creator's explicit flag", () => {
    expect(() => assertWritable({})).toThrow(/LIVE/);
  });
  it("lets a live guide through ONLY with --creator-signed", () => {
    expect(() => assertWritable({}, { creatorSigned: true })).not.toThrow();
  });
});

describe("--check NEVER writes (the boundary check, run against the real CLI)", () => {
  it("checking the guide with a standing proposal (us) leaves every byte on disk untouched", async () => {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const { readFile, readdir } = await import("node:fs/promises");
    const path = await import("node:path");
    const { GUIDES_DIR } = await import("../audit/lib.mjs");
    const dir = path.join(GUIDES_DIR, "us");
    const snapshot = async () => {
      const files = (await readdir(dir)).sort();
      const out = {};
      for (const f of files) out[f] = await readFile(path.join(dir, f), "utf8");
      return out;
    };
    const before = await snapshot();
    // exit 2 = "a proposal exists" — the expected outcome for us; anything ≠ 0/2 is a real error
    const code = await promisify(execFile)("node", ["scripts/compose-guide.mjs", "--slug", "us", "--check"])
      .then(() => 0, (e) => e.code);
    expect([0, 2]).toContain(code);
    expect(await snapshot()).toEqual(before);
  });
});
