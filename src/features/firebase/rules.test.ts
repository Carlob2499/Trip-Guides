/* rules.json is the ONE part of this feature that no build, lint or test could see, because
   it is not code the site runs — it is pasted by hand into the Firebase console. That gap is
   not hypothetical: Trip Split V2 changed the record shape (integer minor units, per-expense
   split method, recorded payments) and rules.json stayed on the pre-V2 shape, where
   `"$other": {".validate": false}` rejects any field not explicitly listed. Every V2 expense
   write would have been denied — and RTDB applies a write locally BEFORE the server rejects
   it, so the row appears, vanishes, and says nothing (see sync.js's onWriteFailed).

   This test closes the loop that matters: the record shape is defined in
   trip-split/model/records.ts, so DERIVE the field list from the normalizers rather than
   retyping it. Adding a field to a record now fails here until the rules learn about it.

   What it cannot check: whether the rules currently PUBLISHED in the console match this
   file. Publishing stays a human step (README.md step 5). */
// @protects-file The database refuses writes the app should never make.

import { describe, it, expect } from "vitest";
import rules from "./rules.json";
import { normalizeExpense, normalizeMember, normalizePayment } from "../trip-split/model/records";

/** The rules tree is deliberately loose here: it is a hand-authored config, not a typed
    artifact, and this test walks it by key name. */
type RuleNode = Record<string, unknown>;
const trip = (rules as { rules: { trips: { $code: RuleNode } } }).rules.trips.$code;

/** Fields the sync layer stamps on every record it writes (sync.js's add/addAsync). */
const SYNC_FIELDS = ["createdBy", "createdAt"];
/** `id` is the RTDB key, never a child of the record. */
const NOT_A_FIELD = ["id"];

function ruleFieldsOf(node: RuleNode): string[] {
  return Object.keys(node).filter((k) => !k.startsWith(".") && k !== "$other");
}

function expectCovered(collection: string, recordKeys: string[]) {
  const coll = trip[collection] as RuleNode;
  const wildcard = Object.keys(coll).find((k) => k.startsWith("$"))!;
  const allowed = ruleFieldsOf(coll[wildcard] as RuleNode);
  const missing = recordKeys
    .filter((k) => NOT_A_FIELD.indexOf(k) === -1)
    .concat(SYNC_FIELDS)
    .filter((k) => allowed.indexOf(k) === -1);
  expect(missing, `${collection}: rules.json has no rule for ${missing.join(", ")} — RTDB's ` +
    `$other:false would reject every write carrying them`).toEqual([]);
}

describe("rules.json covers the record shapes the app actually writes", () => {
  it("has a rule for every field of an expense", () => {
    expectCovered("expenses", Object.keys(normalizeExpense({ id: "e" })));
  });

  it("has a rule for every field of a member", () => {
    expectCovered("members", Object.keys(normalizeMember({ id: "m" })));
  });

  it("has a payments collection, with a rule for every field of a payment", () => {
    expect(trip.payments, "settling is RECORDED in trips/<code>/payments — without a rule " +
      "block the parent's $other:false rejects the whole node").toBeTruthy();
    expectCovered("payments", Object.keys(normalizePayment({ id: "p" })));
  });

  it("still accepts the legacy pre-V2 expense fields, so existing rooms stay editable", () => {
    const allowed = ruleFieldsOf((trip.expenses as RuleNode).$eid as RuleNode);
    expect(allowed).toContain("amount");
    expect(allowed).toContain("split");
  });

  it("keeps the room-code length gate that makes the code itself the lock", () => {
    expect(trip[".write"]).toContain("$code.length >= 16");
    expect(trip[".write"]).toContain("$code.length <= 40");
  });
});
