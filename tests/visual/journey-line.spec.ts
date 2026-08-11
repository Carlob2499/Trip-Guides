/* The spine rail's line and its stations (R5; was R3's desktop journey line).

   RETARGETED to the R5 rail, not rewritten: every property below survived the move, so deleting
   this file with the R4 CSS would have retired the only gate holding them.

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
    const track = document.querySelector(".grail-track")!;
    // Real boxes, not parsed offsets: ::before and a real element compute in different spaces.
    const line = getComputedStyle(track, "::before");
    const trackTop = track.getBoundingClientRect().top;
    const lineMid = trackTop + parseFloat(line.top) + parseFloat(line.height) / 2;
    const d = document.querySelector(".grail-stop .grail-dot")!.getBoundingClientRect();
    return { rail: lineMid, dot: d.top + d.height / 2, overlay: getComputedStyle(track, "::after").content };
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
    const stop = document.querySelectorAll(".grail-stop")[i] as HTMLElement;
    const dot = stop.querySelector(".grail-dot")!;
    // Value from --st-fill (Chrome resolves the gradient's calc() stops to px), consumption
    // asserted separately — a variable updating forever behind an unpainted dot is a silent pass.
    const painted = getComputedStyle(dot).backgroundImage;
    if (!painted.includes("gradient") && !stop.hasAttribute("data-visited")) return -1;
    if (stop.hasAttribute("data-visited")) return 100;
    const raw = getComputedStyle(stop).getPropertyValue("--st-fill").trim();
    return raw === "" ? 0 : parseFloat(raw);
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
  const tabs = page.locator(".grail-stop");
  await tabs.nth(2).click();

  await expect(tabs.nth(0)).toHaveAttribute("data-visited", "");
  expect(await fillOf(page, 0)).toBe(100);          // walked
  await expect(tabs.nth(1)).not.toHaveAttribute("data-visited", "");
  expect(await fillOf(page, 1)).toBe(0);            // skipped past, not read
  expect(await fillOf(page, 3)).toBe(0);            // still ahead
});

test("the route walked survives a reload within the same visit", async ({ page }) => {
  await open(page);
  await page.locator(".grail-stop").nth(1).click();
  await page.reload({ waitUntil: "networkidle" });
  // sessionStorage, not localStorage — next week's visit is a new journey.
  await expect(page.locator(".grail-stop").nth(0)).toHaveAttribute("data-visited", "");
});
