import { describe, expect, it } from "vitest";
import { burnTotal, convertRate, decodeStops, encodeStops } from "./field-math";
import { SPLIT_STATE, STOP_STATE } from "../mocks/seeds";

describe("convertRate", () => {
  it("reports no-rate until a rate is loaded (the cold-cache state)", () => {
    expect(convertRate(100, null)).toEqual({ state: "no-rate" });
    expect(convertRate(100, undefined)).toEqual({ state: "no-rate" });
    expect(convertRate(100, 0)).toEqual({ state: "no-rate" }); // 0 is not a real rate, never /0
  });

  it("reports empty when a rate is present but no amount is typed", () => {
    expect(convertRate(NaN, 1479)).toEqual({ state: "empty" });
  });

  it("converts both directions once seeded (pins the warm-cache path)", () => {
    const r = convertRate(10, 1479);
    expect(r).toEqual({ state: "ok", usdToLocal: 14790, localToUsd: 10 / 1479 });
  });

  it("round-trips a value through both conversions", () => {
    const rate = 1479;
    const r = convertRate(50, rate);
    if (r.state !== "ok") throw new Error("expected ok");
    expect(r.localToUsd * rate).toBeCloseTo(50, 6); // 50 USD → local → back to 50 USD
  });

  it("handles zero and negative amounts without special-casing", () => {
    expect(convertRate(0, 1479)).toEqual({ state: "ok", usdToLocal: 0, localToUsd: 0 });
    const neg = convertRate(-5, 1479);
    expect(neg).toEqual({ state: "ok", usdToLocal: -7395, localToUsd: -5 / 1479 });
  });
});

describe("encodeStops / decodeStops", () => {
  it("round-trips a checked-stops map", () => {
    expect(decodeStops(encodeStops(STOP_STATE))).toEqual({ ...STOP_STATE });
  });

  it("drops keys that are not the <day>-<idx> shape (tamper resistance)", () => {
    const tampered = encodeStops({
      "0-0": 1,
      evil: 1,
      "1-": 1,
      "-2": 1,
      "a-b": 1,
      __proto__: 1,
    } as Record<string, number>);
    expect(decodeStops(tampered)).toEqual({ "0-0": 1 });
  });

  it("never pollutes the prototype from a crafted payload", () => {
    // A raw JSON payload with a __proto__ key, base64'd by hand.
    // `unescape` is deprecated but deliberate: this fixture has to be encoded the SAME way
    // encodeStops encodes, or the test would be exercising a payload the decoder never sees.
    const raw = btoa(unescape(encodeURIComponent('{"__proto__":{"polluted":1},"2-4":1}')));
    const out = decodeStops(raw);
    expect(out).toEqual({ "2-4": 1 });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("returns {} for garbage instead of throwing", () => {
    expect(decodeStops("not%%%base64")).toEqual({});
    expect(decodeStops(btoa("[not an object]"))).toEqual({});
    expect(decodeStops(btoa("null"))).toEqual({});
    expect(decodeStops("")).toEqual({});
  });
});

describe("burnTotal", () => {
  it("sums the raw entered amounts on a real split blob", () => {
    expect(burnTotal(SPLIT_STATE)).toBeCloseTo(45012.5, 6); // 45000 + 12.5 + ""(→0)
  });

  it("treats blank / non-numeric amounts as zero", () => {
    expect(burnTotal({ expenses: [{ amount: "" }, { amount: "abc" }, { amount: null }] })).toBe(0);
  });

  it("tolerates a missing, null, or malformed blob (returns 0, never throws)", () => {
    expect(burnTotal(null)).toBe(0);
    expect(burnTotal(undefined)).toBe(0);
    expect(burnTotal({})).toBe(0);
    expect(burnTotal({ expenses: "oops" })).toBe(0);
    expect(burnTotal({ expenses: [null, undefined] })).toBe(0);
  });
});
