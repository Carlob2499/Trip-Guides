/* Behavioral coverage for the SOS emergency sheet (features/sos/ui/sos.js) — A7 /
   The 2026-07 coverage analysis (§P6) named this an untested risk surface. Korea has real
   emergency data (src/data/countries.mjs), so its SOS button renders. Mirrors
   field-tools.spec.ts's network-blocking pattern; no fixed clock needed here. */
// @protects-file Emergency numbers are two taps away and readable in a hurry.

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

  const focusables = sheet.locator(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const count = await focusables.count();
  expect(count).toBeGreaterThan(0);

  /* Opening the sheet already puts focus on the FIRST focusable (.sos-x — asserted by the
     first test in this file), so a full cycle is exactly `count` Tabs: count-1 to walk to
     the last focusable, then one more that must WRAP to the first rather than escaping to
     the page behind the sheet. Pressing count+1 lands one PAST the wrap — which is what
     this test used to do, failing on a focus trap that was working correctly all along. */
  for (let i = 0; i < count; i++) {
    await page.keyboard.press("Tab");
  }
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

/* One downward swipe, three claimants.

   Both bottom sheets read the thumb themselves (src/scripts/sheet-drag.js), but neither set
   `touch-action`, so it defaulted to `auto` and the browser kept claiming the same gesture:
   the sheet followed the finger while the page scrolled behind it and Chrome's pull-to-refresh
   armed on top of both. Which one won depended on where the thumb landed — the reported symptom
   was a sheet that sometimes dismissed and sometimes reloaded the whole guide.

   These assert the SPLIT rather than the outcome, because the outcome is a real touchscreen and
   a real browser gesture, neither of which a headless run has. What is checkable is who is
   declared to own what — and that is exactly the thing that was wrong. */
test("the SOS sheet owns its drag gesture outright", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.locator("button[aria-label='Emergency numbers']").click();
  await expect(page.locator(".sos-sheet")).not.toHaveAttribute("hidden", "");
  // `none`: it has no scrolling content, so there is nothing to give the browser.
  await expect(page.locator(".sos-inner")).toHaveCSS("touch-action", "none");
});

test("the groups sheet splits the gesture: shell drags, list scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.locator("#sheetOpen").click();
  const sheet = page.locator(".sheet");
  await expect(sheet).toHaveClass(/open/);

  await expect(sheet).toHaveCSS("touch-action", "none");
  // pan-y, not none: the list is genuinely scrollable and must stay that way. sheet-drag only
  // arms when it is at scrollTop 0, so the two never contend for the same swipe.
  const list = page.locator(".sheet-list");
  await expect(list).toHaveCSS("touch-action", "pan-y");
  expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight + 2)).toBe(true);

  // Pull-to-refresh is the third claimant. Not disabled site-wide — a browser tab should keep
  // it — but contained while the page underneath is locked and a reload would be destructive.
  await expect(page.locator("body")).toHaveClass(/sheet-lock/);
  await expect(page.locator("body")).toHaveCSS("overscroll-behavior-y", "contain");

  // The rounded top edge WAS the drag cue, and it was also Atlas drift (0 or 999px only).
  // The container is square now; the handle that replaced it is the pill.
  await expect(sheet).toHaveCSS("border-radius", "0px");
});
