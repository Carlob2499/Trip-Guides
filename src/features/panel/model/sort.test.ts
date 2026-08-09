// @protects-file Sections have a stable default order rather than an accidental one.

import { describe, it, expect } from "vitest";
import { sortPanels, panelRank, type PanelOrderItem } from "./sort";

function p(id: string, over: Partial<PanelOrderItem> = {}): PanelOrderItem {
  return { id, fullWidth: false, collapsed: false, order: 0, ...over };
}

const ids = (items: PanelOrderItem[]) => items.map((i) => i.id);

describe("panelRank", () => {
  it("bands: full-width open < full-width collapsed < open < collapsed", () => {
    expect(panelRank({ fullWidth: true, collapsed: false })).toBe(0);
    expect(panelRank({ fullWidth: true, collapsed: true })).toBe(1);
    expect(panelRank({ fullWidth: false, collapsed: false })).toBe(2);
    expect(panelRank({ fullWidth: false, collapsed: true })).toBe(3);
  });
});

describe("sortPanels", () => {
  it("full-width sorts first, whatever the declared order says", () => {
    const out = sortPanels([
      p("a", { order: 0 }),
      p("wide", { fullWidth: true, order: 5 }),
      p("b", { order: 1 }),
    ]);
    expect(ids(out)).toEqual(["wide", "a", "b"]);
  });

  it("open sorts before collapsed", () => {
    const out = sortPanels([
      p("shut", { collapsed: true, order: 0 }),
      p("open", { order: 1 }),
    ]);
    expect(ids(out)).toEqual(["open", "shut"]);
  });

  it("the two rules compose: a collapsed full-width Panel stays in the full-width band", () => {
    const out = sortPanels([
      p("open", { order: 0 }),
      p("wide-shut", { fullWidth: true, collapsed: true, order: 1 }),
      p("wide-open", { fullWidth: true, order: 2 }),
      p("shut", { collapsed: true, order: 3 }),
    ]);
    expect(ids(out)).toEqual(["wide-open", "wide-shut", "open", "shut"]);
  });

  it("ties inside a band break by the scope's declared order", () => {
    const out = sortPanels([
      p("c", { order: 2 }),
      p("a", { order: 0 }),
      p("b", { order: 1 }),
    ]);
    expect(ids(out)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate its input", () => {
    const input = [p("b", { order: 1 }), p("a", { order: 0 })];
    const before = ids(input);
    sortPanels(input);
    expect(ids(input)).toEqual(before);
  });

  it("is deterministic over repeated calls", () => {
    const input = [
      p("shut", { collapsed: true, order: 3 }),
      p("wide", { fullWidth: true, order: 2 }),
      p("a", { order: 0 }),
      p("b", { order: 1 }),
    ];
    expect(ids(sortPanels(input))).toEqual(ids(sortPanels(input)));
  });

  it("handles the empty and single-Panel cases", () => {
    expect(sortPanels([])).toEqual([]);
    expect(ids(sortPanels([p("only")]))).toEqual(["only"]);
  });
});
