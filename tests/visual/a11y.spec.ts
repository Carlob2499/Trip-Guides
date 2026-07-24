/* Accessibility gate — axe-core over the hub + Korea guide, riding the same
   deterministic harness as the visual suite (fixed clock, network aborted).
   GATE: zero serious/critical violations. Minor/moderate findings are reported
   to the console but don't fail — tighten once the backlog is empty. */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const FIXED_TIME = new Date("2026-09-01T10:00:00+09:00");

async function prep(page: Page, path: string) {
  await page.route("**/*", (route) =>
    route.request().url().startsWith("http://localhost:4322") ? route.continue() : route.abort(),
  );
  // REDUCED MOTION IS LOAD-BEARING, not a nicety. reveal.js marks content .reveal-pending
  // (opacity:0) and only un-hides it via a 4s setTimeout safety rail — and the fixed clock below
  // means that timer NEVER fires. Without this line the whole page sits at opacity 0 while axe
  // scans, axe skips invisible elements, and the gate reports zero violations on a page it never
  // actually saw. It passed that way for months. Reduced motion short-circuits the reveal in both
  // reveal.js (`if (reducedMotion()) return`) and overview.css (`.reveal-pending{opacity:1}`), so
  // the content is up immediately and the audit no longer depends on animation timing at all.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
}

/* Guard the guard. An audit of an invisible page is worse than no audit — it reports success. This
   asserts the content axe is about to scan is actually rendered, so if anything ever hides it from
   the harness again, THIS fails loudly instead of the gate quietly going green. */
async function assertContentVisible(page: Page, name: string) {
  const seen = await page.evaluate(() => {
    const cumulativeOpacity = (el: Element | null) => {
      let o = 1;
      for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
        o *= parseFloat(getComputedStyle(n).opacity || "1");
      }
      return o;
    };
    // Sample real content, not chrome: headings, cards and links are what the audit is FOR.
    const sample = [...document.querySelectorAll("main a, main h2, main .card, .hubcard")].slice(0, 40);
    return {
      sampled: sample.length,
      invisible: sample.filter((el) => cumulativeOpacity(el) === 0).length,
      stillPending: document.querySelectorAll(".reveal-pending").length,
    };
  });
  expect(seen.sampled, `${name}: found no content to audit`).toBeGreaterThan(0);
  expect(
    seen.invisible,
    `${name}: ${seen.invisible}/${seen.sampled} sampled elements are at opacity 0 ` +
      `(${seen.stillPending} still .reveal-pending) — axe would skip them and pass vacuously`,
  ).toBe(0);
}

// Every page shape the site builds: the hub, and BOTH guides. Korea and Denmark
// differ in ways axe can see — Denmark has no learnings block (so no reality
// layer), Korea carries four extra content groups and a habitats/raids grid — so
// covering one guide leaves the other's markup ungated.
for (const [name, path] of [
  ["hub", "/Trip-Guides/"],
  ["korea guide", "/Trip-Guides/guides/korea/"],
  ["denmark guide", "/Trip-Guides/guides/denmark/"],
] as const) {
  test(`a11y — ${name}`, async ({ page }) => {
    await prep(page, path);
    await assertContentVisible(page, name);
    const results = await new AxeBuilder({ page }).analyze();
    // Gate on moderate+ (was serious/critical). The landmark + full tablist ARIA work cleared
    // every moderate finding, so this locks that in: only true `minor` stays non-blocking.
    const BLOCKING = new Set(["moderate", "serious", "critical"]);
    const bad = results.violations.filter((v) => BLOCKING.has(v.impact ?? ""));
    const minor = results.violations.filter((v) => !BLOCKING.has(v.impact ?? ""));
    if (minor.length) {
      console.log(`[a11y] ${name}: ${minor.length} minor finding(s) (non-blocking):`);
      for (const v of minor) console.log(`  · ${v.id} (${v.impact}) — ${v.nodes.length} node(s): ${v.help}`);
    }
    expect(
      bad.map((v) => `${v.id} (${v.impact}) — ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n  ")}`),
      "moderate+ accessibility violations",
    ).toEqual([]);
  });
}
