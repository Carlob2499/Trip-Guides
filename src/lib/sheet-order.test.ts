import { describe, it, expect } from "vitest";
import { sheetOrder, ordinalFor, yearFromKicker } from "./sheet-order";

const NOW = new Date(2026, 5, 1); // Jun 1 2026 — before all three trips below

describe("sheetOrder", () => {
  it("orders guides chronologically by trip start, 1-based", () => {
    const order = sheetOrder(
      [
        { slug: "korea", firstDayDate: "Wed Jul 8", lastDayDate: "Wed Jul 15" },
        { slug: "denmark", firstDayDate: "Mon Jun 1", lastDayDate: "Fri Jun 5" },
        { slug: "us", firstDayDate: "Sat Aug 1", lastDayDate: "Sun Aug 9" },
      ],
      NOW,
    );
    expect(order.map((o) => o.slug)).toEqual(["denmark", "korea", "us"]);
    expect(order.map((o) => o.ordinal)).toEqual([1, 2, 3]);
  });

  it("is stable regardless of input order", () => {
    const order = sheetOrder(
      [
        { slug: "us", firstDayDate: "Sat Aug 1", lastDayDate: "Sun Aug 9" },
        { slug: "denmark", firstDayDate: "Mon Jun 1", lastDayDate: "Fri Jun 5" },
        { slug: "korea", firstDayDate: "Wed Jul 8", lastDayDate: "Wed Jul 15" },
      ],
      NOW,
    );
    expect(order.map((o) => o.slug)).toEqual(["denmark", "korea", "us"]);
  });

  it("sorts undated guides last, in their given order, still numbered", () => {
    const order = sheetOrder(
      [
        { slug: "no-dates", firstDayDate: "Day 1", lastDayDate: "Day 9" },
        { slug: "korea", firstDayDate: "Wed Jul 8", lastDayDate: "Wed Jul 15" },
      ],
      NOW,
    );
    expect(order.map((o) => o.slug)).toEqual(["korea", "no-dates"]);
    expect(order.map((o) => o.ordinal)).toEqual([1, 2]);
  });
});

describe("yearFromKicker", () => {
  it("extracts the year every real guide's kicker carries", () => {
    expect(yearFromKicker("Seoul · Daejeon · Busan — Jul 8–15, 2026")).toBe(2026);
    expect(yearFromKicker("Sedona, Arizona — Sep 2–8, 2026")).toBe(2026);
  });
  it("null when no year is stated — falls back to now-relative inference", () => {
    expect(yearFromKicker("Field guide")).toBeNull();
    expect(yearFromKicker(null)).toBeNull();
    expect(yearFromKicker(undefined)).toBeNull();
  });
});

describe("sheetOrder — D6 stability across build dates (the review-pass regression)", () => {
  // The real four guides' shapes: all 2026, kickers stating the year. Without the pinned
  // year, trip-dates' 180-day rollover resolves Denmark's June trip into 2027 on any build
  // after ~Dec 17 2026 — silently renumbering every plate. With the kicker year, the
  // ordinals D6 fixed (Denmark 01, Korea 02, Sedona 03, Japan 04) hold on EVERY build date.
  const REAL_GUIDES = [
    { slug: "korea", firstDayDate: "Wed Jul 8", lastDayDate: "Wed Jul 15", kicker: "Seoul · Daejeon · Busan — Jul 8–15, 2026" },
    { slug: "japan", firstDayDate: "Thu Oct 15", lastDayDate: "Tue Nov 10", kicker: "Fukuoka · Sapporo · Sendai — Oct 15–Nov 10, 2026" },
    { slug: "denmark", firstDayDate: "Mon Jun 8", lastDayDate: "Tue Jun 16", kicker: "Copenhagen · Malmö · Oslo — Jun 8–16, 2026" },
    { slug: "us", firstDayDate: "Wed Sep 2", lastDayDate: "Tue Sep 8", kicker: "Sedona, Arizona — Sep 2–8, 2026" },
  ];
  const D6_ORDER = ["denmark", "korea", "us", "japan"];

  it("produces D6's settled order today", () => {
    expect(sheetOrder(REAL_GUIDES, new Date(2026, 7, 8)).map((o) => o.slug)).toEqual(D6_ORDER);
  });

  it("produces the SAME order on a build after the 180-day rollover would have fired", () => {
    // Feb 2027: Denmark (Jun) and Korea (Jul) are both >180 days past; unpinned inference
    // would roll them to 2027 while Sedona/Japan stayed 2026, scrambling the plates.
    expect(sheetOrder(REAL_GUIDES, new Date(2027, 1, 15)).map((o) => o.slug)).toEqual(D6_ORDER);
    // And mid-scramble (late Dec 2026): only Denmark has rolled under unpinned inference.
    expect(sheetOrder(REAL_GUIDES, new Date(2026, 11, 20)).map((o) => o.slug)).toEqual(D6_ORDER);
  });
});

describe("ordinalFor", () => {
  it("finds the requested guide's number", () => {
    const order = sheetOrder(
      [
        { slug: "korea", firstDayDate: "Wed Jul 8", lastDayDate: "Wed Jul 15" },
        { slug: "denmark", firstDayDate: "Mon Jun 1", lastDayDate: "Fri Jun 5" },
      ],
      NOW,
    );
    expect(ordinalFor(order, "denmark")).toBe(1);
    expect(ordinalFor(order, "korea")).toBe(2);
  });

  it("null for an unknown slug", () => {
    expect(ordinalFor([], "nope")).toBeNull();
  });
});
