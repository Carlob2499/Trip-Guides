/* Display-cutout gate (design-handoff README, "Display cutouts") — Stage D.

   This exists because the bug it catches is invisible by construction: every --safe-*
   token, and every rule that pads with one, resolves to 0 on a device without a cutout
   AND on a page missing `viewport-fit=cover`. The two states look identical in a desktop
   browser, so the whole notch/home-indicator layer shipped inert and nothing failed.

   Two assertions, split: STATIC — every page carries viewport-fit=cover, without which the
   insets never report. BEHAVIOURAL — with non-zero insets injected at :root (standing in for a
   cutout no headless browser reports), the chrome that must move actually moves; a page could
   carry the meta tag and still hard-code its padding. */
// @protects-file Nothing hides under a phone's notch or home bar.

import { test, expect } from "@playwright/test";

const PAGES = [
  ["hub", "/Trip-Guides/"],
  ["guide", "/Trip-Guides/guides/korea/"],
  ["about", "/Trip-Guides/about/"],
  ["new intake", "/Trip-Guides/new/"],
] as const;

for (const [name, path] of PAGES) {
  test(`${name}: declares viewport-fit=cover, or every safe-area inset is dead`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const content = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(content, `${name} has no viewport meta`).toBeTruthy();
    expect(content).toContain("viewport-fit=cover");
  });
}

test("guide chrome pads for a cutout instead of hard-coding its offsets", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 }); // the spec's iPhone 17 Pro bench
  await page.goto("/Trip-Guides/guides/korea/", { waitUntil: "networkidle" });

  const read = () =>
    page.evaluate(() => {
      const cs = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el) : null;
      };
      const px = (v: string | undefined) => (v ? parseFloat(v) : NaN);
      return {
        botbarBottom: px(cs(".botbar")?.paddingBottom),
        topbarTop: px(cs(".topbar")?.paddingTop),
        sheetBottom: px(cs(".sheet")?.paddingBottom),
        colophonBottom: px(cs(".colophon")?.paddingBottom),
      };
    });

  const flat = await read();
  // Standing in for a notched device: the tokens are the single source every rule reads,
  // so overriding them here exercises the same path a real cutout would.
  await page.addStyleTag({
    content: ":root{--safe-top:59px;--safe-bottom:34px;--safe-left:0px;--safe-right:0px}",
  });
  // .topbar carries `transition: padding .28s` (mobile-nav.css) for the yield animation, so
  // its padding EASES to the new inset rather than jumping. Reading straight away samples a
  // mid-transition value and reads as "the rule ignored the cutout" when it did not.
  await page.waitForTimeout(450);
  const inset = await read();

  expect(inset.botbarBottom, "bottom bar ignores the home indicator").toBeGreaterThanOrEqual(34);
  expect(inset.sheetBottom, "Groups sheet ignores the home indicator").toBeGreaterThanOrEqual(34);
  expect(inset.colophonBottom, "footer loses its clearance over the fixed bar")
    .toBeGreaterThan(flat.colophonBottom);
  expect(inset.topbarTop, "top bar ignores the notch").toBeGreaterThan(flat.topbarTop + 50);
});
