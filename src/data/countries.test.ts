import { describe, it, expect } from "vitest";
// @ts-ignore — plain .mjs data module, no types needed for these shape assertions
import { COUNTRIES, CONTINENTS, CONTINENT_ORDER, ALIASES, continentFor, emergencyFor } from "./countries.mjs";

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

describe("emergencyFor (E8·3: SOS coverage)", () => {
  it("returns a verified entry for a researched country", () => {
    expect(emergencyFor("South Korea")?.lines).toContainEqual({ label: "Police", num: "112" });
    expect(emergencyFor("Denmark")?.fallback).toBeUndefined();
  });

  it("US and Mexico now have verified 911 entries, not the generic EU fallback", () => {
    const us = emergencyFor("United States");
    expect(us?.fallback).toBeUndefined();
    expect(us?.lines).toContainEqual({ label: "Police / Fire / Ambulance", num: "911" });

    const mx = emergencyFor("Mexico");
    expect(mx?.fallback).toBeUndefined();
    expect(mx?.lines).toContainEqual({ label: "Police / Fire / Ambulance", num: "911" });
  });

  it("Portugal has no verified entry of its own but gets the honest EU-112 fallback, flagged", () => {
    const pt = emergencyFor("Portugal");
    expect(pt?.fallback).toBe(true);
    expect(pt?.lines).toContainEqual({ label: "All emergencies — universal EU number", num: "112" });
  });

  it("returns null for a country with neither a verified entry nor EU-112 coverage", () => {
    expect(emergencyFor("Thailand")).toBeNull();
    expect(emergencyFor("Atlantis")).toBeNull();
  });
});
