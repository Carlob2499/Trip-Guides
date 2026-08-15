// @protects-file Answers given when requesting a guide survive intact to the person building it.

import { describe, it, expect } from "vitest";
import {
  NICHE_VALUE,
  rankToFields, nextTailSteps, manifestSegments,
} from "./intake";

// The rank-card/issue-enum and TAIL_STEPS/field-id contracts once duplicated here as hardcoded
// lists now live in intake-contract.test.ts, asserted against the real intake-schema.mjs and
// intake-submit.js sources instead of a copy that could drift unnoticed.

describe("rankToFields", () => {
  it("maps tap order to priority order and pads with empty", () => {
    expect(rankToFields(["Nightlife", "Shopping"])).toEqual({
      priority1: "Nightlife", priority2: "Shopping", priority3: "",
    });
    expect(rankToFields([])).toEqual({ priority1: "", priority2: "", priority3: "" });
  });
});

describe("nextTailSteps", () => {
  const empty: Record<string, string> = {};
  it("asks everything when nothing is filled (except niche without a niche rank)", () => {
    const steps = nextTailSteps(empty, []);
    expect(steps.some((s) => s.ids.includes("ngNiche"))).toBe(false);
    expect(steps.some((s) => s.ids.includes("ngCountry"))).toBe(true);
  });
  it("skips a step when ALL of its fields are filled — the drop zone's whole point", () => {
    const v = { ngCountry: "Japan", ngCities: "Tokyo", ngStart: "2026-10-12", ngEnd: "2026-10-30" };
    const steps = nextTailSteps(v, []);
    expect(steps.some((s) => s.ids.includes("ngCountry"))).toBe(false);
    expect(steps.some((s) => s.ids.includes("ngStart"))).toBe(false);
    expect(steps.some((s) => s.ids.includes("ngAnchor"))).toBe(true);
  });
  it("still asks a step when only ONE of its fields is filled", () => {
    const steps = nextTailSteps({ ngCountry: "Japan" }, []); // cities empty
    expect(steps.some((s) => s.ids.includes("ngCountry"))).toBe(true);
  });
  it("asks the niche question ONLY when a ranked priority is the niche enum", () => {
    expect(nextTailSteps(empty, [NICHE_VALUE]).some((s) => s.ids.includes("ngNiche"))).toBe(true);
    expect(nextTailSteps(empty, ["Nightlife"]).some((s) => s.ids.includes("ngNiche"))).toBe(false);
  });
  it("whitespace-only counts as empty", () => {
    const steps = nextTailSteps({ ngCountry: "   " }, []);
    expect(steps.some((s) => s.ids.includes("ngCountry"))).toBe(true);
  });
});

describe("manifestSegments", () => {
  it("renders ghosts for an empty intake and never invents a value", () => {
    const segs = manifestSegments({});
    const fields = segs.filter((s) => s.field);
    expect(fields.length).toBeGreaterThan(4);
    for (const f of fields) expect(f.ghost).toBeDefined();
    // No filled text claims anything specific about the trip.
    expect(segs.map((s) => s.text ?? "").join("")).not.toMatch(/Japan|Tokyo|\d/);
  });
  it("includes optional sentences only when their values exist", () => {
    const none = manifestSegments({});
    expect(none.some((s) => s.field === "ngConstraints")).toBe(false);
    const some = manifestSegments({ ngConstraints: "no stairs", ngAnchor: "GO Fest", ngPriority2: "Shopping" });
    expect(some.some((s) => s.field === "ngConstraints")).toBe(true);
    expect(some.some((s) => s.field === "ngAnchor")).toBe(true);
    expect(some.some((s) => s.field === "ngPriority2")).toBe(true);
  });
  it("drops empty text separators", () => {
    for (const s of manifestSegments({})) {
      if (s.field === undefined) expect((s.text ?? "").length).toBeGreaterThan(0);
    }
  });
});
