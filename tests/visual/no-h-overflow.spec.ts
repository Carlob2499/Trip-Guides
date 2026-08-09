/* Nothing may push a page wider than the phone it is read on.

   Written because of a shipped one, and the shape of that bug is the reason this is a gate
   rather than a fix. `anchors.css`'s mobile block set `.anch-scroll{overflow-x:visible}` and
   `.jline{min-width:0}` — correct for the DATE rail it was written for, whose labels are a
   weekday and a number. The ROUTE rail inherited it, and route names are 14ch and do not
   compress. Nine of them widened their card past the viewport.

   The figure looking wrong was the cheap half. The expensive half is that EVERY step's prose in
   that card then wrapped to the card's new too-wide measure, so each line lost its ending
   against the right edge of the screen — "fly into and out of T", "a ~13-hr flight is possible
   but". Text was being destroyed by a layout bug three elements away, and no test in this repo
   could see it: the unit suites do not lay anything out, and axe does not measure geometry.

   So this asserts the property directly, at the width it matters, and NAMES the widest culprit
   rather than just failing — a bare "1206 > 375" sends you hunting through a whole page.

   375px is the floor the ship loop already checks by hand (iPhone SE / mini). A page that fits
   there fits everything above it. */
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
    await page.addStyleTag({ content: `[role=tabpanel]{display:block !important}` });
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
