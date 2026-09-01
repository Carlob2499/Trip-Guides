import { describe, expect, it } from "vitest";
import { buildTravelerStations } from "../model/stations";

const PRIMARY = ["Days", "Food", "Explore", "Essentials"] as const;

const names = (stations: { full: string }[]) => stations.map((station) => station.full);

describe("traveler-first guide stations", () => {
  it("shows only canonical destinations as primary stations", () => {
    const stations = buildTravelerStations({ groups: [...PRIMARY], hasSources: true, hasLearnings: true });
    expect(names(stations.filter((station) => station.primary))).toEqual(PRIMARY);
  });

  it("keeps sources, recap and utilities reachable as secondary stations", () => {
    const stations = buildTravelerStations({ groups: [...PRIMARY], hasSources: true, hasLearnings: true });
    expect(stations.filter((station) => !station.primary).map((station) => [station.kind, station.full])).toEqual([
      ["sources", "Sources & verification"],
      ["recap", "Recap"],
      ["tools", "Trip utilities"],
    ]);
  });

  it("omits optional secondary routes honestly", () => {
    const stations = buildTravelerStations({ groups: ["Days", "Essentials"], hasSources: false, hasLearnings: false });
    expect(names(stations)).toEqual(["Days", "Essentials", "Trip utilities"]);
    expect(stations.some((station) => station.kind === "sources" || station.kind === "recap")).toBe(false);
  });

  it("uses stable route keys instead of position-derived slugs", () => {
    const stations = buildTravelerStations({ groups: ["Essentials", "Days", "Explore"], hasSources: true, hasLearnings: false });
    expect(stations.map((station) => station.key)).toEqual(["essentials", "days", "explore", "sources", "tools"]);
    expect(stations.map((station) => station.index)).toEqual([0, 1, 2, 3, 4]);
  });
});
