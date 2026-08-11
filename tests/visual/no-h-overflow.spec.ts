/* A page wider than the phone does not just look wrong: `body` is overflow-x:clip, so the
   overhang is cut off, and every paragraph beside it has already wrapped to the wider
   measure and lost the end of each line. Reported failures name the widest offender. */
// @protects-file Nothing runs off the side of a phone screen, so no sentence ever loses its ending.

import { test, expect } from "@playwright/test";

const GUIDES = ["korea", "japan", "denmark", "us"] as const;

const PAGES: ReadonlyArray<readonly [string, string]> = [
  ["hub", "/Trip-Guides/"],
  ["about", "/Trip-Guides/about/"],
  ["new intake", "/Trip-Guides/new/"],
  ["trip tools", "/Trip-Guides/tools/korea/"],
  ...GUIDES.map((g) => [`guide: ${g}`, `/Trip-Guides/guides/${g}/`] as const),
];

/** The widest elements that stick out past the viewport, worst first. Reported on failure so
 *  the message points at a selector instead of a number. */
async function overflowingElements(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out: { sel: string; right: number; width: number }[] = [];
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>("*"))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      /* Skip what is not currently painted. A tooltip bubble is laid out at rest but sits at
         opacity 0 until revealed, and several of them are anchored past the right edge — real,
         but a DIFFERENT bug with a different fix (hint.js measures and shifts on reveal, and
         hint.spec.ts asserts it). Counting them here would fail this gate for something it
         cannot see and cannot describe: it would report a clipped paragraph that nobody is
         looking at. What this gate is for is content the reader is reading right now. */
      const cs0 = getComputedStyle(el);
      if (cs0.visibility === "hidden" || cs0.display === "none" || Number(cs0.opacity) === 0) continue;
      // Only count what is actually laid out past the edge. An element inside its own
      // horizontal scroller is CONTAINED, not overflowing — that is the fix, not the bug.
      let clipped = false;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ov = getComputedStyle(p).overflowX;
        if (ov === "auto" || ov === "scroll" || ov === "hidden") { clipped = true; break; }
      }
      if (clipped) continue;
      if (r.right <= vw + 1) continue;
      const sel =
        el.tagName.toLowerCase() +
        (el.id ? `#${el.id}` : "") +
        (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : "");
      out.push({ sel, right: Math.round(r.right), width: Math.round(r.width) });
    }
    return out.sort((a, b) => b.right - a.right).slice(0, 6);
  });
}

for (const [name, path] of PAGES) {
  test(`${name}: fits a 375px phone without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path, { waitUntil: "networkidle" });

    // Tab panels are `hidden` unless their tab is active, so a defect in a non-default group is
    // invisible to a single page load — which is exactly where the shipped one lived (Transit).
    // Revealing them all stacks panels VERTICALLY, so it cannot manufacture a horizontal
    // failure; it only exposes ones that were already there. Same override the a11y gate uses.
    await page.addStyleTag({ content: `[role=region]{display:block !important}` });
    await page.waitForTimeout(150); // let the reveal settle before measuring geometry

    const offenders = await overflowingElements(page);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(
      offenders,
      `${name} overflows its viewport (scrollWidth ${scrollWidth} > ${clientWidth}). ` +
        `Widest offenders:\n` +
        offenders.map((o) => `  ${o.sel} — right edge ${o.right}px, width ${o.width}px`).join("\n") +
        `\nAn element wider than the screen also re-wraps every sibling's text to a measure ` +
        `the screen cannot show, so prose loses the end of each line. Either constrain it or ` +
        `give it its own overflow-x:auto scroller.`,
    ).toEqual([]);

    // Belt and braces: the offender scan walks elements, this catches anything it missed
    // (pseudo-elements, transforms) that still widened the document.
    expect(scrollWidth, `${name}: document is wider than the viewport`).toBeLessThanOrEqual(clientWidth + 1);
  });
}
