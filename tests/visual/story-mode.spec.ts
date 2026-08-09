/* Story mode — the full-screen day deck (src/features/itinerary/ui/story-mode.js).

   It had no test of any kind before Stage F feature 3, and it is exactly the shape that hides
   things: built entirely by script, `hidden` until a button is pressed, and painted on its own
   fixed dark ground in BOTH themes. axe skips hidden nodes, so the whole-page gate has never
   seen a single pixel of it — the same blind spot that hid the SOS sheet's 2.16:1 emergency
   number and, before that, the share panel.

   The contrast check here is pixel-sampled rather than token-asserted on purpose. The ground is
   a radial gradient that mixes 26% of the guide's accent into --dark-ground near the top, so the
   real background behind the title is NOT --dark-ground and asserting against that token would be
   measuring the wrong thing. The overlay is screenshotted with its own ink hidden, the lightest
   pixel is taken as the worst case, and every --sm-* ink is rated against that. */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

const KOREA = "/Trip-Guides/guides/korea/";

async function openStory(page: Page) {
  await page.goto(KOREA, { waitUntil: "networkidle" });
  // The launcher lives inside DaysBlock, which sits in a tab panel that is `hidden` unless its
  // tab is the active one. Same override the whole-page a11y gate uses to reach non-default tabs.
  await page.addStyleTag({ content: `[role=tabpanel]{display:block !important}` });
  await page.locator("[data-story-open]").first().click();
  const overlay = page.locator(".sm-overlay");
  await expect(overlay).toBeVisible();
  return overlay;
}

const lum = (r: number, g: number, b: number) =>
  [r, g, b]
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);

test("opening story mode locks the page and lands on day 1", async ({ page }) => {
  const overlay = await openStory(page);
  await expect(page.locator("body")).toHaveClass(/sm-lock/);
  await expect(overlay.locator(".sm-seg.now")).toHaveCount(1);
  await expect(overlay.locator(".sm-rail .sm-seg").first()).toHaveClass(/now/);
});

test("Escape closes it and gives the page back", async ({ page }) => {
  await openStory(page);
  await page.keyboard.press("Escape");
  await expect(page.locator(".sm-overlay")).toBeHidden();
  await expect(page.locator("body")).not.toHaveClass(/sm-lock/);
});

for (const scheme of ["light", "dark"] as const) {
  test(`the open deck passes axe in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    const overlay = await openStory(page);
    await expect(overlay).toBeVisible();

    const results = await new AxeBuilder({ page }).include(".sm-overlay").analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

/* The takeover does not re-map with the theme, by design (base.css's --sm-* contract), so one
   sampling run covers both. Run in light mode precisely because that is the case a themed
   token WOULD have inverted for. */
test("every --sm-* ink clears 4.5:1 against the worst pixel of the real painted ground", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  const overlay = await openStory(page);

  // Hide the overlay's own ink so the shot is nothing but the ground it paints on.
  await page.addStyleTag({
    content: `.sm-overlay *{color:transparent !important;border-color:transparent !important}
              .sm-rail,.sm-close,.sm-nav{visibility:hidden !important}`,
  });
  const shot = await overlay.screenshot();
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });

  let worst = { l: -1, hex: "" };
  for (let i = 0; i < data.length; i += info.channels) {
    const l = lum(data[i], data[i + 1], data[i + 2]);
    if (l > worst.l) {
      worst = { l, hex: [data[i], data[i + 1], data[i + 2]].map((c) => c.toString(16).padStart(2, "0")).join("") };
    }
  }
  expect(worst.l, "sampled no pixels — the screenshot is empty").toBeGreaterThan(0);

  const inks = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector(".sm-overlay")!);
    return ["--dark-ink", "--dark-ink-2", "--dark-ink-3", "--dark-ink-4"].map((n) => [n, cs.getPropertyValue(n).trim()]);
  });

  for (const [name, hex] of inks) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const il = lum(r, g, b);
    const ratio = (Math.max(il, worst.l) + 0.05) / (Math.min(il, worst.l) + 0.05);
    expect(ratio, `${name} (${hex}) on worst ground pixel #${worst.hex}`).toBeGreaterThanOrEqual(4.5);
  }
});
