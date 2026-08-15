// @protects-file A shared budget with nothing in it says so, instead of inventing a debt.

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildBudgetSummary } from "../model/summary";
import { settle } from "../model/settle";

const MEMBERS = [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }];
const IDS = MEMBERS.map((m) => m.id);

describe("Trip Split ships empty", () => {
  const empty = () => buildBudgetSummary(MEMBERS, [], [], 8);

  it("⌁ reports zero, not a guess", () => {
    expect(empty().total).toBe(0);
  });

  it("⌁ leaves every net at zero so the UI can render an em dash, never +0.00", () => {
    // The model reports 0; rendering it as "+0.00" would claim a positive balance — that
    // someone has been measured and is owed nothing — when nothing was measured at all.
    const s = empty();
    expect(s.people).toHaveLength(3);
    for (const p of s.people) {
      expect(p.paid, p.id).toBe(0);
      expect(p.share, p.id).toBe(0);
      expect(p.net, p.id).toBe(0);
    }
  });

  it("⌁ produces no transfers, so settle-up has nothing to offer", () => {
    const { txns, balances } = settle(IDS, []);
    expect(txns).toEqual([]);
    expect(Object.values(balances).every((v) => v === 0)).toBe(true);
  });
});

describe("Trip Split never seeds itself from the guide", () => {
  /* ⌁ The deliberate reversal (DESIGN.md R5 §4). R4 seeded the ledger from the guide's budget
     block, which produces a settle-up demanding real transfers for money nobody spent — an
     estimate is not a debt. Asserted as the ABSENCE of a code path, because a behaviour test
     passes happily on a seeding function nobody happens to call yet. */
  const files: string[] = [];
  (function walk(dir: string) {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|js)$/.test(f) && !/\.test\.ts$/.test(f)) files.push(p);
    }
  })("src/features/trip-split");

  it("found the silo's real source files", () => {
    expect(files.length).toBeGreaterThan(3);
  });

  it("defines no seeding function anywhere in the silo", () => {
    for (const f of files) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/function\s+seed|seedFrom|seedLedger|seedExpenses/);
    }
  });

  it("never reads a guide's budget section — the one import that would make seeding possible", () => {
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/type\s*===\s*["']budget["']/);
      expect(src, f).not.toMatch(/basis\s*===\s*["']day["']/);
    }
  });

  it("⌁ takes the guide's day count as a divisor and never as a row", () => {
    /* The ONE thing the summary does read from the guide is the trip's length, and it is the
       likeliest re-entry point for seeding: a day count is right there, and multiplying it by a
       budget estimate would look like a helpful head start. So the assertion is arithmetic, not
       a grep — a source scan passes on any string the seeder happens not to use.
       Eight days, three members, nothing spent: every figure the sheet can print stays empty. */
    const s = buildBudgetSummary(MEMBERS, [], [], 8);
    expect(s.days).toBe(8);           // the divisor arrived
    expect(s.total).toBe(0);          // and multiplied nothing
    expect(s.perDay).toBe(0);
    expect(s.expenseCount).toBe(0);
    expect(s.items).toEqual([]);      // no row was manufactured to fill the sheet
    expect(s.byCategory).toEqual([]);
    expect(s.txns).toEqual([]);
  });
});

describe("Trip Split's arithmetic, once there IS something in it", () => {
  it("splits one expense equally across three, and the nets sum to zero", () => {
    const { balances } = settle(IDS, [{ paidBy: "a", baseMinor: 3000, participants: IDS }]);
    expect(Object.values(balances).reduce((s, v) => s + v, 0)).toBe(0);
    expect(balances.a).toBeGreaterThan(0);
    expect(balances.b).toBeLessThan(0);
  });

  it("bills an UNKNOWN payer to the first member rather than dropping the expense", () => {
    /* Found while writing the cases above: settle() falls back to memberIds[0] when the payer
       is not in the group, so an expense whose payer field is missing or stale is billed to
       whoever happens to be listed first. Pinned because it is silent — the earlier drafts of
       these tests passed on that fallback while asserting the wrong field name entirely, which
       is exactly how it would reach a traveller. The money is never lost; it is just attributed
       to someone who did not spend it. */
    const { balances } = settle(IDS, [{ paidBy: "nobody", baseMinor: 3000, participants: IDS }]);
    expect(balances.a).toBeGreaterThan(0);
    expect(Object.values(balances).reduce((s, v) => s + v, 0)).toBe(0);
  });

  it("takes a two-person split from the PARTICIPANT SET, never an invented per value", () => {
    // Participants are who was actually there. The moment a `per` number disagrees with the
    // set, the ledger owes someone for a meal they were not at.
    const { balances } = settle(IDS, [
      { paidBy: "a", baseMinor: 2000, participants: ["a", "b"] },
    ]);
    expect(balances.c).toBe(0);
    expect(balances.a + balances.b).toBe(0);
  });

  it("sums paid to the total for a random 20-expense set (property)", () => {
    // Seeded LCG, not Math.random: a failure has to be reproducible from the report.
    let seed = 7;
    const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) % 2147483648), seed % n);
    const expenses = Array.from({ length: 20 }, (_, i) => ({
      id: `e${i}`,
      paidBy: IDS[rnd(3)],
      baseMinor: 100 + rnd(50_000),
      participants: IDS.slice(0, 1 + rnd(3)),
    }));
    const s = buildBudgetSummary(MEMBERS, expenses, [], 8);
    // Two independent identities: every cent was paid by someone, and every cent was owed by
    // someone. Rounding a three-way split is where the second one breaks if it is going to.
    expect(s.people.reduce((acc, p) => acc + p.paid, 0)).toBe(s.total);
    expect(s.people.reduce((acc, p) => acc + p.share, 0)).toBe(s.total);
    expect(s.people.reduce((acc, p) => acc + p.net, 0)).toBe(0);
  });
});
