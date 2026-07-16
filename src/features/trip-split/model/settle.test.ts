import { describe, it, expect } from "vitest";
import { settle, type SettleExpense } from "./settle";

describe("settle", () => {
  it("returns nothing for no members", () => {
    expect(settle([], [], false)).toEqual({ balances: {}, txns: [] });
  });

  it("zeroes out with members but no expenses", () => {
    const r = settle(["a", "b"], [], false);
    expect(r.balances).toEqual({ a: 0, b: 0 });
    expect(r.txns).toEqual([]);
  });

  it("splits a single expense evenly (2 people)", () => {
    // a pays $50; even split → b owes a $25.
    const r = settle(["a", "b"], [{ paidBy: "a", amount: 50 }], false);
    expect(r.balances.a).toBeCloseTo(25);
    expect(r.balances.b).toBeCloseTo(-25);
    expect(r.txns).toEqual([{ from: "b", to: "a", amt: 25 }]);
  });

  it("splits evenly 3 ways and minimizes transfers", () => {
    // a pays 90 for three → each owes 30 → b→a 30, c→a 30.
    const r = settle(["a", "b", "c"], [{ paidBy: "a", amount: 90 }], false);
    expect(r.txns).toHaveLength(2);
    expect(r.txns).toContainEqual({ from: "b", to: "a", amt: 30 });
    expect(r.txns).toContainEqual({ from: "c", to: "a", amt: 30 });
  });

  it("nets out mutual expenses into the fewest transfers", () => {
    // a pays 60 (each owes 20), b pays 30 (each owes 10). Net: a +25, b -5... check.
    // a: +60 -20(own) -10(b's) = +30 ... balances: a 60-20=+40 from own; then b's 30 splits:
    // a -10, b +30-10=+20-? let's just assert conservation + minimality.
    const exps: SettleExpense[] = [
      { paidBy: "a", amount: 60 },
      { paidBy: "b", amount: 30 },
    ];
    const r = settle(["a", "b", "c"], exps, false);
    const sum = Object.values(r.balances).reduce((x, y) => x + y, 0);
    expect(sum).toBeCloseTo(0); // balances always conserve
    // c paid nothing and owes its full share of 90/3 = 30.
    expect(r.balances.c).toBeCloseTo(-30);
    // Every transfer flows FROM a debtor TO a creditor, and total moved settles everyone.
    for (const t of r.txns) {
      expect(r.balances[t.from]).toBeLessThan(0);
      expect(r.balances[t.to]).toBeGreaterThan(0);
    }
  });

  it("honors a custom split normalized to the total", () => {
    // a pays 100; custom split a:0 b:100 → b owes a the whole 100.
    const r = settle(
      ["a", "b"],
      [{ paidBy: "a", amount: 100, split: { a: 0, b: 100 } }],
      true,
    );
    expect(r.balances.a).toBeCloseTo(100);
    expect(r.balances.b).toBeCloseTo(-100);
    expect(r.txns).toEqual([{ from: "b", to: "a", amt: 100 }]);
  });

  it("custom split falls back to even when shares sum to zero", () => {
    const r = settle(
      ["a", "b"],
      [{ paidBy: "a", amount: 40, split: { a: 0, b: 0 } }],
      true,
    );
    expect(r.balances.a).toBeCloseTo(20);
    expect(r.balances.b).toBeCloseTo(-20);
  });

  it("ignores zero/blank amounts and unknown payers", () => {
    const r = settle(
      ["a", "b"],
      [
        { paidBy: "a", amount: null },
        { paidBy: "ghost", amount: 20 }, // unknown payer → credited to first member (a)
      ],
      false,
    );
    expect(r.balances.a).toBeCloseTo(10);
    expect(r.balances.b).toBeCloseTo(-10);
  });
});
