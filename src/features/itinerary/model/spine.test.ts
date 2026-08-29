import { describe, expect, it } from "vitest";
import { primarySpineTabs, spineActiveIndex } from "../ui/spine.js";

function tab(dataPrimary: string, dataTab: string, hidden = false) {
  return {
    hidden,
    getAttribute(name: string) {
      return name === "data-primary" ? dataPrimary : dataTab;
    },
  };
}

describe("desktop reading spine destinations", () => {
  it("includes only visible primary stations, excluding secondary routes", () => {
    const days = tab("true", "0");
    const food = tab("true", "1");
    const sources = tab("false", "4", true);
    const recap = tab("false", "5", true);
    const tabs = { querySelectorAll: () => [days, food, sources, recap] };

    expect(primarySpineTabs(tabs)).toEqual([days, food]);
  });

  it("maps an active primary station to its filtered tick position", () => {
    const days = tab("true", "0");
    const food = tab("true", "1");
    const sources = tab("false", "4", true);

    expect(spineActiveIndex([days, food], food)).toBe(1);
    expect(spineActiveIndex([days, food], sources)).toBe(-1);
  });
});
