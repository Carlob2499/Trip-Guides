/* The desktop journey line (R3) — the track behind the guide tabs and its stations.

   Both defects this covers were GEOMETRY, invisible to every other gate: the rail and the
   stations were positioned by two unrelated hand-tuned offsets that disagreed by 6.5px, so
   the line ran through the top edge of each circle rather than its middle, and a third
   element (the accent progress bar) sat at a fourth offset with a different thickness. A
   test that only asked "is the line present?" would have passed throughout. So this measures
   centres, and it measures them at the width the line actually exists at. */
// @protects-file The progress figure at the top of a section tells the truth about where you are in it.

import { test, expect, type Page } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";
const DESKTOP = { width: 1280, height: 800 };

async function open(page: Page) {
  await page.setViewportSize(DESKTOP);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(KOREA, { waitUntil: "networkidle" });
}

/** Centre of an element's box, measured from the BOTTOM of the tabs nav — the axis both the
    rail and the stations are positioned on. */
async function centres(page: Page) {
  return page.evaluate(() => {
    const nav = document.querySelector(".guide-tabs-nav")!;
    const rail = getComputedStyle(nav, "::before");
    const dot = getComputedStyle(document.querySelector(".gtab:not(.gtab-tool)")!, "::after");
    const mid = (s: CSSStyleDeclaration) => parseFloat(s.bottom) + parseFloat(s.height) / 2;
    return { rail: mid(rail), dot: mid(dot), overlay: getComputedStyle(nav, "::after").content };
  });
}

test("the track runs through the exact centre of the stations", async ({ page }) => {
  await open(page);
  const { rail, dot } = await centres(page);
  expect(Math.abs(rail - dot), `rail centre ${rail}px vs station centre ${dot}px`).toBeLessThan(0.51);
});

test("no second bar slides along the track over the circles", async ({ page }) => {
  await open(page);
  // The old ::after progress overlay is gone: the stations themselves carry the progress.
  expect((await centres(page)).overlay).toBe("none");
});

function fillOf(page: Page, nth: number) {
  return page.evaluate((i) => {
    const t = document.querySelectorAll(".gtab:not(.gtab-tool)")[i];
    const m = getComputedStyle(t, "::after").backgroundImage.match(/([\d.]+)%/);
    return m ? parseFloat(m[1]) : -1;
  }, nth);
}

test("the station you are in fills as you scroll it", async ({ page }) => {
  await open(page);
  expect(await fillOf(page, 0)).toBe(0);

  // The page scrolls smoothly, so wait for the position to SETTLE rather than sampling a
  // value still in flight — the fill tracks scrollY, and scrollY is still moving.
  const target = await page.evaluate(() => {
    const y = (document.body.scrollHeight - window.innerHeight) * 0.6;
    window.scrollTo(0, y);
    return y;
  });
  await page.waitForFunction((y) => Math.abs(window.scrollY - y) < 2, target);
  const partway = await fillOf(page, 0);
  expect(partway).toBeGreaterThan(40);
  expect(partway).toBeLessThan(100);
});

test("a section you have moved on from stays solid, and one you have not is empty", async ({ page }) => {
  await open(page);
  const tabs = page.locator(".gtab:not(.gtab-tool)");
  await tabs.nth(2).click();

  await expect(tabs.nth(0)).toHaveAttribute("data-visited", "");
  expect(await fillOf(page, 0)).toBe(100);          // walked
  await expect(tabs.nth(1)).not.toHaveAttribute("data-visited", "");
  expect(await fillOf(page, 1)).toBe(0);            // skipped past, not read
  expect(await fillOf(page, 3)).toBe(0);            // still ahead
});

test("the route walked survives a reload within the same visit", async ({ page }) => {
  await open(page);
  await page.locator(".gtab:not(.gtab-tool)").nth(1).click();
  await page.reload({ waitUntil: "networkidle" });
  // sessionStorage, not localStorage — next week's visit is a new journey.
  await expect(page.locator(".gtab:not(.gtab-tool)").nth(0)).toHaveAttribute("data-visited", "");
});
