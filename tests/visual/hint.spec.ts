/* The `?` affordance (creator, 2026-08-08: explanations should be there but not take up
   space). Gates the three ways in and the one thing that must never happen — a hint that
   activates the control it sits inside. */
import { test, expect } from "@playwright/test";

const TOOLS = "/Trip-Guides/tools/korea/";

test("a panel's explanation is off the screen but in the page", async ({ page }) => {
  await page.goto(TOOLS, { waitUntil: "domcontentloaded" });
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

test("hovering reveals it, and so does keyboard focus — both without JavaScript", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(TOOLS, { waitUntil: "domcontentloaded" });
  const hint = page.locator(".pnl-headings .hint").first();
  const bubble = hint.locator(".hint-bubble");

  await hint.locator(".hint-btn").hover();
  await expect(bubble).toHaveCSS("opacity", "1");

  await page.mouse.move(0, 0);
  await hint.locator(".hint-btn").focus();
  await expect(bubble).toHaveCSS("opacity", "1");
  await ctx.close();
});

test("tapping opens it — the case hover cannot serve — and Escape closes it", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto(TOOLS, { waitUntil: "networkidle" });
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
  await page.goto(TOOLS, { waitUntil: "networkidle" });
  const panel = page.locator("[data-panel^='tools-closures-']");
  const toggle = panel.locator("[data-panel-toggle]");
  const before = await toggle.getAttribute("aria-expanded");
  await panel.locator(".hint-btn").click();
  await expect(toggle).toHaveAttribute("aria-expanded", before!);
});

test("only one hint is open at a time", async ({ page }) => {
  await page.goto(TOOLS, { waitUntil: "networkidle" });
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
  await page.goto(TOOLS, { waitUntil: "networkidle" });

  const buttons = page.locator("[data-hint-btn]");
  const n = await buttons.count();
  expect(n, "no hints on the tools page — this test would pass vacuously").toBeGreaterThan(3);

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
