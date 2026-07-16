/* Visual smoke — hub + Korea guide, light + dark, mobile + desktop (8 baselines).
   Deterministic for everything the BROWSER decides:
   · fixed clock (post-trip date) — countdowns, "jump to today", now-line and
     weather-day logic render the same forever;
   · external requests aborted — Commons photos / weather / FX / Firebase never
     vary a pixel (and never hit the network in CI);
   · animations disabled at the screenshot layer (config).

   ⚠ KNOWN LIMIT — page.clock only fixes CLIENT-side time. The hub's "next trip" hero is
   chosen at BUILD time (`new Date()` in src/pages/index.astro) and baked into static HTML,
   so no browser clock can stabilize it: the hub baselines legitimately change when a trip
   crosses from upcoming → past, or when an upcoming guide is added. A hub diff after such a
   change is expected staleness, NOT a regression — confirm against the guide baselines
   (which are build-date independent) before hunting a bug, then re-record with
   `npx playwright test --update-snapshots`. Fixing this properly means making the build date
   injectable (e.g. SOURCE_DATE_EPOCH) so index.astro resolves "next trip" against a pinned
   date; until then, treat hub baselines as date-sensitive.

   Baselines are per-platform (Playwright suffixes them); CI bootstraps missing
   linux baselines on its first run (see .github/workflows/visual.yml). */
import { test, expect, type Page } from "@playwright/test";

const FIXED_TIME = new Date("2026-09-01T10:00:00+09:00"); // stable post-trip date

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  desktop: { width: 1280, height: 800 },
} as const;

async function prep(page: Page, path: string) {
  // Kill all cross-origin variance (photos, APIs, Firebase) before any request fires.
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("http://localhost:4322")) return route.continue();
    return route.abort();
  });
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForTimeout(600); // let entry choreography settle (animations are
  //                                 disabled in the diff, but layout must finish)
}

for (const scheme of ["light", "dark"] as const) {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    test.describe(`${scheme} ${vpName}`, () => {
      test.use({ viewport: vp, colorScheme: scheme });

      test(`hub — ${scheme} ${vpName}`, async ({ page }) => {
        await prep(page, "/Trip-Guides/");
        await expect(page).toHaveScreenshot(`hub-${scheme}-${vpName}.png`);
      });

      test(`korea guide — ${scheme} ${vpName}`, async ({ page }) => {
        await prep(page, "/Trip-Guides/guides/korea/");
        await expect(page).toHaveScreenshot(`korea-${scheme}-${vpName}.png`);
      });
    });
  }
}
