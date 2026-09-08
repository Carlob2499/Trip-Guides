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

/* The five primary destinations (design-system.md 2026-09-05 §6, board 02): on a GUIDE the
   bottom bar's slots are the trip's own regions and Split takes the fifth — the Atlas is the
   wordmark in the strip there. (The hub's own bar still leads with Atlas; only guides are
   asserted here.) */
const DEST_NAV = ".botbar [data-dest]";
async function openDestination(page: Page, key: string) {
  const tab = page.locator(`.botbar [data-dest-nav][data-dest="${key}"]`).first();
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
  test(`⌁ ${name} every destination fits at 320px`, async ({ page }) => {
    await prep(page, path, 320);
    const ids = await page.locator(DEST_NAV).evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).dataset.dest).filter((id): id is string => Boolean(id)));
    expect(ids, `${name}: the five destinations`).toEqual(["trip", "itinerary", "map", "guide", "split"]);
    for (const id of ids) {
      await openDestination(page, id);
      await expectFits(page, `${name}/${id} @ 320px`);
      // The Guide destination's chapters are one more level: every chapter must fit too.
      if (id === "guide") {
        const chapters = page.locator("[data-chapter-go]:visible");
        for (let i = 0; i < await chapters.count(); i++) {
          await page.locator("[data-chapter-go]:visible").nth(i).click();
          await settle(page);
          await expectFits(page, `${name}/guide chapter ${i} @ 320px`);
          await page.locator('[data-chapter-go="overview"]:visible').first().click();
          await settle(page);
        }
      }
    }
  });
}

const HUB_COPY = ".atlas-sheet-title,.atlas-sheet-cities,.atlas-sheet-dates,.atlas-dock-name";
/* Variable copy per destination — every string a guide author can lengthen. */
const GUIDE_COPY: Record<string, string> = {
  trip: ".trip-title,.trip-sub,.trip-cities,.trip-dates,.trip-goto-title,.trip-rem li,.trip-entry-row,.trip-list li,.tn-name,.tn-note",
  itinerary: ".day-title,.day-tldr,.day .b>strong,.day-leg span:not(.day-leg-arrow):not(.day-leg-km),.check-txt,.fit,.day-branch-label,.day-know-title,.itin-daybtn-n",
  map: ".mapdest-row-name,.mapdest-row-meta,.mapdest-group-title,.mapdest-sel-name",
  guide: ".mast-eyebrow,.mast-title,.mast-dek,.gd-card-name,.gd-card-sub,.block-title,.pnl-title,.lsnote,.sight-name,.sight-body p,.venue-name,.venue-area,.venue-pill,.venue-why,.venue-crowd,.venue-details dd",
  split: ".split-title,.split-desc,.split-empty,.se-h-desc,.sr-total-lbl",
};

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
    let total = 0;
    for (const [key, selector] of Object.entries(GUIDE_COPY)) {
      await openDestination(page, key);
      if (key === "guide") {
        // Chapters hold the repositories; open the first one that carries places.
        const first = page.locator("[data-chapter-go]:visible").first();
        if (await first.count()) { await first.click(); await settle(page); }
      }
      total += await appendStress(page, selector);
      await expectFits(page, `${name}/${key} hostile copy @ 390px`);
    }
    expect(total).toBeGreaterThan(10);
  });

  test(`⌁ ${name} opened surfaces fit at 320px`, async ({ page }) => {
    await prep(page, path, 320);
    let exercised = 0;

    const share = page.locator("#btnShare");
    if (await share.isVisible()) {
      await share.click();
      await expect(page.locator("#shareModal")).toBeVisible();
      await expectFits(page, `${name} share`);
      await page.keyboard.press("Escape");
      exercised++;
    }

    const sos = page.locator(".topbar-sos:visible,.sos-fab:visible").first();
    if (await sos.isVisible()) {
      await sos.click();
      await expect(page.locator(".sos-sheet")).toBeVisible();
      await expectFits(page, `${name} SOS`);
      await page.keyboard.press("Escape");
      exercised++;
    }

    // The Map destination's pin sheet, opened to its full state.
    await openDestination(page, "map");
    const grip = page.locator("[data-map-sheet] .mapdest-sheet-grip").first();
    if (await grip.isVisible()) {
      await grip.click();
      await grip.click();
      await expect(page.locator("[data-map-sheet]")).toHaveAttribute("data-sheet", "full");
      await expectFits(page, `${name} map sheet`);
      exercised++;
    }

    // A provenance popover, wherever the first visible dot lives.
    for (const key of ["guide", "itinerary", "trip"]) {
      await openDestination(page, key);
      if (key === "guide") {
        const first = page.locator("[data-chapter-go]:visible").first();
        if (await first.count()) { await first.click(); await settle(page); }
      }
      const dot = page.locator(".prov-dot:visible").first();
      if (await dot.count()) {
        await dot.click();
        await expect(page.locator(".prov-popover[data-open]").first()).toBeVisible();
        await expectFits(page, `${name} provenance`);
        await page.keyboard.press("Escape");
        exercised++;
        break;
      }
    }

    await openDestination(page, "itinerary");
    const indexed = await page.evaluate((stress) => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(".day[data-day] .d,.day-title"));
      els.forEach((el) => el.append(document.createTextNode(` ${stress}`)));
      return els.length;
    }, STRESS[1]);
    expect(indexed).toBeGreaterThan(0);
    const search = page.locator("[data-search-open]:visible").first();
    if (await search.count()) await search.click(); else await page.keyboard.press("/");
    const input = page.locator(".srch-input");
    await expect(input).toBeVisible();
    await input.fill("Gyeongbokgung-Palace-Reservation");
    await expect(page.locator("[data-srch-i]").first()).toBeVisible();
    await expectFits(page, `${name} search overlay`);
    exercised++;

    expect(exercised, `${name}: too few real opened surfaces exercised`).toBeGreaterThanOrEqual(4);
  });
}


test("⌁ mobile traveler critical path exposes usable primary surfaces", async ({ page }) => {
  await prep(page, NEW[1], 375, 812);
  await expect(page.locator("#ngForm")).toBeVisible();
  // Enhanced mode deliberately hides the no-JS submit until intake prerequisites are satisfied;
  // the country field is the actual first traveler action and must be reachable immediately.
  await expect(page.locator("#ngCountry")).toBeVisible();
  await expectFits(page, "new intake critical path @ 375px");

  await prep(page, PROGRESS[1], 375, 812);
  await expect(page.locator("#pgMain")).toBeVisible();
  await expect(page.locator("#pgStatusPill")).toBeVisible();
  await expect(page.locator(".pg-empty-actions .pg-btn--go")).toBeVisible();
  await expectFits(page, "progress critical path @ 375px");

  await prep(page, GUIDES[1][1], 375, 812);
  await expect(page.locator(DEST_NAV).first()).toBeVisible();
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
  await expect(page.locator(DEST_NAV).first()).toBeVisible();
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("service worker unsupported");
    await navigator.serviceWorker.ready;
  });

  await context.setOffline(true);
  const offlinePage = await context.newPage();
  await offlinePage.setViewportSize({ width: 375, height: 812 });
  const offline = await offlinePage.goto(GUIDES[1][1], { waitUntil: "domcontentloaded" });
  expect(offline?.status(), "service worker did not serve the cached guide navigation").toBeLessThan(400);
  await expect(offlinePage.locator("main")).toBeVisible();
  await expect(offlinePage.locator(DEST_NAV).first()).toBeVisible();
  await expect(offlinePage.locator(".trip-title, h1").first()).toBeVisible();
  await expectFits(offlinePage, "finished guide offline @ 375px");

  await context.close();
});

/* ═══ CONTAINMENT: an overlay may not escape the box it is drawn on ═══════════════════════
   This file opens by saying "content may not escape its owner", and until 2026-09-06 it only
   ever checked one owner: the viewport, horizontally. That is a real check and it stays. But it
   cannot see the failure that actually reaches a reader most often — an element that sits well
   inside the viewport and hangs out of the BOX it is supposed to belong to.

   The case that prompted this: the guide cover's title plate is absolutely positioned over the
   photograph. It was anchored to .mast-hero, which also contains the plateline UNDER the frame,
   so `bottom:0` resolved to the hero's foot and the title hung 86px past the bottom of the
   picture with the dek's last line sitting on cream. Every existing gate passed. It was found by
   the creator looking at it, which is the most expensive way to find a 6-line CSS bug and the
   one that erodes trust fastest.

   Each entry below is a promise the design makes about where something lives. They are listed
   explicitly rather than inferred, because "no child may exceed its parent" is false in general
   — half of good layout is deliberate overhang — so a blanket rule would drown in exceptions and
   get muted. A named pair is a claim someone can argue with. */
const CONTAINED: ReadonlyArray<{ child: string; box: string; why: string }> = [
  {
    child: ".mast-cover .mast-plate-row",
    box: ".mast-cover .mast-frame",
    why:
      "The cover's identity is drawn ON the photograph. Its scrim is a gradient inside the frame, " +
      "so any part of the plate outside the frame is unscrimmed type on whatever happens to be " +
      "below — cream, in the case that shipped. In band mode the plate is static and sits under " +
      "the frame by design, so that layout is skipped rather than exempted: the pair only applies " +
      "when the plate is positioned.",
  },
];

for (const [name, path] of GUIDES) {
  for (const width of [320, 375, 768, 1440]) {
    test(`⌁ ${name} overlays stay inside their box at ${width}px`, async ({ page }) => {
      await prep(page, path, width, width < 700 ? 812 : 900);
      await page.evaluate(() => {
        const g = Array.from(document.querySelectorAll<HTMLElement>(".tab, .botslot, a, button"))
          .find((e) => e.textContent?.trim() === "Guide");
        g?.click();
      });
      await page.waitForTimeout(1200);
      await settle(page);

      const offenders = await page.evaluate((pairs) => {
        const out: string[] = [];
        for (const { child, box, why } of pairs) {
          const c = document.querySelector(child);
          const b = document.querySelector(box);
          if (!c || !b) continue;
          /* Only an ABSOLUTE child is claiming to sit on the box; anything still in flow is a
             different layout and legitimately sits after it. Written as `!== "absolute"` rather
             than `=== "static"`, which is the version I first wrote and which was wrong: the
             plate's base rule is position:relative, so band mode — where it flows under the
             frame on purpose — was read as an overlay and failed all four widths on Denmark.
             The gate caught that about itself before it ever ran in CI. */
          if (getComputedStyle(c).position !== "absolute") continue;
          const cr = c.getBoundingClientRect(), br = b.getBoundingClientRect();
          if (!cr.width || !br.width) continue;
          const over = {
            top: Math.round(br.top - cr.top),
            bottom: Math.round(cr.bottom - br.bottom),
            left: Math.round(br.left - cr.left),
            right: Math.round(cr.right - br.right),
          };
          const bad = Object.entries(over).filter(([, px]) => px > 1);
          if (bad.length) {
            out.push(`${child} escapes ${box} by ${bad.map(([k, v]) => `${v}px ${k}`).join(", ")} — ${why}`);
          }
        }
        return out;
      }, CONTAINED as unknown as { child: string; box: string; why: string }[]);

      expect(offenders, `${name} @${width}px: an overlay left the box it is drawn on`).toEqual([]);
    });
  }
}
