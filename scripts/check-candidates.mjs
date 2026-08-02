// Standard S2/S3 — the candidates table and its coverage floors (creator-approved 2026-08-02).
//
// WHY. Every other gate measures whether what shipped is TRUE; none measured whether enough
// was CONSIDERED. Real research quality lives in the rejections — the 19 ramen shops
// evaluated behind the 5 that shipped — and until this table, a thin pass and a deep pass
// produced identical-looking guides. The table forces the consideration set onto the record
// (same philosophy as the reconciliation ledger: evidence, not vibes), and the floors make
// thinness a measurable verdict instead of a human impression.
//
// WHAT IT CHECKS, per ranked-priority table in `guides-intake/<slug>.md`'s
// `## Candidates considered` section:
//   · rows counted: total considered, and rows whose verdict starts with "shipped"
//   · floors: defaults below, overridable per guide via `researchFloors` in _guide.json
//     (the tabBudget precedent — guides legitimately differ)
//   · every `shipped` candidate NAME must appear somewhere in the guide's section files —
//     a shipped row that matches nothing in the guide is either a typo or a lie, and both
//     need a human.
//
// POSTURE for guides that predate the standard: no `## Candidates considered` section →
// "n/a" (the coverage.json precedent — the gate only bites guides scaffolded after it).
// An EMPTY table on a post-standard guide FAILS: the section existing means the standard
// applies, and an empty consideration set is exactly the thinness this measures.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { isMain } from "./audit/lib.mjs";
import { isSectionFile } from "../src/lib/facts.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

/** Default floors by priority rank — shipped/considered. Deliberately modest: they are a
    FLOOR against thinness, not a target (padding a table to hit a number is its own smell,
    and the shipped-name cross-check makes fake rows expensive). */
export const DEFAULT_FLOORS = {
  1: { considered: 16, shipped: 8 },
  2: { considered: 10, shipped: 5 },
  3: { considered: 6, shipped: 3 },
};

/** Pure: parse the `## Candidates considered` section into per-priority row sets.
    Returns null when the section is absent (pre-standard guide). */
export function parseCandidates(intakeMd) {
  const section = intakeMd.split(/^## Candidates considered.*$/m)[1];
  if (section === undefined) return null;
  const body = section.split(/^## /m)[0];
  const tables = [];
  for (const block of body.split(/^### /m).slice(1)) {
    const header = block.split(/\r?\n/)[0].trim();
    const m = header.match(/^Priority\s+(\d)\s*:\s*(.*)$/i);
    if (!m) continue;
    const rows = [];
    for (const line of block.split(/\r?\n/)) {
      const cells = line.split("|").map((c) => c.trim());
      // A table row: | Candidate | Verdict | → ["", name, verdict, ""]
      if (cells.length < 4 || !cells[1]) continue;
      if (/^-+$/.test(cells[1]) || cells[1] === "Candidate") continue; // separator/header
      rows.push({ name: cells[1], verdict: cells[2] ?? "" });
    }
    tables.push({ rank: Number(m[1]), priority: m[2].trim() || "(unnamed)", rows });
  }
  return tables;
}

/** Pure: judge parsed tables against floors + the guide's own text. */
export function judgeCandidates(tables, { floors = {}, guideText = "" } = {}) {
  const findings = [];
  const summary = [];
  for (const t of tables) {
    const floor = floors[t.rank] ?? floors[String(t.rank)] ?? DEFAULT_FLOORS[t.rank];
    if (!floor) continue; // ranks beyond 3 are bonus depth, never gated
    const shipped = t.rows.filter((r) => /^shipped\b/i.test(r.verdict));
    const considered = t.rows.length;
    summary.push({ rank: t.rank, priority: t.priority, considered, shipped: shipped.length, floor });
    if (considered < floor.considered) {
      findings.push(`priority ${t.rank} (${t.priority}): ${considered} candidate(s) considered, floor is ${floor.considered}`);
    }
    if (shipped.length < floor.shipped) {
      findings.push(`priority ${t.rank} (${t.priority}): ${shipped.length} shipped, floor is ${floor.shipped}`);
    }
    for (const r of shipped) {
      // The cross-check that makes a padded table expensive: a shipped name must exist in
      // the guide. Case-insensitive substring — names appear inside prose and item fields.
      if (guideText && !guideText.toLowerCase().includes(r.name.toLowerCase())) {
        findings.push(`priority ${t.rank}: "${r.name}" is marked shipped but appears nowhere in the guide`);
      }
    }
  }
  if (!tables.length) findings.push("the ## Candidates considered section exists but holds no priority tables");
  return { status: findings.length ? "fail" : "pass", findings, summary };
}

/** Full check for one slug: reads the intake doc + guide files. n/a when pre-standard. */
export async function checkCandidates(slug, { rootDir = ROOT, researchFloors = null } = {}) {
  let intake;
  try {
    intake = await readFile(path.join(rootDir, "guides-intake", `${slug}.md`), "utf8");
  } catch {
    return { status: "n/a", reason: "no intake doc" };
  }
  const tables = parseCandidates(intake);
  if (tables === null) return { status: "n/a", reason: "pre-standard intake (no ## Candidates considered section)" };

  const dir = path.join(rootDir, "src", "content", "guides", slug);
  let guideText = "";
  try {
    for (const f of (await readdir(dir)).filter(isSectionFile)) {
      guideText += await readFile(path.join(dir, f), "utf8");
    }
  } catch { /* directory missing → shipped cross-check simply can't run */ }

  return { ...judgeCandidates(tables, { floors: researchFloors ?? {}, guideText }), tables: tables.length };
}

if (isMain(import.meta.url)) {
  const slug = process.argv[process.argv.indexOf("--slug") + 1];
  if (!slug || slug === "--slug") { console.error("Usage: node scripts/check-candidates.mjs --slug <slug>"); process.exit(1); }
  const r = await checkCandidates(slug);
  console.log(`[candidates] ${slug}: ${r.status}${r.reason ? ` — ${r.reason}` : ""}`);
  for (const s of r.summary ?? []) console.log(`  P${s.rank} ${s.priority}: ${s.shipped}/${s.considered} shipped/considered (floor ${s.floor.shipped}/${s.floor.considered})`);
  for (const f of r.findings ?? []) console.log(`  ✗ ${f}`);
  process.exit(r.status === "fail" ? 1 : 0);
}
