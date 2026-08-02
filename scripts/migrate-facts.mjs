// Propose (and optionally apply) a guide's move onto the perishable-fact registry.
//
// WHAT IT MIGRATES, AND WHY ONLY THAT. Money figures that sit inside a unit already carrying
// `source_url` + `verified_on`. Two deliberate exclusions:
//   · Clock times and durations. In practice these are itinerary STRUCTURE ("11:00–12:30" in a
//     day plan), not sourced perishable facts, and hoisting them produces dozens of low-value
//     rows that obscure the prices actually worth tracking.
//   · Anything in a unit with no provenance. A fact earns a registry row because it is
//     perishable AND sourced; a row with no source would just relocate the problem.
//
// THE INVARIANT: the built site must not change by one byte. So a fact's `value` is the EXACT
// substring lifted out of the prose — never retyped, never reformatted — and replacement is
// POSITIONAL (single regex pass, offsets applied right-to-left). That matters more than it
// looks: "40 DKK" is a substring of "340 DKK", so naive string replacement silently corrupts
// the larger figure. Offsets cannot make that mistake.
//
// `≈` is derived from `state`, so an approximate figure is stored WITHOUT its marker. A value
// written "≈ 120" (marker, then a space) is SKIPPED rather than migrated: re-rendering it would
// emit "≈120" and lose the space — a one-byte diff is still a diff.
//
// Usage:
//   node scripts/migrate-facts.mjs --slug denmark            # propose, print a review table
//   node scripts/migrate-facts.mjs --slug denmark --write    # apply (facts.json + tokens)

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { GUIDES_DIR } from "./audit/lib.mjs";
import { isSectionFile } from "../src/lib/facts.mjs";

// Currency amounts only. Both orders (symbol-first "$12" / "DKK 100" and unit-last "100 DKK",
// "200 kr"), with an optional leading ≈ captured so state can be derived from it.
const MONEY_RE = new RegExp(
  [
    "(≈)?\\s?(?:DKK|NOK|SEK|EUR|USD|JPY|KRW|GBP)\\s?\\d[\\d.,]*",
    "(≈)?\\s?[$€£¥₩]\\s?\\d[\\d.,]*(?:\\s?(?:USD|EUR|GBP|DKK|NOK|SEK))?",
    "(≈)?\\s?\\d[\\d.,]*\\s?(?:DKK|NOK|SEK|EUR|USD|JPY|KRW|kr\\.?)\\b",
  ].join("|"),
  "g",
);

// Prose-ish fields that may carry a price. Mirrors the fields the voice gate scans.
const TEXT_FIELDS = ["body", "intro", "why", "how", "crowd_tip", "note", "tip"];

/** kebab id, uniquified. The VALUE is always kept and the label truncated around it — an id
    like `transit-passes-589-dkk` is greppable; `transit-passes-which-one-to-buy-7` is not. */
export function makeFactId(label, value, taken = new Set()) {
  const kebab = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const valPart = kebab(value);
  const labelPart = kebab(label).split("-").filter(Boolean).slice(0, 3).join("-");
  const base = [labelPart, valPart].filter(Boolean).join("-") || "fact";
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}

/** A citation/reference list restates figures that live elsewhere in the guide. Hoisting those
    would mint a second row for the same price (cited from a different page), which is the
    opposite of the one-fact-one-row property the registry exists for. */
export function isReferenceUnit(section) {
  return /^sources/i.test(section?.group ?? "") || /^sources/i.test(section?.title ?? "");
}

/**
 * Find every migratable money figure in one string.
 * Returns [{ start, end, raw, value, approx }] — `raw` is the exact matched text (what gets
 * replaced), `value` is what the registry stores (raw minus a leading ≈).
 */
export function findMoney(text) {
  const out = [];
  for (const m of text.matchAll(MONEY_RE)) {
    const raw = m[0];
    const start = m.index;
    // A match may begin with whitespace when the ≈ alternative caught it — keep the span tight
    // so replacement never eats a neighbouring space.
    const lead = raw.match(/^\s+/)?.[0]?.length ?? 0;
    const tight = raw.slice(lead);
    const approx = tight.startsWith("≈");
    let value = approx ? tight.slice(1) : tight;
    // "≈ 120 DKK": re-rendering would drop the space after the marker. Skip rather than change
    // a byte — the registry is not worth a cosmetic regression.
    if (approx && /^\s/.test(value)) continue;
    if (!/\d/.test(value)) continue;
    out.push({ start: start + lead, end: start + lead + tight.length, raw: tight, value, approx });
  }
  return out;
}

/** Apply replacements by OFFSET, right-to-left, so earlier offsets stay valid. */
export function applyReplacements(text, reps) {
  let out = text;
  for (const r of [...reps].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, r.start) + r.token + out.slice(r.end);
  }
  return out;
}

export async function proposeMigration(slug, guidesDir = GUIDES_DIR) {
  const dir = path.join(guidesDir, slug);
  const files = (await readdir(dir)).filter(isSectionFile).sort();
  const facts = {};
  const taken = new Set();
  // value+source_url → id, so the SAME price cited from the same page becomes ONE fact
  // referenced from every mention. That collapsing is the entire point: one edit, everywhere.
  const byValue = new Map();
  const edits = [];
  let occurrences = 0;

  for (const file of files) {
    const raw = await readFile(path.join(dir, file), "utf8");
    const sections = JSON.parse(raw);
    let touched = false;

    const scanUnit = (unit, label) => {
      if (!unit?.source_url || !unit?.verified_on) return;
      for (const field of TEXT_FIELDS) {
        const text = unit[field];
        if (typeof text !== "string") continue;
        const hits = findMoney(text);
        if (!hits.length) continue;
        const reps = [];
        for (const h of hits) {
          const key = `${h.value}|${h.approx}|${unit.source_url}`;
          let id = byValue.get(key);
          if (!id) {
            id = makeFactId(label, h.value, taken);
            byValue.set(key, id);
            facts[id] = {
              claim: `${label} — ${h.value}`,
              value: h.value,
              source_url: unit.source_url,
              verified_on: unit.verified_on,
              shelf_life: unit.shelf_life ?? "default",
              ...(h.approx ? { state: "approx" } : {}),
            };
          }
          reps.push({ ...h, token: `{{fact:${id}}}` });
          occurrences++;
        }
        unit[field] = applyReplacements(text, reps);
        touched = true;
      }
    };

    for (const s of sections) {
      if (isReferenceUnit(s)) continue; // a Sources list restates; it does not own the fact
      const label = s.title ?? s.group ?? "section";
      scanUnit(s, label);
      for (const it of s.items ?? []) scanUnit(it, `${label} → ${it.name ?? it.title ?? it.label ?? "item"}`);
    }
    if (touched) edits.push({ file, json: JSON.stringify(sections, null, 2) + "\n" });
  }

  return { facts, edits, occurrences, factCount: Object.keys(facts).length };
}

// ── CLI ──
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--write") a.write = true;
    else if (argv[i].startsWith("--")) { a[argv[i].slice(2)] = argv[i + 1]; i++; }
    else a._.push(argv[i]);
  }
  return a;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  if (!a.slug) {
    console.error("Usage: node scripts/migrate-facts.mjs --slug <slug> [--write]");
    process.exit(1);
  }
  const { facts, edits, occurrences, factCount } = await proposeMigration(a.slug);
  if (!factCount) {
    console.log(`[migrate] ${a.slug}: no migratable money facts in provenance-bearing units.`);
    process.exit(0);
  }
  console.log(`[migrate] ${a.slug}: ${factCount} fact(s) covering ${occurrences} occurrence(s) across ${edits.length} file(s)\n`);
  for (const [id, f] of Object.entries(facts)) {
    const reuse = occurrences > factCount ? "" : "";
    console.log(`  ${id}`);
    console.log(`     value ${JSON.stringify(f.value)}${f.state === "approx" ? "  (≈ derived)" : ""}${reuse}`);
    console.log(`     ${f.shelf_life} · ${f.verified_on} · ${f.source_url}`);
  }
  if (!a.write) {
    console.log(`\n[migrate] proposal only — re-run with --write to apply.`);
    process.exit(0);
  }
  const dir = path.join(GUIDES_DIR, a.slug);
  for (const e of edits) await writeFile(path.join(dir, e.file), e.json);
  await writeFile(path.join(dir, "facts.json"), JSON.stringify(facts, null, 2) + "\n");
  console.log(`\n[migrate] wrote facts.json + ${edits.length} group file(s). Now REBUILD and diff dist/ — it must be byte-identical.`);
}
