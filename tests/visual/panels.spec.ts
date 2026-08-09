/* Panel invariants on a REAL guide page (Atlas Phase 2) — the two that were verified by
   hand in Phase 1, then deleted with the `_tmp-*` specs and left ungated (HANDOFF's own
   open item). Both live at a seam unit tests structurally cannot reach:

   1. NO-JS: every collapse rule in the silo's CSS is gated on `[data-panel-ready]`,
      which only src/features/panel/ sets — so with JS off every Panel must render open
      and neither the toggle nor the grip may be drawn. A control that cannot work must
      not exist. Only a browser with scripting disabled can prove the gate holds.

   2. NO-ANIMATE-ON-RESTORE: a Panel collapsed on a previous visit must be ALREADY shut
      at first paint — never painted open and then animated closed. The silo stages this
      as two attributes ([data-panel-ready] synchronously, [data-panel-anim] two frames
      later); the proof is a transitionstart listener installed before any page script
      runs, which must stay silent through a restore. Motion is deliberately ENABLED
      here — under reduced motion the invariant would pass vacuously. */
// @protects-file Sections open, close, and stay how you left them — even with JavaScript switched off.

import { test, expect } from "@playwright/test";

/* Test-only globals the init scripts hang on window — typed here so the page
   closures stay lint-clean without `any`. */
declare global {
  interface Window {
    __panelTransitions: string[];
    __stage: Record<string, number>;
  }
}

const KOREA = "/Trip-Guides/guides/korea/";
/* model/collapse.ts scopeKey("korea:Essentials") — \W+ stripped, lowercased. */
const COLLAPSE_KEY = "tg-panelcollapse-koreaessentials";
/* The Panel's storage id is its section title (Block.astro passes sec.title). */
const PANEL_ID = "Health & pharmacy";

test.describe("Panel gates — korea/Essentials on the real guide page", () => {
  test("JS off: every Panel renders open, no toggle or grip is drawn", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    // The Essentials tab panel ships `hidden` (tabs are JS chrome); unhide catblocks in
    // the RESPONSE, because with scripting off addStyleTag never resolves (it waits on
    // an onload only JS can deliver). This mirrors a11y.spec.ts forcing tabpanels open —
    // the tab system is not what this gate is about, the Panel CSS gate is.
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (!url.startsWith("http://localhost:4322")) return route.abort();
      if (route.request().resourceType() !== "document") return route.continue();
      const resp = await route.fetch();
      const body = (await resp.text()).replace(
        /(<div[^>]*class="catblock"[^>]*?)\shidden(?:="")?/g,
        "$1",
      );
      return route.fulfill({ response: resp, body });
    });
    await page.goto(KOREA, { waitUntil: "load" });

    // Scoped to THIS guide's Essentials grid on purpose. The bare
    // `[data-panel-grid] [data-panel]` this used to say counted every panel on the page,
    // which was the same number back when Essentials was korea's only panel group — the
    // guide now declares 11, so the old selector matched 78 and the gate broke on content
    // growth rather than on any Panel regression. The count assertion is about ONE grid.
    const panels = page.locator('[data-panel-scope="korea:Essentials"] [data-panel]');
    await expect(panels).toHaveCount(9);

    // The silo never ran: its ready gate must be absent from the document.
    await expect(page.locator("html[data-panel-ready]")).toHaveCount(0);

    for (let i = 0; i < 9; i++) {
      const panel = panels.nth(i);
      // Body content visible — grid-template-rows 1fr, visibility visible.
      await expect(panel.locator("[data-panel-body]")).toBeVisible();
      // No interactive chrome drawn without the wiring that makes it work.
      await expect(panel.locator("[data-panel-toggle]")).toBeHidden();
      await expect(panel.locator("[data-panel-grip]")).toBeHidden();
    }
    await context.close();
  });

  test("restore: a previously-collapsed Panel is shut at first paint, with zero transitions", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route("**/*", (route) =>
      route.request().url().startsWith("http://localhost:4322") ? route.continue() : route.abort(),
    );

    // Seed the reader's saved state and install the transition spy BEFORE any page
    // script runs — the restore happens during boot, so a listener attached after
    // load would prove nothing.
    await context.addInitScript(
      ([key, id]) => {
        try { localStorage.setItem(key, JSON.stringify({ [id]: true })); } catch { /* seed is the test's job */ }
        window.__panelTransitions = [];
        document.addEventListener(
          "transitionstart",
          (e) => {
            const t = e.target as Element | null;
            if (t && t.closest && t.closest(".pnl")) {
              window.__panelTransitions.push((e as TransitionEvent).propertyName);
            }
          },
          true,
        );
      },
      [COLLAPSE_KEY, PANEL_ID] as [string, string],
    );

    await page.goto(KOREA, { waitUntil: "networkidle" });

    const panel = page.locator(`[data-panel="${PANEL_ID}"]`);
    // Restored shut at boot.
    await expect(panel).toHaveAttribute("data-collapsed", "1");
    // The body-hidden claim is only meaningful with the Essentials TAB open — in a
    // fresh context the whole catblock ships hidden and the assertion would pass
    // vacuously for any collapse state.
    await page.evaluate(() => (document.querySelectorAll(".gtab")[1] as HTMLElement)?.click());
    await expect(panel).toBeVisible();
    await expect(panel.locator("[data-panel-body]")).toBeHidden();
    // The anim gate is up (so the reader's OWN toggles would animate) …
    await expect(page.locator("html[data-panel-anim]")).toHaveCount(1);
    // … and yet nothing animated getting here. Settle a few frames first so any
    // wrongly-staged transition would have fired before we read the spy.
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.__panelTransitions)).toEqual([]);
    await context.close();
  });

  /* The STAGING gate — pinned at the MECHANISM, because the outcome is untestable
     here. What the forced-failure pass actually established (2026-08-06): headless
     Chromium does not paint before the silo's boot task, so a boot-restored Panel has
     no before-change style and can never fire a transition in this harness, staging
     or no staging — an absence-of-transition assertion is green even with the stagger
     deliberately collapsed (and separately, Chromium won't start a transition whose
     transition-property arrives in the same recalc as the value change). The
     transition spy in the test above therefore stays as a belt for other engines, but
     the load-bearing assertion is the staging order itself: [data-panel-anim] must be
     committed in a LATER task than [data-panel-ready], which MutationObserver batches
     expose exactly — same-task attribute writes arrive in one callback batch, the
     two-rAF stagger arrives in a later one. Collapsing the stagger fails this
     (verified by forcing it); the restore path above proves the visible outcome. */
  test("staging: [data-panel-anim] lands in a later task than [data-panel-ready]", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route("**/*", (route) =>
      route.request().url().startsWith("http://localhost:4322") ? route.continue() : route.abort(),
    );
    await context.addInitScript(() => {
      const stage: Record<string, number> = (window.__stage = {});
      let batch = 0;
      // Observed on the DOCUMENT node, subtree on: at init-script time the initial
      // documentElement is a placeholder the parser replaces, so an observer bound to
      // it sees nothing. The document node survives parsing.
      new MutationObserver((records) => {
        batch += 1;
        for (const r of records) {
          if (r.target !== document.documentElement) continue;
          if (r.attributeName === "data-panel-ready" && stage.ready === undefined) stage.ready = batch;
          if (r.attributeName === "data-panel-anim" && stage.anim === undefined) stage.anim = batch;
        }
      }).observe(document, { attributes: true, subtree: true });
    });
    await page.goto("/Trip-Guides/panel-preview/?scope=study-a", { waitUntil: "networkidle" });
    await expect(page.locator("html[data-panel-anim]")).toHaveCount(1);
    const stage = await page.evaluate(() => window.__stage);
    expect(stage.ready).toBeDefined();
    expect(stage.anim).toBeDefined();
    // Strictly later batch = strictly later task: the restore's first paint happens
    // BETWEEN the two, which is the whole reason a restored Panel never animates shut.
    expect(stage.anim).toBeGreaterThan(stage.ready);
    await context.close();
  });
});
