import { describe, it, expect } from "vitest";
import { sheetOrder, ordinalFor } from "./sheet-order";

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
