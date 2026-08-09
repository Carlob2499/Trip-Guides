// @protects-file The budget summary's figures are the ledger's figures.

import { describe, it, expect } from "vitest";
import { buildBudgetSummary } from "./summary";
import { settle } from "./settle";

// The seeded Korea case used to design the sheet: three travellers, four expenses, one of
// which only two of them shared. All money is integer minor units of the base currency.
const MEMBERS = [
  { id: "m1", name: "Carlo" },
  { id: "m2", name: "Sam" },
  { id: "m3", name: "Riley" },
];
const ALL = ["m1", "m2", "m3"];
const EXPENSES = [
  { id: "e1", paidBy: "m1", desc: "Airport AREX tickets", baseMinor: 3300, participants: ALL, category: "Transport" },
  { id: "e2", paidBy: "m2", desc: "Korean BBQ dinner night 1", baseMinor: 9600, participants: ALL, category: "Food" },
  { id: "e3", paidBy: "m1", desc: "Jimjilbang entry", baseMinor: 2700, participants: ["m1", "m2"], category: "Activities" },
  { id: "e4", paidBy: "m3", desc: "T-money top-ups", baseMinor: 4500, participants: ALL, category: "Transport" },
];

describe("buildBudgetSummary — headline figures", () => {
  it("totals every real expense and divides by the party size", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], 8);
    expect(s.total).toBe(20100);
    expect(s.memberCount).toBe(3);
    expect(s.expenseCount).toBe(4);
    expect(s.perPerson).toBe(6700);
    expect(s.days).toBe(8);
    expect(s.perDay).toBe(2513);
  });

  it("omits per-day rather than guessing when the guide has no dated days", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], null);
    expect(s.days).toBeNull();
    expect(s.perDay).toBeNull();
    expect(s.total).toBe(20100);
  });

  it("ignores half-typed rows with no amount", () => {
    const s = buildBudgetSummary(MEMBERS, [...EXPENSES, { id: "e5", paidBy: "m1", desc: "", baseMinor: null }], [], 8);
    expect(s.expenseCount).toBe(4);
    expect(s.items).toHaveLength(4);
    expect(s.unconvertedCount).toBe(0);
  });

  it("counts — and excludes — an expense whose currency was never converted", () => {
    const s = buildBudgetSummary(
      MEMBERS,
      [...EXPENSES, { id: "e5", paidBy: "m1", desc: "Taxi", baseMinor: null, amountMinor: 12000, currency: "KRW" }],
      [], 8,
    );
    expect(s.unconvertedCount).toBe(1);
    expect(s.total).toBe(20100); // untouched — a guessed rate would be an invented number
  });
});

describe("buildBudgetSummary — paid vs share vs net", () => {
  it("splits paid and share out of the balance the calculator already shows", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], 8);
    const by = Object.fromEntries(s.people.map((p) => [p.id, p]));
    expect(by.m1.paid).toBe(6000);
    expect(by.m1.share).toBe(1100 + 3200 + 1350 + 1500);
    expect(by.m2.paid).toBe(9600);
    expect(by.m3.paid).toBe(4500);
    // Riley skipped the jimjilbang, so their share is lighter by exactly that half.
    expect(by.m3.share).toBe(1100 + 3200 + 1500);
  });

  it("net always equals settle()'s balance, and the three net out to zero", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], 8);
    const truth = settle(ALL, EXPENSES, []);
    s.people.forEach((p) => expect(p.net).toBe(truth.balances[p.id]));
    expect(s.people.reduce((a, p) => a + p.net, 0)).toBe(0);
  });

  it("paid minus share is the net, per person, when nothing has been settled", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], 8);
    s.people.forEach((p) => expect(p.paid - p.share).toBe(p.net));
  });

  it("a recorded payment moves the net without touching paid or share", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [{ from: "m3", to: "m2", baseMinor: 1300 }], 8);
    const by = Object.fromEntries(s.people.map((p) => [p.id, p]));
    expect(by.m3.paid).toBe(4500);              // unchanged — a settlement is not an expense
    expect(by.m3.share).toBe(5800);             // unchanged
    expect(by.m3.net).toBe(0);                  // but they are square now
    expect(s.settledCount).toBe(1);
    expect(s.settledMinor).toBe(1300);
    expect(s.total).toBe(20100);                // settling does not change what the trip cost
  });
});

describe("buildBudgetSummary — settle-up and itemisation", () => {
  it("names both sides of every transfer", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], 8);
    const truth = settle(ALL, EXPENSES, []);
    expect(s.txns).toHaveLength(truth.txns.length);
    s.txns.forEach((t, i) => {
      expect(t.amtMinor).toBe(truth.txns[i].amtMinor);
      expect(t.fromName).toBe(MEMBERS.find((m) => m.id === truth.txns[i].from)!.name);
      expect(t.toName).toBe(MEMBERS.find((m) => m.id === truth.txns[i].to)!.name);
    });
  });

  it("records who paid and how many shared each line", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], 8);
    const jj = s.items.find((i) => i.desc === "Jimjilbang entry")!;
    expect(jj.payerName).toBe("Carlo");
    expect(jj.sharerCount).toBe(2);
    expect(jj.sharerNames).toEqual(["Carlo", "Sam"]);
    expect(s.items.find((i) => i.desc === "T-money top-ups")!.sharerCount).toBe(3);
  });

  it("keeps the entered foreign amount beside the converted one", () => {
    const s = buildBudgetSummary(
      MEMBERS,
      [{ id: "e1", paidBy: "m1", desc: "Taxi", baseMinor: 3116, amountMinor: 45000, currency: "KRW", participants: ALL }],
      [], 8,
    );
    expect(s.items[0].nativeMinor).toBe(45000);
    expect(s.items[0].nativeCurrency).toBe("KRW");
    expect(s.items[0].baseMinor).toBe(3116);
  });

  it("leaves the native fields null for a base-currency expense", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], 8);
    expect(s.items[0].nativeMinor).toBeNull();
    expect(s.items[0].nativeCurrency).toBeNull();
  });

  it("gives each person only the lines they actually shared, summing to their share", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], 8);
    const riley = s.byPerson.find((p) => p.id === "m3")!;
    expect(riley.items.map((i) => i.desc)).not.toContain("Jimjilbang entry");
    expect(riley.items).toHaveLength(3);
    s.byPerson.forEach((p) => {
      expect(p.items.reduce((a, i) => a + i.share, 0)).toBe(p.total);
      expect(p.total).toBe(s.people.find((x) => x.id === p.id)!.share);
    });
  });

  it("every person's share adds back up to the trip total, to the minor unit", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], 8);
    expect(s.byPerson.reduce((a, p) => a + p.total, 0)).toBe(s.total);
  });
});

describe("buildBudgetSummary — spend by category", () => {
  it("rolls categories up, biggest first, and conserves the total", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, [], 8);
    expect(s.byCategory.map((c) => c.category)).toEqual(["Food", "Transport", "Activities"]);
    expect(s.byCategory[0]).toEqual({ category: "Food", total: 9600, count: 1 });
    expect(s.byCategory[1]).toEqual({ category: "Transport", total: 7800, count: 2 });
    expect(s.byCategory.reduce((a, c) => a + c.total, 0)).toBe(s.total);
  });

  it("gathers uncategorised spend under one honest label rather than hiding it", () => {
    const s = buildBudgetSummary(
      MEMBERS,
      [{ id: "e1", paidBy: "m1", desc: "Something", baseMinor: 500, participants: ALL }],
      [], 8,
    );
    expect(s.byCategory).toEqual([{ category: "Uncategorised", total: 500, count: 1 }]);
  });
});

describe("buildBudgetSummary — edge cases the sheet must survive", () => {
  it("labels an undescribed expense instead of printing a bare amount", () => {
    const s = buildBudgetSummary(MEMBERS, [{ id: "e1", paidBy: "m1", desc: "  ", baseMinor: 2000, participants: ALL }], [], 4);
    expect(s.items[0].desc).toBe("Unlabelled expense");
    expect(s.byPerson[0].items[0].desc).toBe("Unlabelled expense");
  });

  it("falls back to Person N for an unnamed member", () => {
    const s = buildBudgetSummary(
      [{ id: "a", name: "" }, { id: "b" }],
      [{ paidBy: "a", baseMinor: 1000, participants: ["a", "b"] }],
      [], 1,
    );
    expect(s.people.map((p) => p.name)).toEqual(["Person 1", "Person 2"]);
    expect(s.txns[0].fromName).toBe("Person 2");
  });

  it("returns a printable empty summary with no members or expenses", () => {
    const s = buildBudgetSummary([], [], [], 5);
    expect(s.total).toBe(0);
    expect(s.perPerson).toBe(0);
    expect(s.people).toEqual([]);
    expect(s.txns).toEqual([]);
    expect(s.items).toEqual([]);
    expect(s.byCategory).toEqual([]);
  });

  it("honours per-expense weights, including on a subset expense", () => {
    const s = buildBudgetSummary(
      MEMBERS,
      [{
        id: "e1", paidBy: "m1", desc: "Hotel", baseMinor: 30000,
        method: "EXACT" as const, weights: { m1: 20000, m2: 10000 }, participants: ["m1", "m2"],
      }],
      [], 3,
    );
    const by = Object.fromEntries(s.people.map((p) => [p.id, p]));
    expect(by.m1.share).toBe(20000);
    expect(by.m2.share).toBe(10000);
    expect(by.m3.share).toBe(0);
    expect(s.byPerson.find((p) => p.id === "m3")!.items).toHaveLength(0);
  });
});
