import { describe, expect, it } from "vitest";
import { buildStations, progressGeometry } from "../model/stations";

const PRIMARY = ["Days", "Food", "Explore", "Essentials"];
const names = (stations: { full: string }[]) => stations.map((station) => station.full);

describe("traveler-first guide stations", () => {
  it("shows only canonical destinations as primary stations", () => {
    const stations = buildStations({ groups: PRIMARY, hasSources: true, hasLearnings: true });
    const visible = names(stations.filter((station) => station.primary));
    expect(visible).toEqual(PRIMARY);
    for (const rawName of ["Sources", "Pokémon GO", "Daejeon & MSI", "Field log", "Tools"])
      expect(visible).not.toContain(rawName);
  });

  it("keeps sources, recap and utilities reachable as secondary stations", () => {
    const stations = buildStations({ groups: PRIMARY, hasSources: true, hasLearnings: true });
    expect(stations.filter((station) => !station.primary).map((station) => [station.kind, station.full])).toEqual([
      ["sources", "Sources & verification"],
      ["recap", "Recap"],
      ["tools", "Trip utilities"],
    ]);
  });

  it("omits optional secondary stations honestly", () => {
    const stations = buildStations({ groups: ["Days", "Essentials"], hasLearnings: false });
    expect(names(stations)).toEqual(["Days", "Essentials", "Trip utilities"]);
    expect(stations.some((station) => station.kind === "sources" || station.kind === "recap")).toBe(false);
  });

  it("numbers every primary and secondary route contiguously with unique keys", () => {
    const stations = buildStations({ groups: PRIMARY, hasSources: true, hasLearnings: true });
    expect(stations.map((station) => station.index)).toEqual(stations.map((_, index) => index));
    expect(stations.map((station) => station.key)).toEqual([
      "days", "food", "explore", "essentials", "sources", "recap", "tools",
    ]);
  });

  it("keeps canonical route keys independent of their position", () => {
    const reordered = buildStations({ groups: ["Essentials", "Days", "Explore"], hasLearnings: false });
    expect(reordered.map((station) => station.key)).toEqual(["essentials", "days", "explore", "tools"]);
  });
});

describe("primary progress geometry", () => {
  it("uses only the visible primary count", () => {
    expect(progressGeometry(0, PRIMARY.length)).toEqual({ left: 0, width: 25 });
    expect(progressGeometry(3, PRIMARY.length)).toEqual({ left: 75, width: 25 });
  });

  it("stays finite and clamps invalid positions", () => {
    expect(progressGeometry(0, 0)).toEqual({ left: 0, width: 100 });
    expect(progressGeometry(99, 4)).toEqual({ left: 75, width: 25 });
    expect(progressGeometry(-1, 4)).toEqual({ left: 0, width: 25 });
  });
});
