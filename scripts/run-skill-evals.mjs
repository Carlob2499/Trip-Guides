// Deterministic regression checks for the waypoint-guide-author evals (W3 IMPROVE loop, part 3).
// skill-evals.yml runs the skill's eval prompts headless (a real agent pass against the skill),
// then calls this to assert the MECHANICAL properties an edit could silently break — price
// propagation across ALL touchpoints, the draft flag surviving, no stale value left behind. The
// judgment-shaped assertions (gold-standard depth, ledger present) are a Haiku judge in the
// workflow, not here. The pure helpers below are unit-tested with good/sabotaged fixtures, so the
// regression-catching is proven without spending an agent run.
//
//   node scripts/run-skill-evals.mjs --eval=2      # assert eval 2's deterministic checks; exit 1 on fail

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "./audit/lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDES = path.join(ROOT, "src", "content", "guides");

/* ─────────────────────────── pure helpers (unit-tested) ─────────────────────────── */

// ~400-char windows around each occurrence of `keyword` across the given texts — enough to scope a
// price to the venue it belongs to (a bare grep for "₩12,000" would false-positive on an unrelated
// item that legitimately costs that).
export function segmentsNear(texts, keyword) {
  const out = [];
  for (const t of texts || []) {
    const s = String(t);
    let i = s.indexOf(keyword);
    while (i !== -1) {
      out.push(s.slice(Math.max(0, i - 200), i + keyword.length + 200));
      i = s.indexOf(keyword, i + 1);
    }
  }
  return out;
}

// A scoped price change is correct iff EVERY segment mentioning the venue shows the new price and
// NONE shows the old one, across at least `minTouchpoints` places (the change must propagate, not
// land in one spot). Returns { pass, hits, newHits, oldHits }.
export function assertScopedPropagation(texts, keyword, oldToken, newToken, minTouchpoints = 2) {
  const segs = segmentsNear(texts, keyword);
  const newHits = segs.filter((s) => s.includes(newToken)).length;
  const oldHits = segs.filter((s) => s.includes(oldToken)).length;
  return {
    pass: segs.length >= minTouchpoints && newHits >= minTouchpoints && oldHits === 0,
    hits: segs.length,
    newHits,
    oldHits,
  };
}

export function assertDraftPreserved(text) {
  return /"draft"\s*:\s*true/.test(String(text));
}

/* ─────────────────────────── impure: read the produced guide ─────────────────────────── */

function guideTexts(slug) {
  const flat = path.join(GUIDES, `${slug}.json`);
  if (existsSync(flat)) return [readFileSync(flat, "utf8")];
  const dir = path.join(GUIDES, slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => readFileSync(path.join(dir, f), "utf8"));
}

// Deterministic checks per eval id — the subset a grep can verify honestly. Each returns
// { id, pass, detail }. The fuzzy assertions in evals.json (depth, ledger) are the Haiku judge's.
const CHECKS = {
  1: () => {
    const p = path.join(GUIDES, "germany.json");
    if (!existsSync(p)) return [{ id: "germany-exists", pass: false, detail: "germany.json missing (scaffold it first)" }];
    const t = readFileSync(p, "utf8");
    return [
      { id: "draft-flag-preserved", pass: assertDraftPreserved(t), detail: "germany.json keeps draft:true" },
      { id: "money-section-filled", pass: /money|currency/i.test(t) && t.length > 500, detail: "Money & currency content present and substantive" },
    ];
  },
  2: () => {
    const texts = guideTexts("korea");
    if (!texts.length) return [{ id: "korea-exists", pass: false, detail: "korea guide files not found" }];
    const prop = assertScopedPropagation(texts, "SPAREX", "₩12,000", "₩14,000", 2);
    return [
      { id: "both-touchpoints-updated", pass: prop.newHits >= 2, detail: `₩14,000 near SPAREX in ${prop.newHits} place(s)` },
      { id: "no-stale-price", pass: prop.oldHits === 0, detail: prop.oldHits ? "stale ₩12,000 still near SPAREX" : "no stale ₩12,000 near SPAREX" },
    ];
  },
};

if (isMain(import.meta.url)) {
  const arg = process.argv.find((a) => a.startsWith("--eval="));
  const id = arg ? Number(arg.split("=")[1]) : null;
  const check = CHECKS[id];
  if (!check) {
    console.error(`Usage: node scripts/run-skill-evals.mjs --eval=<${Object.keys(CHECKS).join("|")}>`);
    process.exit(2);
  }
  const results = check();
  let failed = 0;
  for (const r of results) {
    console.log(`${r.pass ? "✓" : "✗"} eval ${id} · ${r.id} — ${r.detail}`);
    if (!r.pass) failed++;
  }
  console.log(failed ? `\n${failed} deterministic check(s) FAILED for eval ${id}` : `\nAll deterministic checks passed for eval ${id}`);
  process.exit(failed ? 1 : 0);
}
