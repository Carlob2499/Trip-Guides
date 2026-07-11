/* Behavioral coverage for the itinerary interaction cluster + the tab/scroll
   chrome it interleaves with in the page bundle. This suite exists to make the
   itinerary-silo migration PROVABLE: it must pass on the pre-move build AND the
   post-move build unchanged. It exercises the exact listener collisions the
   SILO_ROADMAP flagged as order-sensitive:
     · guide-ui + scroll-memory  — tab switch (click + deep-link)
     · spine                     — a reading-rail tick drives the real tab (≥1100px)
     · day-rail                  — a day chip activates + is the day nav
     · print-day                 — per-day + full-pack print buttons exist
     · swipe-nav                 — a touch swipe on #content pages the tab (mobile)
   Deterministic clock + no network (mirrors the visual/a11y suites). */
import { test, expect, type Page } from "@playwright/test";

const FIXED_TIME = new Date("2026-09-01T10:00:00+09:00"); // stable post-trip date
const KOREA = "/Trip-Guides/guides/korea/";

async function open(page: Page, hash = "") {
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://localhost:4322") ? route.continue() : route.abort(),
  );
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(KOREA + hash, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
}
const activeTab = (page: Page) =>
  page.evaluate(() => document.querySelector(".gtab-active")?.getAttribute("data-tab") ?? null);

// ── Desktop (spine live at ≥1100px) ──────────────────────────────────────────
test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("deep-link #grp-3 lands on Itinerary (guide-ui hash routing beats jump-to-today)", async ({ page }) => {
    await open(page, "#grp-3");
    expect(await activeTab(page)).toBe("3");
    await expect(page.locator("#grp-3")).toBeVisible();
    await expect(page.locator("#dayScrub")).toBeVisible();
  });

  test("clicking a numbered tab switches the visible panel (guide-ui + scroll-memory)", async ({ page }) => {
    await open(page);
    await page.locator('.gtab[data-tab="3"]').click();
    expect(await activeTab(page)).toBe("3");
    await expect(page.locator("#grp-3")).toBeVisible();
    await page.locator('.gtab[data-tab="1"]').click();
    expect(await activeTab(page)).toBe("1");
    await expect(page.locator("#grp-3")).toBeHidden();
  });

  test("day-rail: a day chip becomes active; one chip per day", async ({ page }) => {
    await open(page, "#grp-3");
    const chips = page.locator("#dayScrub [data-day-jump]");
    const days = page.locator(".planner-days .day[data-day]");
    expect(await chips.count()).toBe(await days.count());
    await chips.nth(3).click();
    await expect(chips.nth(3)).toHaveClass(/dchip-active/);
    await expect(chips.nth(3)).toHaveAttribute("aria-current", "true");
  });

  test("spine: a reading-rail tick drives the real guide tab", async ({ page }) => {
    await open(page, "#grp-3");
    const ticks = page.locator(".spine .spine-tick");
    expect(await ticks.count()).toBeGreaterThanOrEqual(3);
    await ticks.nth(5).click();
    expect(await activeTab(page)).toBe("5");
    await expect(ticks.nth(5)).toHaveClass(/spine-active/);
  });

  test("print-day: every day card has a print button + full-pack button exists", async ({ page }) => {
    await open(page, "#grp-3");
    const dayBtns = page.locator(".day-print-btn");
    const days = page.locator(".planner-days .day[data-day]");
    expect(await dayBtns.count()).toBe(await days.count());
    expect(await page.locator(".share-summary-btn").count()).toBeGreaterThanOrEqual(1);
  });
});

// ── Mobile (swipe-nav arms on coarse-pointer / ≤899px) ────────────────────────
test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("swipe-nav: a leftward touch swipe on #content advances one tab", async ({ page }) => {
    await open(page, "#grp-1"); // Essentials — no horizontal day deck to own the gesture
    expect(await activeTab(page)).toBe("1");
    await page.evaluate(() => {
      const el = document.getElementById("content")!;
      const mk = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 200 });
      const ev = (type: string, touches: Touch[], changed: Touch[]) =>
        el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches, changedTouches: changed }));
      const start = mk(320), mid = mk(150), end = mk(120); // dx = -200: clearly leftward
      ev("touchstart", [start], [start]);
      ev("touchmove", [mid], [mid]);
      ev("touchend", [], [end]);
    });
    await page.waitForTimeout(400);
    expect(await activeTab(page)).toBe("2"); // advanced exactly one section
  });
});
