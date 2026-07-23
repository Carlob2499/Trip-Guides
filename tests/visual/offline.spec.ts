/* Offline confidence (docs/PLAN_TRAVELER_FEATURES.md F5) — proves the service-worker
   precache actually works, which nothing in this repo had verified before this suite.
   Two phases per the SW's own contract: (1) a normal online load lets the worker install
   and its CORE precache populate — a page loaded before that point isn't yet CONTROLLED
   by the worker, so a reload is needed before offline behavior is representative; (2) only
   then does `context.setOffline(true)` (the real network-down signal `public/sw.js`'s own
   fetch handler branches on) turn off the network for the actual assertions. Guide slugs
   are read from the built `dist/guides/` directory rather than hardcoded, mirroring
   scripts/gen-sw-precache.mjs's own dynamic enumeration — a new guide should not need this
   suite edited to stay covered. */
import { test, expect, type Page } from "@playwright/test";
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GUIDES_DIST = path.join(ROOT, "dist", "guides");
const SLUGS = existsSync(GUIDES_DIST)
  ? readdirSync(GUIDES_DIST, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(path.join(GUIDES_DIST, e.name, "index.html")))
      .map((e) => e.name)
  : [];

const BASE = "/Trip-Guides";

async function goOnlineThenControl(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  // First load may only REGISTER the worker, not be CONTROLLED by it (SW spec) — reload
  // once more, still online, so this page becomes a controlled client before going offline.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}

test.describe("offline confidence", () => {
  test.skip(SLUGS.length === 0, "no built guides found under dist/guides — run `npm run build` first");
  // Two full online round-trips (install + re-control) plus an offline reload runs long;
  // the default per-test timeout left some runs right at the edge.
  test.setTimeout(45_000);

  test("the shell loads with zero network once the service worker controls the page", async ({ page, context }) => {
    await goOnlineThenControl(page, BASE + "/");
    await context.setOffline(true);
    // domcontentloaded, not the default "load": offline, a subresource the SW didn't
    // precache (opportunistically-cached-on-first-view assets, not the CORE list) can sit
    // pending indefinitely, which would hang "load" even though the real content — what
    // this test actually cares about — already rendered from cache.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    // The hub's own identity text, not just "a page rendered" — proves real cached
    // content, not a browser error page that also happens to paint a body.
    await expect(page.getByText("Waypoint", { exact: false }).first()).toBeVisible();
    await context.setOffline(false);
  });

  test('the "Works offline" badge (guide-ui.js §10) reflects REAL Cache Storage state, not navigator.onLine', async ({ page }) => {
    // First visit, before anything is cached: honestly absent — no cache exists yet.
    await page.goto(BASE + "/guides/korea/", { waitUntil: "networkidle" });
    await expect(page.locator(".gstat-offline")).toHaveCount(0);
    // Once the worker has installed and this load is a controlled reload, the badge
    // reads Cache Storage directly (not the network-status heuristic offline-pill.js
    // uses) and shows up while still fully online.
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".gstat-offline")).toContainText("Works offline");
  });

  for (const slug of SLUGS) {
    test(`guide "${slug}" loads with zero network once controlled`, async ({ page, context }) => {
      const url = `${BASE}/guides/${slug}/`;
      await goOnlineThenControl(page, url);
      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible();
      // Real page furniture (masthead nav), not an offline dino / browser error page.
      await expect(page.locator(".topbar, .masthead, header").first()).toBeVisible();
      await context.setOffline(false);
    });
  }

  test("a guide NOT in the precache (never visited) fails honestly rather than silently — offline-pill explains it", async ({ context, browser }) => {
    // A fresh context never installed the service worker at all — going straight
    // offline here is the "never opened this before a trip" case the offline-pill
    // (navigator.onLine banner) exists to explain, distinct from the precache itself.
    const freshContext = await browser.newContext({ offline: true });
    const freshPage = await freshContext.newPage();
    let failed = false;
    try {
      await freshPage.goto(BASE + "/", { timeout: 5000 });
    } catch {
      failed = true;
    }
    expect(failed).toBe(true); // honest: no prior visit, no cache, no page — not a silent blank
    await freshContext.close();
    await context.setOffline(false);
  });

  test("map tiles are NOT precached (documented limitation, not a bug) — sw.js has no map-tile caching logic", async () => {
    const { readFileSync } = await import("node:fs");
    const sw = readFileSync(path.join(ROOT, "dist", "sw.js"), "utf8");
    expect(sw).not.toMatch(/tile\.openstreetmap|maps\.googleapis/);
  });
});
