/* Behavioral coverage for the day-route optimizer (docs/PLAN_FIELD_REPORT_FIXES.md E7).
   Exercises it against Korea's REAL Jul 14 shopping day (not a synthetic fixture) —
   the model/optimize.test.ts unit suite already proves the model fires there and
   stays silent everywhere else in this guide; this suite proves the DOM half:
   chip appears, sheet shows the real suggested order, apply reorders the visible
   stop list, restore undoes it, and the choice survives a reload (localStorage,
   per-device — never the guide JSON). Deterministic clock, no network. */
import { test, expect, type Page } from "@playwright/test";

const FIXED_TIME = new Date("2026-09-01T10:00:00+09:00"); // stable post-trip date
const KOREA = "/Trip-Guides/guides/korea/";
const JUL14_DAY = "#day-6"; // 0-indexed: Jul8=0 … Jul14=6, the only day this trip that fires

async function open(page: Page, hash = "") {
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://localhost:4322") ? route.continue() : route.abort(),
  );
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(KOREA + hash, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
}

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("a chip appears on the one real day where reordering genuinely helps, and nowhere else", async ({ page }) => {
    await open(page, "#grp-3");
    const chips = page.locator(".ro-chip");
    expect(await chips.count()).toBe(1);
    await expect(chips.first()).toHaveText(/Reorder could save ≈\d/);
    // The chip lives specifically on Jul 14's card, not some other day.
    await expect(page.locator(JUL14_DAY + " .ro-chip")).toHaveCount(1);
  });

  test("tapping the chip opens a sheet with the real suggested stop order", async ({ page }) => {
    await open(page, "#grp-3");
    await page.locator(".ro-chip").first().click();
    const sheet = page.locator(".ro-sheet");
    await expect(sheet).toBeVisible();
    const order = await page.locator(".ro-sheet-order li").allTextContents();
    expect(order).toHaveLength(5);
    expect(order[0]).toContain("Changdeokgung");
    // Honest boundary line: the sheet says this never touches exports.
    await expect(page.locator(".ro-sheet-note")).toContainText("GPX");
  });

  test("Apply reorders the visible stop list and Restore undoes it exactly", async ({ page }) => {
    await open(page, "#grp-3");
    const originalNames = await page.locator(JUL14_DAY + " .stop .stop-name").allTextContents();

    await page.locator(".ro-chip").first().click();
    await page.locator(".ro-sheet-apply").click();
    await expect(page.locator(".ro-sheet")).toBeHidden();

    const reorderedNames = await page.locator(JUL14_DAY + " .stop .stop-name").allTextContents();
    expect(reorderedNames).not.toEqual(originalNames);
    expect(new Set(reorderedNames)).toEqual(new Set(originalNames)); // same 5 stops, no loss/dup
    const reorderedNums = await page.locator(JUL14_DAY + " .stop .stop-num").allTextContents();
    expect(reorderedNums).toEqual(["01", "02", "03", "04", "05"]);
    await expect(page.locator(".ro-chip").first()).toHaveText(/Reordered — restore/);

    await page.locator(".ro-chip").first().click(); // restore
    const restoredNames = await page.locator(JUL14_DAY + " .stop .stop-name").allTextContents();
    expect(restoredNames).toEqual(originalNames);
    await expect(page.locator(".ro-chip").first()).toHaveText(/Reorder could save/);
  });

  test("an applied reorder survives a reload (per-device localStorage, not guide JSON)", async ({ page }) => {
    await open(page, "#grp-3");
    await page.locator(".ro-chip").first().click();
    await page.locator(".ro-sheet-apply").click();
    const reorderedNames = await page.locator(JUL14_DAY + " .stop .stop-name").allTextContents();

    await open(page, "#grp-3"); // full reload, same route
    const afterReload = await page.locator(JUL14_DAY + " .stop .stop-name").allTextContents();
    expect(afterReload).toEqual(reorderedNames);
    await expect(page.locator(".ro-chip").first()).toHaveText(/Reordered — restore/);
  });

  test("Escape closes the sheet without applying anything", async ({ page }) => {
    await open(page, "#grp-3");
    const originalNames = await page.locator(JUL14_DAY + " .stop .stop-name").allTextContents();
    await page.locator(".ro-chip").first().click();
    await expect(page.locator(".ro-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".ro-sheet")).toBeHidden();
    expect(await page.locator(JUL14_DAY + " .stop .stop-name").allTextContents()).toEqual(originalNames);
  });
});
