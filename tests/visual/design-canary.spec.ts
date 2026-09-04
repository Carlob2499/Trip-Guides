/* Waypoint D6 -> production visual canary.

   This is deliberately NOT a screenshot-baseline test. It produces review artifacts for creator
   fidelity review (docs/reference/design-system.md §21):

     V1 — the two checkpoint surfaces:
       1. South Korea active Trip — phone, dark
       2. South Korea Itinerary workbench — desktop, dark
     V2 — every other converged surface, phone + desktop, dark + light: Atlas, Trip lifecycle
       siblings, Itinerary mobile, Map, Guide (cover + a chapter), Split, Search, SOS, provenance.

   The images are evidence for human/creator review. They must never be auto-approved, diffed
   against the current D7 gallery, or used to regenerate gallery baselines.
*/

import { test, expect, type Page, type TestInfo } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";
const ACTIVE_TRIP_TIME = new Date("2026-07-10T11:20:00+09:00");

type Theme = "dark" | "light";

async function prepare(page: Page, viewport: { width: number; height: number }, opts: { theme?: Theme; time?: Date; path?: string } = {}) {
  const theme = opts.theme ?? "dark";
  await page.setViewportSize(viewport);
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  await page.clock.setFixedTime(opts.time ?? ACTIVE_TRIP_TIME);

  const path = opts.path ?? KOREA;
  const response = await page.goto(path, { waitUntil: "networkidle" });
  expect(response, `${path} returned no response`).not.toBeNull();
  expect(response!.status(), `${path} did not render a real product page`).toBeLessThan(400);

  /* The production theme control remains the source of truth. Do not inject ad-hoc CSS/classes
     into the screenshot: the whole point is to review what the built app actually renders. */
  /* A page that follows a light OS preference carries NO data-theme attribute (the pre-paint
     snippet only stamps a stored choice or a dark preference), so the effective theme is
     "dark" only when the attribute says so — anything else is light. */
  const effective = async () => ((await page.locator("html").getAttribute("data-theme")) === "dark" ? "dark" : "light");
  if ((await effective()) !== theme) {
    const toggle = page.locator("#btnDark");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect.poll(effective, { message: `theme control did not switch to ${theme}` }).toBe(theme);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350);
}

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 1000 };
const PRE_TRIP_TIME = new Date("2026-06-20T11:20:00+09:00");
const POST_TRIP_TIME = new Date("2026-07-30T11:20:00+09:00");

async function chooseDestination(page: Page, destination: "trip" | "itinerary" | "map" | "guide" | "split") {
  /* Desktop and phone controls share the same data contract. Prefer whichever instance is visible
     rather than encoding a second navigation model into the test. */
  // Split is contextual (design-system.md §27): no nav slot, so its opener is the card on Trip.
  if (destination === "split") await chooseDestination(page, "trip");
  const controls = destination === "split"
    ? page.locator(`[data-dest-go="split"]`)
    : page.locator(`[data-dest-nav][data-dest="${destination}"]`);
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

/* ── V2: every converged surface, for the same creator review (never a baseline). ─────────── */
const V2 = [
  { label: "phone", viewport: PHONE },
  { label: "desktop", viewport: DESKTOP },
] as const;
const THEMES: Theme[] = ["dark", "light"];

for (const { label, viewport } of V2) for (const theme of THEMES) {
  test(`V2 — Atlas ${label} ${theme}`, async ({ page }, testInfo) => {
    await prepare(page, viewport, { theme, path: "/Trip-Guides/" });
    await expect(page.locator("[data-atlas-globe]")).toBeVisible();
    await page.waitForTimeout(600);
    await capture(page, testInfo, `v2-atlas-${label}-${theme}.png`);
  });

  test(`V2 — Trip before and after ${label} ${theme}`, async ({ page }, testInfo) => {
    await prepare(page, viewport, { theme, time: PRE_TRIP_TIME });
    await chooseDestination(page, "trip");
    await expect(page.locator("[data-trip][data-phase=\"pre\"]")).toBeVisible();
    await capture(page, testInfo, `v2-trip-pre-${label}-${theme}.png`);
    await prepare(page, viewport, { theme, time: POST_TRIP_TIME });
    await chooseDestination(page, "trip");
    await expect(page.locator("[data-trip][data-phase=\"post\"]")).toBeVisible();
    await capture(page, testInfo, `v2-trip-post-${label}-${theme}.png`);
  });

  test(`V2 — Itinerary, Map, Guide, Split ${label} ${theme}`, async ({ page }, testInfo) => {
    await prepare(page, viewport, { theme });
    await chooseDestination(page, "itinerary");
    await expect(page.locator("[data-workbench]")).toBeVisible();
    await capture(page, testInfo, `v2-itinerary-${label}-${theme}.png`);
    await chooseDestination(page, "map");
    await expect(page.locator("[data-mapdest] [data-itin-map]")).toBeVisible();
    await page.waitForTimeout(500);
    await capture(page, testInfo, `v2-map-${label}-${theme}.png`);
    await chooseDestination(page, "guide");
    await expect(page.locator("[data-guide-dest] .mast-hero")).toBeVisible();
    await capture(page, testInfo, `v2-guide-cover-${label}-${theme}.png`);
    const chapter = page.locator(".gd-card[data-chapter-go]").first();
    await chapter.evaluate((el) => (el as HTMLElement).click());
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await capture(page, testInfo, `v2-guide-chapter-${label}-${theme}.png`);
    await chooseDestination(page, "split");
    await expect(page.locator("#tripSplit")).toBeVisible();
    await capture(page, testInfo, `v2-split-${label}-${theme}.png`);
  });

  test(`V2 — Search and SOS ${label} ${theme}`, async ({ page }, testInfo) => {
    await prepare(page, viewport, { theme });
    await chooseDestination(page, "trip");
    await page.keyboard.press("/");
    const input = page.locator(".srch-input");
    await expect(input).toBeVisible();
    await input.fill("Gyeongbok");
    await expect(page.locator("[data-srch-i]").first()).toBeVisible();
    await capture(page, testInfo, `v2-search-${label}-${theme}.png`);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    const sos = page.locator(".topbar-sos").first();
    await expect(sos).toBeVisible();
    await sos.click();
    await expect(page.locator(".sos-sheet")).toBeVisible();
    await capture(page, testInfo, `v2-sos-${label}-${theme}.png`);
  });
}
