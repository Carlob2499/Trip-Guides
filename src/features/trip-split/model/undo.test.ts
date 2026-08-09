// @protects-file Undo puts the budget back exactly as it was, including what a deletion rewrote.

import { describe, it, expect } from "vitest";
import { planMemberRemoval, applyExpensePatch, type ExpensePatch } from "./undo";
import { normalizeExpense, normalizeMember, type SplitExpense } from "./records";

const members = [
  normalizeMember({ id: "a", name: "Carlo" }),
  normalizeMember({ id: "b", name: "Sam" }),
  normalizeMember({ id: "c", name: "Riley" }),
];

function exp(over: Record<string, unknown>): SplitExpense {
  return normalizeExpense(Object.assign({
    id: "e1", paidBy: "a", desc: "Dinner", amountMinor: 3000, currency: "USD",
    baseMinor: 3000, method: "EQUAL", weights: null, participants: ["a", "b", "c"], category: "",
  }, over));
}

/** The whole point: apply the plan, apply the restore, and nothing may have moved. */
function roundTrip(expenses: SplitExpense[], id: string) {
  const before = JSON.parse(JSON.stringify(expenses));
  const plan = planMemberRemoval(members, expenses, id);
  plan.patches.forEach((p) => applyExpensePatch(expenses.find((e) => e.id === p.id)!, p));
  const removed = JSON.parse(JSON.stringify(expenses));
  plan.restore.forEach((p) => applyExpensePatch(expenses.find((e) => e.id === p.id)!, p));
  return { before, removed, after: JSON.parse(JSON.stringify(expenses)), plan };
}

describe("planMemberRemoval", () => {
  it("hands the departed member's expenses to the first person still on the trip", () => {
    const { removed, plan } = roundTrip([exp({ paidBy: "b" })], "b");
    expect(removed[0].paidBy).toBe("a");
    expect(plan.restore[0].paidBy).toBe("b");
  });

  it("drops them from weights and from participant snapshots", () => {
    const { removed } = roundTrip(
      [exp({ method: "EXACT", weights: { a: 1000, b: 2000 }, participants: ["a", "b"] })],
      "b",
    );
    expect(removed[0].weights).toEqual({ a: 1000 });
    expect(removed[0].participants).toEqual(["a"]);
  });

  it("clears the snapshot rather than leaving an expense shared by nobody", () => {
    const { removed } = roundTrip([exp({ participants: ["b"] })], "b");
    // null reads as "the whole group" — a meaning. An empty list has none.
    expect(removed[0].participants).toBeNull();
  });

  it("leaves expenses that never referenced them completely alone", () => {
    const untouched = exp({ id: "e2", paidBy: "a", participants: ["a", "c"] });
    const plan = planMemberRemoval(members, [untouched], "b");
    expect(plan.patches).toEqual([]);
    expect(plan.restore).toEqual([]);
  });

  it("restores every touched field exactly — the removal is fully reversible", () => {
    const { before, after } = roundTrip([
      exp({ id: "e1", paidBy: "b", participants: ["a", "b", "c"] }),
      exp({ id: "e2", paidBy: "a", method: "SHARES", weights: { a: 1, b: 2, c: 1 }, participants: ["a", "b", "c"] }),
      exp({ id: "e3", paidBy: "c", participants: ["b"] }),
      exp({ id: "e4", paidBy: "a", participants: ["a", "c"] }),
    ], "b");
    expect(after).toEqual(before);
  });

  it("empties the payer field when the last person leaves", () => {
    const solo = [normalizeMember({ id: "a", name: "Carlo" })];
    const plan = planMemberRemoval(solo, [exp({ paidBy: "a" })], "a");
    expect(plan.patches[0].paidBy).toBe("");
  });

  it("does not mutate the records it plans over", () => {
    const e = exp({ paidBy: "b", weights: { a: 1, b: 2 }, participants: ["a", "b"] });
    const snapshot = JSON.parse(JSON.stringify(e));
    planMemberRemoval(members, [e], "b");
    expect(JSON.parse(JSON.stringify(e))).toEqual(snapshot);
  });

  /* Each of the three ways an expense can reference a person is tracked by the same flag, and
     mutation testing showed the round-trip test above covers them only as a set: an expense
     that mentions the departing member EXACTLY ONCE, in one of the three places, could stop
     producing a patch and nothing went red. That is a person who leaves the trip and stays on
     an expense — money still owed to someone no longer in the list. */
  it.each([
    ["only as the payer", { paidBy: "b", weights: null, participants: ["a", "c"] }],
    ["only in the weights", { paidBy: "a", method: "SHARES", weights: { a: 1, b: 2 }, participants: null }],
    ["only as a sharer", { paidBy: "a", weights: null, participants: ["a", "b"] }],
  ])("still plans a patch when they appear %s", (_where, over) => {
    const plan = planMemberRemoval(members, [exp(over)], "b");
    expect(plan.patches).toHaveLength(1);
    expect(plan.restore).toHaveLength(1);
  });

  it("snapshots the sharer list by copy, so undo cannot be edited out from under itself", () => {
    // Without the copy, the restore record points at the SAME array the expense holds. Any
    // later edit to that list rewrites history, and undo puts back the edited version — which
    // looks exactly like undo working.
    const e = exp({ paidBy: "a", participants: ["a", "b", "c"] });
    const original = e.participants;
    const { restore } = planMemberRemoval(members, [e], "b");
    expect(restore[0].participants).toEqual(["a", "b", "c"]);
    expect(restore[0].participants).not.toBe(original);
  });
});

describe("applyExpensePatch", () => {
  it("touches only the keys the patch carries", () => {
    const e = exp({ paidBy: "b", category: "Food" });
    applyExpensePatch(e, { id: "e1", paidBy: "a" } as ExpensePatch);
    expect(e.paidBy).toBe("a");
    expect(e.category).toBe("Food");
    expect(e.participants).toEqual(["a", "b", "c"]);
  });

  it("writes an explicit null — restoring 'the whole group' is a real value, not a skip", () => {
    const e = exp({ participants: ["a"] });
    applyExpensePatch(e, { id: "e1", participants: null });
    expect(e.participants).toBeNull();
  });
});
