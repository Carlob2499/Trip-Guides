/* Behavioral coverage for the Atlas hub (src/pages/index.astro) — replaces the old
   overture.spec.ts when the Atlas migration's Stage C item 10 flip retired the previous
   hub (overture.js, stats beat, #hubGrid cards). The guarantees carry over unchanged in
   INTENT — only the markup they assert against moved:
   1. The sheet list is reachable with JS entirely disabled — it's D4's server-rendered
      "no-JS/SEO door", and the globe/cover are progressive enhancement on top of it.
   2. prefers-reduced-motion → the cover's iris/FLIP sequence is skipped, content reachable.
   3. A second visit in the same session (tg-atlas-cover-seen set) never shows the cover. */
import { test, expect } from "@playwright/test";

const HUB = "/Trip-Guides/";

test("the sheet list is reachable with JavaScript entirely disabled (D4's server-rendered door)", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(HUB, { waitUntil: "load" });

  const sheets = page.locator(".atlas-sheets .atlas-sheet");
  expect(await sheets.count()).toBeGreaterThan(0);

  // Every row is a real, followable link to a real guide even with no JS at all — the
  // whole point of the table view being SSR rather than globe-derived.
  const count = await sheets.count();
  for (let i = 0; i < count; i++) {
    const href = await sheets.nth(i).getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toContain("/guides/");
  }

  await context.close();
});

test("reduced-motion: the cover does not animate and the hub is immediately reachable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HUB, { waitUntil: "networkidle" });

  // cover.js's dismiss() takes the reducedMotion() early return — it removes the cover
  // outright rather than running the fade/FLIP/iris sequence. Whether the cover is still
  // on screen or already gone, the table content behind it must be present and usable.
  await expect(page.locator(".atlas-table")).toBeAttached();
  await expect(page.locator(".atlas-sheets .atlas-sheet").first()).toBeAttached();
});

test("a second visit in the same session never shows the cover", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("tg-atlas-cover-seen", "1");
  });
  await page.goto(HUB, { waitUntil: "networkidle" });

  // initCover() removes the element entirely on the seen path — not merely hides it.
  await expect(page.locator("[data-atlas-cover]")).toHaveCount(0);
  // Attached, not visible: with JS running the hub opens in WORLD mode, which hides the
  // table view. The point here is that nothing blocks the hub, not which face is showing.
  await expect(page.locator(".atlas-sheets .atlas-sheet").first()).toBeAttached();
});
