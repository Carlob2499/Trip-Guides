// The accent precedence is load-bearing on every surface (guide page, hub, OG):
// explicit theme > extracted cover palette > country accent. Korea/Denmark have
// committed extracted palettes, so they double as fixtures.
import { describe, it, expect } from "vitest";
import { paletteFor, accentForGuide } from "./palettes";
import { accentFor } from "./themes";

describe("paletteFor", () => {
  it("returns the committed extracted palette for korea/denmark", () => {
    expect(paletteFor("korea")?.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(paletteFor("denmark")?.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(paletteFor("korea")?.primary).not.toBe(paletteFor("denmark")?.primary); // distinct identities
  });
  it("returns null for a guide with no extracted palette", () => {
    expect(paletteFor("no-such-guide")).toBe(null);
  });
});

describe("accentForGuide precedence", () => {
  it("explicit theme wins over everything", () => {
    expect(accentForGuide("korea", { primary: "#123456" }, "South Korea")).toBe("#123456");
  });
  it("extracted palette wins over the country accent", () => {
    const extracted = paletteFor("korea")!.primary;
    expect(accentForGuide("korea", undefined, "South Korea")).toBe(extracted);
    expect(extracted).not.toBe(accentFor("South Korea"));
  });
  it("falls back to the country accent when nothing else exists", () => {
    expect(accentForGuide("no-such-guide", null, "Japan")).toBe(accentFor("Japan"));
  });
});
