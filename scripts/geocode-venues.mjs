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
  if (isCategoryName(item.name)) return { ok: false, why: "reads as a category, not a single place" };
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

/**
 * Is this "venue" actually a CATEGORY rather than a place?
 *
 * Guides legitimately list a class of thing — "Konbini (7-Eleven, Lawson, FamilyMart)",
 * "Paris Baguette / Tous les Jours", "Gyudon chains (…)". Places will happily resolve any of
 * them to one arbitrary branch, and a pin saying "the convenience store is HERE" is a false
 * claim about a category that is, by design, everywhere. These are left un-pinned.
 */
export function isCategoryName(name) {
  const s = String(name || "");
  return / \/ /.test(s)                         // slash-joined alternatives
    || /\bchains?\b/i.test(s)                    // "…chains"
    || /\([^)]*,[^)]*,[^)]*\)/.test(s);          // parenthetical brand list (2+ commas)
}

const EARTH_KM = 6371;
export function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Reject geographic outliers, judged against the OTHER results in the same file.
 *
 * The guard that name-matching cannot provide, and the reason this exists: on the first real
 * Korea run, "Konbini (7-Eleven, Lawson, FamilyMart)" in the Tokyo section resolved to Staten
 * Island, New York, and "Gyudon chains" to Osaka — both with names similar enough to pass
 * acceptMatch. A guide file describes one place on earth, so the file's own median location is
 * the honest reference: no configuration to maintain, and it adapts to a Tokyo section inside a
 * Korea guide, which a guide-level country hint gets wrong by construction.
 *
 * ONE EXCEPTION: a row that already carries its own verified `map` (this pass is only filling in
 * its `place_id`) has better ground truth than any file median could offer, and judging it against
 * the median is actively wrong for a file that legitimately spans several cities — Japan's
 * itinerary files run Sendai, Sapporo and Fukuoka sections together, so the "centre" of the file
 * is nowhere real, and multiple genuine matches were rejected as if they were the Konbini bug.
 * Ground-truthed rows are checked against their OWN coordinates instead, and are excluded from the
 * median used to judge everyone else — they'd only pull that median toward whichever city happens
 * to have more already-pinned sights, not toward the truth for a still-uncoordinated row.
 */
const GROUND_TRUTH_KM = 5;
export function flagOutliers(results, maxKm = 150) {
  const anchored = new Set();
  const judged = results.map((r) => {
    if (!r.ok || r.needsCoords !== false || !r.item?.map) return r;
    anchored.add(r);
    const km = haversineKm(r.item.map, r.res);
    if (km <= GROUND_TRUTH_KM) return r;
    return {
      ...r, ok: false,
      why: `place_id result is ${Math.round(km)} km from this item's own verified coordinates — Places resolved a same-named place elsewhere`,
    };
  });

  const pts = judged.filter((r) => r.ok && !anchored.has(r)).map((r) => r.res);
  if (pts.length < 3) return judged;               // too few to establish a centre honestly
  const mid = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  const centre = { lat: mid(pts.map((p) => p.lat)), lng: mid(pts.map((p) => p.lng)) };
  return judged.map((r) => {
    if (!r.ok || anchored.has(r)) return r;
    const km = haversineKm(centre, r.res);
    if (km <= maxKm) return r;
    return { ...r, ok: false, why: `${Math.round(km)} km from the rest of this file — Places resolved a same-named place elsewhere` };
  });
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

/* Rewriting a content file must change ONLY the fields being added. The first run of this
   script reformatted four Korea files end to end — 1,247 insertions for 43 field additions —
   because it serialized at indent 1 with LF while the repo uses indent 2 with CRLF. A diff
   nobody can read is a diff nobody can review, which defeats the whole propose-then-write
   design. So both are detected from the file itself rather than assumed. */
function detectFormat(raw) {
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const m = raw.split(/\r?\n/)[1]?.match(/^(\s+)/);
  return { eol, indent: m ? m[1].length : 2, trailingNewline: /\r?\n$/.test(raw) };
}

function serialize(json, fmt) {
  const body = JSON.stringify(json, null, fmt.indent).replace(/\n/g, fmt.eol);
  return body + (fmt.trailingNewline ? fmt.eol : "");
}

function readGuideDir(slug) {
  const dir = path.join(GUIDES, slug);
  if (!fs.existsSync(dir)) throw new Error(`no guide directory: ${dir}`);
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_") && f !== "facts.json")
    .map((f) => {
      const p = path.join(dir, f);
      const raw = fs.readFileSync(p, "utf8");
      return { file: f, path: p, json: JSON.parse(raw), fmt: detectFormat(raw) };
    });
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

  const graded = [];
  for (const row of pending) {
    const query = buildQuery(row.item, ctx);
    const res = await lookupVenue(query, { cc: ctx.country, check: "status" });
    const verdict = acceptMatch(row.item, res);
    graded.push({ ...row, query, res, ok: verdict.ok, why: verdict.why });
    await sleep(THROTTLE_MS);
  }

  /* Outliers are judged PER FILE, not per guide: a guide file describes one place on earth,
     but a guide can span several (Korea's own guide carries a Tokyo section). Judging against
     the whole guide would reject every legitimate Tokyo pin. */
  const byFile = new Map();
  for (const g of graded) {
    if (!byFile.has(g.file)) byFile.set(g.file, []);
    byFile.get(g.file).push(g);
  }
  const checked = [...byFile.values()].flatMap((rows) => flagOutliers(rows));
  const accepted = checked.filter((r) => r.ok);
  const rejected = checked.filter((r) => !r.ok);

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
  for (const t of touched) fs.writeFileSync(t.path, serialize(t.json, t.fmt));
  console.log(`\nWrote ${accepted.length} match(es) across ${touched.size} file(s).`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv).catch((e) => { console.error(e.message); process.exit(1); });
}
