import { describe, it, expect } from "vitest";
import { currencyFor, accentFor, tzFor, darken, COUNTRY_CODES } from "./themes";

describe("currencyFor", () => {
  it("returns the currency entry for a known country", () => {
    const jpy = currencyFor("Japan");
    expect(jpy).not.toBeNull();
    expect(jpy?.code).toBe("JPY");
    expect(jpy?.symbol).toBeTruthy();
    expect(jpy?.name).toBeTruthy();
  });

  it("returns null for an unknown country", () => {
    expect(currencyFor("Narnia")).toBeNull();
  });
});

describe("accentFor", () => {
  it("returns the theme color for a known country", () => {
    expect(accentFor("Japan")).toBe("#b23a48");
  });

  it("falls back to the default accent for an unknown country", () => {
    expect(accentFor("Narnia")).toBe("#9c4421");
  });
});

describe("tzFor", () => {
  it("returns the IANA time zone for a known country", () => {
    expect(tzFor("Japan")).toBe("Asia/Tokyo");
  });

  it("returns null for an unknown country", () => {
    expect(tzFor("Narnia")).toBeNull();
  });
});

describe("darken", () => {
  it("returns the same color when the factor is 0", () => {
    expect(darken("#ffffff", 0)).toBe("#ffffff");
  });

  it("darkens each channel independently and proportionally", () => {
    expect(darken("#ff0000", 0.5)).toBe("#800000");
    expect(darken("#0000ff", 0.5)).toBe("#000080");
  });

  it("goes fully black at factor 1", () => {
    expect(darken("#b23a48", 1)).toBe("#000000");
  });
});

describe("data tables stay in sync", () => {
  it("every country with a holiday COUNTRY_CODE also has a currency and an IANA time zone (single-source countries.mjs)", () => {
    for (const country of Object.keys(COUNTRY_CODES)) {
      expect(currencyFor(country), `missing currency for ${country}`).not.toBeNull();
      expect(tzFor(country), `missing time zone for ${country}`).not.toBeNull();
    }
  });

  it("every country with a holiday COUNTRY_CODE also has a theme accent (no undefined colour in the UI)", () => {
    for (const country of Object.keys(COUNTRY_CODES)) {
      expect(accentFor(country)).not.toBe("#9c4421");
    }
  });
});
