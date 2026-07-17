import { describe, it, expect } from "vitest";
import { tzOffsetHours } from "./tz-offset";

const WINTER = new Date("2026-01-15T12:00:00Z");
const SUMMER = new Date("2026-07-15T12:00:00Z");

describe("tzOffsetHours", () => {
  it("is DST-AWARE for a zone that observes it — the entire reason this exists over a fixed table", () => {
    // A fixed "LA is UTC-8" lookup is right half the year and an hour wrong the other
    // half. This is the bug the DST-aware Intl approach specifically fixes.
    expect(tzOffsetHours("America/Los_Angeles", WINTER)).toBe(-8); // PST
    expect(tzOffsetHours("America/Los_Angeles", SUMMER)).toBe(-7); // PDT
  });

  it("is DST-aware for a northern-hemisphere zone too (opposite season, opposite shift)", () => {
    expect(tzOffsetHours("Europe/London", WINTER)).toBe(0); // GMT
    expect(tzOffsetHours("Europe/London", SUMMER)).toBe(1); // BST
  });

  it("returns a stable offset for a zone with no DST, in every season", () => {
    expect(tzOffsetHours("Asia/Seoul", WINTER)).toBe(9);
    expect(tzOffsetHours("Asia/Seoul", SUMMER)).toBe(9);
  });

  it("handles a fractional (half-hour) zone", () => {
    expect(tzOffsetHours("Asia/Kolkata", SUMMER)).toBe(5.5);
  });

  it("returns null for an unknown/invalid IANA zone rather than throwing", () => {
    // A thrown error here would take down the whole jet-lag calculator, not just
    // degrade it — this is the guard that keeps a bad zone string a no-op.
    expect(tzOffsetHours("Not/AZone", SUMMER)).toBeNull();
    expect(tzOffsetHours("", SUMMER)).toBeNull();
  });

  it("returns null for null/undefined input", () => {
    expect(tzOffsetHours(null, SUMMER)).toBeNull();
    expect(tzOffsetHours(undefined, SUMMER)).toBeNull();
  });
});
