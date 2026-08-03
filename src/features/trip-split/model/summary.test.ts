import { describe, it, expect } from "vitest";
import { buildBudgetSummary } from "./summary";
import { settle } from "./settle";

// The seeded Korea case used to design the sheet: three travellers, four expenses, one of
// which only two of them shared. Every figure below is what the calculator shows on screen —
// the sheet exists to print exactly these, so the test asserts the whole set at once.
const MEMBERS = [
  { id: "m1", name: "Carlo" },
  { id: "m2", name: "Sam" },
  { id: "m3", name: "Riley" },
];
const EXPENSES = [
  { id: "e1", paidBy: "m1", desc: "Airport AREX tickets", amount: 33 },
  { id: "e2", paidBy: "m2", desc: "Korean BBQ dinner night 1", amount: 96 },
  { id: "e3", paidBy: "m1", desc: "Jimjilbang entry", amount: 27, participants: ["m1", "m2"] },
  { id: "e4", paidBy: "m3", desc: "T-money top-ups", amount: 45 },
];

describe("buildBudgetSummary — headline figures", () => {
  it("totals every real expense and divides by the party size", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, false, 8);
    expect(s.total).toBeCloseTo(201);
    expect(s.memberCount).toBe(3);
    expect(s.expenseCount).toBe(4);
    expect(s.perPerson).toBeCloseTo(67);
    expect(s.days).toBe(8);
    expect(s.perDay).toBeCloseTo(25.125);
  });

  it("omits per-day rather than guessing when the guide has no dated days", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, false, null);
    expect(s.days).toBeNull();
    expect(s.perDay).toBeNull();
    expect(s.total).toBeCloseTo(201); // the rest of the sheet is unaffected
  });

  it("ignores half-typed rows with no amount", () => {
    const s = buildBudgetSummary(MEMBERS, [...EXPENSES, { id: "e5", paidBy: "m1", desc: "", amount: null }], false, 8);
    expect(s.expenseCount).toBe(4);
    expect(s.items).toHaveLength(4);
  });
});

describe("buildBudgetSummary — paid vs share vs net", () => {
  it("splits paid and share out of the balance the calculator already shows", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, false, 8);
    const by = Object.fromEntries(s.people.map((p) => [p.id, p]));
    // Carlo paid the AREX + jimjilbang; shares all of AREX/BBQ/T-money plus half the jimjilbang.
    expect(by.m1.paid).toBeCloseTo(60);
    expect(by.m1.share).toBeCloseTo(11 + 32 + 13.5 + 15);
    expect(by.m2.paid).toBeCloseTo(96);
    expect(by.m3.paid).toBeCloseTo(45);
    // Riley skipped the jimjilbang, so their share is lighter by exactly that half.
    expect(by.m3.share).toBeCloseTo(11 + 32 + 15);
  });

  it("net always equals settle()'s balance, and the three net out to zero", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, false, 8);
    const truth = settle(MEMBERS.map((m) => m.id), EXPENSES, false);
    s.people.forEach((p) => expect(p.net).toBeCloseTo(truth.balances[p.id]));
    expect(s.people.reduce((a, p) => a + p.net, 0)).toBeCloseTo(0);
  });

  it("paid minus share is the net, per person (the sheet prints all three side by side)", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, false, 8);
    s.people.forEach((p) => expect(p.paid - p.share).toBeCloseTo(p.net));
  });
});

describe("buildBudgetSummary — settle-up and itemisation", () => {
  it("names both sides of every transfer", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, false, 8);
    const truth = settle(MEMBERS.map((m) => m.id), EXPENSES, false);
    expect(s.txns).toHaveLength(truth.txns.length);
    s.txns.forEach((t, i) => {
      expect(t.amt).toBeCloseTo(truth.txns[i].amt);
      expect(t.fromName).toBe(MEMBERS.find((m) => m.id === truth.txns[i].from)!.name);
      expect(t.toName).toBe(MEMBERS.find((m) => m.id === truth.txns[i].to)!.name);
    });
  });

  it("records who paid and how many shared each line", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, false, 8);
    const jj = s.items.find((i) => i.desc === "Jimjilbang entry")!;
    expect(jj.payerName).toBe("Carlo");
    expect(jj.sharerCount).toBe(2);
    expect(jj.sharerNames).toEqual(["Carlo", "Sam"]);
    expect(s.items.find((i) => i.desc === "T-money top-ups")!.sharerCount).toBe(3);
  });

  it("gives each person only the lines they actually shared, summing to their share", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, false, 8);
    const riley = s.byPerson.find((p) => p.id === "m3")!;
    expect(riley.items.map((i) => i.desc)).not.toContain("Jimjilbang entry");
    expect(riley.items).toHaveLength(3);
    s.byPerson.forEach((p) => {
      expect(p.items.reduce((a, i) => a + i.share, 0)).toBeCloseTo(p.total);
      expect(p.total).toBeCloseTo(s.people.find((x) => x.id === p.id)!.share);
    });
  });

  it("every person's share adds back up to the trip total", () => {
    const s = buildBudgetSummary(MEMBERS, EXPENSES, false, 8);
    expect(s.byPerson.reduce((a, p) => a + p.total, 0)).toBeCloseTo(s.total);
  });
});

describe("buildBudgetSummary — edge cases the sheet must survive", () => {
  it("labels an undescribed expense instead of printing a bare amount", () => {
    const s = buildBudgetSummary(MEMBERS, [{ id: "e1", paidBy: "m1", desc: "  ", amount: 20 }], false, 4);
    expect(s.items[0].desc).toBe("Unlabelled expense");
    expect(s.byPerson[0].items[0].desc).toBe("Unlabelled expense");
  });

  it("falls back to Person N for an unnamed member", () => {
    const s = buildBudgetSummary([{ id: "a", name: "" }, { id: "b" }], [{ paidBy: "a", amount: 10 }], false, 1);
    expect(s.people.map((p) => p.name)).toEqual(["Person 1", "Person 2"]);
    expect(s.txns[0].fromName).toBe("Person 2");
  });

  it("returns a printable empty summary with no members or expenses", () => {
    const s = buildBudgetSummary([], [], false, 5);
    expect(s.total).toBe(0);
    expect(s.perPerson).toBe(0);
    expect(s.people).toEqual([]);
    expect(s.txns).toEqual([]);
    expect(s.items).toEqual([]);
  });

  it("honours custom amounts, including a subset expense", () => {
    const s = buildBudgetSummary(
      MEMBERS,
      [{ id: "e1", paidBy: "m1", desc: "Hotel", amount: 300, split: { m1: 200, m2: 100, m3: 0 }, participants: ["m1", "m2"] }],
      true,
      3,
    );
    const by = Object.fromEntries(s.people.map((p) => [p.id, p]));
    expect(by.m1.share).toBeCloseTo(200);
    expect(by.m2.share).toBeCloseTo(100);
    expect(by.m3.share).toBeCloseTo(0);
    expect(s.byPerson.find((p) => p.id === "m3")!.items).toHaveLength(0);
  });
});
