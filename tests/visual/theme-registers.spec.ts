/* THE LIGHT/DARK REGISTER GATE — the test that would have caught the 2026-09-05 defect on day one.

   What went wrong: `.spatial` re-mapped the surface tokens to a fixed dark register "in BOTH
   themes", and ten page frames carried it as `.stage.spatial`. Every framed surface therefore
   ignored the theme entirely. Eleven board-vs-build compare sheets were produced with a
   "1440 LIGHT" panel and a "1440 DARK" panel that were the same picture, reviewed, and merged.
   Nothing failed, because nothing was asserting that a light page looks light.

   So this asserts exactly that, and nothing more decorative: for every framed page, the stage's
   own painted background must be the LIGHT token in light mode and the DARK token in dark mode.
   It reads computed styles rather than diffing pixels on purpose — no baseline to regenerate,
   so it cannot be silenced by the same reflex that let the original defect through.

   The second half is the other side of the same rule. `.spatial` still exists and is still
   always-dark — it is the chrome strip, a map pane, the search overlay: objects that are dark on
   a cream page, exactly as the boards draw them. An inset that started following the theme would
   be this fix over-applied, so it is pinned too. */

import { test, expect, type Page } from "@playwright/test";

const LIGHT_BG = "rgb(245, 241, 234)"; // base.css :root --bg  #f5f1ea
const DARK_BG = "rgb(18, 17, 16)";     // base.css dark  --bg  #121110
const FRAME_DARK = "rgb(34, 31, 29)";  // base.css dark  --frame-bg  #221f1d

/* Every page that wraps its content in `.stage`. If a new framed surface is added without a row
   here, it is unprotected — which is precisely how ten of them shipped unthemed. */
const FRAMED = [
  ["Atlas", "/Trip-Guides/"],
  ["Guide (Korea)", "/Trip-Guides/guides/korea/"],
  ["Guide (Denmark)", "/Trip-Guides/guides/denmark/"],
  ["Create Guide", "/Trip-Guides/new/"],
  ["Progress", "/Trip-Guides/progress/"],
  ["Triage", "/Trip-Guides/progress/triage/"],
  ["About", "/Trip-Guides/about/"],
  ["Health", "/Trip-Guides/health/"],
  ["Change", "/Trip-Guides/change/"],
] as const;

async function open(page: Page, path: string, theme: "light" | "dark") {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  const res = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(res, `${path} returned no response`).not.toBeNull();
  expect(res!.status(), `${path} did not render a real page`).toBeLessThan(400);
  /* The pre-paint snippet stamps data-theme only for a stored choice or a dark preference, so a
     light page carries no attribute at all — "not dark" is the light signal, same as the canary. */
  const effective = async () => ((await page.locator("html").getAttribute("data-theme")) === "dark" ? "dark" : "light");
  expect(await effective(), `${path} did not honour the ${theme} colour-scheme preference`).toBe(theme);
}

const bgOf = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => getComputedStyle(el).backgroundColor);

test.describe("⌁ a framed page renders in the reader's theme, not a fixed one", () => {
  for (const [name, path] of FRAMED) {
    test(`${name} paints the cream ground in light and the navy ground in dark`, async ({ page }) => {
      await open(page, path, "light");
      const light = await bgOf(page, ".stage");
      await open(page, path, "dark");
      const dark = await bgOf(page, ".stage");

      expect(light, `${name}: light mode should paint the cream page ground`).toBe(LIGHT_BG);
      expect(dark, `${name}: dark mode should paint the navy page ground`).toBe(DARK_BG);
      /* The assertion that actually catches the original bug. The two above could both be edited
         to the same value by someone "fixing" a failure; this one cannot be satisfied that way. */
      expect(light, `${name}: light and dark render identically — the frame is ignoring the theme`).not.toBe(dark);
    });
  }
});

test.describe("⌁ an always-dark inset stays dark in both themes", () => {
  /* The chrome strip is the inset present on every page, so it is the one worth pinning here;
     the map panes and the search overlay share its single declaration in base.css. */
  test("the chrome strip keeps the dark register on a cream page", async ({ page }) => {
    await open(page, "/Trip-Guides/guides/korea/", "light");
    const onCream = await bgOf(page, ".chrome");
    await open(page, "/Trip-Guides/guides/korea/", "dark");
    const onNavy = await bgOf(page, ".chrome");

    /* 2026-09-06: the strip is the FRAME register, not the page ground, and the two are no
       longer the same colour. In light it is the dark object on cream; in dark it LIFTS off a
       near-black page (frame/page 1.28:1) instead of matching it, which is what makes the frame
       still read as a frame at night. Both values, not one, is the assertion now. */
    expect(onCream, "the chrome strip should wear the light-theme frame on the cream page").toBe("rgb(27, 25, 23)");
    expect(onNavy, "the chrome strip should wear the lifted dark-theme frame").toBe(FRAME_DARK);
    expect(onCream, "the frame must differ between themes — a fixed frame is what collapsed before").not.toBe(onNavy);
  });
});
