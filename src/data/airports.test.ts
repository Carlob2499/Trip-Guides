import { describe, it, expect } from "vitest";
import { AIRPORTS, airportFor } from "./airports.mjs";

describe("AIRPORTS", () => {
  it("every entry has real lat/lng/label", () => {
    for (const [code, a] of Object.entries(AIRPORTS)) {
      expect(typeof a.lat, `${code}.lat`).toBe("number");
      expect(typeof a.lng, `${code}.lng`).toBe("number");
      expect(a.label, `${code}.label`).toBeTruthy();
      expect(a.lat).toBeGreaterThan(-90);
      expect(a.lat).toBeLessThan(90);
      expect(a.lng).toBeGreaterThan(-180);
      expect(a.lng).toBeLessThan(180);
    }
  });

  it("carries the two D14-required codes", () => {
    expect(AIRPORTS.EWR).toBeTruthy();
    expect(AIRPORTS.JFK).toBeTruthy();
  });
});

describe("airportFor", () => {
  it("resolves a known code", () => {
    expect(airportFor("EWR")).toEqual(AIRPORTS.EWR);
  });

  it("is case-insensitive and trims whitespace (authored text, not a validated enum)", () => {
    expect(airportFor("ewr")).toEqual(AIRPORTS.EWR);
    expect(airportFor(" JFK ")).toEqual(AIRPORTS.JFK);
  });

  it("returns null for an unknown code or absent input — honest absence, never a guessed point", () => {
    expect(airportFor("LAX")).toBeNull();
    expect(airportFor(null)).toBeNull();
    expect(airportFor(undefined)).toBeNull();
    expect(airportFor("")).toBeNull();
  });
});
