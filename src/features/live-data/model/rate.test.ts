import { describe, it, expect } from "vitest";
import { inBand, fmtRate, isCacheFresh, parseRateResponse, SANITY } from "./rate";

describe("inBand", () => {
  it("accepts a real KRW rate and rejects an order-of-magnitude error", () => {
    expect(inBand(1479.45, "KRW")).toBe(true);  // today's actual rate
    expect(inBand(147.945, "KRW")).toBe(false); // decimal slipped
    expect(inBand(14794.5, "KRW")).toBe(false); // extra digit
  });

  it("is inclusive at the band edges", () => {
    expect(inBand(SANITY.KRW[0], "KRW")).toBe(true);
    expect(inBand(SANITY.KRW[1], "KRW")).toBe(true);
    expect(inBand(SANITY.KRW[0] - 0.01, "KRW")).toBe(false);
    expect(inBand(SANITY.KRW[1] + 0.01, "KRW")).toBe(false);
  });

  it("accepts ANY rate for an unlisted currency — unknown is not invalid", () => {
    // A guide for a country we have no band for must not have its rate rejected.
    expect(inBand(0.0001, "XYZ")).toBe(true);
    expect(inBand(99999, "XYZ")).toBe(true);
  });

  it("catches a plausible-looking cross-currency mixup", () => {
    // A JPY rate (~150) served under a KRW request looks like a fine number and is
    // 10x wrong for the traveler's budget. The band is what notices.
    expect(inBand(150, "KRW")).toBe(false);
    expect(inBand(150, "JPY")).toBe(true);
  });
});

describe("fmtRate", () => {
  it("renders big rates whole and small rates with decimals", () => {
    expect(fmtRate(1479.45)).toBe("1,479");  // KRW — cents are noise
    expect(fmtRate(150.4)).toBe("150");      // JPY
    expect(fmtRate(6.85)).toBe("6.85");      // DKK — 2dp matters
  });

  it("does NOT round a sub-1 rate to a useless integer — the bug this shape exists to avoid", () => {
    // Math.round(0.93) === 1 would tell a traveler $1 = €1.
    expect(fmtRate(0.93)).toBe("0.930");
    expect(fmtRate(0.8642)).toBe("0.864");
  });

  it("handles the boundaries between the three formats", () => {
    expect(fmtRate(100)).toBe("100");    // >=100 → whole
    expect(fmtRate(99.99)).toBe("99.99"); // >=1   → 2dp
    expect(fmtRate(1)).toBe("1.00");
    expect(fmtRate(0.999)).toBe("0.999"); // <1    → 3dp
  });
});

describe("isCacheFresh", () => {
  const TODAY = "2026-07-17";
  it("accepts a complete cache stamped today", () => {
    expect(isCacheFresh({ rate: 1479, date: "2026-07-17", fetchedAt: TODAY }, TODAY)).toBe(true);
  });
  it("rejects yesterday's cache", () => {
    expect(isCacheFresh({ rate: 1479, date: "2026-07-16", fetchedAt: "2026-07-16" }, TODAY)).toBe(false);
  });
  it("rejects a partial cache rather than rendering undefined", () => {
    expect(isCacheFresh({ rate: 1479, fetchedAt: TODAY }, TODAY)).toBe(false);         // no date
    expect(isCacheFresh({ date: "2026-07-17", fetchedAt: TODAY }, TODAY)).toBe(false); // no rate
    expect(isCacheFresh({ rate: 1479, date: "2026-07-17" }, TODAY)).toBe(false);       // no stamp
  });
  it("rejects null/undefined", () => {
    expect(isCacheFresh(null, TODAY)).toBe(false);
    expect(isCacheFresh(undefined, TODAY)).toBe(false);
  });
});

describe("parseRateResponse", () => {
  it("pulls the rate and date out of a real Frankfurter shape", () => {
    expect(parseRateResponse({ amount: 1, base: "USD", date: "2026-07-17", rates: { KRW: 1479.45 } }, "KRW"))
      .toEqual({ rate: 1479.45, date: "2026-07-17" });
  });

  it("throws when the requested currency is absent — never returns undefined as a rate", () => {
    expect(() => parseRateResponse({ date: "2026-07-17", rates: { JPY: 150 } }, "KRW")).toThrow(/missing/);
    expect(() => parseRateResponse({ rates: {} }, "KRW")).toThrow(/missing/);
    expect(() => parseRateResponse(null, "KRW")).toThrow(/missing/);
  });

  it("throws on non-finite values", () => {
    expect(() => parseRateResponse({ rates: { KRW: Infinity } }, "KRW")).toThrow(/non-finite/);
    expect(() => parseRateResponse({ rates: { KRW: NaN } }, "KRW")).toThrow(/missing|non-finite/);
  });

  it("throws on an out-of-band rate, naming it — the caller falls back rather than showing it", () => {
    expect(() => parseRateResponse({ date: "x", rates: { KRW: 14794 } }, "KRW"))
      .toThrow(/outside sanity band for KRW/);
  });

  it("treats 0 as missing — a zero rate would divide-by-zero the budget", () => {
    expect(() => parseRateResponse({ rates: { KRW: 0 } }, "KRW")).toThrow(/missing/);
  });
});
