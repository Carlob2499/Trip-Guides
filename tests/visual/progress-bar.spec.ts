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
    return { width: cs.width, origin: cs.transformOrigin };
  });
  // Full width in the box model; the scale is what varies, so a poll tick costs a composite.
  const track = await page.locator(".pg-bar-track").evaluate((el) => getComputedStyle(el).width);
  expect(shape.width).toBe(track);
  expect(shape.origin.split(" ")[0]).toBe("0px");

  /* Drive the contract on a PROBE, not on the live element. progress.js polls and writes
     --pg-progress on #pgBarFill itself, so setting it there is a race the script wins roughly
     whenever the machine is busy — it failed exactly once, under full-suite load, which is the
     worst way to learn that. A sibling with the same class proves the same thing (the property
     IS the whole contract between script and stylesheet) and nothing else touches it. */
  const half = await page.locator(".pg-bar-track").evaluate((track) => {
    const probe = document.createElement("div");
    probe.className = "pg-bar-fill";
    probe.style.transition = "none";
    probe.style.setProperty("--pg-progress", "0.5");
    track.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return w;
  });
  const full = parseFloat(track);
  expect(half).toBeGreaterThan(full * 0.4);
  expect(half).toBeLessThan(full * 0.6);
});
