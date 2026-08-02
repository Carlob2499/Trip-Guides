/* Behavioral coverage for the change-request wizard's DOM WIRING
   (features/change-request/ui/change-request.js). The URL building and step validation are
   unit-tested in ../model/change-request.test.ts; this pins what units can't reach:

   · the trigger is a REAL link that still works with JS off (progressive enhancement),
   · the modal escapes the .sticky-chrome backdrop-filter containing block (the trap the share
     panel documents — a filtered ancestor becomes the containing block for position:fixed, so
     an un-reparented modal anchors to the chrome and flies off-screen once scrolled),
   · the tab chips come from the guide's OWN nav, and picking one does not destroy the element
     the user just activated (which would drop keyboard focus mid-flow),
   · Escape closes and returns focus to the trigger. */
import { test, expect } from "@playwright/test";

const DENMARK = "/Trip-Guides/guides/denmark/";

test("the trigger is a real prefilled link, so the flow survives JS being off", async ({ page }) => {
  await page.goto(DENMARK, { waitUntil: "networkidle" });
  const trigger = page.locator("#btnChangeRequest");
  await expect(trigger).toHaveJSProperty("tagName", "A");
  const href = await trigger.getAttribute("href");
  expect(href).toContain("/issues/new?");
  expect(href).toContain("template=modify-guide.yml");
  expect(href).toContain("labels=modify-request");
  expect(href).toContain("slug=denmark");
});

test("clicking opens the wizard instead of navigating away", async ({ page }) => {
  await page.goto(DENMARK, { waitUntil: "networkidle" });
  const before = page.url();
  await page.locator("#btnChangeRequest").click();
  await expect(page.locator("#crModal")).toBeVisible();
  expect(page.url()).toBe(before);
});

test("the modal is reparented to <body> so `fixed` is viewport-relative, not chrome-relative", async ({ page }) => {
  await page.goto(DENMARK, { waitUntil: "networkidle" });
  await page.locator("#btnChangeRequest").click();
  const parentIsBody = await page.evaluate(() => document.getElementById("crModal")!.parentElement === document.body);
  expect(parentIsBody).toBe(true);

  // And it must still be on-screen after scrolling — the symptom the reparent exists to prevent.
  await page.evaluate(() => window.scrollTo(0, 1200));
  const box = await page.locator("#crModal").boundingBox();
  const vh = await page.evaluate(() => window.innerHeight);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeLessThan(vh);
});

test("tab chips are built from the guide's own nav, plus an explicit escape hatch", async ({ page }) => {
  await page.goto(DENMARK, { waitUntil: "networkidle" });
  await page.locator("#btnChangeRequest").click();

  const groups = await page.evaluate(
    () => JSON.parse(document.getElementById("tgConfig")!.textContent!).navSections.map((s: { group: string }) => s.group),
  );
  const chips = await page.locator("#crModal .cr-chip").allTextContents();
  expect(chips).toEqual([...groups, "I'm not sure"]);
});

test("picking a tab keeps focus on the chip and marks exactly one pressed", async ({ page }) => {
  await page.goto(DENMARK, { waitUntil: "networkidle" });
  await page.locator("#btnChangeRequest").click();

  // Nothing is pre-selected — "I'm not sure" must be a choice, not a default.
  expect(await page.locator("#crModal .cr-chip[aria-pressed='true']").count()).toBe(0);

  const sights = page.locator("#crModal .cr-chip", { hasText: /^Sights$/ });
  await sights.click();
  await expect(sights).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator("#crModal .cr-chip[aria-pressed='true']").count()).toBe(1);

  // Rebuilding the chip list on each pick would blur the just-clicked element.
  const focusIsChip = await page.evaluate(() => document.activeElement?.classList.contains("cr-chip"));
  expect(focusIsChip).toBe(true);
});

test("the description step refuses an empty report and accepts a real one", async ({ page }) => {
  await page.goto(DENMARK, { waitUntil: "networkidle" });
  await page.locator("#btnChangeRequest").click();
  const next = page.locator("#crModal [data-cr-next]");

  await next.click(); // step 1 -> 2
  await expect(page.locator("#crModal [data-cr-stepof]")).toHaveText("Step 2 of 3");

  await next.click(); // empty -> blocked
  await expect(page.locator("#crModal [data-cr-err]")).not.toBeEmpty();
  await expect(page.locator("#crModal [data-cr-stepof]")).toHaveText("Step 2 of 3");

  await page.locator("#crModal [data-cr-change]").fill("Rosenborg admission is 145 DKK now, not 125.");
  await next.click();
  await expect(page.locator("#crModal [data-cr-stepof]")).toHaveText("Step 3 of 3");
  await expect(next).toHaveText(/Continue on GitHub/);
  // The review must show what will actually be sent.
  await expect(page.locator("#crModal [data-cr-review]")).toContainText("denmark");
  await expect(page.locator("#crModal [data-cr-review]")).toContainText("145 DKK");
});

test("Escape closes the wizard and returns focus to the trigger", async ({ page }) => {
  await page.goto(DENMARK, { waitUntil: "networkidle" });
  const trigger = page.locator("#btnChangeRequest");
  await trigger.click();
  await expect(page.locator("#crModal")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator("#crModal")).toBeHidden();
  const focusedId = await page.evaluate(() => document.activeElement?.id);
  expect(focusedId).toBe("btnChangeRequest");
});

test("the wizard fits the viewport at 375px and its textarea clears the iOS zoom floor", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(DENMARK, { waitUntil: "networkidle" });
  await page.locator("#btnChangeRequest").click();

  const box = await page.locator("#crModal").boundingBox();
  expect(box!.width).toBeLessThanOrEqual(375);
  expect(box!.x).toBeGreaterThanOrEqual(0);

  await page.locator("#crModal [data-cr-next]").click();
  const fontPx = await page.evaluate(
    () => parseFloat(getComputedStyle(document.querySelector("#crModal [data-cr-change]")!).fontSize),
  );
  expect(fontPx).toBeGreaterThanOrEqual(16);
});
