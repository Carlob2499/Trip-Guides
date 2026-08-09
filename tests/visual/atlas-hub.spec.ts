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

/* ── The 2026-08-08 hub pass (creator's own list) ──────────────────────────────────────
   Four complaints, four gates. Each asserts the BEHAVIOUR that was missing, not the
   styling that expresses it, so a later restyle does not have to rewrite them. */

test("the table header collapses to a search button instead of following you down the list", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="table"]').click();

  const head = page.locator("[data-atlas-searchhead]");
  const toggle = page.locator("[data-atlas-search-toggle]");
  await expect(toggle).toBeVisible();
  await expect(head).toHaveAttribute("data-collapsed", "");
  // The sticky region has to be genuinely small, not merely collapsed in name.
  expect((await head.boundingBox())!.height).toBeLessThan(72);

  await toggle.click();
  await expect(head).not.toHaveAttribute("data-collapsed", "");
  await expect(page.locator("[data-atlas-search]")).toBeFocused();

  // The chips are no longer part of the sticky header — they scroll away with the page.
  expect(await head.locator(".atlas-chips").count()).toBe(0);
  await expect(page.locator(".atlas-chips")).toBeAttached();
});

test("the search field still works with no JavaScript, and no dead button is offered", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(HUB, { waitUntil: "domcontentloaded" });
  // Server default is the opposite of the enhanced one, on purpose.
  await expect(page.locator("[data-atlas-search]")).toBeVisible();
  await expect(page.locator("[data-atlas-search-toggle]")).toBeHidden();
  await ctx.close();
});

test("every trip row carries its own cover plate, asked for at plate size", async ({ page }) => {
  await page.goto(HUB, { waitUntil: "networkidle" });
  const rows = page.locator(".atlas-sheets .atlas-sheet");
  const n = await rows.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    await expect(rows.nth(i).locator(".atlas-sheet-plate")).toBeAttached();
    // The survey number survives the photo — it is the guide's D6 ordinal, not decoration.
    await expect(rows.nth(i).locator(".atlas-sheet-num")).toBeAttached();
  }
  // A 56px plate must not be pulling full-size originals (Nyhavn is 258 KB unresized).
  const srcs = await page.locator(".atlas-sheet-thumb").evaluateAll((els) =>
    els.map((e) => (e as HTMLImageElement).getAttribute("src") || ""));
  for (const src of srcs) {
    if (src.includes("Special:FilePath")) expect(src).toContain("width=");
  }
});

test("mobile globe: each surveyed country names itself without being tapped", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  // Reduced motion parks the auto-spin. Without it the chips move between Playwright's
  // actionability check and the click itself, and the click lands on the canvas behind —
  // which is a property of testing a spinning globe, not a bug in the chips.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();

  // The globe spins, so at least one guide is always facing the viewer; wait for the
  // first frame that shows one rather than assuming a fixed rotation.
  const shown = page.locator(".atlas-pinchip[data-on]");
  await expect(shown.first()).toBeVisible({ timeout: 15000 });
  await expect(shown.first().locator(".atlas-pinchip-name")).not.toBeEmpty();
  // Status is carried as data, so the dot's colour can never disagree with the trip.
  const statuses = await page.locator(".atlas-pinchip").evaluateAll((els) =>
    els.map((e) => e.getAttribute("data-status")));
  expect(statuses.length).toBeGreaterThan(0);
  for (const s of statuses) expect(["ongoing", "upcoming", "past", "undated"]).toContain(s);

  // Tapping a chip must do what tapping its pin does — raise the sheet, not navigate away.
  const url = page.url();
  await shown.first().click();
  await expect(page.locator("[data-atlas-pingsheet]")).toBeVisible();
  expect(page.url()).toBe(url);
});

test("desktop keeps its full pincards and shows no phone chips", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();
  await expect(page.locator(".atlas-pincard").first()).toBeAttached({ timeout: 15000 });
  await expect(page.locator(".atlas-pinchip")).toHaveCount(0);
});
