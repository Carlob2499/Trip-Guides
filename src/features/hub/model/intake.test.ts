// @protects-file Answers given when requesting a guide survive intact to the person building it.

import { describe, it, expect } from "vitest";
import { NICHE_VALUE, RANK_CARDS, rankToFields } from "./intake";

// The rank-card/issue-enum and field-id contracts once duplicated here as hardcoded lists now
// live in intake-contract.test.ts, asserted against the real intake-schema.mjs and
// intake-submit.js sources instead of a copy that could drift unnoticed. The checklist that
// renders these cards — sections, status, matchups, fork gate — is checklist.test.ts.

describe("rankToFields", () => {
  it("maps rank order to priority order and pads with empty", () => {
    expect(rankToFields(["Nightlife", "Shopping"])).toEqual({
      priority1: "Nightlife", priority2: "Shopping", priority3: "",
    });
    expect(rankToFields([])).toEqual({ priority1: "", priority2: "", priority3: "" });
  });

  it("drops anything past the third seat — the schema has three", () => {
    const five = RANK_CARDS.slice(0, 5).map((c) => c.value);
    expect(Object.values(rankToFields(five))).toEqual(five.slice(0, 3));
  });
});

describe("the niche option", () => {
  it("is a card like any other, and its exact enum string", () => {
    expect(RANK_CARDS.map((c) => c.value)).toContain(NICHE_VALUE);
  });
});
