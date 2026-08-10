/* Behavioral coverage for the itinerary interaction cluster + the tab/scroll
   chrome it interleaves with in the page bundle. This suite exists to make the
   itinerary-silo migration PROVABLE: it must pass on the pre-move build AND the
   post-move build unchanged. It exercises the exact listener collisions the
   silo migration (docs/reference/architecture.md) flagged as order-sensitive:
     · guide-ui + scroll-memory  — tab switch (click + deep-link)
     · spine                     — a reading-rail tick drives the real tab (≥1100px)
     · day-rail                  — a day chip activates + is the day nav
     · print-day                 — per-day + full-pack print buttons exist
     · swipe-tabs                — a touch swipe on #content pages the tab (mobile).
       That gesture moved to src/features/mobile-nav on 2026-07-30 and was rewritten
       to track the finger; the test stays HERE because what it guards is the listener
       collision on #content between the swipe and this cluster, which is unchanged by
       the move — and it must keep passing across it.
   Deterministic clock + no network (mirrors the visual/a11y suites). */
// @protects-file Moving between the days and sections of a guide always lands where you meant to go.

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

  test("tablist ARIA: ArrowRight roves focus + activates the next tab, panels are labelled tabpanels", async ({ page }) => {
    await open(page);
    await page.locator('.gtab[data-tab="0"]').focus();
    await page.keyboard.press("ArrowRight");
    // Automatic activation: focus follows AND the panel switches (roving tabindex + APG keys).
    expect(await activeTab(page)).toBe("1");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-tab"))).toBe("1");
    // Only the active tab is in the tab order (roving tabindex).
    expect(await page.locator('.gtab[data-tab="0"]').getAttribute("tabindex")).toBe("-1");
    expect(await page.locator('.gtab[data-tab="1"]').getAttribute("tabindex")).toBe("0");
    // The tab points at its panel, and the panel is a labelled tabpanel.
    expect(await page.locator('.gtab[data-tab="1"]').getAttribute("aria-controls")).toBe("grp-1");
    await expect(page.locator("#grp-1")).toHaveAttribute("role", "tabpanel");
    await expect(page.locator("#grp-1")).toHaveAttribute("aria-labelledby", "gtab-1");
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

  /* The fill was animating `height` from a scroll handler until Stage F feature 7 — a per-frame
     layout path, which this system does not do. It is a scaleY driven by --spine-fill now, so
     this pins the thing that actually breaks if the property name or the origin drifts: the
     read tick paints its full bar, the unread one paints nothing, and it is a TRANSFORM doing
     it rather than a height. */
  test("spine: read ticks fill by transform, not by animating height", async ({ page }) => {
    await open(page, "#grp-3");
    await page.locator(".spine .spine-tick").nth(5).click();
    await page.waitForTimeout(400);

    const read = await page.locator(".spine-tick.spine-seen .spine-fill").first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { h: cs.height, t: cs.transform, origin: cs.transformOrigin, box: el.getBoundingClientRect().height };
    });
    /* Assert the SCALE, not side effects of it. `height` is 100% from CSS unconditionally and
       `transform` is a matrix even at scaleY(0), so neither of those could fail on a revert —
       only the scale factor names what the change actually did. */
    const scaleY = Number(read.t.match(/matrix\(([^)]+)\)/)?.[1].split(",")[3] ?? NaN);
    expect(scaleY).toBeCloseTo(1, 2);
    expect(read.h).not.toBe("0px");
    // `transform-origin: top` computes to "<half the width> 0px" — the Y is what matters:
    // scaling from the middle would grow the bar in both directions.
    expect(read.origin.split(" ")[1]).toBe("0px");
    expect(read.box).toBeGreaterThan(0);

    const unread = await page.locator(".spine-tick:not(.spine-seen):not(.spine-active) .spine-fill").first()
      .evaluate((el) => ({ h: getComputedStyle(el).height, box: el.getBoundingClientRect().height }));
    expect(unread.h).toBe(read.h); // same height — only the scale differs
    expect(unread.box).toBeLessThan(1); // scaled to nothing
  });

  test("print-day: every day card has a print button + full-pack button exists", async ({ page }) => {
    await open(page, "#grp-3");
    const dayBtns = page.locator(".day-print-btn");
    const days = page.locator(".planner-days .day[data-day]");
    expect(await dayBtns.count()).toBe(await days.count());
    expect(await page.locator(".share-summary-btn").count()).toBeGreaterThanOrEqual(1);
  });
});

// ── Mobile (swipe-tabs arms on coarse-pointer / ≤899px) ──────────────────────
test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("swipe-tabs: a leftward touch swipe on #content advances one tab", async ({ page }) => {
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

/* MOTION.md rule 7, third and fourth instances.
 *
 * The reading spine and /progress/ were caught in Stage F; these two were missed because
 * nothing was measuring guide.css or mobile-nav.css. `.read-prog` wrote `style.width` from the
 * scroll listener — so every scroll frame, on every guide, on a phone, ran layout for a 3px
 * strip. `.botbar-ind` wrote a real width with a .3s `width` transition behind it, so every
 * frame of every tab change laid out the bottom bar.
 *
 * Asserted by parsing the MATRIX rather than reading `transform`, because a transform is a
 * matrix even at scaleX(0) and `toHaveCSS("transform", /scale/)` would pass on the broken
 * version too. The spine test above learned that the hard way.
 */
test("the reading progress bar fills by transform, never by width", async ({ page }) => {
  // Mobile only, and that is not incidental: `.read-prog{display:none}` above 900px, where the
  // journey line carries the percentage instead. A desktop run reads `transform: none` on a
  // display:none element — an identity matrix, scaleX 1 — and would pass or fail for reasons
  // that have nothing to do with this code.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(KOREA, { waitUntil: "networkidle" });
  const bar = page.locator("#readProg");

  const read = () =>
    bar.evaluate((el) => {
      const cs = getComputedStyle(el);
      const m = new DOMMatrixReadOnly(cs.transform);
      return { widthPx: cs.width, scaleX: m.a, origin: cs.transformOrigin, transition: cs.transitionProperty };
    });

  const atTop = await read();
  // Full width at rest — the fill is the scale, so the box itself must never be resized.
  expect(atTop.scaleX).toBeLessThan(0.05);
  expect(atTop.origin.split(" ")[0]).toBe("0px");
  expect(atTop.transition).not.toContain("width");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(async () => (await read()).scaleX, { timeout: 4000 }).toBeGreaterThan(0.5);
  // The element's own box never changed — only its matrix did.
  expect((await read()).widthPx).toBe(atTop.widthPx);
});

test("mobile: the bottom-bar indicator is scaled to its slot, not resized to it", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(KOREA, { waitUntil: "networkidle" });

  const ind = page.locator(".botbar-ind");
  await expect(ind).toHaveClass(/on/);
  const state = await ind.evaluate((el) => {
    const cs = getComputedStyle(el);
    const m = new DOMMatrixReadOnly(cs.transform);
    return { scaleX: m.a, tx: m.e, transition: cs.transitionProperty, w: el.getBoundingClientRect().width };
  });

  expect(state.transition, "a width transition lays out every frame of the tween").not.toContain("width");
  // Scaled down from full-bleed to one slot, and moved into place — both in the matrix.
  expect(state.scaleX).toBeGreaterThan(0);
  expect(state.scaleX).toBeLessThan(1);
  // It still lands on the active slot: the painted width matches that slot's width.
  const slot = await page.locator(".botslot-on").boundingBox();
  expect(state.w).toBeCloseTo(slot!.width, 0);
});
