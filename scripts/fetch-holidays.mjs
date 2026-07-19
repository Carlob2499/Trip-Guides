// Fetch public holidays from Nager.Date at build time into src/data/holidays/.
// Run BEFORE `astro build` (locally and in CI, see .github/workflows/deploy.yml).
//
// It scans every guide for a `holidays` section, maps its country to an ISO code,
// derives the trip year, and fetches that country+year once. On ANY network/HTTP
// error it leaves the existing committed file untouched, so the site keeps the
// last-good data and the build never breaks. It always exits 0.
//
// Why build-time, not runtime: a year's public holidays are fixed, so there's no
// reason to re-fetch them on every page load. Baking them into committed JSON keeps
// the guide working offline with zero client JS and no failure mode in the browser.

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Country → ISO 3166-1 alpha-2, shared with the site (single source of truth).
// countries.mjs is plain ESM precisely so this Node script can import it too.
import { COUNTRY_CODES } from "../src/data/countries.mjs";
// Shared guide reader — understands BOTH content shapes (flat <slug>.json and
// split <slug>/_guide.json + NN-*.json). A local readdir(GUIDES_DIR)-then-filter
// used to live here instead; it silently stopped seeing Denmark/Korea the moment
// they split into directories (readdir returns the bare dir name, which never
// ends in ".json"), so their holiday data went stale with zero error, zero
// warning — reusing readGuides() closes that gap for good instead of patching it
// locally a second time.
import { readGuides, flatten } from "./audit/lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "src", "data", "holidays");
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

function firstDayDate(sections) {
  const d = flatten(sections).find((s) => s.type === "days" && s.items?.length);
  return d?.items?.[0]?.date ?? null;
}

// Same logic as deriveTripYear() in src/lib/holidays.ts.
function deriveYear(date, now = new Date()) {
  const y = now.getUTCFullYear();
  if (!date) return y;
  let mo = null, day = null;
  for (const p of String(date).replace(/,/g, " ").split(/\s+/).filter(Boolean)) {
    const k = p.slice(0, 3);
    if (mo === null && MONTHS[k] !== undefined) mo = MONTHS[k];
    else if (day === null && /^\d{1,2}$/.test(p)) day = parseInt(p, 10);
  }
  if (mo === null || day === null) return y;
  return Date.UTC(y, mo, day) < now.getTime() - 31 * 864e5 ? y + 1 : y;
}

async function main() {
  let entries;
  try {
    entries = await readGuides();
  } catch (err) {
    console.warn(`[holidays] cannot read guides dir (${err.message}) — skipping`);
    return;
  }

  // Collect the unique (country, year) pairs actually used by a holidays section.
  const wanted = new Map(); // "CC-YYYY" -> { cc, year }
  for (const { file: f, guide: g } of entries) {
    const hol = flatten(g.sections).find((s) => s.type === "holidays");
    if (!hol) continue;
    const cc = COUNTRY_CODES[g.country];
    if (!cc) { console.warn(`[holidays] no country code for "${g.country}" (${f}) — skipped`); continue; }
    const year = hol.year || deriveYear(firstDayDate(g.sections));
    wanted.set(`${cc}-${year}`, { cc, year });
  }

  if (!wanted.size) { console.log("[holidays] no guides use a holidays section — nothing to fetch"); return; }
  await mkdir(OUT_DIR, { recursive: true });

  for (const { cc, year } of wanted.values()) {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${cc}`;
    const out = path.join(OUT_DIR, `${cc}-${year}.json`);
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error("empty or malformed payload");
      // Keep only the fields the site renders — smaller committed files.
      const slim = data.map((h) => ({
        date: h.date, localName: h.localName, name: h.name,
        global: h.global === true, counties: h.counties ?? null,
      }));
      await writeFile(out, JSON.stringify(slim, null, 2) + "\n");
      console.log(`[holidays] ${cc} ${year}: ${slim.length} holidays → ${path.relative(ROOT, out)}`);
    } catch (err) {
      if (existsSync(out)) console.warn(`[holidays] ${cc} ${year}: fetch failed (${err.message}) — keeping existing file`);
      else console.warn(`[holidays] ${cc} ${year}: fetch failed (${err.message}) — no existing file, block will hide`);
    }
  }
}

main().catch((err) => {
  // Never fail the build over holidays — graceful failure is mandatory.
  console.warn(`[holidays] unexpected error: ${err.message} — build continues`);
});
