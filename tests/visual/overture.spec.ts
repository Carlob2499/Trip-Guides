/* Behavioral coverage for the hub Overture (src/scripts/overture.js) — A7 /
   TEST_COVERAGE_ANALYSIS.md §P6 names this an untested risk surface (0% before this).
   Three guarantees the finding called out specifically:
   1. prefers-reduced-motion → no kinetic arrival/auto-glide; content immediately reachable.
   2. A second visit (tg-overture-seen already set) → compact hero, set pre-paint.
   3. The guide grid is reachable even with JS entirely disabled — it's SSR content, motion
      is pure enhancement on top, never a requirement to see or use the grid. */
import { test, expect } from "@playwright/test";

const HUB = "/Trip-Guides/";

test("reduced-motion: no kinetic arrival class, content immediately reachable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HUB, { waitUntil: "networkidle" });

  // initOverture() returns early under reducedMotion() — body never gets the "ov-play"
  // class that drives the kinetic arrival keyframes.
  await expect(page.locator("body")).not.toHaveClass(/ov-play/);

  // The hero text and the guide grid must both be visible right away — no animation
  // gating them behind a delay.
  await expect(page.locator(".ov-head")).toBeVisible();
  await expect(page.locator("#hubGrid")).toBeVisible();
  const cards = page.locator("#hubGrid .hubcard");
  await expect(cards.first()).toBeVisible();
});

test("a second visit (tg-overture-seen already set) renders the compact hero, set pre-paint", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("tg-overture-seen", "1");
  });
  await page.goto(HUB, { waitUntil: "networkidle" });

  // Set by the pre-paint inline script BEFORE Astro/overture.js ever runs — this is the
  // "no flash of the full intro" guarantee, testable independent of overture.js itself.
  await expect(page.locator("html")).toHaveAttribute("data-overture", "compact");

  // initOverture() takes the isCompact early-return branch — no ov-play class, and
  // markSeen() runs so a REPEAT of this same visit stays compact too.
  await expect(page.locator("body")).not.toHaveClass(/ov-play/);

  // U12: the stats beat must still be rendered (smaller), not hidden outright, on a
  // return visit — a bounce-once visitor must not permanently lose it.
  await expect(page.locator(".stats-beat")).toBeVisible();
});

test("the guide grid is reachable with JavaScript entirely disabled (SSR content, motion is enhancement only)", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(HUB, { waitUntil: "load" });

  const cards = page.locator("#hubGrid .hubcard");
  expect(await cards.count()).toBeGreaterThan(0);
  // Each card is a real, followable link even with no JS at all.
  const firstHref = await cards.first().getAttribute("href");
  expect(firstHref).toBeTruthy();

  await context.close();
});
