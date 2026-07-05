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
