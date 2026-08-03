/* axe pass over the /progress/ design study (PREVIEW-ONLY tooling; deletes with the study).
 *   node docs/mockups/axe-progress-study.mjs [--port 4399]
 * Every option × light/dark × mobile/desktop × three states, WCAG 2 A/AA rules only. */
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const argv = process.argv.slice(2);
const i = argv.indexOf("--port");
const PORT = i >= 0 ? argv[i + 1] : "4399";
const ORIGIN = `http://localhost:${PORT}/Trip-Guides/progress-preview`;
const IDENT = "country=South+Korea&slug=south-korea";

const OPTIONS = ["first-light", "departures", "neatline", "two-passes"];
const STATES = ["mid", "stuck", "done"];
const browser = await chromium.launch();
let checked = 0;
const findings = [];

for (const option of OPTIONS) {
  for (const theme of ["light", "dark"]) {
    for (const vp of [{ w: 375, h: 812, id: "mobile" }, { w: 1280, h: 900, id: "desktop" }]) {
      for (const state of STATES) {
        const ctx = await browser.newContext({
          viewport: { width: vp.w, height: vp.h },
          colorScheme: theme,
        });
        const page = await ctx.newPage();
        await page.goto(`${ORIGIN}/${option}/?bare=1&${IDENT}&state=${state}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1400);
        const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        checked++;
        for (const v of res.violations) {
          findings.push(`${option}/${state}/${theme}/${vp.id}  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
          for (const n of v.nodes.slice(0, 2)) findings.push(`      ${n.target.join(" ")} :: ${(n.failureSummary || "").split("\n").slice(0, 2).join(" | ")}`);
        }
        await ctx.close();
      }
    }
  }
}
await browser.close();

console.log(`\naxe: ${checked} page states checked`);
if (findings.length) {
  console.log(`\nVIOLATIONS:`);
  for (const f of findings) console.log("  " + f);
  process.exitCode = 1;
} else {
  console.log("Zero WCAG 2 A/AA violations across every option, theme, breakpoint and state.");
}
