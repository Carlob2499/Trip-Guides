import { describe, it, expect } from "vitest";
import { parseOrder, serializeOrder, effectiveOrder, movePanel, orderKey } from "./order";
import { MAX_ID_LEN, MAX_PANELS } from "./collapse";

describe("parseOrder", () => {
  it("round-trips through serializeOrder", () => {
    expect(parseOrder(serializeOrder(["a", "b", "c"]))).toEqual(["a", "b", "c"]);
  });

  it("returns [] for junk: bad JSON, non-arrays, null", () => {
    expect(parseOrder("not json")).toEqual([]);
    expect(parseOrder('{"a":1}')).toEqual([]);
    expect(parseOrder(null)).toEqual([]);
    expect(parseOrder(42)).toEqual([]);
  });

  it("drops non-strings, empties, over-long ids and duplicates", () => {
    const long = "x".repeat(MAX_ID_LEN + 1);
    expect(parseOrder(JSON.stringify(["a", 7, "", long, "a", "b"]))).toEqual(["a", "b"]);
  });

  it("caps at MAX_PANELS", () => {
    const many = Array.from({ length: MAX_PANELS + 10 }, (_, i) => "p" + i);
    expect(parseOrder(JSON.stringify(many)).length).toBe(MAX_PANELS);
  });
});

describe("effectiveOrder", () => {
  it("no saved order → the declared order, as a fresh array", () => {
    const declared = ["a", "b", "c"];
    const out = effectiveOrder(declared, []);
    expect(out).toEqual(declared);
    expect(out).not.toBe(declared);
  });

  it("saved order wins for the ids it knows", () => {
    expect(effectiveOrder(["a", "b", "c"], ["c", "a", "b"])).toEqual(["c", "a", "b"]);
  });

  it("saved ids the page no longer has are dropped", () => {
    expect(effectiveOrder(["a", "b"], ["gone", "b", "a"])).toEqual(["b", "a"]);
  });

  it("new ids append at the end in declared order — never shuffled into the arrangement", () => {
    expect(effectiveOrder(["new1", "a", "new2", "b"], ["b", "a"])).toEqual(["b", "a", "new1", "new2"]);
  });
});

describe("movePanel", () => {
  const order = ["a", "b", "c", "d"];

  it("moves to every valid position", () => {
    expect(movePanel(order, "c", 0)).toEqual(["c", "a", "b", "d"]);
    expect(movePanel(order, "c", 1)).toEqual(["a", "c", "b", "d"]);
    expect(movePanel(order, "a", 2)).toEqual(["b", "c", "a", "d"]);
    expect(movePanel(order, "a", 3)).toEqual(["b", "c", "d", "a"]);
  });

  it("no-op: dropping where it already was returns the SAME array", () => {
    expect(movePanel(order, "b", 1)).toBe(order);
  });

  it("unknown id and empty sequence return the SAME array", () => {
    expect(movePanel(order, "nope", 0)).toBe(order);
    const empty: string[] = [];
    expect(movePanel(empty, "a", 0)).toBe(empty);
  });

  it("out-of-bounds clamps to the ends, never throws or drops", () => {
    expect(movePanel(order, "c", -5)).toEqual(["c", "a", "b", "d"]);
    expect(movePanel(order, "b", 99)).toEqual(["a", "c", "d", "b"]);
    expect(movePanel(order, "a", NaN)).toBe(order);
  });

  it("never mutates its input", () => {
    movePanel(order, "a", 3);
    expect(order).toEqual(["a", "b", "c", "d"]);
  });
});

describe("orderKey", () => {
  it("normalises like the collapse key but under its own prefix", () => {
    expect(orderKey("Study A!")).toBe("tg-panelorder-studya");
    expect(orderKey("")).toBe("tg-panelorder-guide");
    expect(orderKey(null)).toBe("tg-panelorder-guide");
  });
});
