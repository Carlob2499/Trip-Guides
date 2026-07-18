import { describe, it, expect } from "vitest";
// @ts-expect-error — plain-JS module, no types needed for this test
import { todayInTz, esc } from "./util.js";

// Fixed instants (injectable clock — never the real one).
// 2026-07-10T20:00:00Z = Jul 11 05:00 in Seoul (UTC+9), Jul 10 16:00 in New York.
const INSTANT = new Date("2026-07-10T20:00:00Z");

describe("esc — attribute-breakout resistance", () => {
  // trip-split interpolates Firebase record ids into single-quoted attributes
  // (data-mid='...'); a crafted key set via direct REST could carry a quote and
  // break out. esc() must neutralize all five HTML metacharacters, single quote
  // included, so the id can never escape the attribute.
  const HOSTILE = "a'><img src=x onerror=alert(1)>";

  it("escapes the single quote that breaks out of a single-quoted attribute", () => {
    const out = esc(HOSTILE);
    expect(out).not.toContain("'");
    expect(out).toContain("&#39;");
  });

  it("escapes < and > so no tag can form", () => {
    const out = esc(HOSTILE);
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(out).toContain("&lt;");
    expect(out).toContain("&gt;");
  });

  it("escapes all five metacharacters and nothing else", () => {
    expect(esc("&<>\"'")).toBe("&amp;&lt;&gt;&quot;&#39;");
    expect(esc("plain-id_-09")).toBe("plain-id_-09"); // valid keys pass through untouched
  });

  it("coerces null/undefined to empty string, never throws", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
  });
});

describe("todayInTz", () => {
  it("returns the DESTINATION calendar day, not the device/UTC day", () => {
    expect(todayInTz("Asia/Seoul", INSTANT)).toEqual({ y: 2026, m: 7, d: 11 });
    expect(todayInTz("America/New_York", INSTANT)).toEqual({ y: 2026, m: 7, d: 10 });
  });

  it("handles the year boundary across timezones", () => {
    const nye = new Date("2026-12-31T16:00:00Z"); // Jan 1 01:00 Seoul, Dec 31 11:00 NY
    expect(todayInTz("Asia/Seoul", nye)).toEqual({ y: 2027, m: 1, d: 1 });
    expect(todayInTz("America/New_York", nye)).toEqual({ y: 2026, m: 12, d: 31 });
  });

  it("returns null for a missing or invalid timezone (caller falls back)", () => {
    expect(todayInTz(null, INSTANT)).toBeNull();
    expect(todayInTz("", INSTANT)).toBeNull();
    expect(todayInTz("Not/AZone", INSTANT)).toBeNull();
  });
});
