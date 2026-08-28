// Geometry/content resilience. Keep this semantic: design may move pixels; content may not escape its owner.
// @protects-file Variable travel data and opened UI must fit the traveller's viewport without device-specific surgery.
import { test, expect, type Page } from "@playwright/test";

const NOW = new Date("2026-09-01T10:00:00+09:00");
const HUB = ["hub", "/Trip-Guides/"] as const;
const NEW = ["new intake", "/Trip-Guides/new/"] as const;
const PROGRESS = ["progress", "/Trip-Guides/progress/"] as const;
const GUIDES = [
  ["denmark", "/Trip-Guides/guides/denmark/"],
  ["korea", "/Trip-Guides/guides/korea/"],
] as const;
const PAGES = [HUB, NEW, PROGRESS, ...GUIDES] as const;
const STRESS = [
  "東京都千代田区丸の内一丁目・東京駅八重洲中央口から地下連絡通路経由",
  "Gyeongbokgung-Palace-Reservation-Confirmation-ABCDEFGHJKLMNPQRSTUVWXYZ-2026-10-21-Party-of-Eight",
  "https://example.invalid/transport/reservation/this-is-an-intentionally-long-unbroken-reference-token-for-layout-pressure",
] as const;

async function prep(page: Page, path: string, width: number, height = 800) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.clock.setFixedTime(NOW);
  await page.route("**/*", (route) => route.request().url().startsWith("http://localhost:4322")
    ? route.continue() : route.abort());
  const res = await page.goto(path, { waitUntil: "networkidle" });
  expect(res?.status(), `${path}: resilience gate reached an error page`).toBeLessThan(400);
  await page.addStyleTag({ content: ".reveal-pending{opacity:1!important;transform:none!important}" });
}

async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

async function fitReport(page: Page) {
  return page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    const viewport = document.documentElement.clientWidth;
    const visible = (el: Element) => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity || "1") > 0 && r.width > 0 && r.height > 0;
    };
    const owned = (el: Element) => {
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (["auto", "scroll", "hidden", "clip"].includes(s.overflowX) && n.scrollWidth > n.clientWidth + 1) return true;
      }
      return false;
    };
    const offenders = Array.from(document.body.querySelectorAll("*"))
      .filter(visible)
      .filter((el) => !(el instanceof SVGElement && el.ownerSVGElement))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return (r.left < -1 || r.right > viewport + 1) && !owned(el);
      })
      .slice(0, 10)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `${el.tagName.toLowerCase()}#${el.id}.${typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 2).join(".") : ""} [${Math.round(r.left)},${Math.round(r.right)}]`;
      });
    return { client: root.clientWidth, scroll: root.scrollWidth, offenders };
  });
}

async function expectFits(page: Page, label: string) {
  const r = await fitReport(page);
  expect(r.scroll, `${label}: page +${r.scroll - r.client}px; ${r.offenders.join(" | ")}`).toBeLessThanOrEqual(r.client + 1);
  expect(r.offenders, `${label}: visible content escaped without a horizontal owner`).toEqual([]);
}

async function appendStress(page: Page, selector: string) {
  return page.evaluate(({ selector, stress }) => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      if (el.closest("[hidden]")) return false;
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
    });
    els.forEach((el, i) => el.append(document.createTextNode(` ${stress[i % stress.length]}`)));
    return els.length;
  }, { selector, stress: [...STRESS] });
}

async function openStation(page: Page, id: string) {
  const tab = page.locator(`#guideTabs .gtab[data-tab="${id}"]`).first();
  await tab.click();
  await expect(tab).toHaveAttribute("aria-current", "true");
  await settle(page);
}

for (const [name, path] of PAGES) {
  test(`⌁ ${name} reflows at 320px`, async ({ page }) => {
    await prep(page, path, 320);
    await expectFits(page, `${name} @ 320px`);
  });
}

for (const [name, path] of GUIDES) {
  test(`⌁ ${name} every station fits at 320px`, async ({ page }) => {
    await prep(page, path, 320);
    const ids = await page.locator("#guideTabs .gtab:not([hidden])").evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.tab).filter((id): id is string => Boolean(id)));
    expect(ids.length, `${name}: no guide stations`).toBeGreaterThan(1);
    for (const id of ids) {
      await openStation(page, id);
      await expectFits(page, `${name}/${id} @ 320px`);
    }
  });
}

const HUB_COPY = ".atlas-sheet-title,.atlas-sheet-cities,.atlas-sheet-dates,.atlas-dock-name";
const GUIDE_COPY = [
  ".mast-eyebrow,.mast-title,.mast-dek,.block-title,.pnl-title",
  ".day .b>strong,.day-tldr,.day-leg span:not(.day-leg-arrow):not(.day-leg-km),.stop-name,.stop-note",
  ".lsnote,.fit,.check-txt,.sight-name,.sight-body p",
  ".venue-name,.venue-area,.venue-pill,.venue-why,.venue-crowd,.venue-details dd",
].join(",");

test("⌁ hub variable data survives hostile copy", async ({ page }) => {
  await prep(page, HUB[1], 390, 844);
  const table = page.locator('[data-atlas-mode-btn="table"]');
  if (await table.isVisible()) await table.click();
  expect(await appendStress(page, HUB_COPY)).toBeGreaterThan(5);
  await expectFits(page, "hub hostile copy @ 390px");
});

for (const [name, path] of GUIDES) {
  test(`⌁ ${name} variable data survives hostile copy`, async ({ page }) => {
    await prep(page, path, 390, 844);
    expect(await appendStress(page, GUIDE_COPY)).toBeGreaterThan(10);
    await expectFits(page, `${name} hostile copy @ 390px`);
  });

  test(`⌁ ${name} opened surfaces fit at 320px`, async ({ page }) => {
    await prep(page, path, 320);
    let exercised = 0;

    const groups = page.locator("#sheetOpen");
    if (await groups.isVisible()) {
      await groups.click();
      await expect(page.locator(".sheet.open")).toBeVisible();
      await expectFits(page, `${name} groups`);
      await page.keyboard.press("Escape");
      exercised++;
    }

    const share = page.locator("#btnShare");
    if (await share.isVisible()) {
      await share.click();
      await expect(page.locator("#shareModal")).toBeVisible();
      await expectFits(page, `${name} share`);
      await page.keyboard.press("Escape");
      exercised++;
    }

    const sos = page.locator(".topbar-sos,.sos-btn").first();
    if (await sos.isVisible()) {
      await sos.click();
      await expect(page.locator(".sos-sheet")).toBeVisible();
      await expectFits(page, `${name} SOS`);
      await page.keyboard.press("Escape");
      exercised++;
    }

    const tabs = page.locator("#guideTabs .gtab:not([hidden])");
    for (let i = 0; i < await tabs.count(); i++) {
      const dot = page.locator(".prov-dot:visible").first();
      if (await dot.count()) {
        await dot.click();
        await expect(page.locator(".prov-popover[data-open]").first()).toBeVisible();
        await expectFits(page, `${name} provenance`);
        await page.keyboard.press("Escape");
        exercised++;
        break;
      }
      await tabs.nth(i).click();
      await settle(page);
    }

    const indexed = await page.evaluate((stress) => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(".planner-days .day[data-day] .d,.sight .sight-name"));
      els.forEach((el) => el.append(document.createTextNode(` ${stress}`)));
      return els.length;
    }, STRESS[1]);
    expect(indexed).toBeGreaterThan(0);
    const search = page.locator(".topbar-search");
    if (await search.isVisible()) await search.click(); else await page.keyboard.press("/");
    const input = page.locator(".pal-input");
    await expect(input).toBeVisible();
    await input.fill("Gyeongbokgung-Palace-Reservation");
    await expect(page.locator(".pal-item").first()).toBeVisible();
    await expectFits(page, `${name} command palette`);
    exercised++;

    expect(exercised, `${name}: too few real opened surfaces exercised`).toBeGreaterThanOrEqual(4);
  });
}


test("⌁ mobile traveler critical path exposes usable primary surfaces", async ({ page }) => {
  await prep(page, NEW[1], 375, 812);
  await expect(page.locator("#ngForm")).toBeVisible();
  await expect(page.locator("[data-plain-submit]")).toBeVisible();
  await expectFits(page, "new intake critical path @ 375px");

  await prep(page, PROGRESS[1], 375, 812);
  await expect(page.locator("#pgMain")).toBeVisible();
  await expect(page.locator("#pgStatusPill")).toBeVisible();
  await expect(page.locator(".pg-empty-actions .pg-btn--go")).toBeVisible();
  await expectFits(page, "progress critical path @ 375px");

  await prep(page, GUIDES[1][1], 375, 812);
  await expect(page.locator("#guideTabs .gtab:not([hidden])").first()).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
  await expectFits(page, "finished guide critical path @ 375px");
});

test("⌁ a primed finished guide remains readable after the browser goes offline", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.clock.setFixedTime(NOW);
  await page.route("**/*", (route) => route.request().url().startsWith("http://localhost:4322")
    ? route.continue() : route.abort());

  const first = await page.goto(GUIDES[1][1], { waitUntil: "networkidle" });
  expect(first?.status(), "online prime reached an error page").toBeLessThan(400);
  await page.addStyleTag({ content: ".reveal-pending{opacity:1!important;transform:none!important}" });
  await expect(page.locator("#guideTabs .gtab:not([hidden])").first()).toBeVisible();
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("service worker unsupported");
    await navigator.serviceWorker.ready;
  });

  await context.setOffline(true);
  const offlinePage = await context.newPage();
  await offlinePage.setViewportSize({ width: 375, height: 812 });
  const offline = await offlinePage.goto(GUIDES[1][1], { waitUntil: "domcontentloaded" });
  expect(offline?.status(), "service worker did not serve the cached guide navigation").toBeLessThan(400);
  await offlinePage.addStyleTag({ content: ".reveal-pending{opacity:1!important;transform:none!important}" });
  await expect(offlinePage.locator("main")).toBeVisible();
  await expect(offlinePage.locator("#guideTabs .gtab:not([hidden])").first()).toBeVisible();
  await expect(offlinePage.locator(".mast-title, h1").first()).toBeVisible();
  await expectFits(offlinePage, "finished guide offline @ 375px");

  await context.close();
});
