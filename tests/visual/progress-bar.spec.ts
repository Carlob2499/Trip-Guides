/* The /progress/ bar — the surface a traveller watches while their guide is being built.

   Untested before Stage F feature 12, and worth one test now for a specific reason: the fill
   used to animate `width` on every poll tick, i.e. a layout pass per update, and it is a
   scaleX off --pg-progress instead. Nothing about that is visible in a screenshot, so this
   pins the mechanism — the bar is a transform that grows from the left edge, and the track
   still clips it. */
import { test, expect } from "@playwright/test";

test("the progress bar fills by transform, anchored to the left edge", async ({ page }) => {
  await page.goto("/Trip-Guides/progress/?slug=demo", { waitUntil: "domcontentloaded" });

  const fill = page.locator("#pgBarFill");
  await expect(fill).toBeAttached();

  const shape = await fill.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { width: cs.width, origin: cs.transformOrigin, transform: cs.transform };
  });
  // Full width in the box model; the scale is what varies, so a poll tick costs a composite.
  const track = await page.locator(".pg-bar-track").evaluate((el) => getComputedStyle(el).width);
  expect(shape.width).toBe(track);
  expect(shape.origin.split(" ")[0]).toBe("0px");

  // Drive it directly: the property is the whole contract between script and stylesheet.
  await fill.evaluate((el) => el.style.setProperty("--pg-progress", "0.5"));
  // The fill carries a .5s transition, and a rect read mid-transition is the interpolated
  // value, not the target — the same trap the change-request hover test documents.
  await page.waitForTimeout(700);
  const half = await fill.evaluate((el) => el.getBoundingClientRect().width);
  const full = parseFloat(track);
  expect(half).toBeGreaterThan(full * 0.4);
  expect(half).toBeLessThan(full * 0.6);
});
