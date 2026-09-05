#!/usr/bin/env node
/* global window, document -- the page.evaluate callbacks run in the browser, not in Node. */
/* Surface screenshots for the board-vs-build sheets (docs/work-orders/surface-transplant-playbook.md).

   node scripts/design/shot.mjs <outdir> <surfaces> [viewports] [themes] [net] [scrollY]

     surfaces   comma list: atlas · trip · itinerary · map · guide · guide:chapter · split · search · sos
                · prov · itinerary:select · map:select · <any>:scrolled (with scrollY)
     viewports  m (390) · d (1440) · t (900) · s (320) · l (1024)      default m,d
     themes     light · dark                                           default light,dark
     net        block (default: third-party hosts aborted) · stub (Commons/OSM answered with the
                stubs beside this script — the sandbox has no egress) · live (nothing intercepted)
     scrollY    pixels for a `:scrolled` capture

   The clock is fixed inside the South Korea trip (2026-07-10 11:20 KST) so the Trip cockpit is in
   its ACTIVE phase; set CLOCK=<iso> to move it. SEED_SPLIT=1 seeds a three-person ledger.
   Needs `npm run preview -- --port 4322` running on a fresh `npm run build`. */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";

const [out = "shots", surfacesArg = "trip", vpsArg = "m,d", themesArg = "light,dark", netArg = "block", scrollArg = "0"] = process.argv.slice(2);
const CLOCK = process.env.CLOCK ? new Date(process.env.CLOCK) : new Date("2026-07-10T11:20:00+09:00");
const SEED = process.env.SEED_SPLIT === "1";
const BASE = process.env.WP_BASE || "http://localhost:4322/Trip-Guides";
const VP = { m: { width: 390, height: 844 }, d: { width: 1440, height: 1000 }, t: { width: 900, height: 1100 }, s: { width: 320, height: 640 }, l: { width: 1024, height: 768 } };
mkdirSync(out, { recursive: true });

const launch = { headless: true };
if (process.env.PW_CHROMIUM) launch.executablePath = process.env.PW_CHROMIUM;
const browser = await chromium.launch(launch);

async function dest(page, key) {
  if (key === "split") {
    await dest(page, "trip");
    const c = page.locator('[data-dest-go="split"]').first();
    await c.scrollIntoViewIfNeeded(); await c.click();
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
    return;
  }
  const controls = page.locator(`[data-dest-nav][data-dest="${key}"]`);
  const n = await controls.count();
  for (let i = 0; i < n; i++) { const c = controls.nth(i); if (await c.isVisible()) { await c.click(); break; } }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
}

for (const v of vpsArg.split(",")) for (const theme of themesArg.split(",")) {
  const ctx = await browser.newContext({ viewport: VP[v], colorScheme: theme, reducedMotion: "reduce", serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(CLOCK);
  if (SEED) await page.addInitScript(() => {
    try {
      localStorage.setItem("tg-split-korea", JSON.stringify({
        members: [{ id: "m1", name: "Carlos", payment: "" }, { id: "m2", name: "Minji", payment: "Kakao Pay" }, { id: "m3", name: "Alex", payment: "" }],
        expenses: [
          { id: "e1", paidBy: "m1", desc: "Korean BBQ dinner, night 1", amountMinor: 84000, currency: "KRW", rate: 1380, rateDate: "2026-07-09", baseMinor: 6087, method: "EQUAL", weights: null, participants: ["m1", "m2", "m3"], category: "Food", order: 1 },
          { id: "e2", paidBy: "m2", desc: "Airport limousine 6002", amountMinor: 34000, currency: "KRW", rate: 1380, rateDate: "2026-07-09", baseMinor: 2464, method: "SHARES", weights: { m1: 2, m2: 1, m3: 1 }, participants: ["m1", "m2", "m3"], category: "Transport", order: 2 },
          { id: "e3", paidBy: "m3", desc: "T1 Basecamp merch", amountMinor: 120000, currency: "KRW", rate: 1380, rateDate: "2026-07-10", baseMinor: 8696, method: "EXACT", weights: { m1: 40000, m3: 80000 }, participants: ["m1", "m3"], category: "Shopping", order: 3 },
        ],
        payments: [],
      }));
    } catch { /* storage unavailable */ }
  });
  if (netArg === "block") await page.route(/openstreetmap|googleapis|gstatic|unsplash|wikimedia/, (r) => r.abort());
  if (netArg === "stub") {
    const photo = readFileSync(new URL("./stubs/stub-photo.jpg", import.meta.url));
    const osm = readFileSync(new URL("./stubs/osm-stub.html", import.meta.url), "utf8");
    await page.route(/wikimedia|unsplash/, (r) => r.fulfill({ status: 200, contentType: "image/jpeg", body: photo }));
    await page.route(/openstreetmap/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: osm }));
    await page.route(/googleapis|gstatic/, (r) => r.abort());
  }
  for (const s of surfacesArg.split(",")) {
    const [key, sub] = s.split(":");
    if (key === "atlas") { await page.goto(`${BASE}/`, { waitUntil: "networkidle" }).catch(() => {}); }
    else if (key === "progress") { await page.goto(`${BASE}/progress/?slug=korea`, { waitUntil: "networkidle" }).catch(() => {}); }
    else if (key === "new") { await page.goto(`${BASE}/new/`, { waitUntil: "networkidle" }).catch(() => {}); }
    else if (!page.url().includes("/guides/korea")) { await page.goto(`${BASE}/guides/korea/`, { waitUntil: "networkidle" }); }
    await page.evaluate((t) => { localStorage.setItem("tg-theme", t); document.documentElement.setAttribute("data-theme", t); }, theme);
    await page.waitForTimeout(300);
    if (["trip", "itinerary", "map", "guide", "split"].includes(key)) await dest(page, key);
    if (key === "guide" && sub === "chapter") { const ch = page.locator(".gd-card[data-chapter-go]").first(); await ch.evaluate((el) => el.click()); await page.waitForTimeout(400); await page.evaluate(() => window.scrollTo(0, 0)); }
    if (key === "search") { await page.keyboard.press("/"); await page.waitForTimeout(200); await page.keyboard.type("Gyeongbok"); await page.waitForTimeout(500); }
    if (key === "sos") { await page.locator(".topbar-sos").first().click(); await page.waitForTimeout(400); }
    if (key === "itinerary" && sub === "select") { await page.locator("#dest-itinerary .day[data-day]:not([hidden]) [data-map-pin-id]").nth(1).click(); await page.waitForTimeout(500); }
    if (key === "map" && sub === "select") { const b = page.locator("[data-map-focus]").first(); await b.evaluate((el) => el.click()); await page.waitForTimeout(500); }
    if (key === "prov") { await dest(page, "guide"); const ch = page.locator(".gd-card[data-chapter-go]").nth(3); await ch.evaluate((el) => el.click()); await page.waitForTimeout(300); const dot = page.locator(".prov-dot:visible").first(); await dot.scrollIntoViewIfNeeded(); await dot.click(); await page.waitForTimeout(300); }
    if (scrollArg !== "0" && sub === "scrolled") { await page.evaluate((y) => window.scrollTo(0, y), Number(scrollArg)); await page.waitForTimeout(500); }
    await page.screenshot({ path: `${out}/${s.replace(":", "-")}-${v}-${theme}.png`, animations: "disabled" });
    if (key === "search" || key === "sos" || key === "prov") { await page.keyboard.press("Escape"); await page.keyboard.press("Escape"); }
  }
  await ctx.close();
}
await browser.close();
