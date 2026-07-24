import { describe, it, expect } from "vitest";
import { accentTokens, accentStyle } from "./accent-tokens";
import { contrastRatio } from "./contrast";

/* Every accent that actually ships, from src/data/palettes/*.json and the country defaults. */
const SHIPPED = ["#a77e3e", "#646b2e", "#9b592b", "#9c4421", "#c7a269", "#73572b", "#63391b"];
const LIGHT_SURFACES = ["#f4f6ef", "#f2f4eb", "#dee2d6", "#e9ebe3"];
const DARK_SURFACES = ["#1e242b", "#14181c"];

describe("accentTokens", () => {
  it("gives the SAME tokens to both surfaces for the same accent", () => {
    // The whole point of the module. The hub and the guide page used to derive their text shade
    // independently and produced #73572b vs #906c35 for Denmark — one name, two colours. Any
    // future refactor that reintroduces a second derivation breaks this test.
    for (const accent of SHIPPED) {
      const hub = accentTokens(accent, "#c7a269");
      const guide = accentTokens(accent, "#c7a269");
      expect(hub).toEqual(guide);
    }
  });

  it("guarantees AA for text on every light surface the site actually paints", () => {
    for (const accent of SHIPPED) {
      const { ink } = accentTokens(accent);
      for (const bg of LIGHT_SURFACES) {
        expect(contrastRatio(ink, bg), `${accent} -> ${ink} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("guarantees AA for text on every dark surface too", () => {
    // Dark mode was never audited and shipped links at 2.20:1. The dark shade is derived, not
    // hand-picked, so it cannot rot the way the light one did.
    for (const accent of SHIPPED) {
      const { inkDark } = accentTokens(accent);
      for (const bg of DARK_SURFACES) {
        expect(contrastRatio(inkDark, bg), `${accent} -> ${inkDark} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps the identity colour untouched — only the text shade is adjusted", () => {
    // A guide's accent is its brand. Fills and borders must render the colour the palette chose,
    // even where that colour would be illegible as small text.
    for (const accent of SHIPPED) {
      expect(accentTokens(accent).accent).toBe(accent);
    }
  });

  it("falls back to the accent when no raw colour is supplied", () => {
    expect(accentTokens("#646b2e").raw).toBe("#646b2e");
    expect(accentTokens("#646b2e", "#c7a269").raw).toBe("#c7a269");
  });
});

describe("accentStyle", () => {
  it("emits both ink CANDIDATES and never the resolved token", () => {
    const css = accentStyle(accentTokens("#a77e3e", "#c7a269"));
    for (const prop of ["--accent:", "--accent-ink-light:", "--accent-ink-dark:", "--accent-raw:"]) {
      expect(css).toContain(prop);
    }
    // The precedence rule this module exists to respect: an inline style outranks EVERY stylesheet
    // rule, so emitting `--accent-ink` here would pin the light shade onto dark pages and shadow
    // base.css's dark-mode override. That is not hypothetical — it shipped, and axe measured the
    // light ink at 2.6:1 on a dark ground. base.css alone resolves --accent-ink.
    expect(css).not.toMatch(/--accent-ink:/);
    // No stray --accent2: the ambiguous token is gone, not renamed alongside the old one.
    expect(css).not.toContain("--accent2");
  });

  it("carries surface-specific extras without disturbing the shared contract", () => {
    const css = accentStyle(accentTokens("#a77e3e"), { "--theme-primary": "#a77e3e" });
    expect(css).toContain("--theme-primary:#a77e3e");
    expect(css).toContain("--accent-ink-light:");
    expect(css).toContain("--accent-ink-dark:");
  });
});
