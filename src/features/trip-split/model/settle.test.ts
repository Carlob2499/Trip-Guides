// @protects-file Who owes whom is settled in the fewest transfers, and the totals always balance.

import { describe, it, expect } from "vitest";
import { settle, type SettleExpense } from "./settle";

/* V2: amounts are integer minor units (cents of the base currency) and the split method is a
   property of the expense. Every behavioural assertion from the float era is preserved below
   — the numbers are the same money, expressed exactly. */

describe("settle — participants (a subset of the group shares an expense)", () => {
  // The real case this came from: Phil + Carlo were in Daejeon, Gaby wasn't, so Daejeon
  // expenses must not touch Gaby.
  it("divides evenly among ONLY the named participants", () => {
    const r = settle(
      ["phil", "carlo", "gaby"],
      [{ paidBy: "phil", baseMinor: 6000, participants: ["phil", "carlo"] }],
    );
    expect(r.balances.phil).toBe(3000);   // paid 60, owes 30
    expect(r.balances.carlo).toBe(-3000);
    expect(r.balances.gaby).toBe(0);      // wasn't there — untouched
    expect(r.txns).toEqual([{ from: "carlo", to: "phil", amtMinor: 3000 }]);
  });

  it("treats absent/empty participants as the whole group (legacy records settle unchanged)", () => {
    const all = settle(["a", "b", "c"], [{ paidBy: "a", baseMinor: 3000 }]);
    const empty = settle(["a", "b", "c"], [{ paidBy: "a", baseMinor: 3000, participants: [] }]);
    const nulled = settle(["a", "b", "c"], [{ paidBy: "a", baseMinor: 3000, participants: null }]);
    expect(empty).toEqual(all);
    expect(nulled).toEqual(all);
    expect(all.balances.c).toBe(-1000);
  });

  it("ignores participant ids that are no longer members (deleted mid-trip)", () => {
    const r = settle(
      ["a", "b"],
      [{ paidBy: "a", baseMinor: 4000, participants: ["a", "b", "ghost"] }],
    );
    expect(r.balances.a).toBe(2000);
    expect(r.balances.b).toBe(-2000);
  });

  it("falls back to the whole group if every participant was deleted", () => {
    const r = settle(["a", "b"], [{ paidBy: "a", baseMinor: 4000, participants: ["ghost"] }]);
    expect(r.balances.a).toBe(2000);
    expect(r.balances.b).toBe(-2000);
  });

  it("charges a solo participant their own expense entirely (nets to zero)", () => {
    const r = settle(["a", "b"], [{ paidBy: "a", baseMinor: 2500, participants: ["a"] }]);
    expect(r.balances.a).toBe(0);
    expect(r.balances.b).toBe(0);
    expect(r.txns).toEqual([]);
  });

  it("mixes group and subset expenses correctly", () => {
    const r = settle(
      ["a", "b", "c"],
      [
        { paidBy: "a", baseMinor: 3000 },                              // all three: 10 each
        { paidBy: "b", baseMinor: 2000, participants: ["b", "c"] },    // b+c only: 10 each
      ],
    );
    expect(r.balances.a).toBe(2000);   // +30 -10
    expect(r.balances.b).toBe(0);      // +20 -10 -10
    expect(r.balances.c).toBe(-2000);  // -10 -10
  });

  it("ignores a stale weight for someone excluded from the expense", () => {
    // b was excluded AFTER amounts were typed — the leftover entry must not charge b.
    const r = settle(
      ["a", "b", "c"],
      [{
        paidBy: "a", baseMinor: 10000, participants: ["a", "c"],
        method: "EXACT", weights: { a: 2500, b: 7500 },
      }],
    );
    expect(r.balances.b).toBe(0);      // excluded — untouched despite the stale entry
    expect(r.balances.a).toBe(0);      // only sharer with a weight → owes all 100, paid 100
    expect(r.balances.c).toBe(0);      // sharer with no weight typed yet
  });

  it("zero-sum weights fall back to even across the PARTICIPANTS, not the group", () => {
    const r = settle(
      ["a", "b", "c"],
      [{
        paidBy: "a", baseMinor: 9000, participants: ["a", "b"],
        method: "EXACT", weights: { a: 0, b: 0 },
      }],
    );
    expect(r.balances.a).toBe(4500);
    expect(r.balances.b).toBe(-4500);
    expect(r.balances.c).toBe(0);
  });

  it("weights still win over an even split among the participants", () => {
    const r = settle(
      ["a", "b", "c"],
      [{
        paidBy: "a", baseMinor: 10000, participants: ["a", "b"],
        method: "EXACT", weights: { a: 2500, b: 7500 },
      }],
    );
    expect(r.balances.a).toBe(7500);
    expect(r.balances.b).toBe(-7500);
    expect(r.balances.c).toBe(0);
  });
});

describe("settle — the retroactive-participant bug (V2 regression)", () => {
  // Before V2, `participants: null` meant "everyone AS THE GROUP STANDS NOW", so adding a
  // fourth traveller on day 5 silently made them owe for a day-1 dinner. New records carry
  // an explicit snapshot, and this is the test that keeps it that way.
  const dinner: SettleExpense = {
    paidBy: "a", baseMinor: 9000, participants: ["a", "b", "c"],
  };

  it("a snapshotted expense is untouched when a fourth person joins later", () => {
    const before = settle(["a", "b", "c"], [dinner]);
    const after = settle(["a", "b", "c", "d"], [dinner]);
    expect(before.balances.b).toBe(-3000);
    expect(after.balances.b).toBe(-3000);   // unchanged
    expect(after.balances.d).toBe(0);       // the newcomer owes nothing for it
  });

  it("a LEGACY record with no snapshot still re-splits — documented, not fixed retroactively", () => {
    const legacy: SettleExpense = { paidBy: "a", baseMinor: 9000 };
    expect(settle(["a", "b", "c"], [legacy]).balances.b).toBe(-3000);
    expect(settle(["a", "b", "c", "d"], [legacy]).balances.b).toBe(-2250);
  });
});

describe("settle — exact money (V2 regression)", () => {
  it("splitting 100 three ways loses nothing", () => {
    const r = settle(["a", "b", "c"], [{ paidBy: "a", baseMinor: 10000, participants: ["a", "b", "c"] }]);
    const owed = [r.balances.b, r.balances.c].map(Math.abs);
    expect(owed[0] + owed[1] + (10000 - r.balances.a)).toBe(10000);
    expect(Object.values(r.balances).reduce((x, y) => x + y, 0)).toBe(0);
  });

  it("distributes the odd minor unit rather than dropping it", () => {
    // 10.00 three ways = 333/333/334 in cents; the total must survive exactly.
    const r = settle(["a", "b", "c"], [{ paidBy: "a", baseMinor: 1000, participants: ["a", "b", "c"] }]);
    const shares = [r.balances.b, r.balances.c].map((v) => -v);
    expect(shares.reduce((x, y) => x + y, 0) + (1000 - r.balances.a)).toBe(1000);
    expect(Object.values(r.balances).reduce((x, y) => x + y, 0)).toBe(0);
  });

  it("conserves the total across many awkward amounts", () => {
    const exps: SettleExpense[] = [1, 7, 33, 101, 999, 1234, 5001].map((n, i) => ({
      paidBy: ["a", "b", "c"][i % 3],
      baseMinor: n,
      participants: ["a", "b", "c"],
    }));
    const r = settle(["a", "b", "c"], exps);
    expect(Object.values(r.balances).reduce((x, y) => x + y, 0)).toBe(0);
  });
});

describe("settle — the split method belongs to the expense (V2 regression)", () => {
  it("two expenses in one trip can split differently", () => {
    const r = settle(
      ["a", "b"],
      [
        { paidBy: "a", baseMinor: 6000, participants: ["a", "b"] },                                  // even
        { paidBy: "a", baseMinor: 10000, participants: ["a", "b"], method: "SHARES", weights: { a: 3, b: 1 } },
      ],
    );
    // Dinner: b owes 30. Hotel 3:1 → b owes 25. Total b owes 55.
    expect(r.balances.b).toBe(-5500);
    expect(r.balances.a).toBe(5500);
  });

  it("PERCENTAGE weights allocate proportionally and sum exactly", () => {
    const r = settle(
      ["a", "b"],
      [{ paidBy: "a", baseMinor: 6255, participants: ["a", "b"], method: "PERCENTAGE", weights: { a: 60, b: 40 } }],
    );
    expect(r.balances.b).toBe(-2502);
    expect(Object.values(r.balances).reduce((x, y) => x + y, 0)).toBe(0);
  });

  it("does not throw when typed EXACT shares fail to add up (the form warns; the engine copes)", () => {
    const r = settle(
      ["a", "b"],
      [{ paidBy: "a", baseMinor: 10000, participants: ["a", "b"], method: "EXACT", weights: { a: 3000, b: 3000 } }],
    );
    // Treated proportionally — 50/50 of the real total — and still conserves.
    expect(r.balances.b).toBe(-5000);
    expect(Object.values(r.balances).reduce((x, y) => x + y, 0)).toBe(0);
  });
});

describe("settle — recorded payments (V2)", () => {
  const dinner: SettleExpense = { paidBy: "a", baseMinor: 9000, participants: ["a", "b", "c"] };

  it("a payment discharges the payer's debt", () => {
    const r = settle(["a", "b", "c"], [dinner], [{ from: "b", to: "a", baseMinor: 3000 }]);
    expect(r.balances.b).toBe(0);
    expect(r.balances.a).toBe(3000);          // still owed c's share
    expect(r.txns).toEqual([{ from: "c", to: "a", amtMinor: 3000 }]);
  });

  it("settling everyone leaves no transfers at all", () => {
    const r = settle(["a", "b", "c"], [dinner], [
      { from: "b", to: "a", baseMinor: 3000 },
      { from: "c", to: "a", baseMinor: 3000 },
    ]);
    expect(r.txns).toEqual([]);
    expect(Object.values(r.balances)).toEqual([0, 0, 0]);
  });

  it("a partial payment leaves the remainder outstanding", () => {
    const r = settle(["a", "b", "c"], [dinner], [{ from: "b", to: "a", baseMinor: 1000 }]);
    expect(r.balances.b).toBe(-2000);
  });

  it("overpaying flips the balance rather than silently clamping", () => {
    const r = settle(["a", "b", "c"], [dinner], [{ from: "b", to: "a", baseMinor: 5000 }]);
    expect(r.balances.b).toBe(2000);          // b is now owed 20
    expect(Object.values(r.balances).reduce((x, y) => x + y, 0)).toBe(0);
  });

  it("ignores payments naming someone who is no longer a member", () => {
    const r = settle(["a", "b", "c"], [dinner], [{ from: "ghost", to: "a", baseMinor: 3000 }]);
    expect(r.balances.a).toBe(6000);
    expect(Object.values(r.balances).reduce((x, y) => x + y, 0)).toBe(0);
  });
});

describe("settle", () => {
  it("returns nothing for no members", () => {
    expect(settle([], [])).toEqual({ balances: {}, txns: [] });
  });

  it("zeroes out with members but no expenses", () => {
    const r = settle(["a", "b"], []);
    expect(r.balances).toEqual({ a: 0, b: 0 });
    expect(r.txns).toEqual([]);
  });

  it("splits a single expense evenly (2 people)", () => {
    const r = settle(["a", "b"], [{ paidBy: "a", baseMinor: 5000 }]);
    expect(r.balances.a).toBe(2500);
    expect(r.balances.b).toBe(-2500);
    expect(r.txns).toEqual([{ from: "b", to: "a", amtMinor: 2500 }]);
  });

  it("splits evenly 3 ways and minimizes transfers", () => {
    const r = settle(["a", "b", "c"], [{ paidBy: "a", baseMinor: 9000 }]);
    expect(r.txns).toHaveLength(2);
    expect(r.txns).toContainEqual({ from: "b", to: "a", amtMinor: 3000 });
    expect(r.txns).toContainEqual({ from: "c", to: "a", amtMinor: 3000 });
  });

  it("nets out mutual expenses into the fewest transfers", () => {
    const exps: SettleExpense[] = [
      { paidBy: "a", baseMinor: 6000 },
      { paidBy: "b", baseMinor: 3000 },
    ];
    const r = settle(["a", "b", "c"], exps);
    expect(Object.values(r.balances).reduce((x, y) => x + y, 0)).toBe(0);
    expect(r.balances.c).toBe(-3000);
    for (const t of r.txns) {
      expect(r.balances[t.from]).toBeLessThan(0);
      expect(r.balances[t.to]).toBeGreaterThan(0);
    }
  });

  it("honors weights normalized to the total", () => {
    const r = settle(
      ["a", "b"],
      [{ paidBy: "a", baseMinor: 10000, method: "EXACT", weights: { a: 0, b: 10000 } }],
    );
    expect(r.balances.a).toBe(10000);
    expect(r.balances.b).toBe(-10000);
    expect(r.txns).toEqual([{ from: "b", to: "a", amtMinor: 10000 }]);
  });

  it("falls back to even when weights sum to zero", () => {
    const r = settle(["a", "b"], [{ paidBy: "a", baseMinor: 4000, method: "EXACT", weights: { a: 0, b: 0 } }]);
    expect(r.balances.a).toBe(2000);
    expect(r.balances.b).toBe(-2000);
  });

  it("ignores blank amounts and unknown payers", () => {
    const r = settle(
      ["a", "b"],
      [
        { paidBy: "a", baseMinor: null },
        { paidBy: "ghost", baseMinor: 2000 }, // unknown payer → credited to first member (a)
      ],
    );
    expect(r.balances.a).toBe(1000);
    expect(r.balances.b).toBe(-1000);
  });

  it("skips a foreign-currency expense whose conversion was never captured", () => {
    // baseMinor null means "we do not know what this cost in the base currency" — settling
    // it would require inventing a rate.
    const r = settle(["a", "b"], [{ paidBy: "a", baseMinor: null }, { paidBy: "a", baseMinor: 2000 }]);
    expect(r.balances.a).toBe(1000);
  });
});
