// @protects-file Destination theming is deterministic and never spends operational contrast.
import { describe, it, expect } from "vitest";
import { destinationTheme, destinationThemeStyle } from "./destination-theme";
import { contrastRatio } from "./contrast";

describe("destinationTheme", () => {
  it("tints the dark ground toward the accent, deterministically", () => {
    const a = destinationTheme("korea", "#2b5d86");
    const b = destinationTheme("korea", "#2b5d86");
    expect(a).toEqual(b);
    expect(a.darkGround).not.toBeNull();
    expect(a.darkGround).not.toBe("#0d1512");
    expect(a.textureSeed).toBe("korea");
  });
  it("keeps the quiet ink readable on the tinted ground", () => {
    for (const accent of ["#2b5d86", "#a4332a", "#b23a48", "#8a6a1f", "#2f6f4f", "#ffffff"]) {
      const t = destinationTheme("x", accent);
      if (t.darkGround) expect(contrastRatio("#91a59b", t.darkGround)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("emits only the properties the manifest allows", () => {
    expect(Object.keys(destinationThemeStyle(destinationTheme("korea", "#2b5d86")))).toEqual(["--atmo-ground"]);
    expect(destinationThemeStyle({ accent: "#000", darkGround: null, textureSeed: "x" })).toEqual({});
  });
});
