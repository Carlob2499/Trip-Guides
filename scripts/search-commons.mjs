// Deterministic photo enricher. Given a subject (place/landmark name), searches
// Wikimedia Commons for real image File: pages that PROVABLY exist, so the guide
// generator can set sights[].img.file to a verified filename instead of guessing one
// (CLAUDE.md forbids guessed filenames — the model's only safe alternative today is to
// omit the image entirely). Authoritative source, never the LLM.
//
// Two-step, mirroring the site's existing Commons usage in scripts/audit/check-photos.mjs:
//   1. list=search in the File namespace (6) to find candidate titles.
//   2. confirm each candidate resolves (not `missing`) — same authoritative check the
//      photo audit uses — so we only ever return files that actually exist.
//
// Importable:  searchCommons("Fushimi Inari Taisha", 6) -> ["Name.jpg", ...] | []
// CLI:         node scripts/search-commons.mjs "Fushimi Inari Taisha" --limit 6

import { pathToFileURL } from "node:url";

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "waypoint-generator/1.0 (+https://github.com/Carlob2499/Trip-Guides)";
// Only bitmap image types render in SightsBlock; skip svg/pdf/audio/video hits.
const IMG_RE = /\.(jpe?g|png|webp|gif|tiff?)$/i;

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
  if (!res.ok) throw new Error(`Commons API HTTP ${res.status}`);
  return res.json();
}

// Keep only titles that are not `missing` — the same authoritative existence signal
// check-photos.mjs relies on (a search hit should exist, but confirm rather than trust).
async function confirmExist(files) {
  if (!files.length) return new Set();
  const titles = files.map((f) => `File:${f}`).join("|");
  const data = await api({ action: "query", titles });
  const present = new Set();
  for (const p of data?.query?.pages ?? []) {
    if (!p.missing) present.add(p.title.replace(/^File:/, ""));
  }
  return present;
}

export async function searchCommons(query, limit = 6) {
  const q = String(query || "").trim();
  if (!q) return [];
  try {
    const data = await api({
      action: "query", list: "search", srnamespace: "6",
      srsearch: q, srlimit: String(Math.max(1, Math.min(limit, 20))),
    });
    const titles = (data?.query?.search ?? [])
      .map((r) => String(r.title || "").replace(/^File:/, ""))
      .filter((t) => IMG_RE.test(t));
    if (!titles.length) return [];
    const present = await confirmExist(titles);
    return titles.filter((t) => present.has(t)).slice(0, limit);
  } catch (err) {
    // Graceful: print the reason to stderr, return nothing (caller omits the image).
    console.error(`[search-commons] ${q}: ${err.message || err}`);
    return [];
  }
}

// ── CLI ──
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) { a[argv[i].slice(2)] = argv[i + 1]; i++; }
    else a._.push(argv[i]);
  }
  return a;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const query = a._.join(" ");
  if (!query) {
    console.error('Usage: node scripts/search-commons.mjs "<subject>" [--limit 6]');
    process.exit(1);
  }
  const files = await searchCommons(query, a.limit ? parseInt(a.limit, 10) : 6);
  console.log(JSON.stringify(files, null, 2));
}
