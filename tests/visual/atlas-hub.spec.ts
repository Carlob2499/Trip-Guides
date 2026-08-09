/* Behavioral coverage for the Atlas hub (src/pages/index.astro) — replaces the old
   overture.spec.ts when the Atlas migration's Stage C item 10 flip retired the previous
   hub (overture.js, stats beat, #hubGrid cards). The guarantees carry over unchanged in
   INTENT — only the markup they assert against moved:
   1. The sheet list is reachable with JS entirely disabled — it's D4's server-rendered
      "no-JS/SEO door", and the globe/cover are progressive enhancement on top of it.
   2. prefers-reduced-motion → the cover's iris/FLIP sequence is skipped, content reachable.
   3. A second visit in the same session (tg-atlas-cover-seen set) never shows the cover. */
import { test, expect } from "@playwright/test";

const HUB = "/Trip-Guides/";

test("the sheet list is reachable with JavaScript entirely disabled (D4's server-rendered door)", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(HUB, { waitUntil: "load" });

  const sheets = page.locator(".atlas-sheets .atlas-sheet");
  expect(await sheets.count()).toBeGreaterThan(0);

  // Every row is a real, followable link to a real guide even with no JS at all — the
  // whole point of the table view being SSR rather than globe-derived.
  const count = await sheets.count();
  for (let i = 0; i < count; i++) {
    const href = await sheets.nth(i).getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toContain("/guides/");
  }

  await context.close();
});

test("reduced-motion: the cover does not animate and the hub is immediately reachable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HUB, { waitUntil: "networkidle" });

  // cover.js's dismiss() takes the reducedMotion() early return — it removes the cover
  // outright rather than running the fade/FLIP/iris sequence. Whether the cover is still
  // on screen or already gone, the table content behind it must be present and usable.
  await expect(page.locator(".atlas-table")).toBeAttached();
  await expect(page.locator(".atlas-sheets .atlas-sheet").first()).toBeAttached();
});

test("a second visit in the same session never shows the cover", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("tg-atlas-cover-seen", "1");
  });
  await page.goto(HUB, { waitUntil: "networkidle" });

  // initCover() removes the element entirely on the seen path — not merely hides it.
  await expect(page.locator("[data-atlas-cover]")).toHaveCount(0);
  // Attached, not visible: with JS running the hub opens in WORLD mode, which hides the
  // table view. The point here is that nothing blocks the hub, not which face is showing.
  await expect(page.locator(".atlas-sheets .atlas-sheet").first()).toBeAttached();
});

/* ── The 2026-08-08 hub pass (creator's own list) ──────────────────────────────────────
   Four complaints, four gates. Each asserts the BEHAVIOUR that was missing, not the
   styling that expresses it, so a later restyle does not have to rewrite them. */

test("the table header collapses to a search button instead of following you down the list", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="table"]').click();

  const head = page.locator("[data-atlas-searchhead]");
  const toggle = page.locator("[data-atlas-search-toggle]");
  await expect(toggle).toBeVisible();
  await expect(head).toHaveAttribute("data-collapsed", "");
  // The sticky region has to be genuinely small, not merely collapsed in name...
  expect((await head.boundingBox())!.height).toBeLessThan(72);
  // ...and it must stop LOOKING like chrome: no ground, no rule, and no tap target beyond
  // the button itself, so what rides down the page is a button and not a bar.
  const shed = await head.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, border: cs.borderBottomWidth, pe: cs.pointerEvents };
  });
  expect(shed.bg).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  expect(shed.border).toBe("0px");
  expect(shed.pe).toBe("none");
  await expect(toggle).toHaveCSS("pointer-events", "auto");

  await toggle.click();
  await expect(head).not.toHaveAttribute("data-collapsed", "");
  await expect(page.locator("[data-atlas-search]")).toBeFocused();

  // The chips are no longer part of the sticky header — they scroll away with the page.
  expect(await head.locator(".atlas-chips").count()).toBe(0);
  await expect(page.locator(".atlas-chips")).toBeAttached();
});

test("the search field still works with no JavaScript, and no dead button is offered", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(HUB, { waitUntil: "domcontentloaded" });
  // Server default is the opposite of the enhanced one, on purpose.
  await expect(page.locator("[data-atlas-search]")).toBeVisible();
  await expect(page.locator("[data-atlas-search-toggle]")).toBeHidden();
  await ctx.close();
});

test("every trip row carries its own cover plate, asked for at plate size", async ({ page }) => {
  await page.goto(HUB, { waitUntil: "networkidle" });
  const rows = page.locator(".atlas-sheets .atlas-sheet");
  const n = await rows.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    await expect(rows.nth(i).locator(".atlas-sheet-plate")).toBeAttached();
    // The survey number survives the photo — it is the guide's D6 ordinal, not decoration.
    await expect(rows.nth(i).locator(".atlas-sheet-num")).toBeAttached();
    /* ...but not ON it. The plate is 56px square and the number used to be stamped into a
       corner of it with its own opaque ground, eating part of the one image in the row
       (creator, 2026-08-09). Asserting the containment, not the pixels: "is it inside the
       plate" is the thing that was wrong and it cannot drift back silently. */
    await expect(rows.nth(i).locator(".atlas-sheet-plate .atlas-sheet-num")).toHaveCount(0);
  }
  // A 56px plate must not be pulling full-size originals (Nyhavn is 258 KB unresized).
  const srcs = await page.locator(".atlas-sheet-thumb").evaluateAll((els) =>
    els.map((e) => (e as HTMLImageElement).getAttribute("src") || ""));
  for (const src of srcs) {
    if (src.includes("Special:FilePath")) expect(src).toContain("width=");
  }
});

test("mobile globe: each surveyed country names itself without being tapped", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  // Reduced motion parks the auto-spin. Without it the chips move between Playwright's
  // actionability check and the click itself, and the click lands on the canvas behind —
  // which is a property of testing a spinning globe, not a bug in the chips.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();

  // The globe spins, so at least one guide is always facing the viewer; wait for the
  // first frame that shows one rather than assuming a fixed rotation.
  const shown = page.locator(".atlas-pinchip[data-on]");
  await expect(shown.first()).toBeVisible({ timeout: 15000 });
  await expect(shown.first().locator(".atlas-pinchip-name")).not.toBeEmpty();
  // Status is carried as data, so the dot's colour can never disagree with the trip.
  const statuses = await page.locator(".atlas-pinchip").evaluateAll((els) =>
    els.map((e) => e.getAttribute("data-status")));
  expect(statuses.length).toBeGreaterThan(0);
  for (const s of statuses) expect(["ongoing", "upcoming", "past", "undated"]).toContain(s);

  // Tapping a chip must do what tapping its pin does — raise the sheet, not navigate away.
  const url = page.url();
  await shown.first().click();
  await expect(page.locator("[data-atlas-pingsheet]")).toBeVisible();
  expect(page.url()).toBe(url);
});

test("desktop keeps its full pincards and shows no phone chips", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();
  await expect(page.locator(".atlas-pincard").first()).toBeAttached({ timeout: 15000 });
  await expect(page.locator(".atlas-pinchip")).toHaveCount(0);
});

test("the globe carries a hideable readout for the featured trip, and remembers the choice", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();

  const dock = page.locator("[data-atlas-dock]");
  await expect(dock).toBeVisible();
  // Collapsed by default: the pill says which trip and what time it is there.
  await expect(dock.locator(".atlas-dock-name")).not.toBeEmpty();
  await expect(dock.locator(".atlas-dock-body")).toBeHidden();

  await dock.locator("[data-atlas-dock-toggle]").click();
  await expect(dock.locator(".atlas-dock-body")).toBeVisible();
  // The expanded state is the point — real, dialable numbers, not a description of them.
  const tel = dock.locator(".atlas-dock-tel").first();
  await expect(tel).toHaveAttribute("href", /^tel:/);

  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();
  await expect(page.locator("[data-atlas-dock] .atlas-dock-body")).toBeVisible();
});

test("the dock stands down while another bottom surface owns the screen", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();

  const dock = page.locator("[data-atlas-dock]");
  await expect(dock).toBeVisible();
  await page.locator("[data-atlas-menufab]").click();
  await expect(dock).toBeHidden();
  await page.locator("[data-atlas-menufab]").click();
  await expect(dock).toBeVisible();
});

test("the dock is a globe surface only — no JS, and no phone dock on desktop", async ({ browser, page }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const noJs = await ctx.newPage();
  await noJs.goto(HUB, { waitUntil: "domcontentloaded" });
  // Ships hidden: without JS the reader is on the table view, which already carries this
  // data in its quick card.
  await expect(noJs.locator("[data-atlas-dock]")).toBeHidden();
  await ctx.close();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await expect(page.locator("[data-atlas-dock]")).toBeHidden();
});


test("the ping sheet's grip is a real handle — dragging it down dismisses the sheet", async ({ page }) => {
  // It drew a drag affordance and listened to nothing (creator, 2026-08-09). A control that
  // looks draggable and is not is worse than no control at all.
  await page.setViewportSize({ width: 402, height: 874 });
  /* NOT reduced motion, deliberately. sheet-drag.js skips writing the transform entirely when
     motion is reduced (`if (!reduced)`), so a reduced-motion run never exercises the dragged
     path at all — it was passing without ever moving the sheet. The real path also needs
     .atlas-pingsheet.sheet-dragging{transition:none}, or each pointermove restarts a 240ms
     tween and the sheet trails the thumb. Both are now under test. */
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();

  /* The chip is clicked through the DOM, not the pointer. This test cannot run under reduced
     motion (see above), so the globe is spinning and the chip moves between Playwright's
     actionability check and its click — which is what the earlier reduced-motion run was
     quietly working around. Dispatching the click directly tests the same handler. */
  const chip = page.locator(".atlas-pinchip[data-on]").first();
  await chip.waitFor({ state: "attached", timeout: 15000 });
  await chip.evaluate((el) => (el as HTMLElement).click());
  const sheet = page.locator("[data-atlas-pingsheet]");
  await expect(sheet).toBeVisible();

  // A TOUCH drag, not a mouse one: sheet-drag.js ignores `pointerType === "mouse"` on
  // purpose (a mouse has the close button and the backdrop), so driving this with
  // page.mouse would test nothing and pass for the wrong reason.
  await page.locator(".atlas-pingsheet-grip").evaluate((grip) => {
    const panel = grip.closest("[data-atlas-pingsheet]")!;
    const r = grip.getBoundingClientRect();
    const x = r.x + r.width / 2;
    // Dispatched ON THE GRIP, not on the panel. Events bubble to the panel's listener either
    // way, but firing on the panel would pass identically if the grip were a decorative span
    // anywhere in the sheet — which is the exact regression this test exists to catch.
    const fire = (type: string, clientY: number) =>
      grip.dispatchEvent(new PointerEvent(type, {
        bubbles: true, pointerId: 1, pointerType: "touch", clientX: x, clientY,
      }));
    fire("pointerdown", r.y);
    // Past DISMISS_FRACTION of the sheet's own height, in steps, so the handler sees real
    // travel rather than one jump.
    const h = panel.getBoundingClientRect().height;
    for (let i = 1; i <= 6; i++) fire("pointermove", r.y + (h * 0.6 * i) / 6);
    fire("pointerup", r.y + h * 0.6);
  });

  await expect(sheet).toBeHidden();
  // Dismissing the sheet must hand the screen back to the dock, not leave both gone.
  await expect(page.locator("[data-atlas-dock]")).toBeVisible();
});

test("the ping sheet stops transitioning while a thumb owns its transform", async ({ page }) => {
  /* The sheet gained a .24s transform transition for its entrance. sheet-drag.js writes
     transform on every pointermove, so without a dragging opt-out each move restarts that
     tween and the sheet lags the finger by a quarter second — invisible to every other test,
     because the only drag test used to run under reduced motion. */
  await page.setViewportSize({ width: 402, height: 874 });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();

  const chip = page.locator(".atlas-pinchip[data-on]").first();
  await chip.waitFor({ state: "attached", timeout: 15000 });
  await chip.evaluate((el) => (el as HTMLElement).click());
  const sheet = page.locator("[data-atlas-pingsheet]");
  await expect(sheet).toBeVisible();

  const during = await sheet.evaluate((panel) => {
    const r = panel.getBoundingClientRect();
    const fire = (type: string, clientY: number) =>
      panel.dispatchEvent(new PointerEvent(type, {
        bubbles: true, pointerId: 1, pointerType: "touch", clientX: r.x + r.width / 2, clientY,
      }));
    fire("pointerdown", r.y + 6);
    fire("pointermove", r.y + 30);
    const t = getComputedStyle(panel).transitionProperty;
    fire("pointerup", r.y + 30); // below the dismiss threshold — the sheet springs back
    return t;
  });
  expect(during).toBe("none");
  await expect(sheet).toBeVisible();
});

/* Dismissing a pin sheet must give the world back.

   `flyTo` leaves the globe at 2.1R with `_target` still pointed at the guide it flew to, and
   the 2600ms hold it sets releases only the SPIN. So closing the sheet left a globe rotating in
   close-up around a country nobody had selected any more (creator, 2026-08-09: "the globe
   doesn't re-orient itself and continue spinning"), and the only way back was finding the FIT
   control — which on mobile lives inside the menu sheet.

   `resetView()` was already the right answer and simply had no caller here. Asserted through
   the component's own state rather than by screenshotting a moving globe: the scale target is
   the thing that was stuck, and it is exact. */
test("closing the ping sheet returns the globe to the world and lets it spin again", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();

  const map = page.locator("atlas-map");
  const state = () =>
    map.evaluate((el) => {
      // The component's own internals — the scale target is the thing that was stuck, and it is
      // exact, where a screenshot of a spinning globe would not be.
      const m = el as unknown as { _targetK: number; _R: number; _target: string | null; _hold: boolean };
      return { targetK: m._targetK, R: m._R, target: m._target, hold: m._hold };
    });

  const chip = page.locator(".atlas-pinchip[data-on]").first();
  await chip.waitFor({ state: "attached", timeout: 15000 });
  await chip.evaluate((el) => (el as HTMLElement).click());
  await expect(page.locator("[data-atlas-pingsheet]")).toBeVisible();

  // Zoom in on it, which is what selecting a guide is for.
  await page.locator("[data-atlas-pingsheet-zoom]").click();
  await expect
    .poll(async () => (await state()).targetK > (await state()).R * 1.5, { timeout: 5000 })
    .toBe(true);

  await page.locator("[data-atlas-pingsheet-close]").click();
  await expect(page.locator("[data-atlas-pingsheet]")).toBeHidden();

  const after = await state();
  expect(after.targetK, "the globe is still zoomed into a guide nobody has selected").toBe(after.R);
  expect(after.target, "the dismissed guide is still the map's target").toBeFalsy();
  expect(after.hold, "the spin is still held after the selection cleared").toBeFalsy();
});

/* The phone header spent three rows before the globe got a pixel: brand, then a full-bleed
   WORLD|TABLE bar on a line of its own, then the two buttons on another (creator, 2026-08-09:
   "the World/Table view is too big and should fill up the space ... give more space to the
   globe"). D5's "permanent" switch is about presence, not width.

   Asserted as a ROW SHARE rather than a pixel height: heights drift with fonts and safe-area
   insets, but "these two are on the same line" is exactly the thing that was wrong. */
test("mobile: the view switch shares its row with the header buttons", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });

  const box = async (sel: string) => (await page.locator(sel).boundingBox())!;
  const [brand, toggle, actions, header] = await Promise.all([
    box(".atlas-brand"), box(".atlas-toggle"), box(".atlas-header-actions"), box(".atlas-header"),
  ]);

  // Same line: their vertical spans overlap. Not equal tops — the buttons are shorter than the
  // 44px switch and sit centred against it.
  expect(toggle.y < actions.y + actions.height && actions.y < toggle.y + toggle.height).toBe(true);
  // ...and the switch is no longer full-bleed, which is what forced the extra row.
  expect(toggle.width).toBeLessThan(header.width * 0.8);
  // The brand still gets the full width, so the header reads as one block, not a ragged stack.
  expect(brand.y + brand.height).toBeLessThanOrEqual(toggle.y);
});

/* The globe dock cleared the FAB SIDEWAYS with `margin-right: 64px`, so a card that looked
   full-width had a bite out of one corner with a circle floating in it — the asymmetry the
   creator flagged. Stacking gives the dock the whole width and leaves the FAB the bottom-right
   corner, which is the best place on a phone for a thumb. */
test("mobile: the globe dock spans the screen and clears the FAB by stacking, not by inset", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => sessionStorage.setItem("tg-atlas-cover-seen", "1"));
  await page.goto(HUB, { waitUntil: "networkidle" });
  await page.locator('[data-atlas-mode-btn="world"]').click();

  const dock = page.locator("[data-atlas-dock]");
  await expect(dock).toBeVisible();
  const d = (await dock.boundingBox())!;
  const f = (await page.locator(".atlas-menufab").boundingBox())!;

  // Symmetric: equal gutters either side, rather than 12px one side and 76px the other.
  expect(Math.round(d.x)).toBeCloseTo(Math.round(375 - (d.x + d.width)), -1);
  expect(d.width).toBeGreaterThan(375 * 0.9);
  // Stacked, not overlapping — the dock ends above the FAB.
  expect(d.y + d.height).toBeLessThanOrEqual(f.y);
  // The FAB kept the corner.
  expect(f.x + f.width).toBeGreaterThan(375 * 0.8);
});
