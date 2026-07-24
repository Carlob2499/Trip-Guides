import { describe, it, expect } from "vitest";
import { relativeLuminance, contrastRatio, readableOn } from "./contrast";

/* The surfaces accent text actually lands on, sampled from the built site. Card and card2 are the
   guide/hub card fills; sunken is the inset panel behind "more" summaries. */
const CARD = "#f4f6ef";
const CARD2 = "#f2f4eb";
const SUNKEN = "#dee2d6";

describe("readableOn", () => {
  it("leaves a colour alone when it already passes", () => {
    // Korea's accent clears 4.5 on the card fill, so it must come back untouched — the token
    // should never darken a guide's identity colour it does not have to.
    expect(contrastRatio("#646b2e", CARD)).toBeGreaterThanOrEqual(4.5);
    expect(readableOn("#646b2e", CARD)).toBe("#646b2e");
  });

  it("rescues the exact colours that shipped unreadable to the live site", () => {
    // Denmark's gold rendered link text at 3.32-3.38:1 on every card surface. These are the real
    // measured failures from the a11y gate, not synthetic examples.
    for (const bg of [CARD, CARD2, SUNKEN]) {
      expect(contrastRatio("#a77e3e", bg)).toBeLessThan(4.5);
      expect(contrastRatio(readableOn("#a77e3e", bg), bg)).toBeGreaterThanOrEqual(4.5);
    }
    // Korea's accent passes on the card but NOT on the sunken panel — the case the old fixed
    // 14% darkening could not express, because one constant cannot serve two surfaces.
    expect(contrastRatio("#646b2e", SUNKEN)).toBeLessThan(4.5);
    expect(contrastRatio(readableOn("#646b2e", SUNKEN), SUNKEN)).toBeGreaterThanOrEqual(4.5);
  });

  it("holds for every accent in the shipped palette, on every surface", () => {
    const ACCENTS = ["#a77e3e", "#646b2e", "#9b592b", "#9c4421", "#b3261e", "#c7a269"];
    for (const fg of ACCENTS) {
      for (const bg of [CARD, CARD2, SUNKEN]) {
        expect(contrastRatio(readableOn(fg, bg), bg)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("darkens only as far as it must, even from the worst starting point", () => {
    // White on white is the hardest input. It must terminate, stay in gamut, and stop at the
    // LIGHTEST shade that clears the bar rather than running to black — minimal intervention is
    // the contract, so a guide's colour is never darkened further than legibility requires.
    const out = readableOn("#ffffff", "#ffffff");
    expect(out).toMatch(/^#[0-9a-f]{6}$/);
    expect(contrastRatio(out, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(relativeLuminance(out)).toBeGreaterThan(relativeLuminance("#000000"));
  });

  it("preserves hue order — the result is a darker shade, not a different colour", () => {
    const out = readableOn("#a77e3e", CARD);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(out.slice(i, i + 2), 16));
    // Source #a77e3e is r > g > b; the darkened shade must keep that relationship.
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
  });

  it("LIGHTENS on dark surfaces instead of darkening", () => {
    // The dark-mode card and page grounds, measured from the built site. Accent text sat at
    // 2.87:1 here — darkening it (the old fixed-shade approach) pushes it TOWARD the background
    // and makes it worse, so direction has to come from the surface.
    for (const bg of ["#1e242b", "#14181c"]) {
      for (const fg of ["#a77e3e", "#646b2e", "#9b592b", "#9c4421"]) {
        const out = readableOn(fg, bg);
        expect(contrastRatio(out, bg)).toBeGreaterThanOrEqual(4.5);
        // Never darker: either it already passed and came back untouched, or it was lightened.
        expect(relativeLuminance(out)).toBeGreaterThanOrEqual(relativeLuminance(fg));
      }
    }
    // The specific measured failure: this pair rendered at 2.87:1 on the dark card, so it must
    // move, and strictly upward.
    const rescued = readableOn("#9b592b", "#1e242b");
    expect(contrastRatio("#9b592b", "#1e242b")).toBeLessThan(4.5);
    expect(relativeLuminance(rescued)).toBeGreaterThan(relativeLuminance("#9b592b"));
  });

  it("honours a custom target, so large-text surfaces can ask for 3.0", () => {
    expect(contrastRatio(readableOn("#a77e3e", CARD, 3), CARD)).toBeGreaterThanOrEqual(3);
    // A looser target must not over-darken: 3.0 should land lighter than 4.5 demands.
    expect(relativeLuminance(readableOn("#a77e3e", CARD, 3)))
      .toBeGreaterThan(relativeLuminance(readableOn("#a77e3e", CARD, 4.5)));
  });
});

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black vs white (WCAG max)", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("is 1 for identical colours", () => {
    expect(contrastRatio("#2b5d86", "#2b5d86")).toBeCloseTo(1, 5);
  });

  it("is order-independent", () => {
    expect(contrastRatio("#9c4421", "#f3ecdf")).toBeCloseTo(
      contrastRatio("#f3ecdf", "#9c4421"), 5,
    );
  });

  // Calibration guard: the tightest real country accent (#b07a1f) must stay
  // above the 3.0 build gate, and an obvious disaster (near-cream) must fail it.
  // If this ever flips, the gate in content.config.ts needs re-review.
  it("passes the tightest shipping accent and fails a pale disaster on the light bg", () => {
    expect(contrastRatio("#b07a1f", "#f3ecdf")).toBeGreaterThan(3);
    expect(contrastRatio("#f5e6a0", "#f3ecdf")).toBeLessThan(3);
  });
});
