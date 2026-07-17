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
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
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
    const results = await new AxeBuilder({ page }).analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    const minor = results.violations.filter((v) => v.impact !== "serious" && v.impact !== "critical");
    if (minor.length) {
      console.log(`[a11y] ${name}: ${minor.length} minor/moderate finding(s) (non-blocking):`);
      for (const v of minor) console.log(`  · ${v.id} (${v.impact}) — ${v.nodes.length} node(s): ${v.help}`);
    }
    expect(
      bad.map((v) => `${v.id} (${v.impact}) — ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n  ")}`),
      "serious/critical accessibility violations",
    ).toEqual([]);
  });
}
