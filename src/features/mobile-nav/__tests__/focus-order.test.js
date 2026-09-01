import { describe, expect, it } from "vitest";
import { alignBotbarFocusOrder } from "../index.js";

function fixture(order) {
  const nodes = {
    group0: { name: "group0", nextElementSibling: null },
    group1: { name: "group1", nextElementSibling: null },
    groups: { name: "groups", nextElementSibling: null },
    tools: { name: "tools", nextElementSibling: null },
  };
  const items = order.map((name) => nodes[name]);
  const sync = () => {
    items.forEach((node, i) => { node.nextElementSibling = items[i + 1] ?? null; });
  };
  sync();

  const bar = {
    querySelector(selector) {
      if (selector === ".botmini-groups") return nodes.groups;
      if (selector === ".botslot-tool") return nodes.tools;
      return null;
    },
    insertBefore(node, before) {
      const from = items.indexOf(node);
      if (from >= 0) items.splice(from, 1);
      const at = items.indexOf(before);
      items.splice(at, 0, node);
      sync();
    },
  };

  return { bar, items };
}

describe("alignBotbarFocusOrder", () => {
  it("moves Groups before Tools so DOM focus order matches the visual bar", () => {
    const { bar, items } = fixture(["group0", "group1", "tools", "groups"]);
    expect(alignBotbarFocusOrder(bar)).toBe(true);
    expect(items.map((node) => node.name)).toEqual(["group0", "group1", "groups", "tools"]);
  });

  it("is a no-op once source order is already aligned", () => {
    const { bar, items } = fixture(["group0", "group1", "groups", "tools"]);
    expect(alignBotbarFocusOrder(bar)).toBe(false);
    expect(items.map((node) => node.name)).toEqual(["group0", "group1", "groups", "tools"]);
  });
});
