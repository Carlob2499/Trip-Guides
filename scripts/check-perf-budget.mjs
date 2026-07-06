// Performance budget gate — fails CI if the built bundles bloat past the
// budget, so the site's speed survives future features. Raw (uncompressed)
// sizes; thresholds are ~2x today's footprint to allow growth while
// catching runaway regressions (a stray heavy dependency, an unsplit chunk).
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist/_astro";
const BUDGET = {
  js:  900 * 1024,  // all JS combined (Leaflet chunk included)
  css: 300 * 1024,  // all CSS combined
  maxFile: 500 * 1024, // no single bundle larger than this
};

let js = 0, css = 0, worst = { name: "", size: 0 };
for (const f of readdirSync(DIST)) {
  const size = statSync(join(DIST, f)).size;
  if (f.endsWith(".js")) js += size;
  else if (f.endsWith(".css")) css += size;
  else continue;
  if (size > worst.size) worst = { name: f, size };
}

const kb = (n) => (n / 1024).toFixed(0) + " KB";
console.log(`[perf-budget] JS ${kb(js)} / ${kb(BUDGET.js)} · CSS ${kb(css)} / ${kb(BUDGET.css)} · largest ${worst.name} ${kb(worst.size)}`);

const fails = [];
if (js > BUDGET.js) fails.push(`JS total ${kb(js)} exceeds ${kb(BUDGET.js)}`);
if (css > BUDGET.css) fails.push(`CSS total ${kb(css)} exceeds ${kb(BUDGET.css)}`);
if (worst.size > BUDGET.maxFile) fails.push(`${worst.name} (${kb(worst.size)}) exceeds per-file ${kb(BUDGET.maxFile)}`);
if (fails.length) {
  console.error("[perf-budget] FAIL:\n  " + fails.join("\n  "));
  process.exit(1);
}
console.log("[perf-budget] OK");
