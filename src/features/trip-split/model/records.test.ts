import { describe, it, expect } from "vitest";
import { normalizeExpense, normalizeMember } from "./records";

/* These tests exist because of a shipped bug: the Firebase sync echo rebuilt each expense
   with a hand-copied field list that omitted `participants`, so every subset split silently
   reverted to everyone the moment the server echoed it back. It was invisible to the whole
   suite — the tests covered settle()'s math, and the math was never wrong. The data was. */

describe("normalizeExpense", () => {
  const FULL = {
    id: "e1", paidBy: "m1", desc: "Dinner", amount: 60,
    split: { m1: 30, m2: 30 }, participants: ["m1", "m2"], order: 3,
  };

  it("round-trips a complete record unchanged — the sync-echo path", () => {
    expect(normalizeExpense(FULL)).toEqual(FULL);
  });

  it("PRESERVES participants — the exact field the sync mapper dropped", () => {
    // This is the regression. If it ever fails, subset splits are broken again in the
    // shared room, and only in the shared room.
    expect(normalizeExpense(FULL).participants).toEqual(["m1", "m2"]);
  });

  it("participants null means EVERYONE, and must not become an empty array", () => {
    // [] would mean "nobody shares this", which has no meaning and divides by zero in
    // settle(). null is the honest "unset → everyone" signal.
    const out = normalizeExpense({ id: "e", paidBy: "", desc: "", amount: 5 });
    expect(out.participants).toBeNull();
    expect(out.participants).not.toEqual([]);
  });

  it("keeps amount 0 as 0, not null — 0 is a real amount", () => {
    // `|| null` here would erase a deliberately-zeroed expense. `!= null` is load-bearing.
    expect(normalizeExpense({ id: "e", amount: 0 }).amount).toBe(0);
  });

  it("maps a missing amount to null, not undefined or 0", () => {
    expect(normalizeExpense({ id: "e" }).amount).toBeNull();
    expect(normalizeExpense({ id: "e", amount: undefined }).amount).toBeNull();
    expect(normalizeExpense({ id: "e", amount: null }).amount).toBeNull();
  });

  it("defaults text fields to '' so the UI never renders 'undefined'", () => {
    const out = normalizeExpense({ id: "e" });
    expect(out.paidBy).toBe("");
    expect(out.desc).toBe("");
  });

  it("preserves a custom split map and a zero inside it", () => {
    // A 0 in a custom split is meaningful: that person shares the expense at no cost.
    const out = normalizeExpense({ id: "e", amount: 10, split: { m1: 10, m2: 0 } });
    expect(out.split).toEqual({ m1: 10, m2: 0 });
  });

  it("keeps order when present and undefined when not — both are legitimate", () => {
    expect(normalizeExpense({ id: "e", order: 7 }).order).toBe(7);
    expect(normalizeExpense({ id: "e" }).order).toBeUndefined();
  });

  it("produces the SAME shape from a local record and a sync record", () => {
    // The bug was two paths disagreeing about the shape. Pin that they can't.
    const local = normalizeExpense({ id: "e1", paidBy: "m1", desc: "D", amount: 60, participants: ["m1"] });
    const synced = normalizeExpense({ id: "e1", paidBy: "m1", desc: "D", amount: 60, participants: ["m1"], order: 2 });
    expect(Object.keys(local).sort()).toEqual(Object.keys(synced).sort());
  });
});

describe("normalizeMember", () => {
  it("round-trips a complete record", () => {
    const m = { id: "m1", name: "Ana", payment: "Venmo @ana", order: 1 };
    expect(normalizeMember(m)).toEqual(m);
  });

  it("defaults name/payment to '' so an empty new member renders blank, not 'undefined'", () => {
    // opAddMember() creates {id, name:"", payment:""} locally and {name,payment,order}
    // over sync — both must normalize to the same thing.
    expect(normalizeMember({ id: "m1" })).toEqual({ id: "m1", name: "", payment: "", order: undefined });
  });

  it("gives the local and synced creation paths an identical shape", () => {
    // Before this normalizer the sync echo hand-copied {id,name,payment,order} while the
    // local path pushed {id,name,payment} — the same divergence that broke expenses,
    // sitting unexercised on the members side.
    const local = normalizeMember({ id: "m1", name: "", payment: "" });
    const synced = normalizeMember({ id: "m1", name: "", payment: "", order: 4 });
    expect(Object.keys(local).sort()).toEqual(Object.keys(synced).sort());
  });

  it("keeps order when present", () => {
    expect(normalizeMember({ id: "m", order: 0 }).order).toBe(0);
  });
});
