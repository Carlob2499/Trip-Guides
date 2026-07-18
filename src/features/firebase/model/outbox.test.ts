import { describe, expect, it } from "vitest";
import { addEntry, entriesForRoom, removeEntry, type Outbox } from "./outbox";

describe("addEntry", () => {
  it("adds an entry keyed by its full path", () => {
    const o = addEntry({}, "trips/room1/expenses/-Na", { amount: 5 });
    expect(o).toEqual({ "trips/room1/expenses/-Na": { amount: 5 } });
  });

  it("evicts the oldest entries once over the cap (bounded storage)", () => {
    let o: Outbox = {};
    for (let i = 0; i < 55; i++) o = addEntry(o, "trips/r/e/-N" + i, i, 50);
    const keys = Object.keys(o);
    expect(keys.length).toBe(50);
    expect(keys[0]).toBe("trips/r/e/-N5"); // 0..4 evicted
    expect(keys[keys.length - 1]).toBe("trips/r/e/-N54");
  });

  it("does not mutate the input outbox", () => {
    const orig: Outbox = { a: 1 };
    addEntry(orig, "b", 2);
    expect(orig).toEqual({ a: 1 });
  });
});

describe("removeEntry", () => {
  it("removes an acked entry", () => {
    expect(removeEntry({ a: 1, b: 2 }, "a")).toEqual({ b: 2 });
  });

  it("returns the same identity when the path is absent (no needless write)", () => {
    const o = { a: 1 };
    expect(removeEntry(o, "missing")).toBe(o);
  });
});

describe("entriesForRoom", () => {
  const outbox = {
    "trips/roomA/expenses/-N1": { amount: 5 },
    "trips/roomA/members/-N2": { name: "Ana" },
    "trips/roomB/expenses/-N3": { amount: 9 },
  };

  it("returns only the entries under the given room base", () => {
    const got = entriesForRoom(outbox, "trips/roomA");
    expect(got).toEqual([
      { path: "trips/roomA/expenses/-N1", value: { amount: 5 } },
      { path: "trips/roomA/members/-N2", value: { name: "Ana" } },
    ]);
  });

  it("does not match a room whose name is a prefix of another (roomA vs roomAB)", () => {
    const o = { "trips/roomAB/expenses/-N1": { amount: 1 } };
    expect(entriesForRoom(o, "trips/roomA")).toEqual([]); // prefix is "trips/roomA/"
  });

  it("returns [] when nothing matches", () => {
    expect(entriesForRoom(outbox, "trips/roomZ")).toEqual([]);
  });
});
