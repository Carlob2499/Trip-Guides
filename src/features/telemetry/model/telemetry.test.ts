import { describe, expect, it } from "vitest";
import { counterPath, sanitizeName, summarize } from "./telemetry";
import { RAW_TELEMETRY } from "../mocks/seeds";

describe("sanitizeName", () => {
  it("lowercases and dashes a human label", () => {
    expect(sanitizeName("Getting around")).toBe("getting-around");
    expect(sanitizeName("Food & shopping")).toBe("food-shopping");
  });

  it("strips diacritics (so Pokémon keys are stable ASCII)", () => {
    expect(sanitizeName("Pokémon GO")).toBe("pokemon-go");
    expect(sanitizeName("Café")).toBe("cafe");
  });

  it("trims leading/trailing dashes and caps at 40 chars", () => {
    expect(sanitizeName("  --Hello!--  ")).toBe("hello");
    const long = sanitizeName("a".repeat(60));
    expect(long.length).toBeLessThanOrEqual(40);
    expect(long.endsWith("-")).toBe(false);
  });

  it("returns empty string for garbage / empty input", () => {
    expect(sanitizeName("")).toBe("");
    expect(sanitizeName("!!!")).toBe("");
    expect(sanitizeName(null as unknown as string)).toBe("");
  });
});

describe("counterPath", () => {
  it("builds telemetry/<guide>/<kind>/<name>", () => {
    expect(counterPath("southkorea", "tabs", "Getting around")).toBe("telemetry/southkorea/tabs/getting-around");
    expect(counterPath("southkorea", "tools", "split")).toBe("telemetry/southkorea/tools/split");
  });

  it("returns null when guide or name sanitize to empty (never writes a bad key)", () => {
    expect(counterPath("", "tabs", "Food")).toBeNull();
    expect(counterPath("korea", "tabs", "!!!")).toBeNull();
  });
});

describe("summarize", () => {
  it("ranks tabs and tools by count, guides by total opens", () => {
    const out = summarize(RAW_TELEMETRY);
    expect(out.map((g) => g.guide)).toEqual(["southkorea", "denmark"]); // 159 vs 27 total
    const korea = out[0];
    expect(korea.tabs.map((t) => t.name)).toEqual(["food", "getting-around", "sights", "pokemon-go"]);
    expect(korea.tabs[0]).toEqual({ name: "food", count: 58 });
    expect(korea.totalOpens).toBe(41 + 58 + 22 + 12 + 19 + 7);
  });

  it("breaks count ties by name ascending (stable output)", () => {
    const out = summarize({ g: { tabs: { beta: 5, alpha: 5 } } });
    expect(out[0].tabs.map((t) => t.name)).toEqual(["alpha", "beta"]);
  });

  it("tolerates missing / malformed nodes without throwing", () => {
    expect(summarize(null)).toEqual([]);
    expect(summarize({ g: { tabs: { x: "oops", y: -3, z: 0 } } })).toEqual([
      { guide: "g", tabs: [], tools: [], totalOpens: 0 },
    ]);
  });
});
