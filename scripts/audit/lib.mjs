// Shared helpers for the content-audit scripts (scripts/audit/*.mjs). Plain ESM —
// mirrors patterns already used in scripts/fetch-holidays.mjs (which re-implements
// small helpers locally instead of importing TS, since Node scripts can't import
// .ts files directly). Kept intentionally dependency-free: only Node built-ins.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

// "Is this module the one Node was invoked on" check, done correctly cross-platform.
// process.argv[1] is a plain path (relative or backslash-separated on Windows) —
// comparing it to import.meta.url as a bare "file://" + argv[1] string silently
// never matches on Windows, so a script's `if (isMain(import.meta.url))` guard
// would run with no output and no error. pathToFileURL() normalizes both sides.
export function isMain(moduleUrl) {
  return process.argv[1] != null && moduleUrl === pathToFileURL(process.argv[1]).href;
}

export const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const MONTH_RE = new RegExp(`\\b(${Object.keys(MONTHS).join("|")})[a-z]*\\.?\\s+(\\d{4})\\b`);

// Read every guide as { file, slug, raw (text), guide (parsed) }.
export async function readGuides() {
  const files = (await readdir(GUIDES_DIR)).filter((f) => f.endsWith(".json"));
  const out = [];
  for (const file of files) {
    const full = path.join(GUIDES_DIR, file);
    const raw = await readFile(full, "utf8");
    let guide;
    try { guide = JSON.parse(raw); }
    catch (err) { console.warn(`[audit] cannot parse ${file}: ${err.message} — skipped`); continue; }
    out.push({ file, slug: file.replace(/\.json$/, ""), raw, guide });
  }
  return out;
}

// Flatten nested `sections` arrays into a single list — same shape as
// flattenSections() in src/lib/exports.ts and the local flatten() in
// scripts/fetch-holidays.mjs.
export function flatten(sections, out = []) {
  for (const s of sections || []) {
    if (s && Array.isArray(s.sections)) flatten(s.sections, out);
    else if (s) out.push(s);
  }
  return out;
}

// Extract every unique http(s) citation from the RAW file text: inline <a href>
// (guide JSON stores HTML with single-quoted attributes, so match both quote
// styles) AND the structured `source_url` provenance field — both are live
// citations the weekly link-rot sweep must cover.
export function extractLinks(raw) {
  const found = new Set();
  const re = /href=['"](https?:\/\/[^'"]+)['"]|"source_url"\s*:\s*"(https?:\/\/[^"]+)"/g;
  let m;
  while ((m = re.exec(raw))) found.add(m[1] || m[2]);
  return [...found];
}

// Extract every sights[].img.file across a guide's sections.
export function extractPhotos(guide) {
  const files = new Set();
  for (const s of flatten(guide.sections)) {
    if (s.type !== "sights") continue;
    for (const item of s.items || []) {
      if (item.img?.file) files.add(item.img.file);
    }
  }
  return [...files];
}

// Loosely parse a "Mon YYYY" (or "D Mon YYYY") date out of a free-text `verified`
// field (e.g. "Checked 28 Jun 2026 for the trip", "✓ Verified Jun 2026 — ..."). No
// day component is required — month+year is enough for a staleness check. Returns
// a Date (first of month, UTC) or null if nothing date-like is found.
export function parseVerifiedDate(text) {
  if (!text) return null;
  const m = MONTH_RE.exec(text);
  if (!m) return null;
  const mo = MONTHS[m[1]];
  const year = parseInt(m[2], 10);
  if (mo === undefined || !Number.isFinite(year)) return null;
  return new Date(Date.UTC(year, mo, 1));
}

export function daysSince(date, now = new Date()) {
  return Math.round((now.getTime() - date.getTime()) / 86400000);
}

// Small fetch wrapper: HEAD first (cheap), fall back to GET if the server doesn't
// support/allows HEAD (405, or some sites just don't reply sensibly to it). Never
// throws — callers get a uniform { ok, status, error } shape.
export async function checkUrl(url, { timeoutMs = 10000 } = {}) {
  const attempt = async (method) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: ctrl.signal,
        headers: { "user-agent": "waypoint-content-audit/1.0 (+https://github.com/Carlob2499/Trip-Guides)" },
      });
      return { ok: res.ok, status: res.status };
    } finally {
      clearTimeout(t);
    }
  };
  try {
    const head = await attempt("HEAD");
    if (head.status === 405 || head.status === 501) return await attempt("GET");
    return head;
  } catch (err) {
    try { return await attempt("GET"); }
    catch (err2) { return { ok: false, status: null, error: String(err2.message || err2) }; }
  }
}
