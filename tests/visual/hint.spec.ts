/* The `?` affordance (creator, 2026-08-08: explanations should be there but not take up
   space). Gates the three ways in and the one thing that must never happen — a hint that
   activates the control it sits inside. */
// @protects-file The '?' explains a control without covering the page or losing half its own sentence.

import { test, expect, type Page } from "@playwright/test";

const KOREA = "/Trip-Guides/guides/korea/";

// Every `?` sits on a TOOL panel, and R5 moved those into the guide's Tools station — so
// reaching one means opening that station first, which is why the no-JS case changed shape.
async function openTools(page: Page, waitUntil: "domcontentloaded" | "networkidle" = "networkidle") {
  await page.goto(KOREA, { waitUntil });
  await page.locator('.grail-stop[data-kind="tools"]').click();
  await expect(page.locator(".catblock--tools")).toBeVisible();
  await settle(page, ".catblock--tools");
}

/* Opening a station is not instant — the rail centres its stop and the chrome runs a 280ms
   transform — so a hover issued during that window slides off the button and the bubble falls
   back to 0. Two identical bounding boxes is the real precondition; a sleep would be a guess. */
async function settle(page: Page, selector: string) {
  const box = () => page.locator(selector).evaluate((e) => {
    const r = e.getBoundingClientRect();
    return `${Math.round(r.top)}:${Math.round(r.left)}`;
  });
  let last = await box();
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(50);
    const now = await box();
    if (now === last) return;
    last = now;
  }
}

test("a panel's explanation is off the screen but in the page", async ({ page }) => {
  await openTools(page, "domcontentloaded");
  const hint = page.locator(".pnl-headings .hint").first();
  await expect(hint.locator(".hint-btn")).toBeVisible();
  // Present and described, so a screen reader announces it with the control.
  const btn = hint.locator(".hint-btn");
  const id = await btn.getAttribute("aria-describedby");
  expect(id).toBeTruthy();
  await expect(page.locator(`#${id}`)).toHaveAttribute("role", "tooltip");
  await expect(page.locator(`#${id}`)).not.toBeEmpty();
  // ...but not painted until asked for.
  expect(await page.locator(`#${id}`).evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
});

test("hovering reveals it, and so does keyboard focus — on CSS alone", async ({ page }) => {
  /* This ran with JavaScript off while the panels were visible on load. A station needs script
     to open, so the claim split: the REVEAL is still pure CSS and is proven here; what survives
     with no script at all is proven below. Nothing was downgraded quietly. */
  await openTools(page, "domcontentloaded");
  const hint = page.locator(".pnl-headings .hint").first();
  const bubble = hint.locator(".hint-bubble");

  await hint.locator(".hint-btn").hover();
  await expect(bubble).toHaveCSS("opacity", "1");

  await page.mouse.move(0, 0);
  await hint.locator(".hint-btn").focus();
  await expect(bubble).toHaveCSS("opacity", "1");
});

test("with no script at all, the explanation is still IN the document", async ({ browser }) => {
  /* Scriptless readers cannot open any station — true of every group since the guide became
     tabbed. What must not ALSO be true is that the explanations are built by script: one
     assembled on the client never reaches a text-mode reader, a scraper, or print. */
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(KOREA, { waitUntil: "domcontentloaded" });
  const hints = page.locator(".catblock--tools .pnl-headings .hint");
  expect(await hints.count()).toBeGreaterThan(3);
  const id = await hints.first().locator(".hint-btn").getAttribute("aria-describedby");
  expect(id, "the hint's aria wiring is server-rendered, not assembled on the client").toBeTruthy();
  await expect(page.locator(`#${id}`)).not.toBeEmpty();
  await ctx.close();
});

test("tapping opens it — the case hover cannot serve — and Escape closes it", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await openTools(page);
  const hint = page.locator(".pnl-headings .hint").first();
  const btn = hint.locator(".hint-btn");

  await btn.click();
  await expect(hint).toHaveAttribute("data-open", "");
  await expect(btn).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(hint).not.toHaveAttribute("data-open", "");
});

test("asking what a panel is does not collapse the panel", async ({ page }) => {
  // The `?` sits inside the Panel header, whose toggle collapses the whole thing. A hint
  // that also fired that toggle would answer the question and hide the answer.
  await openTools(page);
  const panel = page.locator("[data-panel^='tools-closures-']");
  const toggle = panel.locator("[data-panel-toggle]");
  const before = await toggle.getAttribute("aria-expanded");
  await panel.locator(".hint-btn").click();
  await expect(toggle).toHaveAttribute("aria-expanded", before!);
});

test("only one hint is open at a time", async ({ page }) => {
  await openTools(page);
  const hints = page.locator(".pnl-headings .hint");
  await hints.nth(0).locator(".hint-btn").click();
  await hints.nth(1).locator(".hint-btn").click();
  await expect(page.locator("[data-hint][data-open]")).toHaveCount(1);
});

/* An explanation that opens past the right edge of the screen is not merely awkward: `body` is
   `overflow-x: clip`, so the overflowing half is not scrollable, it is gone. No scrollbar
   appears to suggest it exists and no gesture reveals it — the sentence just stops. The tools
   screen had four bubbles in that state at 375px.

   Every hint is checked rather than a sample, because the collision depends on where a
   particular `?` happens to sit; testing the first one proves nothing about the last. */
test("every hint bubble stays on screen when opened at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openTools(page);

  const buttons = page.locator("[data-hint-btn]");
  const n = await buttons.count();
  expect(n, "no hints in the Tools station — this test would pass vacuously").toBeGreaterThan(3);

  const offenders: string[] = [];
  for (let i = 0; i < n; i++) {
    const btn = buttons.nth(i);
    await btn.click();
    const box = await btn.evaluate((el) => {
      const hint = (el as HTMLElement).closest("[data-hint]")!;
      const b = hint.querySelector(".hint-bubble")!.getBoundingClientRect();
      return { left: b.left, right: b.right, vw: document.documentElement.clientWidth, text: (hint.textContent || "").slice(0, 40) };
    });
    if (box.right > box.vw || box.left < 0) {
      offenders.push(`hint ${i} ("${box.text.trim()}") spans ${Math.round(box.left)}–${Math.round(box.right)} in a ${box.vw}px viewport`);
    }
  }
  expect(offenders, "a hint opens outside the viewport; overflow-x:clip destroys the part that hangs over").toEqual([]);
});
