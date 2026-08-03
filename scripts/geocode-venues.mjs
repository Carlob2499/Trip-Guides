// Backfill map coordinates + Place IDs onto guide venues, from Google Places.
//
// WHY THIS EXISTS. A guide is meant to be browsed on the street — "what is near me that I
// haven't eaten at yet" — and it could not answer that: measured across the four shipped
// guides, 32 of 159 sights+venues items carried coordinates and every one of the 32 was a
// sight. 52 of the missing ones already carried a written street address, so the location was
// known to the guide and simply not in a form a map could read.
//
// WHAT IT COSTS. Nothing beyond what verification already spends: lat/lng and the Place ID
// come back on the Essentials field mask that `--check status` requests anyway
// (scripts/lookup-venue.mjs), so this bills the same SKUs as the venue-status gate.
//
// WHAT IT WILL NOT DO. Invent a location. A geocoder that silently resolves "Melody House" to
// a different business of the same name produces a guide that is confidently, invisibly wrong
// — the precise failure this repo's verification rules exist to prevent. So every match must
// pass acceptMatch() below, and anything that doesn't is REPORTED and left blank. An honest
// gap is the documented feature; a plausible wrong coordinate is not.
//
// Usage:
//   node scripts/geocode-venues.mjs --slug korea            # propose (default): prints a diff
//   node scripts/geocode-venues.mjs --slug korea --write     # apply the accepted matches
//   node scripts/geocode-venues.mjs --slug korea --include-rejected   # show near-misses too

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { lookupVenue } from "./lookup-venue.mjs";

const GUIDES = "src/content/guides";
const THROTTLE_MS = 150;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Sections whose items are visitable places. Mirrors content.config.ts's `visitable`. */
const PLACE_TYPES = new Set(["sights", "venues"]);

/* ── pure helpers (tested) ─────────────────────────────────────────────────────────── */

/* Letters that are NOT accented forms and so survive NFKD intact — they are distinct letters
   in their own alphabets. Without this they get stripped as punctuation and split the word:
   "Nørrebro" became "n rrebro", which then failed every comparison below. Denmark's guide is
   full of them, which is exactly how this was caught. */
const LETTER_MAP = { ø: "o", æ: "ae", å: "a", ß: "ss", đ: "d", ð: "d", þ: "th", ł: "l", ı: "i", œ: "oe" };

/** Words that carry no identifying weight, so their presence or absence must not decide a match. */
const STOPWORDS = new Set(["the", "a", "an", "of", "and", "at", "in", "on", "de", "la", "le", "el", "du", "der", "den", "das"]);

/** Normalize for comparison: strip case, accents, punctuation and spacing noise. */
export function normalizeName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[øæåßđðþłıœ]/g, (c) => LETTER_MAP[c] || c)
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

/** Identifying words only — case-folded, stopwords and one/two-letter noise removed. */
export function significantTokens(s) {
  return new Set(normalizeName(s).split(" ").filter((w) => w.length > 2 && !STOPWORDS.has(w)));
}

/**
 * The query sent to Places. Name alone is ambiguous across cities ("Family Mart"), so the
 * guide's own context is appended in increasing order of specificity — a written address is
 * the strongest disambiguator the content already holds.
 */
export function buildQuery(item, ctx = {}) {
  const parts = [item.name];
  if (item.address) parts.push(item.address);
  else if (item.area) parts.push(item.area);
  else if (ctx.city) parts.push(ctx.city);
  else if (ctx.country) parts.push(ctx.country);
  return parts.filter(Boolean).join(", ");
}

/**
 * Is the returned place actually the venue we asked for?
 *
 * The guard that keeps this script honest. Places always returns its best guess, so "no
 * result" is rare and "confidently the wrong place" is the real failure mode. A match is
 * accepted only when the returned display name recognisably contains — or is contained by —
 * the name the guide wrote. Romanization differences ("Gyeongbokgung" vs "Gyeongbokgung
 * Palace") pass; a substitution ("Melody House" → "Melody Cafe") does not.
 */
export function acceptMatch(item, result) {
  if (!result || result.error || result.notFound) return { ok: false, why: result?.error || "not found" };
  if (!Number.isFinite(result.lat) || !Number.isFinite(result.lng)) return { ok: false, why: "no coordinates returned" };

  const asked = normalizeName(item.name);
  const got = normalizeName(result.name);
  if (!asked || !got) return { ok: false, why: "unnamed" };
  if (got === asked || got.includes(asked) || asked.includes(got)) return { ok: true };

  // Token overlap catches word-order and article differences without accepting a substitution:
  // every IDENTIFYING word of the shorter name must appear in the longer one. Stopwords are
  // dropped first, so "The Round Tower" still matches "Round Tower Copenhagen" while
  // "Melody House" is still refused against "Melody Cafe".
  const a = significantTokens(item.name);
  const g = significantTokens(result.name);
  if (a.size && g.size) {
    const [small, big] = a.size <= g.size ? [a, g] : [g, a];
    if ([...small].every((w) => big.has(w))) return { ok: true };
  }
  return { ok: false, why: `name mismatch — asked "${item.name}", Places returned "${result.name}"` };
}

/** Every place item in a guide dir that still needs coordinates. */
export function pendingItems(files) {
  const out = [];
  for (const { file, json } of files) {
    for (const [key, sec] of Object.entries(json)) {
      if (!sec || !PLACE_TYPES.has(sec.type) || !Array.isArray(sec.items)) continue;
      sec.items.forEach((item, i) => {
        const hasCoords = item.map && Number.isFinite(item.map.lat) && Number.isFinite(item.map.lng);
        if (hasCoords && item.place_id) return;      // already complete
        out.push({ file, key, i, item, sec, needsCoords: !hasCoords, needsId: !item.place_id });
      });
    }
  }
  return out;
}

/* ── I/O ───────────────────────────────────────────────────────────────────────────── */

function readGuideDir(slug) {
  const dir = path.join(GUIDES, slug);
  if (!fs.existsSync(dir)) throw new Error(`no guide directory: ${dir}`);
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_") && f !== "facts.json")
    .map((f) => ({ file: f, path: path.join(dir, f), json: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }));
}

function guideMeta(slug) {
  const p = path.join(GUIDES, slug, "_guide.json");
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return {}; }
}

async function main(argv) {
  const slug = argv[argv.indexOf("--slug") + 1];
  const write = argv.includes("--write");
  const showRejected = argv.includes("--include-rejected");
  if (!slug || slug.startsWith("--")) {
    console.error("Usage: node scripts/geocode-venues.mjs --slug <guide> [--write] [--include-rejected]");
    process.exit(2);
  }

  const files = readGuideDir(slug);
  const meta = guideMeta(slug);
  const ctx = { country: meta.country || null, city: meta.city || null };
  const pending = pendingItems(files);

  if (!pending.length) {
    console.log(`${slug}: every place already has coordinates and a Place ID — nothing to do.`);
    return;
  }
  console.log(`${slug}: ${pending.length} place(s) to resolve (country hint: ${ctx.country || "none"})\n`);

  const accepted = [], rejected = [];
  for (const row of pending) {
    const query = buildQuery(row.item, ctx);
    const res = await lookupVenue(query, { cc: ctx.country, check: "status" });
    const verdict = acceptMatch(row.item, res);
    (verdict.ok ? accepted : rejected).push({ ...row, query, res, why: verdict.why });
    await sleep(THROTTLE_MS);
  }

  for (const r of accepted) {
    const bits = [];
    if (r.needsCoords) bits.push(`map ${r.res.lat.toFixed(5)}, ${r.res.lng.toFixed(5)}`);
    if (r.needsId) bits.push(`place_id ${r.res.place_id}`);
    console.log(`  + ${r.item.name}  (${r.file})\n      ${bits.join("  ·  ")}`);
  }
  if (rejected.length) {
    console.log(`\n  ${rejected.length} left blank — an honest gap, not a guess:`);
    for (const r of rejected) {
      console.log(`  ? ${r.item.name}  (${r.file}) — ${r.why}`);
      if (showRejected && r.res && r.res.lat) console.log(`      near-miss was: ${r.res.name} @ ${r.res.lat}, ${r.res.lng}`);
    }
  }

  if (!write) {
    console.log(`\nProposal only. Re-run with --write to apply the ${accepted.length} accepted match(es).`);
    return;
  }

  const touched = new Set();
  for (const r of accepted) {
    const target = files.find((f) => f.file === r.file);
    const item = target.json[r.key].items[r.i];
    if (r.needsCoords) item.map = { lat: r.res.lat, lng: r.res.lng };
    if (r.needsId && r.res.place_id) item.place_id = r.res.place_id;
    touched.add(target);
  }
  for (const t of touched) fs.writeFileSync(t.path, JSON.stringify(t.json, null, 1) + "\n");
  console.log(`\nWrote ${accepted.length} match(es) across ${touched.size} file(s).`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv).catch((e) => { console.error(e.message); process.exit(1); });
}
