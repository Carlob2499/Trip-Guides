/* Prose SHAPE — the standard the guide-author skill had no rule for.
 *
 * The skill governs where a fact came from and when it was checked. It says nothing about the
 * shape of the sentence carrying it, so research notes have been shipping as cards: the Entry
 * Documents item the creator flagged (2026-08-09, "WAY too much unorganized prose ... you need
 * a stricter critic for this") is 90 words, one bolded lead, four independent claims welded
 * into a single paragraph. Every fact in it is sourced and correct. It is still unreadable on a
 * phone, which is where it is read.
 *
 * MEASURED, not guessed. Across the four shipped guides — 1087 paragraphs — the median is 28
 * words and p75 is 48. Well-shaped prose in this product is already short; the long ones are
 * outliers, not the house style:
 *
 *     median 28 · p75 48 · p90 80 · p95 104 · p99 155 · max 334
 *
 * So the ceilings below are not a taste imposed on the corpus, they are the corpus's own
 * distribution with its tail cut off.
 *
 * Two rules, both mechanical:
 *
 *   1. PARAGRAPH LENGTH. A paragraph past MAX_WORDS is doing more than one job and should be
 *      split, turned into a list, or promoted to a typed section. Judged per PARAGRAPH (and per
 *      list item), not per field — a `body` legitimately holds several <p>s and counting the
 *      field would punish a well-shaped long section.
 *
 *   2. A `price` IS A VALUE. 26 of them hold a whole sentence ("≈249 DKK food-only / ≈399 DKK
 *      food+drinks per person — confirm at koba-bbq.dk before booking, prices change"). That is
 *      not pedantry: `.venue-pill` renders this field as a pill, and an unbreakable 568px pill
 *      on a 375px phone widened the page until `overflow-x: clip` cut the end off every line of
 *      prose beside it. The caveat belongs in the venue's own note, where it can wrap.
 *
 * BASELINE, not a bulk rewrite. Every guide already in the repo is a verified historical
 * record; reshaping its prose is a content edit under the guide-author discipline, with its own
 * continuity sweep, and it is not something a lint script should do behind anyone's back. So
 * existing offenders are RECORDED in prose-shape-baseline.json and the gate fails on:
 *   · any NEW offender, and
 *   · any existing one getting worse.
 * The baseline can only shrink. `--update` rewrites it, and the test asserts it never grows.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Past this a paragraph is carrying more than one idea. p95 of the corpus is 104. */
export const MAX_WORDS = 120;
/** A price is a figure, a range, or a tier. Past this it is a sentence. */
export const MAX_PRICE_CHARS = 60;

/** Fields whose string value is prose the reader reads as a paragraph. */
const PROSE_KEYS = new Set(["body", "text", "note", "intro", "why", "tips", "desc", "steps"]);

const strip = (s) => String(s).replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
const wordCount = (s) => (strip(s) ? strip(s).split(" ").length : 0);

/** The reader's unit is a paragraph or a list item, never the whole field. */
function paragraphsOf(html) {
  const parts = String(html).split(/<\/p>|<\/li>/i).map(strip).filter(Boolean);
  return parts.length ? parts : [strip(html)].filter(Boolean);
}

function jsonFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) jsonFiles(p, out);
    else if (name.endsWith(".json")) out.push(p);
  }
  return out;
}

/** Every shape offence in one guide directory tree, as stable `file :: kind` keys. */
export function findOffenders(root) {
  const found = [];
  for (const file of jsonFiles(root)) {
    const rel = file.replace(/\\/g, "/").split("src/content/guides/")[1] || file;
    let data;
    try { data = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }

    const visit = (v) => {
      if (Array.isArray(v)) return v.forEach(visit);
      if (!v || typeof v !== "object") return;
      for (const [k, val] of Object.entries(v)) {
        if (typeof val === "string") {
          if (k === "price" && val.length > MAX_PRICE_CHARS) {
            found.push({ file: rel, rule: "price-is-a-sentence", size: val.length, sample: val.slice(0, 70) });
          }
          if (PROSE_KEYS.has(k)) {
            for (const p of paragraphsOf(val)) {
              const w = wordCount(p);
              if (w > MAX_WORDS) found.push({ file: rel, rule: "paragraph-too-long", size: w, sample: p.slice(0, 70) });
            }
          }
        } else if (Array.isArray(val) && k === "steps") {
          for (const s of val) {
            if (typeof s !== "string") { visit(s); continue; }
            for (const p of paragraphsOf(s)) {
              const w = wordCount(p);
              if (w > MAX_WORDS) found.push({ file: rel, rule: "paragraph-too-long", size: w, sample: p.slice(0, 70) });
            }
          }
        } else visit(val);
      }
    };
    visit(data);
  }
  return found;
}

/** Offences collapsed to `file::rule -> {count, worst}`, which is what the baseline stores.
 *  Counting per file rather than per paragraph keeps the baseline stable when unrelated prose
 *  in the same file is edited — the alternative pins line-ish identities that churn constantly. */
export function summarize(offenders) {
  const out = {};
  for (const o of offenders) {
    const key = `${o.file}::${o.rule}`;
    if (!out[key]) out[key] = { count: 0, worst: 0 };
    out[key].count += 1;
    out[key].worst = Math.max(out[key].worst, o.size);
  }
  return out;
}

/** What got worse, in the only two directions that matter: new keys, and bigger numbers. */
export function regressions(current, baseline) {
  const bad = [];
  for (const [key, cur] of Object.entries(current)) {
    const base = baseline[key];
    if (!base) { bad.push(`NEW  ${key} — ${cur.count} offence(s), worst ${cur.worst}`); continue; }
    if (cur.count > base.count) bad.push(`MORE ${key} — ${cur.count} now, ${base.count} in the baseline`);
    else if (cur.worst > base.worst) bad.push(`WORSE ${key} — worst ${cur.worst} now, ${base.worst} in the baseline`);
  }
  return bad;
}

if (process.argv[1] && process.argv[1].endsWith("prose-shape.mjs")) {
  const root = "src/content/guides";
  const offenders = findOffenders(root);
  const summary = summarize(offenders);
  if (process.argv.includes("--update")) {
    writeFileSync("scripts/prose-shape-baseline.json", JSON.stringify(summary, null, 2) + "\n");
    console.log(`[prose-shape] baseline written: ${Object.keys(summary).length} entries, ${offenders.length} offences`);
  } else {
    const worst = offenders.sort((a, b) => b.size - a.size).slice(0, 12);
    console.log(`[prose-shape] ${offenders.length} offence(s) across ${Object.keys(summary).length} file/rule pairs`);
    for (const o of worst) console.log(`  ${o.file} [${o.rule}] ${o.size} — ${o.sample}…`);
  }
}
