import { describe, expect, it } from "vitest";
import type { LegacyRouteAnchor } from "../model/destinations";
import { legacyAnchorsFor, normalizeGuideRoute, routeForLegacyHash } from "../model/routing";

const anchors: LegacyRouteAnchor[] = [
  { id: "grp-0", route: "days" },
  { id: "grp-1", route: "food" },
  { id: "grp-2", route: "explore" },
  { id: "grp-3", route: "explore" },
  { id: "grp-4", route: "tools" },
];

describe("traveler named-route migration helpers", () => {
  it("normalizes only canonical traveler routes", () => {
    expect(normalizeGuideRoute(" Explore ")).toBe("explore");
    expect(normalizeGuideRoute("field-log")).toBeNull();
    expect(normalizeGuideRoute(3)).toBeNull();
  });

  it("preserves old group hashes without guessing unknown anchors", () => {
    expect(routeForLegacyHash("#grp-2", anchors)).toBe("explore");
    expect(routeForLegacyHash("grp-4", anchors)).toBe("tools");
    expect(routeForLegacyHash("#grp-99", anchors)).toBeNull();
    expect(routeForLegacyHash("#dest-explore", anchors)).toBeNull();
  });

  it("groups all legacy anchors owned by one canonical panel", () => {
    expect(legacyAnchorsFor("explore", anchors).map((anchor) => anchor.id)).toEqual(["grp-2", "grp-3"]);
    expect(legacyAnchorsFor("sources", anchors)).toEqual([]);
  });
});
