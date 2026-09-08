/* A stylesheet may not contradict a promise it makes about itself.

   This is the single most productive defect shape found in this codebase, and every instance was
   caught by accident rather than by a check:

   · base.css puts .foot-modify-pill in a `min-height:44px` touch-target list; guide.css then set
     min-height:34px on the same class and, loading later at equal specificity, won.
   · trip-split.css's header says its modernisation pass delivered "44px touch targets"; the
     sheet shipped min-heights of 34, 38 and 28.
   · change-request/styles.css sat at 36px among siblings holding 44.

   Each shipped. Each was a rule disagreeing with a claim written a few lines above it, in the
   same file, by the same author. Nothing looks for that, so this does.

   SCOPE, deliberately narrow. "Intent" in general is prose and unattackable by a script; a
   NUMERIC claim is not. This checks one class of promise — a comment naming a px floor near
   rules that set a smaller value for the property that floor governs. That covers every real
   instance above without inventing a natural-language parser, and a narrow check that fires is
   worth more than a broad one that gets muted.

   EXEMPT lists the rules that legitimately sit under a floor their file discusses, each with
   the reason and, where one exists, the gate that already owns the decision. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIRS = [path.join(ROOT, "src", "styles"), path.join(ROOT, "src", "features")];

/* Selectors allowed under a floor their own file mentions. Mirrors the reasoning already
   recorded in tests/visual/a11y.spec.ts's TARGET_BASELINE — this script does not re-litigate
   those, it only refuses to let a NEW one appear silently. */
const EXEMPT = new Map([
  [".dchip", "Day scrubber chips: 44px tall, narrow by the same spec that defines them (a11y TARGET_BASELINE)."],
  [".spine-tick", "Reading-spine ticks: desktop-only, redundant with a .gtab that clears 44 (a11y TARGET_BASELINE)."],
  [".anchor-btn", "Per-panel copy-link, deliberately quiet (a11y TARGET_BASELINE)."],
  [".se-cur-sel", "Currency select nested INSIDE the amount field's own 44px box, not a target of its own."],
  [".sc-add-btn", "Phone-only compact add control inside a 44px row; the row is the target."],
  [".sc-add-expense-btn", "Phone-only compact add control inside a 44px row; the row is the target."],
  [".flag-chip", "Notation, not a control. a11y.spec.ts excludes it from the touch sweep by the same reasoning: a mark sized to the text it annotates, reachable by keyboard, sitting inside a larger row."],
]);

function cssFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) cssFiles(p, out);
    else if (name.endsWith(".css")) out.push(p);
  }
  return out;
}

/* A comment that states a px floor as a rule the file follows. "44px floor", "the 44px gate",
   "minimum touch target". Not every mention of a number — a claim. */
const CLAIM = /\/\*[^*]*?(?:(\d{2})px\s+(?:floor|gate|minimum|target)|(?:minimum|floor)[^*]{0,24}?(\d{2})px)[^*]*?\*\//gis;
const DECL = /(^|\})\s*([^{}@]+?)\{([^}]*)\}/gs;

const findings = [];

for (const file of cssFiles(DIRS[0]).concat(cssFiles(DIRS[1]))) {
  const css = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");

  const floors = [...css.matchAll(CLAIM)].map((m) => Number(m[1] || m[2])).filter((n) => n >= 24 && n <= 96);
  if (!floors.length) continue;
  const floor = Math.max(...floors);

  /* Declarations are matched against a comment-BLANKED copy — the same idiom breakpoints.test.ts
     uses. Without it a comment sitting between `}` and the next selector is swallowed into the
     selector capture, the rule reads as starting with "/*", and it is skipped. That made the
     first version of this script blind to every commented rule, which in this codebase is most
     of them: it caught .se-filter-clear only because that one rule happened to be uncommented,
     and went quiet the moment a comment was added above it. A gate that stops seeing a file the
     better it is documented is worse than no gate. */
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));

  for (const m of bare.matchAll(DECL)) {
    const selector = m[2].trim().replace(/\s+/g, " ");
    const body = m[3];
    if (selector.startsWith("/*") || !selector) continue;
    for (const prop of ["min-height", "min-width"]) {
      const hit = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*(\\d+)px`, "i").exec(body);
      if (!hit) continue;
      const value = Number(hit[1]);
      if (value >= floor) continue;
      if ([...EXEMPT.keys()].some((k) => selector.includes(k))) continue;
      findings.push({ rel, selector: selector.slice(0, 64), prop, value, floor });
    }
  }
}

if (findings.length) {
  console.error(`[stated-intent] FAIL — ${findings.length} rule(s) contradict a floor their own file states:\n`);
  for (const f of findings) {
    console.error(`  ${f.rel}`);
    console.error(`    ${f.selector}  ${f.prop}: ${f.value}px  — this file states a ${f.floor}px floor`);
  }
  console.error("");
  console.error("  Either raise the rule to the floor its file claims, or, if it genuinely belongs");
  console.error("  under it, add the selector to EXEMPT in this script WITH the reason. Do not");
  console.error("  soften the comment to make the rule true — the comment is the decision.");
  process.exit(1);
}

console.log("[stated-intent] OK — no rule contradicts a px floor stated in its own file.");
