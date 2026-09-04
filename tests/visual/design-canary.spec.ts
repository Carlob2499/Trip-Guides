/* Waypoint D6 -> production visual canary.

   This is deliberately NOT a screenshot-baseline test. It produces review artifacts for the two
   surfaces that must prove creator fidelity before the full visual convergence sweep:

     1. South Korea active Trip — phone, dark
     2. South Korea Itinerary workbench — desktop, dark

   The images are evidence for human/creator review. They must never be auto-approved, diffed
   against the current D7 gallery, or used to regenerate gallery baselines. See the sole authority:
   docs/reference/design-system.md §21.
*/

import { test, expect, type Page, type TestInfo } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";
const ACTIVE_TRIP_TIME = new Date("2026-07-10T11:20:00+09:00");

async function prepare(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.clock.setFixedTime(ACTIVE_TRIP_TIME);

  const response = await page.goto(KOREA, { waitUntil: "networkidle" });
  expect(response, "Korea guide returned no response").not.toBeNull();
  expect(response!.status(), "Korea guide did not render a real product page").toBeLessThan(400);

  /* The production theme control remains the source of truth. Do not inject ad-hoc CSS/classes
     into the screenshot: the whole point is to review what the built app actually renders. */
  const html = page.locator("html");
  if ((await html.getAttribute("data-theme")) !== "dark") {
    const dark = page.locator("#btnDark");
    await expect(dark).toBeVisible();
    await dark.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350);
}

async function chooseDestination(page: Page, destination: "trip" | "itinerary") {
  /* Desktop and phone controls share the same data contract. Prefer whichever instance is visible
     rather than encoding a second navigation model into the test. */
  const controls = page.locator(`[data-dest-nav][data-dest="${destination}"]`);
  const count = await controls.count();
  let clicked = false;
  for (let i = 0; i < count; i += 1) {
    const control = controls.nth(i);
    if (await control.isVisible()) {
      await control.click();
      clicked = true;
      break;
    }
  }
  expect(clicked, `No visible ${destination} navigation control`).toBe(true);
  await expect(page.locator(`#dest-${destination}`)).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function waitForTripMedia(page: Page) {
  const media = page.locator("#dest-trip .trip-hero-media").first();
  await expect(media).toBeVisible();
  const image = page.locator("#dest-trip .trip-hero-img").first();
  if (await image.count()) {
    await image.evaluate(async (img: HTMLImageElement) => {
      if (!img.complete) await new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
      if (typeof img.decode === "function") await img.decode().catch(() => undefined);
    });
    await expect.poll(async () => {
      const naturalWidth = await image.evaluate((img: HTMLImageElement) => img.naturalWidth);
      const intentionalFallback = await media.evaluate((el) => el.classList.contains("media-fail") || el.classList.contains("trip-hero-media--painted"));
      return naturalWidth > 0 || intentionalFallback;
    }, { message: "Trip hero reached neither decoded media nor its intentional painted fallback" }).toBe(true);
  } else {
    await expect(media).toHaveClass(/trip-hero-media--painted/);
  }
}

async function waitForItineraryMap(page: Page) {
  const map = page.locator("#dest-itinerary [data-workbench] [data-itin-map]");
  await expect(map).toBeVisible();
  const googleConfigured = await page.locator("#tgConfig").evaluate((el) => {
    try { return Boolean(JSON.parse(el.textContent || "{}").gmapsKey); } catch { return false; }
  });
  await expect.poll(async () => {
    const provider = await map.getAttribute("data-map-provider");
    if (provider === "google") return provider;
    if (provider === "osm" && (!googleConfigured || await map.getAttribute("data-map-google-failed") !== null)) return provider;
    return (await map.locator("[data-map-degraded]").isVisible()) ? "degraded" : "pending";
  }, { message: "Itinerary map never reached Google, terminal OSM, or intentional degraded readiness", timeout: 15_000 }).toMatch(/^(google|osm|degraded)$/);
}

async function capture(page: Page, testInfo: TestInfo, filename: string) {
  await page.screenshot({
    path: testInfo.outputPath(filename),
    fullPage: false,
    animations: "disabled",
  });
}

test("V1 — South Korea active Trip mobile, dark", async ({ page }, testInfo) => {
  await prepare(page, { width: 390, height: 844 });
  await chooseDestination(page, "trip");

  await expect(page.locator("#dest-trip")).toBeVisible();
  await expect(page.locator('[data-dest-nav][data-dest="trip"][aria-current="true"]').first()).toBeAttached();
  await waitForTripMedia(page);

  await capture(page, testInfo, "v1-trip-active-mobile-dark.png");
});

test("V1 — South Korea Itinerary desktop workbench, dark", async ({ page }, testInfo) => {
  await prepare(page, { width: 1440, height: 1000 });
  await chooseDestination(page, "itinerary");

  await expect(page.locator("#dest-itinerary")).toBeVisible();
  await expect(page.locator("[data-workbench]")).toBeVisible();
  await waitForItineraryMap(page);
  const selectedDay = await page.locator("[data-planner-days] .day[data-day]:not([hidden])").getAttribute("data-day");
  expect(selectedDay, "No selected itinerary day").not.toBeNull();
  const selectedFallback = page.locator(`[data-map-fallback-day="${selectedDay}"]`);
  await expect(selectedFallback).toBeAttached();
  if ((await page.locator("#dest-itinerary [data-workbench] [data-itin-map]").getAttribute("data-map-provider")) === "osm") {
    await expect(selectedFallback).toBeVisible();
  }

  await capture(page, testInfo, "v1-itinerary-desktop-dark.png");

  /* Exercise the shared selection contract after capture so the review artifact remains the
     default workbench state while the canary still proves the timeline can focus the map. */
  const stopFocus = page.locator("#dest-itinerary .day[data-day]:not([hidden]) [data-map-pin-id]").first();
  await expect(stopFocus).toBeVisible();
  const workbenchMap = page.locator("#dest-itinerary [data-workbench] [data-itin-map]");
  const provider = await workbenchMap.getAttribute("data-map-provider");
  const osmFrame = page.locator("#dest-itinerary [data-workbench] .osmmap");
  const osmBefore = provider === "osm" ? await osmFrame.getAttribute("src") : null;
  await stopFocus.click();
  await expect(stopFocus).toHaveAttribute("aria-current", "location");
  if (provider === "osm") {
    await expect.poll(() => osmFrame.getAttribute("src")).not.toBe(osmBefore);
  }
});
