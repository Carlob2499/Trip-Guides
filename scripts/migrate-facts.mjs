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
// DEDUP (B2, docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST): two units citing the identical claim text (same
// label, same value) from two DIFFERENT source pages collapse onto ONE row — the first-seen
// source wins, and every collapse is printed in the CLI output (below) for human review before
// `--write` makes it permanent. See the collapsed-rows log, and MONEY_DIGITS above MONEY_RE for
// the companion fix (a value must never carry a trailing separator with nothing after it).
//
// Usage:
//   node scripts/migrate-facts.mjs --slug denmark            # propose, print a review table
//   node scripts/migrate-facts.mjs --slug denmark --write    # apply (facts.json + tokens)

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { GUIDES_DIR } from "./audit/lib.mjs";
import { isSectionFile } from "../src/lib/facts.mjs";

// B2 (docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST): the digit group used to be `\d[\d.,]*` — any run of digits,
// commas, and dots. That accepts a TRAILING separator with nothing after it, which is exactly
// how "$19, $65, or $18" (a comma-separated list in prose) yielded the fact row `"$19,"` — the
// regex happily matched up through the list separator. Same failure mode for a value ending a
// sentence: "…around ₩6,000." captured the full stop. The Japan regression fixture's case 10
// froze three such rows (tests/fixtures/japan-regression/MANIFEST.md).
//
// Fix: every separator inside the digit group must be immediately followed by MORE digits —
// `\d+(?:[.,]\d+)*` — so a comma or dot with nothing after it is simply left out of the match,
// not swallowed into it. Verified against every value format actually in the corpus (comma
// thousands-grouping "11,410", plain "19", decimals "5.50" and "2,007.90") before landing this.
const MONEY_DIGITS = "\\d+(?:[.,]\\d+)*";

// Currency amounts only. Both orders (symbol-first "$12" / "DKK 100" and unit-last "100 DKK",
// "200 kr"), with an optional leading ≈ captured so state can be derived from it.
const MONEY_RE = new RegExp(
  [
    `(≈)?\\s?(?:DKK|NOK|SEK|EUR|USD|JPY|KRW|GBP)\\s?${MONEY_DIGITS}`,
    `(≈)?\\s?[$€£¥₩]\\s?${MONEY_DIGITS}(?:\\s?(?:USD|EUR|GBP|DKK|NOK|SEK))?`,
    `(≈)?\\s?${MONEY_DIGITS}\\s?(?:DKK|NOK|SEK|EUR|USD|JPY|KRW|kr\\.?)\\b`,
  ].join("|"),
  "g",
);

/** Defense in depth alongside the regex fix above, not a substitute for it: strips any trailing
    run of `,`/`.` a value should never carry. The regex should never produce one any more, but
    this keeps a malformed value from reaching facts.json even if a future MONEY_RE edit
    reintroduces the gap — the exact way this bug shipped the first time. */
export function normalizeValue(value) {
  return value.replace(/[.,]+$/, "");
}

// Prose-ish fields that may carry a price. Mirrors the fields the voice gate scans. Exported
// (B4, docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST) so fact-usage.mjs scans the SAME fields when it looks for
// raw money mentions with no {{fact:id}} token — one list, not two that can drift apart.
export const TEXT_FIELDS = ["body", "intro", "why", "how", "crowd_tip", "note", "tip"];

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
    // Normalize the STORED value only — never `raw`/`tight`, which drive the positional
    // replacement below and must stay the exact substring lifted from prose (the invariant this
    // whole module exists to hold). MONEY_DIGITS should already stop this trailing-punctuation
    // case from occurring; this is the safety net described above MONEY_RE, not the primary fix.
    value = normalizeValue(value);
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
  // The registry already on disk is the base we merge INTO, never a blank slate — otherwise
  // --write silently deletes every fact a prior pass (or hand edit) already registered. Newly
  // migrated ids must also avoid colliding with an id that already exists.
  let facts = {};
  try {
    facts = JSON.parse(await readFile(path.join(dir, "facts.json"), "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  const taken = new Set(Object.keys(facts));
  // B2: keyed on (label, normalized value, approx) — the CLAIM STEM plus the value, matching
  // the fact's own `claim` string (`${label} — ${value}`) minus formatting. That's deliberately
  // broader than the old value+source_url key: two units citing the identical claim from two
  // DIFFERENT pages used to mint two rows with byte-identical `claim` text, which is the
  // duplicate-row half of the plan's D9 defect (the Japan fixture's case 9 domestic-flight
  // cluster is this shape, just spread across separate migrate-facts.mjs runs over time rather
  // than one). The first occurrence in file order wins and keeps its source; "strongest source"
  // isn't computable here since `tier` is never populated at migrate time (documented in B1) —
  // first-seen is the deterministic tie-break, and every collapse is reported so a human can
  // override it before `--write`.
  const byClaim = new Map();
  const newIds = new Set();
  const collapsed = [];
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
          const key = `${label}|${h.value}|${h.approx}`;
          let id = byClaim.get(key);
          if (!id) {
            id = makeFactId(label, h.value, taken);
            byClaim.set(key, id);
            newIds.add(id);
            // Does NOT populate risk/entity/evidence (src/content.config.ts, src/lib/facts.mjs)
            // — deliberately. This migrator lifts exactly what was already in the prose unit;
            // assigning risk or grouping an entity needs research judgment this pass doesn't
            // have. That's D2's job (entity-level research protocol), not this one's.
            facts[id] = {
              claim: `${label} — ${h.value}`,
              value: h.value,
              source_url: unit.source_url,
              verified_on: unit.verified_on,
              shelf_life: unit.shelf_life ?? "default",
              ...(h.approx ? { state: "approx" } : {}),
            };
          } else if (facts[id].source_url !== unit.source_url) {
            // Same claim, same value, a SECOND source_url turned up. Kept the first; report the
            // rest rather than silently dropping evidence a human might want to look at (a
            // second source could mean welcome corroboration, or it could mean the JR East vs
            // ANA misattribution shape B3's hygiene gate looks for later).
            collapsed.push({ id, label, value: h.value, kept: facts[id].source_url, dropped: unit.source_url });
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

  return { facts, edits, occurrences, factCount: newIds.size, collapsed, newIds };
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
  const { facts, edits, occurrences, factCount, collapsed, newIds } = await proposeMigration(a.slug);
  if (!factCount) {
    console.log(`[migrate] ${a.slug}: no migratable money facts in provenance-bearing units.`);
    process.exit(0);
  }
  console.log(`[migrate] ${a.slug}: ${factCount} fact(s) covering ${occurrences} occurrence(s) across ${edits.length} file(s)\n`);
  for (const id of newIds) {
    const f = facts[id];
    const reuse = occurrences > factCount ? "" : "";
    console.log(`  ${id}`);
    console.log(`     value ${JSON.stringify(f.value)}${f.state === "approx" ? "  (≈ derived)" : ""}${reuse}`);
    console.log(`     ${f.shelf_life} · ${f.verified_on} · ${f.source_url}`);
  }
  // B2: same claim + value cited from a second source_url — collapsed onto the first-seen row
  // rather than minting a duplicate. Printed even in propose mode (before any --write) since
  // this is exactly the review point a human should look at before the drop is permanent: a
  // second source could be welcome corroboration, or it could be the misattribution shape B3's
  // hygiene gate is built to catch later.
  if (collapsed.length) {
    console.log(`\n[migrate] ${collapsed.length} row(s) collapsed onto an existing claim (review before --write):`);
    for (const c of collapsed) {
      console.log(`  ${c.id}  (${c.label} — ${JSON.stringify(c.value)})`);
      console.log(`     kept:    ${c.kept}`);
      console.log(`     dropped: ${c.dropped}`);
    }
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
