import { describe, it, expect } from "vitest";
// @ts-ignore — plain .mjs data module, no types needed for these shape assertions
import { COUNTRIES, CONTINENTS, CONTINENT_ORDER, ALIASES, continentFor } from "./countries.mjs";

describe("continent data", () => {
  it("assigns a continent to EVERY country — a new country can't ship without one", () => {
    const missing = Object.keys(COUNTRIES).filter((c) => !CONTINENTS[c as keyof typeof CONTINENTS]);
    expect(missing).toEqual([]);
  });

  it("has no continent entry for a country that doesn't exist (no stale keys)", () => {
    const orphans = Object.keys(CONTINENTS).filter((c) => !COUNTRIES[c as keyof typeof COUNTRIES]);
    expect(orphans).toEqual([]);
  });

  it("only uses continents the filter UI knows how to order", () => {
    const unknown = [...new Set(Object.values(CONTINENTS) as string[])].filter(
      (v) => !CONTINENT_ORDER.includes(v),
    );
    expect(unknown).toEqual([]);
  });

  it("resolves aliases the same way countryData does", () => {
    expect(continentFor("Korea")).toBe("Asia");        // ALIASES → South Korea
    expect(continentFor("UK")).toBe("Europe");
    expect(continentFor("USA")).toBe("North America");
    // every alias must resolve, or a guide using one silently loses its chip
    for (const alias of Object.keys(ALIASES)) expect(continentFor(alias)).toBeTruthy();
  });

  it("splits the Americas rather than lumping them (the reason this isn't derived from tz)", () => {
    expect(continentFor("Canada")).toBe("North America");
    expect(continentFor("Brazil")).toBe("South America");
  });

  it("puts Iceland in Europe despite its Atlantic/ time zone", () => {
    expect(COUNTRIES["Iceland"].tz).toMatch(/^Atlantic\//);
    expect(continentFor("Iceland")).toBe("Europe");
  });

  it("returns null for unknown/empty input instead of guessing", () => {
    expect(continentFor("Atlantis")).toBeNull();
    expect(continentFor("")).toBeNull();
    expect(continentFor(undefined)).toBeNull();
  });
});
