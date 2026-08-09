// @protects-file Answers given when requesting a guide survive intact to the person building it.

import { describe, it, expect } from "vitest";
import {
  RANK_CARDS, NICHE_VALUE, TOPIC_CHIPS,
  rankToFields, nextTailSteps, manifestSegments, TAIL_STEPS,
} from "./intake";

/* The pipeline contract: every rank-card value must be an EXACT option string from the
   new-guide issue template (the same enum the old 3×7 dropdowns carried). If someone
   "friendlifies" a value instead of a label, the issue form silently drops it. */
const ISSUE_PRIORITY_ENUM = [
  "Food & dining", "Culture / history", "Nature / outdoors", "Nightlife",
  "Shopping", "Wellness / relaxation", "Niche interest (specify below)",
];

describe("RANK_CARDS", () => {
  it("every card value is an exact issue-template enum string", () => {
    for (const c of RANK_CARDS) expect(ISSUE_PRIORITY_ENUM).toContain(c.value);
  });
  it("covers the full enum — no priority silently unreachable from the board", () => {
    expect(RANK_CARDS.map((c) => c.value).sort()).toEqual([...ISSUE_PRIORITY_ENUM].sort());
  });
  it("topic chips never collide with enum values (they are the also-research tier)", () => {
    for (const t of TOPIC_CHIPS) expect(ISSUE_PRIORITY_ENUM).not.toContain(t);
  });
});

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

describe("TAIL_STEPS", () => {
  it("every id is a real flat-form field id (the seam: intake-submit collects by these)", () => {
    const KNOWN = ["ngCountry", "ngCities", "ngStart", "ngEnd", "ngAnchor", "ngTravelers",
      "ngParty", "ngConstraints", "ngPassports", "ngPace", "ngTravelStyle",
      "ngPriority1", "ngPriority2", "ngPriority3", "ngNiche", "ngBudget", "ngComments"];
    for (const s of TAIL_STEPS) for (const id of s.ids) expect(KNOWN).toContain(id);
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
