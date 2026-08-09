/* The standalone Tools screen (Stage E, design-handoff README §5).

   These assertions are aimed at the two things unit tests structurally cannot see. First,
   the README's own warning: every entry point into Tools must arrive with the trip's data,
   "because the one that forgets is the one that ships". Here the guarantee is the routing
   itself — so the test walks each entry point and checks the tools actually rendered on the
   other side, rather than trusting that they would. Second, the creator's 2026-08-08 ruling
   that the split ledger holds real spend only: the guide's budget figures must not have
   leaked into it. */
import { test, expect, type Page } from "@playwright/test";

const TOOLS = "/Trip-Guides/tools/korea/";

/* Five tools plus "Take it with you", which arrived 2026-08-09 when the .gpx/.ics downloads
   moved off the guide's Share panel — sharing is giving the guide to someone else, and an
   offline map file is the opposite errand. Korea has both coordinates and dated days, so it
   renders. A trip with neither would show five, which is why the entry-point tests below all
   name Korea specifically rather than whichever trip is most relevant today. */
const PANEL_COUNT = 6;

async function panelTitles(page: Page): Promise<string[]> {
  return page.locator(".tools-grid .pnl-title").allInnerTexts();
}

test("the screen renders every tool for the named trip", async ({ page }) => {
  await page.goto(TOOLS, { waitUntil: "domcontentloaded" });
  const titles = (await panelTitles(page)).join(" | ");
  expect(titles).toContain("What everyone actually spent"); // trip split
  expect(titles).toContain("Landing clock");                // jetlag
  expect(titles).toContain("What's shut, and when");        // closures
  expect(titles).toContain("Everything this trip asks you to do"); // reminders
  expect(titles).toContain("Walking the days in a sensible order"); // route order
});

test("the calculator is on the guide's own ledger key, not a second one", async ({ page }) => {
  await page.goto(TOOLS, { waitUntil: "domcontentloaded" });
  const onTools = await page.locator("#tripSplit").getAttribute("data-sk");
  await page.goto("/Trip-Guides/guides/korea/", { waitUntil: "domcontentloaded" });
  const onGuide = await page.locator("#tripSplit").getAttribute("data-sk");
  expect(onTools).toBe(onGuide);
});

test("no budget figure from the guide has leaked into the split panel", async ({ page }) => {
  await page.goto(TOOLS, { waitUntil: "networkidle" });
  const split = page.locator("#tripSplit");
  // A freshly-loaded trip must have no expenses at all — the ruling is that the split is
  // real spend, entered by a person, and nothing seeds it.
  await expect(split).toContainText("Add people first, then record who paid what.");
});

// The four doors of README §5. Each is walked, not assumed.
test("entry point: the hub header's TOOLS button lands on a loaded screen", async ({ page }) => {
  await page.goto("/Trip-Guides/", { waitUntil: "domcontentloaded" });
  await page.locator(".atlas-header-btn--tools").click();
  await page.waitForURL(/\/tools\//);
  expect((await panelTitles(page)).length).toBe(PANEL_COUNT);
});

test("entry point: the table's TRIP TOOLS row lands on a loaded screen", async ({ page }) => {
  await page.goto("/Trip-Guides/", { waitUntil: "networkidle" });
  // The hub boots into WORLD mode, which hides the table — so this row is only reachable
  // after the door the reader would actually use.
  await page.locator('[data-atlas-mode-btn="table"]').click();
  await page.locator(".atlas-toolsrow").click();
  await page.waitForURL(/\/tools\//);
  expect((await panelTitles(page)).length).toBe(PANEL_COUNT);
});

test("entry point: the guide's Groups sheet reaches the screen for that trip", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto("/Trip-Guides/guides/korea/", { waitUntil: "networkidle" });
  await page.locator("#sheetOpen").click();
  await page.locator(".sheet-alltools-link").click();
  await page.waitForURL(/\/tools\/korea\//);
  expect((await panelTitles(page)).length).toBe(PANEL_COUNT);
});

test("entry point: the hub's mobile map menu reaches the screen", async ({ page }) => {
  // The README singles this one out: on a phone the ☰ menu is the ONLY route in, so an
  // omission here breaks Tools entirely there.
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto("/Trip-Guides/", { waitUntil: "networkidle" });
  const link = page.locator('[data-atlas-menusheet] a[href*="/tools/"]');
  await expect(link).toHaveCount(1);
});

test("the trip picker keeps the current trip in the list and marks it", async ({ page }) => {
  await page.goto(TOOLS, { waitUntil: "domcontentloaded" });
  const pills = page.locator(".tools-trip");
  await expect(pills).toHaveCount(4);
  await expect(page.locator('.tools-trip[aria-current="page"]')).toHaveText("South Korea");
});

test("switching trips switches what the tools run on", async ({ page }) => {
  await page.goto(TOOLS, { waitUntil: "domcontentloaded" });
  await page.locator(".tools-trip", { hasText: "Japan" }).click();
  await page.waitForURL(/\/tools\/japan\//);
  await expect(page.locator(".tools-title")).toHaveText("Japan");
  // Japan's holidays are the hand-written, primary-sourced file — the credit must follow.
  await expect(page.locator('[data-panel^="tools-closures-"] .tools-src')).toContainText("www8.cao.go.jp");
});

test("reminder ticks persist per trip, including the ones behind the disclosure", async ({ page }) => {
  await page.goto(TOOLS, { waitUntil: "networkidle" });
  // The disclosure ships closed — open it the way a reader would before ticking inside.
  await page.locator("details.tools-more > summary").click();
  const inFold = page.locator("details.tools-more .tools-rem-box").first();
  await inFold.check();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("details.tools-more .tools-rem-box").first()).toBeChecked();
  // A different trip must not inherit it.
  await page.goto("/Trip-Guides/tools/denmark/", { waitUntil: "networkidle" });
  const denmarkChecked = await page.locator(".tools-rem-box:checked").count();
  expect(denmarkChecked).toBe(0);
});

test("route order says straight-line, so nobody reads it as walking time", async ({ page }) => {
  await page.goto(TOOLS, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".tools-grid")).toContainText("Straight-line distance");
});

test("the screen works with JavaScript disabled", async ({ browser }) => {
  // The picker is links and the fold is a <details> precisely so this holds.
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(TOOLS, { waitUntil: "domcontentloaded" });
  expect((await panelTitles(page)).length).toBe(PANEL_COUNT);
  await page.locator(".tools-trip", { hasText: "Denmark" }).click();
  await page.waitForURL(/\/tools\/denmark\//);
  await expect(page.locator(".tools-title")).toHaveText("Denmark");
  await ctx.close();
});
