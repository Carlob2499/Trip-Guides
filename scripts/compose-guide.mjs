// The Composer (R6 — docs/reference/visual-redesign.md Move F): research emits tagged units
// (content.config.ts facets: theme · phase · rank), THIS deterministic code assembles each
// guide's tabs, and the creator signs. No model ever freelances information architecture.
//
// The core is pure — composeSections(sections, opts) is a function of its input alone
// (no fs, no Date, no randomness), so the same units always produce byte-identical
// output and the whole rule set is unit-testable (scripts/__tests__/compose-guide.test.mjs).
//
// Rules, in order (each one explainable in a sentence):
//   SPINE   — Plan · Essentials · Transit · Days · Sources are the backbone. A foldable
//             spine group (Transit, Essentials) below FOLD_THRESHOLD weight folds — each
//             unit individually, to the host its own phase names (Sedona's one-car trip:
//             transit booking → Plan, daily driving notes → Days). Plan, Days and Sources
//             never fold: the groundwork, the trip itself, and the verification apparatus
//             always stand.
//   ANCHOR  — a theme ranked in the intake's top-2 with ANCHOR_WEIGHT of real content
//             earns its own tab and is immune to budget merging (Korea's MSI weekend).
//   MERGE   — a theme below MERGE_THRESHOLD folds into its phase hosts: no
//             one-paragraph tabs.
//   ORDER   — reader-order, never alphabet: spine groups and Sources keep their
//             positions; the non-spine block sorts by rank (stable on first appearance,
//             so an untagged guide keeps its exact order). Sources is always last.
//   BUDGET  — tabBudget binds. Over budget, the smallest non-anchor themes merge — but a
//             forced merge may never relocate a ⚠-flagged unit out of its named context:
//             that fails loudly instead (raise tabBudget deliberately, or merge by hand).
//
// IDENTITY INVARIANT (the compatibility contract): a guide with no facet tags composes to
// exactly itself — theme defaults to the current group, every threshold compares against
// real weight, and the stable sort changes nothing. So adopting the Composer costs the
// existing catalog zero changes, provably (the identity test runs on the real guides).
//
// WRITE DISCIPLINE (the continuity doctrine, mechanized):
//   --check  computes and prints the proposal; it has NO write path. Exit 0 = already
//            composed; exit 2 = a proposal exists (CI/research-pass surface it for
//            sign-off). Live guides are NEVER auto-recomposed.
//   --write  applies the composition — refused unless the guide is a draft
//            (`draft: true`) or the creator explicitly passes --creator-signed.
//            Writing reuses lib/guide-shape.mjs, so the directory shape and NN-<group>.json
//            naming decisions stay in exactly one place.
import path from "node:path";
import { readFile, readdir, rm } from "node:fs/promises";
import { GUIDES_DIR, isMain } from "./audit/lib.mjs";
import { writeGuideDir } from "./lib/guide-shape.mjs";
import { isSectionFile } from "../src/lib/facts.mjs";

/* ── the rule constants (one home, exported for the tests) ─────────────────── */
export const SPINE = ["Plan", "Essentials", "Transit", "Days", "Sources"];
export const NEVER_FOLD = new Set(["Plan", "Days", "Sources"]);
// Where a folded unit goes, by ITS OWN phase (unset phase reads as groundwork).
export const PHASE_HOST = { before: "Plan", arrival: "Plan", daily: "Days", leaving: "Plan" };
// The literal-label vocabulary (Move D): a bare theme tag becomes a navigable label.
// A theme matching an EXISTING group name keeps that name (so "Gaming & anime" survives).
export const THEME_LABELS = {
  plan: "Plan", essentials: "Essentials", transit: "Transit", days: "Days",
  sources: "Sources", sights: "Sights", food: "Food", gaming: "Gaming",
  shopping: "Shopping", nature: "Nature", nightlife: "Nightlife", "day trips": "Day trips",
};
export const FOLD_THRESHOLD = 4;   // spine weight below this folds (if foldable)
export const MERGE_THRESHOLD = 3;  // non-spine weight below this merges
export const ANCHOR_RANK = 2;      // intake top-2 …
export const ANCHOR_WEIGHT = 8;    // … with this much real content ⇒ anchor tab

/* ── derived weight — never a stored field, so it can't drift from content ─── */
const stripTags = (s) => String(s || "").replace(/<[^>]+>/g, " ");
export function unitWeight(sec) {
  const items =
    (sec.items?.length ?? 0) + (sec.steps?.length ?? 0) +
    (sec.checklist?.length ?? 0) + (sec.points?.length ?? 0);
  const text = stripTags(sec.body) + stripTags(sec.intro);
  return items + Math.ceil(text.trim().length / 600);
}
export const hasWarning = (sec) => JSON.stringify(sec).includes("⚠");

/* ── the pure core ─────────────────────────────────────────────────────────── */
/**
 * @param sections flat section array (as the guide files carry them, in order)
 * @returns { sections, order, changed, moves, notes, error }
 *   moves — human-readable proposal lines, one per relocation/rename/reorder
 *   error — set instead of throwing for the ⚠-guard, so --check can PRINT it
 */
export function composeSections(sections, { tabBudget = 10 } = {}) {
  const units = sections.map((s, i) => ({
    s, i,
    theme: s.theme ?? s.group,
    phase: s.phase ?? null,
    rank: s.rank ?? null,
    weight: unitWeight(s),
    warn: hasWarning(s),
  }));

  // Theme table, first-appearance order.
  const themes = new Map(); // theme -> {units, weight, rank, first, label}
  for (const u of units) {
    if (!themes.has(u.theme)) themes.set(u.theme, { units: [], weight: 0, rank: null, first: u.i });
    const t = themes.get(u.theme);
    t.units.push(u);
    t.weight += u.weight;
    if (u.rank !== null) t.rank = t.rank === null ? u.rank : Math.min(t.rank, u.rank);
  }
  const existingGroups = new Set(sections.map((s) => s.group));
  for (const [name, t] of themes) {
    t.label = existingGroups.has(name)
      ? name
      : THEME_LABELS[name.toLowerCase()] ?? name.charAt(0).toUpperCase() + name.slice(1);
    t.isSpine = SPINE.includes(t.label);
    t.isAnchor = t.rank !== null && t.rank <= ANCHOR_RANK && t.weight >= ANCHOR_WEIGHT;
  }

  const moves = [];
  const notes = [];

  // SPINE folds + MERGE — decide which themes keep a tab.
  const foldTheme = (name, t, why) => {
    t.folded = true;
    for (const u of t.units) {
      u.target = PHASE_HOST[u.phase ?? "before"];
      moves.push(`fold: "${u.s.title ?? u.s.type}" (${name}) → ${u.target} — ${why}`);
    }
  };
  for (const [name, t] of themes) {
    if (t.isSpine && !NEVER_FOLD.has(t.label) && t.weight < FOLD_THRESHOLD) {
      foldTheme(name, t, `spine group near-empty (weight ${t.weight} < ${FOLD_THRESHOLD})`);
    } else if (!t.isSpine && !t.isAnchor && t.weight < MERGE_THRESHOLD) {
      foldTheme(name, t, `below merge threshold (weight ${t.weight} < ${MERGE_THRESHOLD})`);
    } else {
      for (const u of t.units) u.target = t.label;
    }
  }

  // BUDGET — forced merges, smallest first; anchors immune; ⚠ fails instead of hiding.
  const live = () => [...themes.entries()].filter(([, t]) => !t.folded);
  const groupCount = () => new Set(units.map((u) => u.target)).size;
  while (groupCount() > tabBudget) {
    const candidates = live()
      .filter(([, t]) => !t.isSpine && !t.isAnchor)
      .sort((a, b) => a[1].weight - b[1].weight || a[1].first - b[1].first);
    if (!candidates.length) {
      return { error: `over tab budget (${groupCount()} > ${tabBudget}) with nothing mergeable left — every remaining group is spine or an anchor. Raise tabBudget deliberately.`, moves, notes };
    }
    const [name, t] = candidates[0];
    if (t.units.some((u) => u.warn)) {
      return { error: `over tab budget (${groupCount()} > ${tabBudget}), and the smallest merge candidate "${name}" carries a ⚠-flagged unit — an automatic merge may never relocate a warning out of its named context. Raise tabBudget, or merge deliberately by hand.`, moves, notes };
    }
    foldTheme(name, t, `over tab budget (${groupCount()} > ${tabBudget})`);
  }

  // ORDER — reader-order, identity-preserving: groups keep their first-appearance slots;
  // within the non-spine block (Sources excluded), rank sorts stably; Sources goes last.
  // A group's slot comes from its NATIVE units (whose surviving theme IS the group) — a
  // folded ARRIVAL must never hoist its host earlier in the strip. Caught live on the us
  // fold: an early-document Etiquette unit folding into Days pulled Days ahead of Transit,
  // turning a signed two-section fold into an unsigned tab reorder. Targets with no natives
  // (a phase host materializing on a guide that lacked the group) still get a slot, at
  // their first arrival's position — the second pass below.
  const firstAppearance = [];
  for (const u of units) {
    if (themeLabelOfUnit(u, themes) === u.target && !firstAppearance.includes(u.target)) firstAppearance.push(u.target);
  }
  for (const u of units) if (!firstAppearance.includes(u.target)) firstAppearance.push(u.target);
  const rankOf = (g) => {
    const t = [...themes.values()].find((t) => !t.folded && t.label === g);
    return t?.rank ?? Infinity;
  };
  const isFixed = (g) => SPINE.includes(g) && g !== "Sources";
  const sortable = firstAppearance.filter((g) => !isFixed(g) && g !== "Sources");
  const sorted = [...sortable].sort((a, b) =>
    rankOf(a) - rankOf(b) || firstAppearance.indexOf(a) - firstAppearance.indexOf(b));
  let si = 0;
  let order = firstAppearance.map((g) => (isFixed(g) || g === "Sources" ? g : sorted[si++]));
  if (order.includes("Sources")) order = [...order.filter((g) => g !== "Sources"), "Sources"];
  for (let k = 0; k < order.length; k++) {
    if (order[k] !== firstAppearance[k]) { moves.push(`reorder: ${order.join(" · ")}`); break; }
  }

  // Emit: group-contiguous (writeGuideDir's invariant), original order within each group,
  // folded units appended to their host after its own units. Facet fields stay on the
  // unit — they are the unit's identity for the NEXT composition.
  const out = [];
  for (const g of order) {
    // Natives first (units whose surviving theme IS this group), then folded arrivals —
    // each pass in original document order, so within-group reading order is stable.
    for (const u of units) {
      if (u.target === g && !u.done && themeLabelOfUnit(u, themes) === g) { out.push(withGroup(u.s, g)); u.done = true; }
    }
    for (const u of units) {
      if (u.target === g && !u.done) { out.push(withGroup(u.s, g)); u.done = true; }
    }
  }

  const changed = out.length !== sections.length ||
    out.some((s, i) => s !== sections[i] && JSON.stringify(s) !== JSON.stringify(sections[i]));
  if (out.length !== sections.length) {
    return { error: `composition lost units (${sections.length} in, ${out.length} out) — refusing`, moves, notes };
  }
  return { sections: out, order, changed, moves, notes };
}

function themeLabelOfUnit(u, themes) {
  const t = themes.get(u.theme);
  return t && !t.folded ? t.label : null;
}
const withGroup = (s, g) => (s.group === g ? s : { ...s, group: g });

/* ── guide IO (thin — all decisions above are pure) ────────────────────────── */
export async function loadGuide(slug, guidesDir = GUIDES_DIR) {
  const dir = path.join(guidesDir, slug);
  const meta = JSON.parse(await readFile(path.join(dir, "_guide.json"), "utf8"));
  const files = (await readdir(dir)).filter(isSectionFile).sort();
  const sections = [];
  for (const f of files) sections.push(...JSON.parse(await readFile(path.join(dir, f), "utf8")));
  return { dir, meta, sections, files };
}

export function assertWritable(meta, { creatorSigned = false } = {}) {
  if (meta.draft || creatorSigned) return;
  throw new Error(
    "this guide is LIVE (not a draft): the Composer only proposes on live guides — a traveler mid-trip must never find content moved out from under them, and signed information architecture is the creator's to re-sign. Re-run with --creator-signed to apply deliberately, or apply to drafts freely.",
  );
}

export async function applyComposition(slug, meta, sections, guidesDir = GUIDES_DIR) {
  const dir = path.join(guidesDir, slug);
  // Remove the old group files FIRST: a renamed/folded group's NN-file would otherwise
  // linger beside the new split and shadow-feed the loader duplicate sections.
  // isSectionFile is load-bearing here, not just tidy: this loop DELETES what it matches, and
  // facts.json is the guide's citation registry, not a regenerable section file.
  for (const f of (await readdir(dir)).filter(isSectionFile)) {
    await rm(path.join(dir, f));
  }
  try {
    return await writeGuideDir(slug, { ...meta, sections }, { guidesDir });
  } catch (err) {
    // Group-contiguity is the Composer's own invariant, so a throw here is a compose bug, not a
    // caller error — say which side failed instead of surfacing a bare shape complaint.
    throw new Error(`writing the composed guide failed: ${err.message}`, { cause: err });
  }
}

/* ── CLI ───────────────────────────────────────────────────────────────────── */
async function main() {
  const argv = process.argv.slice(2);
  const flag = (n) => argv.includes(`--${n}`);
  const val = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
  const slug = val("slug");
  if (!slug || (!flag("check") && !flag("write"))) {
    console.log("Usage: node scripts/compose-guide.mjs --slug <slug> --check | --write [--creator-signed]");
    process.exit(1);
  }
  const { meta, sections } = await loadGuide(slug);
  const result = composeSections(sections, { tabBudget: meta.tabBudget ?? 10 });
  if (result.error) {
    console.error(`✗ compose(${slug}): ${result.error}`);
    process.exit(1);
  }
  if (!result.changed) {
    console.log(`✓ ${slug} is already composed — no changes.`);
    process.exit(0);
  }
  console.log(`Composition proposal for ${slug} (${result.moves.length} change${result.moves.length === 1 ? "" : "s"}):`);
  for (const m of result.moves) console.log(`  · ${m}`);
  console.log(`  → tab order: ${result.order.join(" · ")}`);
  if (flag("check")) {
    console.log(meta.draft
      ? "(draft — apply with --write)"
      : "(LIVE guide — proposal only; the creator applies with --write --creator-signed)");
    process.exit(2); // a proposal exists; CI/research-pass surface it
  }
  assertWritable(meta, { creatorSigned: flag("creator-signed") });
  await applyComposition(slug, meta, result.sections);
  console.log(`✓ composed ${slug} → ${result.order.join(" · ")}`);
}

if (isMain(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
