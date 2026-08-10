// Performance budget gate — fails CI if the built bundles bloat past budget, so the site's
// speed survives future features. Raw (uncompressed) sizes.
//
// M2/perf: split into a FIRST-PAINT tier and a TOTAL tier. The 900 KB total budget alone
// couldn't catch a first-paint regression — it's ~78% lazy chunks (Firebase, gsap, pdf.js),
// so a genuinely heavy addition to the ALWAYS-loaded entry graph could still pass while a
// visitor's actual time-to-interactive got worse. First-paint is derived from the real built
// artifact, not a hardcoded chunk-name list (the same "read dist/, don't memorize names"
// principle gen-sw-precache.mjs uses): every page's <script type="module" src> tag is a real
// entry, and each entry's STATIC `import ... from "./x.js"` specifiers are what the browser
// necessarily fetches before that script can run. A DYNAMIC `import("./x.js")` call (gsap,
// pdf.js, Firebase, qrcode — all confirmed lazy in the codebase) is deliberately excluded:
// that's exactly the boundary between "blocks first paint" and "loads on demand."
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const ASTRO_DIR = join(DIST, "_astro");
const BUDGET = {
  firstPaintJs: 200 * 1024, // every page's entry graph — today's measured max is ~127 KB
  js:  900 * 1024,  // total baseline JS across all pages (the lazy Firebase/gsap/pdf/d3 chunks dominate this)
  css: 300 * 1024,  // all CSS combined
  maxFile: 500 * 1024, // no single bundle larger than this
};

// On-demand chunks a visitor pulls ONLY via explicit interaction, so they aren't part of the
// baseline page weight the `js` budget protects (pdf.js on a booking upload, d3/topojson-client
// behind the Atlas globe's dynamic import() — docs/archive/PLAN_ATLAS_MIGRATION.md Stage C.2/D19). Derived
// STRUCTURALLY (same "read dist/, don't memorize names" principle as gen-sw-precache.mjs) —
// a chunk is on-demand precisely when it never appears in ANY page's first-paint closure, i.e.
// Rollup only emitted it because something reached it via a dynamic import(). That replaces a
// hand-maintained name pattern (fragile: d3's dependency graph splits into generically-named
// index.esm.*.js chunks with no stable filename to match on) and generalizes to whatever the
// next lazy-loaded feature turns out to be. Still subject to maxFile below.

function findHtmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...findHtmlFiles(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

// Every <script type="module" src="..."> per built page — a SINGLE page's real, guaranteed
// entry set (not a union across pages: the hub and a guide page never load together, so
// summing their entries would double-count a load that never happens).
function entryChunksByPage() {
  const byPage = new Map();
  for (const file of findHtmlFiles(DIST)) {
    const html = readFileSync(file, "utf8");
    const entries = new Set();
    for (const m of html.matchAll(/<script[^>]*type="module"[^>]*\ssrc="([^"]+)"/g)) {
      entries.add(m[1].split("/").pop());
    }
    if (entries.size) byPage.set(file, entries);
  }
  return byPage;
}

// Static imports only (`from "./x.js"` / `export ... from "./x.js"`) — NOT dynamic import("./x.js")
// calls, which is exactly the signal for "lazy, not first-paint."
function staticImportsOf(chunkName) {
  const p = join(ASTRO_DIR, chunkName);
  let src;
  try { src = readFileSync(p, "utf8"); } catch { return []; }
  const out = [];
  for (const m of src.matchAll(/\bfrom\s*["']([^"']+\.m?js)["']/g)) {
    out.push(m[1].split("/").pop());
  }
  return out;
}

function firstPaintClosure(entries) {
  const seen = new Set();
  const queue = [...entries];
  while (queue.length) {
    const name = queue.pop();
    if (seen.has(name)) continue;
    seen.add(name);
    for (const dep of staticImportsOf(name)) {
      if (!seen.has(dep)) queue.push(dep);
    }
  }
  return seen;
}

// The union of every page's first-paint closure — a .js chunk absent from ALL of them was
// only emitted because some dynamic import() reached it, i.e. it's on-demand by construction.
const pageEntries = [...entryChunksByPage()];
const firstPaintReachable = new Set();
for (const [, entries] of pageEntries) {
  for (const name of firstPaintClosure(entries)) firstPaintReachable.add(name);
}
const isOnDemand = (name) => !firstPaintReachable.has(name);

let js = 0, onDemand = 0, css = 0, worst = { name: "", size: 0 };
const astroFiles = readdirSync(ASTRO_DIR);
for (const f of astroFiles) {
  const size = statSync(join(ASTRO_DIR, f)).size;
  if (f.endsWith(".js")) {
    if (isOnDemand(f)) onDemand += size;
    else js += size;
  } else if (f.endsWith(".css")) css += size;
  else continue;
  if (size > worst.size) worst = { name: f, size };
}

const kb = (n) => (n / 1024).toFixed(0) + " KB";

// The metric that matters is the WORST single page's first-paint weight, not a sum across
// pages that never load together.
let worstPage = { file: "", size: 0, count: 0 };
for (const [file, entries] of pageEntries) {
  const closure = firstPaintClosure(entries);
  let size = 0;
  for (const name of closure) {
    if (!name.endsWith(".js")) continue;
    try { size += statSync(join(ASTRO_DIR, name)).size; } catch { /* not an _astro chunk (e.g. inline) */ }
  }
  if (size > worstPage.size) worstPage = { file, size, count: closure.size };
}

console.log(
  `[perf-budget] worst first-paint page ${worstPage.file} — ${kb(worstPage.size)} / ${kb(BUDGET.firstPaintJs)} (${worstPage.count} entry+static chunks) · ` +
  `total JS ${kb(js)} / ${kb(BUDGET.js)} · CSS ${kb(css)} / ${kb(BUDGET.css)} · largest ${worst.name} ${kb(worst.size)}` +
  `${onDemand ? ` · (+${kb(onDemand)} on-demand — pdf.js, d3/topojson-client, etc. — not in either budget)` : ""}`
);

const fails = [];
if (worstPage.size > BUDGET.firstPaintJs) fails.push(`${worstPage.file} first-paint JS ${kb(worstPage.size)} exceeds ${kb(BUDGET.firstPaintJs)} — something landed in the ALWAYS-loaded entry graph, not a lazy chunk`);
if (js > BUDGET.js) fails.push(`total JS ${kb(js)} exceeds ${kb(BUDGET.js)}`);
if (css > BUDGET.css) fails.push(`CSS total ${kb(css)} exceeds ${kb(BUDGET.css)}`);
if (worst.size > BUDGET.maxFile) fails.push(`${worst.name} (${kb(worst.size)}) exceeds per-file ${kb(BUDGET.maxFile)}`);
if (fails.length) {
  console.error("[perf-budget] FAIL:\n  " + fails.join("\n  "));
  process.exit(1);
}
console.log("[perf-budget] OK");
