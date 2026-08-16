// @protects-file A guide still being researched is visible on the hub; one deliberately
// withheld after a finished run stays invisible.

import { describe, it, expect } from "vitest";
import { isGuideBuilding, deriveBuildingGuides } from "./building";

/** A fresh scaffold's state.json: `scaffold` cleared, every later stage still null
    (scripts/pipeline.mjs `initState`). */
const freshState = {
  stages: { scaffold: "2026-08-15T09:00:00.000Z", passA: null, passB: null, reconcile: null, verified: null },
};

/** japan's real committed state.json, trimmed to the field the rule reads. */
const finishedState = {
  stages: {
    scaffold: "2026-07-29T09:12:03.464Z",
    passA: "2026-07-29T10:32:26.640Z",
    passB: "2026-07-29T10:32:26.675Z",
    reconcile: "2026-07-29T10:32:26.711Z",
    verified: "2026-07-29T10:45:40.438Z",
  },
};

describe("isGuideBuilding", () => {
  it("is true for a draft guide whose run has not reached verified", () => {
    expect(isGuideBuilding({ draft: true, state: freshState })).toBe(true);
  });

  it("is false once the run has cleared verified — a withheld draft is not a build (japan)", () => {
    expect(isGuideBuilding({ draft: true, state: finishedState })).toBe(false);
  });

  it("is false for a published guide, whatever its run state says", () => {
    expect(isGuideBuilding({ draft: undefined, state: freshState })).toBe(false);
    expect(isGuideBuilding({ draft: false, state: freshState })).toBe(false);
    expect(isGuideBuilding({ draft: false, state: null })).toBe(false);
  });

  it("is false when there is no run state to read — refuses rather than guesses", () => {
    expect(isGuideBuilding({ draft: true, state: null })).toBe(false);
    expect(isGuideBuilding({ draft: true, state: undefined })).toBe(false);
  });

  it("survives a malformed state.json without throwing", () => {
    expect(isGuideBuilding({ draft: true, state: {} })).toBe(true);
    expect(isGuideBuilding({ draft: true, state: { stages: null } })).toBe(true);
    expect(isGuideBuilding({ draft: true, state: { stages: {} } })).toBe(true);
  });

  it("treats an empty-string verified stamp as not-yet-verified", () => {
    expect(isGuideBuilding({ draft: true, state: { stages: { verified: "" } } })).toBe(true);
  });
});

describe("deriveBuildingGuides", () => {
  it("keeps only the guides being built, in the order given", () => {
    const rows = deriveBuildingGuides([
      { slug: "denmark", title: "Denmark", country: "Denmark", state: null },
      { slug: "brazil", title: "Rio de Janeiro & Brazil", country: "Brazil", draft: true, state: freshState },
      { slug: "japan", title: "Japan", country: "Japan", draft: true, state: finishedState },
      { slug: "peru", title: "Peru", country: "Peru", draft: true, state: freshState },
    ]);
    expect(rows.map((r) => r.slug)).toEqual(["brazil", "peru"]);
  });

  it("drops the country sub-line when the title already carries it", () => {
    const [exact, contained] = deriveBuildingGuides([
      { slug: "peru", title: "Peru", country: "Peru", draft: true, state: freshState },
      { slug: "brazil", title: "Rio de Janeiro & Brazil", country: "brazil", draft: true, state: freshState },
    ]);
    expect(exact.country).toBeNull();
    expect(contained.country).toBeNull();
  });

  it("keeps the country when it says something the title does not", () => {
    const [row] = deriveBuildingGuides([
      { slug: "patagonia", title: "Patagonia crossing", country: "Argentina", draft: true, state: freshState },
    ]);
    expect(row.country).toBe("Argentina");
  });

  it("treats a blank or missing country as no sub-line", () => {
    const rows = deriveBuildingGuides([
      { slug: "a", title: "Somewhere", country: "   ", draft: true, state: freshState },
      { slug: "b", title: "Elsewhere", draft: true, state: freshState },
    ]);
    expect(rows.map((r) => r.country)).toEqual([null, null]);
  });

  it("returns an empty list rather than a placeholder when nothing is being built", () => {
    expect(deriveBuildingGuides([{ slug: "korea", title: "South Korea", state: null }])).toEqual([]);
  });
});
