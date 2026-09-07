/* Every shipped page is claimed by at least one gate, and every gate points at a page that exists.

   Both directions have already failed in this repo, which is why this is a script and not a
   convention:

   · A page nothing looked at. The change-request surface shipped a 36px control because no
     touch sweep listed it; the Itinerary and Split destinations were never measured at all.
     Each was found by hand, months apart, and only because someone happened to look.

   · A gate pointing at nothing. tests/visual/a11y.spec.ts carries its own account of
     `["trip tools", "/Trip-Guides/tools/korea/"]` outliving the route it named — "for four
     combos the gate was scanning Astro's own 404 page, finding nothing, and reporting a pass".
     A green run and an absent page look identical from the outside.

   So this asserts the pairing in both directions: dist has no route missing from COVERAGE, and
   COVERAGE names no route missing from dist. Adding a page therefore forces a decision about
   which gate owns it, and deleting one forces the gates to let go.

   COVERAGE is a closed list in this repo's ALLOWED/TARGET_BASELINE idiom: an entry is a claim
   someone made on purpose, and the diff is where it gets made. Each route names the gates that
   actually visit it, and the claim is verified — a gate that does not mention the route in its
   source cannot be listed as covering it. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = path.join(ROOT, "dist");
const SPEC_DIR = path.join(ROOT, "tests", "visual");

/* route -> the gates that visit it. A gate name is a spec filename; the route must appear in
   that file's source, so a stale claim here is a failure rather than a comforting label. */
const COVERAGE = {
  "/Trip-Guides/": ["a11y.spec.ts", "resilience.spec.ts"],
  "/Trip-Guides/about/": ["a11y.spec.ts"],
  "/Trip-Guides/change/": ["a11y.spec.ts"],
  "/Trip-Guides/gallery/": ["gallery-baselines.spec.ts"],
  "/Trip-Guides/guides/korea/": ["a11y.spec.ts", "resilience.spec.ts", "cover-contrast.spec.ts", "theme-registers.spec.ts"],
  "/Trip-Guides/guides/denmark/": ["a11y.spec.ts", "resilience.spec.ts", "cover-contrast.spec.ts"],
  "/Trip-Guides/health/": ["a11y.spec.ts"],
  "/Trip-Guides/new/": ["a11y.spec.ts", "resilience.spec.ts"],
  "/Trip-Guides/progress/": ["a11y.spec.ts", "resilience.spec.ts"],
  "/Trip-Guides/progress/triage/": ["a11y.spec.ts", "theme-registers.spec.ts"],
};

if (!fs.existsSync(DIST)) {
  console.error("[surface-coverage] no dist/ — run `npm run build` first.");
  process.exit(1);
}

function routes(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) routes(p, out);
    else if (name === "index.html") {
      const rel = path.relative(DIST, path.dirname(p)).split(path.sep).filter(Boolean).join("/");
      out.push(`/Trip-Guides/${rel ? rel + "/" : ""}`);
    }
  }
  return out;
}

const built = routes(DIST).sort();
const claimed = Object.keys(COVERAGE).sort();
const specSrc = Object.fromEntries(
  fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith(".spec.ts"))
    .map((f) => [f, fs.readFileSync(path.join(SPEC_DIR, f), "utf8")]),
);

const problems = [];

for (const r of built) {
  if (!COVERAGE[r]) {
    problems.push(`SHIPPED BUT UNGATED  ${r}\n    Nothing measures this page. Add it to a gate's page list, then record the gate here.`);
    continue;
  }
  for (const gate of COVERAGE[r]) {
    if (!specSrc[gate]) { problems.push(`NO SUCH GATE  ${gate} (claimed for ${r})`); continue; }
    /* The route with or without its trailing slash — specs write both forms, and a hash
       destination (…/#dest-map) still counts as visiting the page. */
    const bare = r.replace(/\/$/, "");
    if (!specSrc[gate].includes(r) && !specSrc[gate].includes(bare)) {
      problems.push(`CLAIM NOT HONOURED  ${gate} is listed as covering ${r}, but never mentions it.`);
    }
  }
}

for (const r of claimed) {
  if (!built.includes(r)) {
    problems.push(`GATED BUT NOT SHIPPED  ${r}\n    A gate points at a route the build does not produce — it is measuring a 404 and passing.`);
  }
}

if (problems.length) {
  console.error(`[surface-coverage] FAIL — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error("");
  console.error("  Every shipped page must be claimed by a gate, and every claim must be true.");
  process.exit(1);
}

console.log(`[surface-coverage] OK — ${built.length} shipped page(s), each claimed by a gate that visits it.`);
