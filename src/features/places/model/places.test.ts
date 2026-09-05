import { describe, expect, it } from "vitest";
import { attachExternalPlaceId, closedStatus, relevantPlaces } from "./places";

describe("place live overlays", () => {
  it("queries only current, today, and selected canonical places with stable-ID deduplication", () => {
    const all = [
      { waypointId: "a", googlePlaceId: "ga" },
      { waypointId: "b", googlePlaceId: "gb" },
      { waypointId: "c", googlePlaceId: "gc" },
      { waypointId: "d", googlePlaceId: "gd" },
    ];
    expect(relevantPlaces(all, { currentId: "b", todayIds: ["a", "b"], selectedIds: ["d"] }).map((p) => p.waypointId)).toEqual(["a", "b", "d"]);
  });

  it("adds an external id without changing Waypoint identity or mutating canonical data", () => {
    const canonical = { waypointId: "museum-1", lookupText: "Museum, City" };
    const mapped = attachExternalPlaceId(canonical, "ChIJ123");
    expect(mapped).toEqual({ waypointId: "museum-1", lookupText: "Museum, City", googlePlaceId: "ChIJ123" });
    expect(canonical).toEqual({ waypointId: "museum-1", lookupText: "Museum, City" });
  });

  it("expresses closure only and does not invent replacement recommendations", () => {
    const overlay = { waypointId: "museum-1", googlePlaceId: "g1", businessStatus: "CLOSED_PERMANENTLY" as const, openNow: false, nextOpenTime: null, nextCloseTime: null };
    expect(closedStatus(overlay)).toBe("permanent");
    expect(overlay).not.toHaveProperty("alternatives");
  });
});

