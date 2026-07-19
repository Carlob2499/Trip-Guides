// Tests for scripts/lookup-tz.mjs — the coordinate → IANA time zone resolver that
// replaces the country-name-table approach to `tz` (see docs/HANDOFF.md and
// content.config.ts's `tz` field: a country this large has no single "typical" zone,
// and Hawaii/Arizona both proved the old approach wrong by hours before this existed).
// Fully offline (bundled boundary data), so unlike lookup-place.mjs this is unit-testable
// without a network call.

import { describe, it, expect } from "vitest";
import { lookupTz } from "../lookup-tz.mjs";

describe("lookupTz", () => {
  it("resolves Sedona, AZ to America/Phoenix — the exact bug this exists to prevent", () => {
    const r = lookupTz(34.8688613, -111.7614394);
    expect(r.tz).toBe("America/Phoenix");
    expect(r.candidates).toContain("America/Phoenix");
  });

  it("resolves Honolulu, HI to Pacific/Honolulu", () => {
    const r = lookupTz(21.304547, -157.855676);
    expect(r.tz).toBe("Pacific/Honolulu");
  });

  it("resolves Seoul to Asia/Seoul (cross-check against an existing guide's known-good tz)", () => {
    const r = lookupTz(37.5665, 126.978);
    expect(r.tz).toBe("Asia/Seoul");
  });

  it("returns an error for non-finite coordinates instead of guessing", () => {
    expect(lookupTz("not-a-number", 5).error).toBeTruthy();
    expect(lookupTz(5, undefined).error).toBeTruthy();
    expect(lookupTz(NaN, NaN).error).toBeTruthy();
  });

  it("accepts numeric strings the same as numbers (CLI argv is always a string)", () => {
    const r = lookupTz("34.8688613", "-111.7614394");
    expect(r.tz).toBe("America/Phoenix");
  });
});
