/* The TOOLS STATION — the last stop on every guide's rail (R5 retired the standalone
   /tools/<trip>/ screen these tests used to walk). The screen's guarantee survived the move:
   the tools must carry THIS trip's data. On a screen with a picker that was a routing question;
   in a station it is a scoping one — a shared ledger key, a reminder tick bleeding across
   trips, a budget figure seeded from the guide it now sits inside. */
// @protects-file A guide's tools run on that guide's own data, and no door leads to the deleted screen.

import { test, expect, type Page } from "@playwright/test";

const guide = (slug: string) => `/Trip-Guides/guides/${slug}/`;

// Five, not the screen's six: jet lag moved to Plan. Korea has coordinates AND dated days, so
// route order and exports both render — which is why every count below names Korea.
const PANEL_COUNT = 5;

async function openTools(page: Page, slug = "korea", waitUntil: "domcontentloaded" | "networkidle" = "networkidle") {
  await page.goto(guide(slug), { waitUntil });
  await page.locator('.grail-stop[data-kind="tools"]').click();
  await expect(page.locator(".catblock--tools")).toBeVisible();
}

async function panelTitles(page: Page): Promise<string[]> {
  return page.locator(".tools-grid .pnl-title").allInnerTexts();
}

test("the station renders every tool for the guide it lives in", async ({ page }) => {
  await openTools(page);
  const titles = (await panelTitles(page)).join(" | ");
  expect(titles).toContain("What everyone actually spent"); // trip split
  expect(titles).toContain("What's shut, and when");        // closures
  expect(titles).toContain("Everything this trip asks you to do"); // reminders
  expect(titles).toContain("Walking the days in a sensible order"); // route order
  expect(await panelTitles(page)).toHaveLength(PANEL_COUNT);
});

test("the jet-lag panel is NOT here — it moved to Plan, and did not get left in both", async ({ page }) => {
  /* ⌁ The failure a move produces is the copy that stayed behind. Two jet-lag panels on one
     page is worse than either placement, because a reader who fills one finds the other blank. */
  await page.goto(guide("korea"), { waitUntil: "networkidle" });
  await expect(page.locator(".tools-grid .jl-wrap")).toHaveCount(0);
  // It hangs from the masthead and guide-ui.js reveals it on the group whose content covers
  // landing — so the contract is the count plus the group it declares, not its nesting.
  await expect(page.locator(".jl-wrap")).toHaveCount(1);
  await expect(page.locator(".jl-wrap")).toHaveAttribute("data-jl-group", /^\d+$/);
});

test("Reminders kept its panel when its tool tab was retired", async ({ page }) => {
  /* ⌁ regression. The shared scratchpad is Firebase-backed and belongs to the group, not to
     R5's removed tools — it was dropped by association once and rendered nowhere at all. */
  await openTools(page);
  // VISIBLE, not merely present. The first fix rendered it into the page still carrying the
  // `hidden` its retired tool tab used to clear — a count assertion passes on that, a reader
  // never sees it, and the feature is as gone as if it had been deleted.
  await expect(page.locator(".catblock--tools #tripRemind")).toBeVisible();
  await expect(page.locator(".catblock--tools .rm-eyebrow")).toHaveCount(1);
});

test("the calculator is on the guide's own ledger key", async ({ page }) => {
  await openTools(page);
  const korea = await page.locator("#tripSplit").getAttribute("data-sk");
  await openTools(page, "denmark");
  const denmark = await page.locator("#tripSplit").getAttribute("data-sk");
  expect(korea).toBeTruthy();
  expect(korea).not.toBe(denmark);   // two trips, two ledgers — never one shared balance
});

test("no budget figure from the guide has leaked into the split panel", async ({ page }) => {
  // The 2026-08-08 ruling: the split holds real spend, entered by a person. Nothing seeds it —
  // and the station now sits INSIDE the guide whose budget block it must keep ignoring.
  await openTools(page);
  await expect(page.locator("#tripSplit")).toContainText("Add people first, then record who paid what.");
});

test("reminder ticks persist per guide, including the ones behind the disclosure", async ({ page }) => {
  await openTools(page);
  await page.locator("details.tools-more > summary").click();
  const inFold = page.locator("details.tools-more .tools-rem-box").first();
  await inFold.check();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('.grail-stop[data-kind="tools"]').click();
  await expect(page.locator("details.tools-more .tools-rem-box").first()).toBeChecked();
  // A different trip must not inherit it.
  await openTools(page, "denmark");
  expect(await page.locator(".tools-rem-box:checked").count()).toBe(0);
});

test("route order says straight-line, so nobody reads it as walking time", async ({ page }) => {
  await openTools(page, "korea", "domcontentloaded");
  await expect(page.locator(".tools-grid")).toContainText("Straight-line distance");
});

/* ── The deleted route ────────────────────────────────────────────────────────────────────── */

test("no surface still links to the retired /tools/ screen", async ({ page }) => {
  // ⌁ The README named four doors into Tools, all URLs. Deleting the route left them standing;
  // a link to a 404 is the defect a route removal reliably produces. Two lived on each page.
  for (const url of ["/Trip-Guides/", guide("korea")]) {
    await page.goto(url, { waitUntil: "networkidle" });
    const dead = await page.locator('a[href*="/tools/"]').count();
    expect(dead, `${url} still links to the deleted Tools screen`).toBe(0);
  }
});

test("the hub's TRIP TOOLS row lands on the featured guide's own station", async ({ page }) => {
  await page.goto("/Trip-Guides/", { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="table"]').click();
  await page.locator(".atlas-toolsrow").click();
  await page.waitForURL(/\/guides\/\w+\/#tools$/);
  // The deep link must OPEN the station, not just land on the page with it hidden.
  await expect(page.locator(".catblock--tools")).toBeVisible();
  expect(await panelTitles(page)).toHaveLength(PANEL_COUNT);
});

test("the phone's ☰ menu still reaches tools — the only route in at that width", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto("/Trip-Guides/", { waitUntil: "networkidle" });
  const link = page.locator('[data-atlas-menusheet] a[href*="#tools"]');
  await expect(link).toHaveCount(1);
});

test("the station's content is in the page without JavaScript", async ({ browser }) => {
  // Narrower than the screen's no-JS claim and still worth holding: the panels are
  // server-rendered, so they are in the document even where the rail cannot switch to them.
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(guide("korea"), { waitUntil: "domcontentloaded" });
  expect(await page.locator(".tools-grid .pnl-title").count()).toBe(PANEL_COUNT);
  await ctx.close();
});
