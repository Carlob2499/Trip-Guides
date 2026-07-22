/* Behavioral coverage for the SOS emergency sheet (features/sos/ui/sos.js) — A7 /
   TEST_COVERAGE_ANALYSIS.md §P6 names this an untested risk surface. Korea has real
   emergency data (src/data/countries.mjs), so its SOS button renders. Mirrors
   field-tools.spec.ts's network-blocking pattern; no fixed clock needed here. */
import { test, expect } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";

test("SOS button opens the sheet, numbers render from guide data, focus lands inside", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });

  const btn = page.locator("button[aria-label='Emergency numbers']");
  await expect(btn).toBeVisible();
  await btn.click();

  const sheet = page.locator(".sos-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet).not.toHaveAttribute("hidden", "");

  // Korea's real emergency data (Korea Travel Hotline, 24/7 English) must actually render —
  // never a guessed/generic number.
  await expect(sheet).toContainText("1330");

  // Focus must land INSIDE the sheet on open (on the close button), not stay on the
  // trigger button or fall back to <body>.
  const closeBtn = sheet.locator(".sos-x");
  await expect(closeBtn).toBeFocused();
});

test("Escape closes the SOS sheet", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.locator("button[aria-label='Emergency numbers']").click();

  const sheet = page.locator(".sos-sheet");
  await expect(sheet).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(sheet).toHaveAttribute("hidden", "");
});

test("Tab wraps focus inside the open SOS sheet instead of escaping to the page (R3)", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.locator("button[aria-label='Emergency numbers']").click();

  const sheet = page.locator(".sos-sheet");
  await expect(sheet).toBeVisible();

  // Tab forward through every focusable element in the sheet; the NEXT Tab past the
  // last one must wrap back to the first, never escape to something outside the sheet.
  const focusables = sheet.locator(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const count = await focusables.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    await page.keyboard.press("Tab");
  }
  // One more Tab past the last focusable should wrap to the first (the close button).
  await page.keyboard.press("Tab");
  await expect(sheet.locator(".sos-x")).toBeFocused();
});

test("clicking the backdrop closes the sheet and returns focus to the trigger", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const trigger = page.locator("button[aria-label='Emergency numbers']");
  await trigger.click();

  const sheet = page.locator(".sos-sheet");
  await expect(sheet).toBeVisible();
  // Click the sheet's own backdrop area (the sheet element itself, outside .sos-inner).
  await sheet.click({ position: { x: 2, y: 2 } });
  await expect(sheet).toHaveAttribute("hidden", "");
  await expect(trigger).toBeFocused();
});
