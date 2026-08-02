// check-passb-coverage.mjs — the reconcile blind-spot gate (creator's ruling, 2026-07-30).
//
// Pass A and Pass B are independent by construction, but ONE agent merges them — and nothing
// downstream can see what the merge silently dropped: the critics judge the product, not what's
// missing from it. This check is deterministic and agent-free: every entry in
// guides-intake/<slug>.passB.json must be accounted for in the intake doc's
// `## Research reconciliation` section (as AGREE / B-only / CONFLICT — or an explicit
// rejection row). A B-find that vanished without a written verdict fails the run.
//
// Matching is deliberately forgiving on phrasing (normalized, token-based) so an item named
// "Ichiran Ramen (Shibuya)" matches a ledger row that says "Ichiran" + "Shibuya" — but a
// find that appears NOWHERE in the reconciliation text cannot pass. The reconcile agent's
// side of the contract (SKILL.md): name each B item in the table as passB.json spells it.
//
// Usage: node scripts/check-passb-coverage.mjs --slug <slug>
// Exit 0: covered (or nothing to check — no passB.json / empty array / reconcile not run yet).
// Exit 1: one or more Pass B entries have no verdict in the reconciliation ledger.
import { existsSync, readFileSync } from "node:fs";

const RECONCILIATION_HEADING = /^##\s+Research reconciliation\s*$/m;

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Significant tokens of an item name (length ≥ 4 keeps "the", "at", "of" out). */
function tokens(name) {
  return normalize(name).split(" ").filter((t) => t.length >= 4);
}

/**
 * A Pass B entry is covered when the reconciliation text contains its full normalized
 * name, or every significant token of it (order-free — table rows rephrase).
 * Items with no significant tokens (e.g. "Bar X") fall back to full-name match only.
 */
export function isCovered(itemName, normalizedLedger) {
  const full = normalize(itemName);
  if (!full) return false;
  if (normalizedLedger.includes(full)) return true;
  const toks = tokens(itemName);
  if (toks.length === 0) return false;
  return toks.every((t) => normalizedLedger.includes(t));
}

/**
 * Pure core. Returns { status: "pass"|"fail"|"skip", missing: string[], reason }.
 * - passB null/[] → skip (nothing to cover).
 * - reconciliation section absent while passB has entries → every entry is missing.
 */
export function checkCoverage(passB, intakeText) {
  if (!Array.isArray(passB) || passB.length === 0) {
    return { status: "skip", missing: [], reason: "no Pass B entries to cover" };
  }
  const m = RECONCILIATION_HEADING.exec(intakeText ?? "");
  if (!m) {
    return {
      status: "fail",
      missing: passB.map((e) => e.item),
      reason: "intake doc has no `## Research reconciliation` section",
    };
  }
  // Section text = from the heading to the next `## ` heading (or EOF).
  const rest = intakeText.slice(m.index + m[0].length);
  const next = rest.search(/^##\s/m);
  const ledger = normalize(next === -1 ? rest : rest.slice(0, next));
  const missing = passB.filter((e) => !isCovered(e.item ?? "", ledger)).map((e) => e.item);
  return {
    status: missing.length ? "fail" : "pass",
    missing,
    reason: missing.length ? "entries with no reconciliation verdict" : "all entries covered",
  };
}

// ── S4: quantitative floors (creator-approved 2026-08-02) ─────────────────────
// Coverage above proves no B-find was silently DROPPED; it says nothing about how much B
// FOUND. A lazy Pass B with 3 entries passed the same gate as one with 30, so the resident
// angle — the whole reason B exists — could quietly thin out. Floors, enforced only with
// --floors (the research-pass gate on a FULL pass; section-scoped re-runs are exempt and
// nothing retro-fails an existing guide):
//   · ≥ MIN_TOTAL entries overall
//   · ≥ MIN_CROWD in {crowd, timing} — the off-peak/queue reality every marquee sight needs
//   · ≥ MIN_NOVEL in {novel, alternative} — the non-obvious picks that beat the generic list
export const PASSB_FLOORS = { MIN_TOTAL: 8, MIN_CROWD: 3, MIN_NOVEL: 2 };

/** Pure. Returns { status: "pass"|"fail", counts, findings[] }. */
export function checkFloors(passB, floors = PASSB_FLOORS) {
  const entries = Array.isArray(passB) ? passB : [];
  const cat = (c) => entries.filter((e) => c.includes(String(e.category ?? "").toLowerCase())).length;
  const counts = { total: entries.length, crowd: cat(["crowd", "timing"]), novel: cat(["novel", "alternative"]) };
  const findings = [];
  if (counts.total < floors.MIN_TOTAL) findings.push(`${counts.total} entries total — floor is ${floors.MIN_TOTAL}; the resident angle is thin`);
  if (counts.crowd < floors.MIN_CROWD) findings.push(`${counts.crowd} crowd/timing find(s) — floor is ${floors.MIN_CROWD}; marquee sights need off-peak reality`);
  if (counts.novel < floors.MIN_NOVEL) findings.push(`${counts.novel} novel/alternative find(s) — floor is ${floors.MIN_NOVEL}; nothing here beats the generic list`);
  return { status: findings.length ? "fail" : "pass", counts, findings };
}

// ── CLI ────────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("check-passb-coverage.mjs")) {
  const slug = process.argv[process.argv.indexOf("--slug") + 1];
  if (!slug || slug.startsWith("--")) {
    console.error("usage: node scripts/check-passb-coverage.mjs --slug <slug> [--floors]");
    process.exit(1);
  }
  const enforceFloors = process.argv.includes("--floors");
  const passBPath = `guides-intake/${slug}.passB.json`;
  const intakePath = `guides-intake/${slug}.md`;
  if (!existsSync(passBPath)) {
    console.log(`[passb-coverage] ${passBPath} absent — nothing to check (single-pass or pre-B run).`);
    process.exit(0);
  }
  let passB;
  try {
    passB = JSON.parse(readFileSync(passBPath, "utf8"));
  } catch (e) {
    console.error(`[passb-coverage] ${passBPath} is not valid JSON: ${e.message}`);
    process.exit(1);
  }
  const intake = existsSync(intakePath) ? readFileSync(intakePath, "utf8") : "";
  const result = checkCoverage(passB, intake);
  if (result.status === "fail") {
    console.error(`[passb-coverage] FAIL — ${result.reason}:`);
    for (const item of result.missing) console.error(`  · ${item}`);
    console.error(
      "Every Pass B find needs a written verdict in `## Research reconciliation` " +
        "(AGREE / B-only / CONFLICT / explicit rejection) — a silently dropped find is invisible to every later critic.",
    );
    process.exit(1);
  }
  console.log(`[passb-coverage] ${result.status.toUpperCase()} — ${result.reason} (${passB.length} entries).`);

  if (enforceFloors) {
    const f = checkFloors(passB);
    if (f.status === "fail") {
      console.error(`[passb-floors] FAIL — Pass B is under its floors (S4):`);
      for (const x of f.findings) console.error(`  · ${x}`);
      console.error("A full pass owes a real resident angle; re-run Pass B with the skill's Pass B charter, or justify the gap to a human.");
      process.exit(1);
    }
    console.log(`[passb-floors] PASS — ${f.counts.total} entries (${f.counts.crowd} crowd/timing, ${f.counts.novel} novel/alternative).`);
  }
}
