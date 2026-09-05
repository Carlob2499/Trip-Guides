/* D5 — gallery screenshot baselines (design-system.md §6). The component gallery is the one
   page that renders every registered component and block from real guide content, so ONE
   full-page screenshot per (guide theme × light/dark) captures the whole design system's
   rendered truth: 6 themes × 2 modes = 12 baselines, driven through the page's own runtime
   controls (#galTheme / #galDark) — the same one-token-core remap architecture the product uses.

   This is deliberately NOT the screenshot-diff suite this config's header says was removed.
   That suite shadowed product pages and failed on every intentional content edit — the wrong
   signal. These baselines watch a page whose content only changes when the DESIGN SYSTEM
   changes (a token, a component, a registry entry), which is exactly the signal we want. An
   intentional design change updates them explicitly: `npm run baselines:update`, and the PNG
   diff in the PR is the review artifact.

   Determinism: same recipe as a11y.spec.ts — everything off-origin is aborted (map embeds and
   the weather mount render their offline fallbacks, which are themselves states worth pinning),
   the clock is fixed so date-derived rendering (provenance aging, jet-lag) cannot drift, and
   reduced-motion is emulated so scroll reveals cannot half-fire mid-capture. */
// @protects-file The design system's rendered output cannot change silently — every theme and mode is pinned.

import { test, expect, type Page } from "@playwright/test";

const FIXED_TIME = new Date("2026-09-01T10:00:00+09:00");
/* The curated guides only. The four pipeline research drafts (luxembourg, malta, portugal,
   uruguay) were removed from main on 2026-09-05 at the owner's direction; their run evidence
   stays in docs/pipeline v2 and in Git history. */
const THEMES = ["denmark", "korea"] as const;
const MODES = ["light", "dark"] as const;

async function openGallery(page: Page) {
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://localhost:4322") ? route.continue() : route.abort(),
  );
  await page.clock.setFixedTime(FIXED_TIME);
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  const res = await page.goto("/Trip-Guides/gallery/");
  expect(res?.status(), "gallery route must exist — a 404 pins nothing").toBeLessThan(400);
  /* Fire every lazy/reveal path before capturing, then settle back at the top. */
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(250);
  await settleHeight(page);
}

/* ⊛ Two things have to hold still before a full-page capture: the page's height, and the
   number Chromium reports for it. This is the first — wait for two identical consecutive
   readings, rather than trusting a fixed delay, so a late-settling webfont cannot move the
   layout between the measurement and the shot. */
async function settleHeight(page: Page) {
  await page.evaluate(() => { delete (window as unknown as { __lastH?: number }).__lastH; });
  await page.waitForFunction(() => {
    const w = window as unknown as { __lastH?: number };
    const h = document.documentElement.scrollHeight;
    const stable = w.__lastH === h;
    w.__lastH = h;
    return stable;
  }, undefined, { timeout: 15_000, polling: 200 });
}

/* ⊛ ...and the height Chromium reports for the capture is FRACTIONAL.
   `fullPage` asks for the document's content size; on ~35 000px of rem- and line-height-derived
   blocks that lands mid-pixel, and which way it rounds is not stable between two runs of the
   same page. A one-pixel canvas difference is a total mismatch to Playwright — 12% of pixels
   "changed" because everything below the seam shifted a row — and it failed exactly that way
   twice on real, correct surface work. Adding the missing fraction to the page's own foot makes
   the number whole, so both runs round to the same integer by construction. The compared
   PIXELS are untouched: this adds sub-pixel padding below the last card, nothing else. */
async function squarePage(page: Page) {
  await page.evaluate(() => {
    document.body.style.paddingBottom = "0px";
    const frac = document.documentElement.getBoundingClientRect().height % 1;
    if (frac > 0.001) document.body.style.paddingBottom = `${(1 - frac).toFixed(4)}px`;
  });
}

for (const theme of THEMES) {
  for (const mode of MODES) {
    test(`gallery — ${theme} theme, ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await openGallery(page);
      await page.selectOption("#galTheme", theme);
      if (mode === "dark") await page.click("#galDark");
      await page.waitForTimeout(250);
      await settleHeight(page);
      await squarePage(page);
      await expect(page).toHaveScreenshot(`gallery-${theme}-${mode}.png`, {
        fullPage: true,
        animations: "disabled",
        /* A full-page capture of this ~8000px page takes >5s alone; the default expect timeout
           reads that as instability. Room for two stability captures, not a looser gate. */
        timeout: 30_000,
        /* Two dials, both proven by a planted violation (see the D5 commit message):
           threshold is PER-PIXEL colour sensitivity — pixelmatch's 0.2 default silently
           swallowed a planted 3%-per-channel --card drift, exactly the token-level change this
           suite exists to catch, so it is tightened to 0.02; maxDiffPixelRatio then absorbs
           cross-machine antialiasing by AREA (under 1% of a full-page capture) without giving
           back colour blindness. */
        threshold: 0.02,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
}
