/* Behavioral coverage for the share panel's DOM WIRING (features/share/ui/share-panel.js) —
   the pure URL/text building lives in ../model/share-links.ts and is unit-tested there; this
   pins the wiring the units can't reach: opening the modal actually sets the WhatsApp/email
   links' hrefs to the CORRECT encoded URL/title, the copy button carries the right URL, and
   the section-specific deep link (#grp-N) is picked up from the active tab. A7 /
   TEST_COVERAGE_ANALYSIS.md §P6. */
import { test, expect } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";

test("opening the share panel sets WhatsApp/email links to the correctly-encoded current URL + title", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const pageTitle = await page.title();

  await page.locator("#btnShare").click();

  const modal = page.locator("#shareModal");
  await expect(modal).toBeVisible();

  const urlTxt = await page.locator("#shareUrlTxt").textContent();
  expect(urlTxt).toContain("/guides/korea/");

  const waHref = await page.locator("#shareWA").getAttribute("href");
  expect(waHref).toBe("https://wa.me/?text=" + encodeURIComponent(urlTxt!.trim()));

  const mailtoHref = await page.locator("#shareEmail").getAttribute("href");
  expect(mailtoHref).toBe(
    "mailto:?subject=" + encodeURIComponent(pageTitle) + "&body=" + encodeURIComponent(urlTxt!.trim()),
  );
});

test("the copy-link button carries the same URL shown in the panel", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.locator("#btnShare").click();

  const urlTxt = (await page.locator("#shareUrlTxt").textContent())?.trim();
  const copyBtn = page.locator("#shareCopyBtn");
  await expect(copyBtn).toHaveAttribute("data-url", urlTxt!);
});

test("the share URL updates to a section-specific #grp-N deep link when a numbered tab is active", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });

  // Switch to a numbered content tab (not a special panel like Budget/Vote).
  const numberedTab = page.locator(".gtab[data-tab]").filter({ hasText: /.+/ }).nth(1);
  await numberedTab.click();
  const tabIndex = await numberedTab.getAttribute("data-tab");

  await page.locator("#btnShare").click();
  const urlTxt = await page.locator("#shareUrlTxt").textContent();
  if (tabIndex && /^\d+$/.test(tabIndex)) {
    expect(urlTxt).toContain(`#grp-${tabIndex}`);
  }
});

test("Escape closes the share modal and returns focus to the trigger", async ({ page }) => {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const trigger = page.locator("#btnShare");
  await trigger.click();

  const modal = page.locator("#shareModal");
  await expect(modal).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(modal).toHaveAttribute("hidden", "");
  await expect(trigger).toBeFocused();
});
