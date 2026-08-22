// Repo-wide validation for every COMMITTED extracted palette (src/data/palettes/*.json).
//
// PR #72 corrected scripts/extract-palette.mjs's contrast grounds to match the real product
// backgrounds, which exposed src/data/palettes/denmark.json: it had been extracted (and
// committed) under the STALE, more forgiving grounds, so its primary passed generation-time but
// measures below the floor against what the site actually paints. A guide's explicit
// `_guide.json.theme` goes through content.config.ts's zod gate on every build; an EXTRACTED
// palette does not — nothing re-checked a committed file after the fact, so a palette blessed by
// an old policy (or hand-edited, or copied from another project) stays trusted forever. This
// script is that missing re-check.
//
// Deterministic and OFFLINE by design: extraction fetches a cover photo over the network (see
// extract-palette.mjs's `fetch`), but VALIDATING an already-committed file never should — it
// reads what's on disk and does pure contrast math, so it's safe to run on every commit/CI run
// with no flakiness and no external dependency.
//
// Never repairs a file — a failing palette is a decision for a human (or `npm run
// extract-palette`) to make, not something this script silently rewrites out from under a guide.
//
// Usage:  node scripts/validate-palettes.mjs        CLI — prints violations, exits 1 if any
//         import { validatePalettes } from "./validate-palettes.mjs"   for tests / other scripts

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "./audit/lib.mjs";
import { contrast } from "./extract-palette.mjs";
// Same shared policy the schema gate and the extractor use — see that file's header. This is the
// invariant TASK 3 exists for: the extractor, this validator, and the product schema must agree,
// and now they structurally can't disagree since all three import one module.
import { LIGHT_BG, DARK_BG, MIN_ACCENT_CONTRAST } from "../src/lib/contrast-policy.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PALETTES_DIR = path.join(ROOT, "src", "data", "palettes");

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Validate one already-parsed palette's `primary`. Returns null if clean, else a violation
    record naming exactly what's wrong: the file, the offending primary, both measured ratios
    (null where not applicable, e.g. an invalid hex), and the threshold that was required. */
function validateOne(file, data) {
  const primary = data && typeof data === "object" ? data.primary : undefined;
  if (typeof primary !== "string" || !HEX_RE.test(primary)) {
    return {
      file, primary, lightContrast: null, darkContrast: null, threshold: MIN_ACCENT_CONTRAST,
      reason: `primary is missing or not a valid #RRGGBB hex colour (got ${JSON.stringify(primary)})`,
    };
  }
  const lightContrast = contrast(primary, LIGHT_BG);
  const darkContrast = contrast(primary, DARK_BG);
  if (lightContrast < MIN_ACCENT_CONTRAST || darkContrast < MIN_ACCENT_CONTRAST) {
    const failing = [
      lightContrast < MIN_ACCENT_CONTRAST ? `light (${LIGHT_BG})` : null,
      darkContrast < MIN_ACCENT_CONTRAST ? `dark (${DARK_BG})` : null,
    ].filter(Boolean).join(" and ");
    return {
      file, primary, lightContrast, darkContrast, threshold: MIN_ACCENT_CONTRAST,
      reason: `primary ${primary} fails the ≥${MIN_ACCENT_CONTRAST}:1 accent contrast floor against the ${failing} ground`,
    };
  }
  return null;
}

/** Validate every committed palette file in `dir` (default src/data/palettes). Pure + offline:
    reads the directory and does contrast math, never fetches or writes. `dir` is overridable so
    tests can point this at a temp fixture directory instead of the real repo content.
    Returns { checked: string[], violations: object[] } — `checked` lists every file examined
    (relative paths) so a caller can prove the sweep covered ALL of them, not a sample. */
export async function validatePalettes(dir = PALETTES_DIR) {
  let entries;
  try {
    entries = await readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") return { checked: [], violations: [] }; // no palettes dir yet — nothing to check
    throw err;
  }
  const files = entries.filter((f) => f.endsWith(".json")).sort();
  const checked = [];
  const violations = [];
  for (const file of files) {
    const rel = path.relative(ROOT, path.join(dir, file));
    checked.push(rel);
    let data;
    try {
      data = JSON.parse(await readFile(path.join(dir, file), "utf8"));
    } catch (err) {
      violations.push({
        file: rel, primary: undefined, lightContrast: null, darkContrast: null,
        threshold: MIN_ACCENT_CONTRAST, reason: `invalid JSON — ${err.message}`,
      });
      continue;
    }
    const v = validateOne(rel, data);
    if (v) violations.push(v);
  }
  return { checked, violations };
}

function formatViolation(v) {
  const fmt = (n) => (n == null ? "n/a" : `${n.toFixed(2)}:1`);
  return [
    `  ✗ ${v.file}`,
    `      primary: ${JSON.stringify(v.primary)}`,
    `      light contrast: ${fmt(v.lightContrast)}  (needs ≥${v.threshold}:1 against ${LIGHT_BG})`,
    `      dark contrast:  ${fmt(v.darkContrast)}  (needs ≥${v.threshold}:1 against ${DARK_BG})`,
    `      reason: ${v.reason}`,
  ].join("\n");
}

if (isMain(import.meta.url)) {
  const { checked, violations } = await validatePalettes();
  if (violations.length) {
    console.error(`\n[validate-palettes] ${violations.length} of ${checked.length} committed palette(s) FAILED the accent contrast floor:\n`);
    for (const v of violations) console.error(formatViolation(v));
    console.error(`\n[validate-palettes] Fix: regenerate with \`npm run extract-palette -- --slug <slug>\` — this script never auto-repairs a file.\n`);
    process.exitCode = 1;
  } else {
    console.log(`[validate-palettes] ${checked.length} committed palette(s) — all pass ≥${MIN_ACCENT_CONTRAST}:1 on both grounds.`);
  }
}
