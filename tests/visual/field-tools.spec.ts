/* Behavioral coverage for the field-tools UI WIRING — the DOM glue that consumes
   ../../src/features/field-tools/model/field-math.ts. The model's math/codec is unit-
   tested next to it; this suite pins the wiring the units can't reach: the rate-pill
   converter's render() branching, the masthead burn tile, and the ?stops= share-link
   decode+merge+URL-scrub. Deterministic clock + no network (mirrors itinerary.spec.ts). */
import { test, expect, type Page } from "@playwright/test";

const FIXED_TIME = new Date("2026-09-01T10:00:00+09:00"); // UTC date 2026-09-01
const UTC_DAY = "2026-09-01";
const KOREA = "/Trip-Guides/guides/korea/";
const RATE = 1479.45; // USD → KRW, as the pill applies it

// storeKey/curCode are baked into the built Korea page's #tgConfig.
const SPLIT_KEY = "tg-split-southkorea";
const STOPS_KEY = "tg-stops-southkorea";
const RATE_KEY = "tg-rate-KRW";

async function blockNet(page: Page) {
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://localhost:4322") ? route.continue() : route.abort(),
  );
  await page.clock.setFixedTime(FIXED_TIME);
}

test("currency converter converts a typed USD amount off the live rate (render ok-branch)", async ({ page }) => {
  await blockNet(page);
  // Seed a fresh rate cache so live-data serves it synchronously (no network) and
  // field-tools seeds the converter from getLastRate() — the warm-cache path.
  await page.addInitScript(
    ([key, rate, day]) => {
      localStorage.setItem(key as string, JSON.stringify({ rate, date: day, fetchedAt: day }));
    },
    [RATE_KEY, RATE, UTC_DAY] as const,
  );
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  const pill = page.locator("#liveRatePill");
  await expect(pill).toBeVisible(); // served from the seeded cache
  await pill.click();

  const input = page.locator(".cur-in");
  await expect(input).toBeVisible();
  await input.fill("100");

  const out = page.locator(".cur-out");
  await expect(out).toContainText("147,945"); // 100 × 1479.45
  await expect(out).toContainText("KRW");
  await expect(out).toContainText("$0.07"); // 100 ÷ 1479.45
});

test("masthead burn tile sums the logged split amounts", async ({ page }) => {
  await blockNet(page);
  await page.addInitScript(
    (key) => {
      localStorage.setItem(
        key as string,
        JSON.stringify({
          members: [{ id: "m1", name: "A" }],
          expenses: [{ id: "e1", amount: 45000 }, { id: "e2", amount: "12.5" }, { id: "e3", amount: "" }],
          customSplit: false,
        }),
      );
    },
    SPLIT_KEY,
  );
  await page.goto(KOREA, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  const burn = page.locator("#burnPill");
  await expect(burn).toBeVisible();
  await expect(burn).toContainText("logged");
  await expect(burn).toContainText(/\$45,01[23]/); // 45000 + 12.5 + ""(→0), rounded
});

test("a ?stops= link decodes, keeps only <day>-<idx> keys, merges, and scrubs the URL", async ({ page }) => {
  await blockNet(page);
  // Base64 of the JSON is what the share button emits (btoa(unescape(encodeURIComponent(...)))
  // === Buffer base64 for ASCII payloads). Include a junk key to prove the filter.
  const payload = Buffer.from(JSON.stringify({ "0-0": 1, "1-2": 1, evil: 1 }), "utf8").toString("base64");
  await page.goto(KOREA + "?stops=" + encodeURIComponent(payload), { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  const stored = await page.evaluate((k) => localStorage.getItem(k), STOPS_KEY);
  const obj = JSON.parse(stored || "{}");
  expect(obj["0-0"]).toBe(1);
  expect(obj["1-2"]).toBe(1);
  expect(obj.evil).toBeUndefined(); // junk key dropped by the model's filter
  expect(page.url()).not.toContain("stops="); // history.replaceState scrubbed it
});
