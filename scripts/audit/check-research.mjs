// Research/draft quality gate — checks the MECHANICALLY checkable half of a guide's
// readiness (judgment stays with the human/agent). Meant to run against an AI-generated
// or scaffolded draft to surface the punch-list a human must still resolve before it can
// graduate. Advisory: it reports findings, never edits. Mirrors the other scripts/audit/*
// modules (exports a check fn; joinable in run-audit.mjs).
//
// Usage:  node scripts/audit/check-research.mjs --slug kyoto-japan   (single guide, verbose)
//         node scripts/audit/check-research.mjs                      (all guides, summary)

import { readGuides, flatten, isMain, parseVerifiedDate } from "./lib.mjs";

const PLACEHOLDER = "__VERIFICATION_REQUIRED__";
// A body with almost no real content is a "filled" section that isn't actually filled.
const strip = (html) => String(html || "").replace(/<[^>]+>/g, "").trim();

export function checkResearchGuide(guide, slug) {
  const findings = [];
  const add = (severity, msg) => findings.push({ severity, msg });
  const sections = flatten(guide.sections);

  // 1. Verified stamp present + either a ⚠ draft marker or a parseable date.
  if (!guide.verified) {
    add("warn", "no `verified` stamp");
  } else if (!guide.verified.includes("⚠") && !parseVerifiedDate(guide.verified)) {
    add("warn", "`verified` stamp has no ⚠ marker and no parseable date");
  }

  // 2. sights[].img.file that look guessed / placeholder (real-existence is covered by
  //    check-photos.mjs against Commons; here we only flag obvious non-values cheaply).
  for (const s of sections) {
    if (s.type !== "sights") continue;
    for (const it of s.items || []) {
      if (it.img?.file && (it.img.file.includes(PLACEHOLDER) || !/\.(jpe?g|png|webp|gif|tiff?)$/i.test(it.img.file))) {
        add("warn", `sights "${it.name}" has a suspicious img.file: ${it.img.file}`);
      }
    }
  }

  // 3. Unresolved map place_id placeholders.
  for (const s of sections) {
    if (s.type !== "map") continue;
    for (const p of s.points || []) {
      if (p.place_id === PLACEHOLDER) add("warn", `map point "${p.name}" still has ${PLACEHOLDER} place_id`);
    }
  }

  // 4. Restaurant-ish entries missing the 4-question signals (address / transit / booking).
  //    Advisory heuristic — a restaurant with none of these hasn't met the standard yet.
  for (const s of sections) {
    const group = String(s.group || "").toLowerCase();
    if (!group.includes("food") && !group.includes("eat")) continue;
    const blob = JSON.stringify(s).toLowerCase();
    const namesFood = /restaurant|cuisine|dish|eat|dine/.test(blob);
    if (!namesFood) continue;
    const hasAddr = /address|st\.|street|road|ave|어디|地址|,\s*\d|区|dong|gil/.test(blob);
    const hasTransit = /metro|subway|line|station|bus|walk|min\b|→/.test(blob);
    const hasBooking = /book|reserv|walk-?in|call ahead|no reservation/.test(blob);
    if (!(hasAddr || hasTransit || hasBooking)) {
      add("info", `food section "${s.title || s.group}" has no address/transit/booking signals (4-question rule)`);
    }
  }

  // 5. "Filled" typed sections left effectively empty.
  for (const s of sections) {
    if ((s.type === "prose" || s.type === "panel") && s.title && s.body !== undefined) {
      // References is allowed to be empty (a human fills sources); everything else isn't.
      if (String(s.group).toLowerCase() !== "references" && strip(s.body).length < 3 && !(s.checklist?.length)) {
        add("info", `${s.type} "${s.title}" has an empty body`);
      }
    }
  }

  // 6. Story consistency — itinerary days must be contiguous calendar dates.
  //    A gap or repeat means a day was dropped/duplicated in editing (a class of
  //    error a schema can't see: each day validates fine alone).
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (const s of sections) {
    if (s.type !== "days" || !Array.isArray(s.items)) continue;
    let prev = null;
    for (const d of s.items) {
      const m = /([A-Z][a-z]{2})\s+(\d{1,2})/.exec(String(d.date || ""));
      if (!m || !MONTHS.includes(m[1])) { add("info", `day "${d.date}" has no parseable "Mon D" date`); prev = null; continue; }
      // Year-free ordinal (month index × 31 + day) — sufficient for contiguity within one trip.
      const ord = MONTHS.indexOf(m[1]) * 31 + Number(m[2]);
      if (prev != null && ord !== prev + 1 && ord !== prev) {
        add("warn", `itinerary jump: "${d.date}" does not follow the previous day (gap or reorder)`);
      }
      if (prev != null && ord === prev) add("warn", `duplicate itinerary date "${d.date}"`);
      prev = ord;
    }
  }

  // 7. Provenance hygiene (the ADDITIVE source_url/verified_on fields).
  //    verified_on without source_url = a date with nothing to re-check against;
  //    a future-dated verified_on is always an entry error.
  const today = new Date().toISOString().slice(0, 10);
  const walkProv = (node, label) => {
    if (!node || typeof node !== "object") return;
    if (node.verified_on && !node.source_url) add("warn", `${label} has verified_on ${node.verified_on} but no source_url to recertify against`);
    if (node.verified_on && node.verified_on > today) add("warn", `${label} has a future verified_on: ${node.verified_on}`);
  };
  for (const s of sections) {
    walkProv(s, `${s.type} "${s.title || s.group}"`);
    for (const it of s.items || []) walkProv(it, `${s.type} item "${it.name || it.label || it.date || "?"}"`);
  }

  return { slug, findings };
}

export async function checkResearch(slug) {
  const guides = await readGuides();
  const targets = slug ? guides.filter((g) => g.slug === slug) : guides;
  if (slug && !targets.length) return { results: [], error: `no guide with slug "${slug}"` };
  return { results: targets.map(({ guide, slug: s }) => checkResearchGuide(guide, s)), error: null };
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const slug = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
  const { results, error } = await checkResearch(slug);
  if (error) { console.error(`[check-research] ${error}`); process.exit(1); }
  let total = 0;
  for (const r of results) {
    total += r.findings.length;
    if (!r.findings.length) { console.log(`[check-research] ${r.slug}: clean`); continue; }
    console.log(`[check-research] ${r.slug}: ${r.findings.length} finding(s)`);
    for (const f of r.findings) console.log(`  ${f.severity === "warn" ? "⚠" : "·"} ${f.msg}`);
  }
  console.log(`[check-research] ${results.length} guide(s), ${total} finding(s) total`);
}
