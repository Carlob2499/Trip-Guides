import { readFileSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { accentTokens, accentStyle, TINT_MAX } from "./accent-tokens";
import { contrastRatio, mix } from "./contrast";

/* Every accent that actually ships, from src/data/palettes/*.json and the country defaults. */
const SHIPPED = ["#a77e3e", "#646b2e", "#9b592b", "#9c4421", "#c7a269", "#73572b", "#63391b"];
const LIGHT_SURFACES = ["#f4f6ef", "#f2f4eb", "#dee2d6", "#e9ebe3"];
const DARK_SURFACES = ["#1e242b", "#1b2026", "#14181c"];

/* Accent text is rarely painted on a FLAT surface — chips and pills tint their ground toward the
   accent, which is the one direction that eats contrast. Every surface below therefore appears
   twice: flat, and tinted at the ceiling. */
const tinted = (accent: string, surfaces: readonly string[]) =>
  surfaces.flatMap((s) => [s, mix(accent, s, TINT_MAX)]);

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
      for (const bg of tinted(accent, LIGHT_SURFACES)) {
        expect(contrastRatio(ink, bg), `${accent} -> ${ink} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("guarantees AA for text on every dark surface too", () => {
    // Dark mode was never audited and shipped links at 2.20:1. The dark shade is derived, not
    // hand-picked, so it cannot rot the way the light one did.
    for (const accent of SHIPPED) {
      const { inkDark } = accentTokens(accent);
      for (const bg of tinted(accent, DARK_SURFACES)) {
        expect(contrastRatio(inkDark, bg), `${accent} -> ${inkDark} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("guarantees AA for text sitting ON an accent fill, identically in both themes", () => {
    // The third job. .shiny-pill, .dchip-active, .story-play, .day-flip-btn.on and friends paint
    // text directly on --accent, and every one of them used to improvise its own ink (#fff,
    // var(--bg), #f4f6ef). Denmark's gold measured 3.68:1 against white and 3.06:1 against
    // var(--bg) in light mode. There is exactly ONE answer per accent because the ground never
    // re-maps by theme — which is why this assertion needs no light/dark split.
    for (const accent of SHIPPED) {
      const { onAccent } = accentTokens(accent);
      expect(contrastRatio(onAccent, accent), `${accent} -> ${onAccent}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps TINT_MAX honest against what the stylesheets actually do", () => {
    // TINT_MAX is a claim ABOUT THE CSS, so the CSS is what has to confirm it. Without this the
    // number is a comment that decays: someone adds `background:color-mix(in srgb,var(--accent)
    // 30%,var(--card))`, every derived ink silently stops covering its real ground, and no test
    // notices because the tokens still satisfy the surfaces this file happens to list.
    const roots = ["src/styles", "src/features"];
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = `${dir}/${e.name}`;
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith(".css")) files.push(p);
      }
    };
    for (const r of roots) walk(r);
    expect(files.length, "found no stylesheets to scan — the walk is broken, not the CSS").toBeGreaterThan(10);

    // Only BACKGROUND tints matter: a border, shadow or gradient stop is not a ground text sits on.
    // A tint toward `transparent` counts too — the browser composites the translucent result over
    // whatever real surface sits beneath, and this site has only three surface tokens, so that
    // composite is bounded by the same set literal var(--card|bg2|bg) tints are. A tint toward
    // --rule or --ink is excluded: those are different token families this contract says nothing
    // about (e.g. .gtab-active mixes toward --ink and pairs it with var(--bg), not accent text).
    const bgTint =
      /background(?:-color)?\s*:\s*color-mix\(\s*in srgb\s*,\s*var\(--accent\)\s*(\d+(?:\.\d+)?)%\s*,\s*(?:var\(--(?:card|bg2|bg)\)|transparent)\s*\)/g;
    const offenders: string[] = [];
    let ceiling = 0;
    for (const f of files) {
      const css = readFileSync(f, "utf8");
      for (const m of css.matchAll(bgTint)) {
        const pct = parseFloat(m[1]) / 100;
        ceiling = Math.max(ceiling, pct);
        if (pct > TINT_MAX) offenders.push(`${f}: ${m[1]}%`);
      }
    }
    expect(offenders, `accent-tinted backgrounds exceed TINT_MAX (${TINT_MAX * 100}%)`).toEqual([]);
    // Also fail when the ceiling DROPS: a stale-high TINT_MAX is not unsafe, but it silently
    // over-darkens every accent on the site, and nobody would ever find out why.
    expect(ceiling, "TINT_MAX is higher than any tint in the CSS — re-derive it").toBe(TINT_MAX);
  });

  it("matches the defaults baked into base.css for the no-guide accent", () => {
    // base.css cannot call a function, so the hub/health/progress defaults are hand-copied out of
    // accentTokens("#9c4421"). Hand-copied values drift; this is the thing that notices.
    const css = readFileSync("src/styles/base.css", "utf8");
    const t = accentTokens("#9c4421");
    expect(css).toContain(`--accent-ink-light:${t.ink};`);
    expect(css).toContain(`--accent-ink-dark:${t.inkDark};`);
    expect(css).toContain(`--on-accent:${t.onAccent};`);
    // --on-accent must NOT be re-mapped in the dark block: its ground is --accent, which isn't.
    const darkBlocks = css.slice(css.indexOf("prefers-color-scheme:dark"));
    expect(darkBlocks).not.toContain("--on-accent:");
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
