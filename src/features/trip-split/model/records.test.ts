import { describe, it, expect } from "vitest";
import { normalizeExpense, normalizeMember, normalizePayment, rekeyForRoom } from "./records";

/* These tests exist because of a shipped bug: the Firebase sync echo rebuilt each expense
   with a hand-copied field list that omitted `participants`, so every subset split silently
   reverted to everyone the moment the server echoed it back. It was invisible to the whole
   suite — the tests covered settle()'s math, and the math was never wrong. The data was.

   V2 adds a second job: this normalizer is where a pre-V2 record becomes a V2 one, so the
   migration tests below are as load-bearing as the shape tests. */

describe("normalizeExpense — the V2 shape", () => {
  const FULL = {
    id: "e1", paidBy: "m1", desc: "Dinner", amountMinor: 6000, currency: "USD",
    rate: null, rateDate: null, baseMinor: 6000, method: "EQUAL" as const,
    weights: null, participants: ["m1", "m2"], category: "Food", order: 3,
  };

  it("round-trips a complete record unchanged — the sync-echo path", () => {
    expect(normalizeExpense(FULL)).toEqual(FULL);
  });

  it("PRESERVES participants — the exact field the sync mapper dropped", () => {
    expect(normalizeExpense(FULL).participants).toEqual(["m1", "m2"]);
  });

  it("participants null means EVERYONE, and must not become an empty array", () => {
    // [] would mean "nobody shares this", which has no meaning. null is the honest
    // "legacy record, read as everyone" signal.
    const out = normalizeExpense({ id: "e", paidBy: "", desc: "", amountMinor: 500 });
    expect(out.participants).toBeNull();
    expect(out.participants).not.toEqual([]);
  });

  it("keeps amountMinor 0 as 0, not null — 0 is a real amount", () => {
    expect(normalizeExpense({ id: "e", amountMinor: 0 }).amountMinor).toBe(0);
  });

  it("maps a missing amount to null, not undefined or 0", () => {
    expect(normalizeExpense({ id: "e" }).amountMinor).toBeNull();
    expect(normalizeExpense({ id: "e", amountMinor: undefined }).amountMinor).toBeNull();
    expect(normalizeExpense({ id: "e", amountMinor: null }).amountMinor).toBeNull();
  });

  it("defaults text fields to '' so the UI never renders 'undefined'", () => {
    const out = normalizeExpense({ id: "e" });
    expect(out.paidBy).toBe("");
    expect(out.desc).toBe("");
    expect(out.category).toBe("");
  });

  it("defaults the method to EQUAL and rejects a method it does not know", () => {
    expect(normalizeExpense({ id: "e" }).method).toBe("EQUAL");
    expect(normalizeExpense({ id: "e", method: "VIBES" }).method).toBe("EQUAL");
    expect(normalizeExpense({ id: "e", method: "SHARES" }).method).toBe("SHARES");
  });

  it("preserves weights including a meaningful zero", () => {
    // A 0 weight is meaningful: that person shares the expense at no cost.
    const out = normalizeExpense({ id: "e", amountMinor: 1000, weights: { m1: 1000, m2: 0 } });
    expect(out.weights).toEqual({ m1: 1000, m2: 0 });
  });

  it("falls back to the base currency rather than trusting an unknown code", () => {
    expect(normalizeExpense({ id: "e", currency: "KRW" }).currency).toBe("KRW");
    expect(normalizeExpense({ id: "e", currency: "XYZ" }).currency).toBe("USD");
    expect(normalizeExpense({ id: "e" }).currency).toBe("USD");
  });

  it("keeps order when present and undefined when not — both are legitimate", () => {
    expect(normalizeExpense({ id: "e", order: 7 }).order).toBe(7);
    expect(normalizeExpense({ id: "e" }).order).toBeUndefined();
  });

  it("produces the SAME shape from a local record and a sync record", () => {
    const local = normalizeExpense({ id: "e1", paidBy: "m1", desc: "D", amountMinor: 6000, participants: ["m1"] });
    const synced = normalizeExpense({ id: "e1", paidBy: "m1", desc: "D", amountMinor: 6000, participants: ["m1"], order: 2 });
    expect(Object.keys(local).sort()).toEqual(Object.keys(synced).sort());
  });
});

describe("normalizeExpense — migrating a pre-V2 record", () => {
  it("converts a float dollar amount into integer cents", () => {
    const out = normalizeExpense({ id: "e", paidBy: "m1", desc: "Dinner", amount: 96.4 });
    expect(out.amountMinor).toBe(9640);
    expect(out.currency).toBe("USD");
    expect(out.baseMinor).toBe(9640);
  });

  it("rounds a float that cannot be represented exactly, instead of truncating it", () => {
    expect(normalizeExpense({ id: "e", amount: 0.615 }).amountMinor).toBe(62);
    expect(normalizeExpense({ id: "e", amount: 33.333 }).amountMinor).toBe(3333);
  });

  it("keeps a legacy amount of 0 as 0 rather than losing the record", () => {
    expect(normalizeExpense({ id: "e", amount: 0 }).amountMinor).toBe(0);
  });

  it("carries a legacy float split map into integer weights", () => {
    const out = normalizeExpense({ id: "e", amount: 100, split: { m1: 25.5, m2: 74.5 } });
    expect(out.weights).toEqual({ m1: 2550, m2: 7450 });
  });

  it("does NOT force the method — the trip-wide flag lives outside this record", () => {
    // Whether those weights are used is ui/trip-split.js's migrate() to decide, because the
    // old customSplit boolean was trip meta and is not in scope here.
    expect(normalizeExpense({ id: "e", amount: 100, split: { m1: 100 } }).method).toBe("EQUAL");
  });

  it("prefers an explicit V2 field over its legacy counterpart", () => {
    const out = normalizeExpense({ id: "e", amount: 60, amountMinor: 4200 });
    expect(out.amountMinor).toBe(4200);
  });

  it("leaves baseMinor null for a foreign expense with no captured conversion", () => {
    // Guessing a rate here would invent a number; settle() skips it instead.
    const out = normalizeExpense({ id: "e", amountMinor: 45000, currency: "KRW" });
    expect(out.baseMinor).toBeNull();
  });

  it("keeps a captured conversion when there is one", () => {
    const out = normalizeExpense({ id: "e", amountMinor: 45000, currency: "KRW", rate: 1444, baseMinor: 3116 });
    expect(out.baseMinor).toBe(3116);
    expect(out.rate).toBe(1444);
  });

  it("discards a nonsense rate rather than storing it", () => {
    expect(normalizeExpense({ id: "e", rate: 0 }).rate).toBeNull();
    expect(normalizeExpense({ id: "e", rate: -5 }).rate).toBeNull();
    expect(normalizeExpense({ id: "e", rate: "abc" }).rate).toBeNull();
  });
});

describe("normalizeMember", () => {
  it("round-trips a complete record", () => {
    const m = { id: "m1", name: "Ana", payment: "Venmo @ana", order: 1 };
    expect(normalizeMember(m)).toEqual(m);
  });

  it("defaults name/payment to '' so an empty new member renders blank, not 'undefined'", () => {
    expect(normalizeMember({ id: "m1" })).toEqual({ id: "m1", name: "", payment: "", order: undefined });
  });

  it("gives the local and synced creation paths an identical shape", () => {
    const local = normalizeMember({ id: "m1", name: "", payment: "" });
    const synced = normalizeMember({ id: "m1", name: "", payment: "", order: 4 });
    expect(Object.keys(local).sort()).toEqual(Object.keys(synced).sort());
  });

  it("keeps order when present", () => {
    expect(normalizeMember({ id: "m", order: 0 }).order).toBe(0);
  });
});

describe("normalizePayment", () => {
  it("round-trips a complete record", () => {
    const p = { id: "p1", from: "m1", to: "m2", baseMinor: 1300, on: "2026-07-15", note: "cash", order: 1 };
    expect(normalizePayment(p)).toEqual(p);
  });

  it("coerces a missing or unusable amount to 0 rather than NaN", () => {
    expect(normalizePayment({ id: "p" }).baseMinor).toBe(0);
    expect(normalizePayment({ id: "p", baseMinor: "abc" }).baseMinor).toBe(0);
  });

  it("rounds a fractional amount to whole minor units", () => {
    expect(normalizePayment({ id: "p", baseMinor: 1300.6 }).baseMinor).toBe(1301);
  });

  it("defaults text fields to ''", () => {
    const out = normalizePayment({ id: "p" });
    expect(out.from).toBe("");
    expect(out.note).toBe("");
    expect(out.on).toBe("");
  });
});

/* rekeyForRoom — restoring a stranded solo-mode ledger into a shared room.

   Tested here rather than trusted inline because its failure mode does not look like a
   failure: a room mints its own record ids, so if a reference to a person is not moved with
   them, every amount still arrives, every total still adds up, and only the BALANCES are
   wrong. Nobody reads a restored ledger closely enough to catch that by eye. */
describe("rekeyForRoom", () => {
  const ledger = {
    members: [
      { id: "old-a", name: "Ana", payment: "Revolut" },
      { id: "old-b", name: "Ben", payment: "" },
    ],
    expenses: [
      {
        id: "e1", desc: "KTX", amountMinor: 5900, currency: "KRW", paidBy: "old-a",
        participants: ["old-a", "old-b"], method: "EXACT", weights: { "old-a": 3000, "old-b": 2900 },
      },
    ],
    payments: [{ id: "p1", from: "old-b", to: "old-a", baseMinor: 2900 }],
  };
  const mint = (_m: unknown, i: number) => `new-${i}`;

  it("gives every member the room's own id and rewrites every reference to them", () => {
    const out = rekeyForRoom(ledger, mint);
    expect(out.members.map((m) => m.id)).toEqual(["new-0", "new-1"]);
    expect(out.members.map((m) => m.name)).toEqual(["Ana", "Ben"]);

    const e = out.expenses[0];
    expect(e.paidBy).toBe("new-0");
    expect(e.participants).toEqual(["new-0", "new-1"]);
    // The weights MAP is keyed by member id — the reference most easily missed, and the one
    // that changes what each person owes rather than what anything cost.
    expect(e.weights).toEqual({ "new-0": 3000, "new-1": 2900 });
    expect(out.payments[0]).toMatchObject({ from: "new-1", to: "new-0" });
  });

  it("keeps the money and the shape untouched — this remaps identity, nothing else", () => {
    const e = rekeyForRoom(ledger, mint).expenses[0];
    expect(e.amountMinor).toBe(5900);
    expect(e.currency).toBe("KRW");
    expect(e.method).toBe("EXACT");
    expect(e.desc).toBe("KTX");
  });

  it("drops the old record id so the room assigns its own, and reorders from zero", () => {
    const out = rekeyForRoom(ledger, mint);
    expect(out.expenses[0].id).toBeUndefined();
    expect(out.payments[0].id).toBeUndefined();
    expect(out.expenses[0].order).toBe(0);
    expect(out.members[1].order).toBe(1);
  });

  it("passes an unmapped reference through instead of emptying it", () => {
    // A dangling id is visible and fixable; a silently blanked `paidBy` reads as an expense
    // nobody paid for, which is indistinguishable from real data.
    const orphan = { members: [], expenses: [{ paidBy: "ghost", participants: ["ghost"] }], payments: [] };
    const out = rekeyForRoom(orphan, mint);
    expect(out.expenses[0].paidBy).toBe("ghost");
  });

  it("survives an empty or malformed ledger rather than throwing into the UI", () => {
    expect(rekeyForRoom(null, mint)).toEqual({ members: [], expenses: [], payments: [] });
    expect(rekeyForRoom({}, mint)).toEqual({ members: [], expenses: [], payments: [] });
  });
});
