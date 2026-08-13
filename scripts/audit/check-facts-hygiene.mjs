// B3 (docs/PLAN_EVIDENCE_FIRST.md) — facts.json hygiene: three deterministic, structural flags
// over a guide's fact registry. ADVISORY ONLY in this packet (warn-first, per the plan's own
// rollout doctrine — E1 is the packet that flips any of these to a blocker). Nothing here
// touches verify-guide.mjs's existing `blockers` list.
//
// Calibrated against the REAL corpus, not just the Japan regression fixture — every threshold
// below was checked against korea/us/denmark's actual facts.json before landing, specifically
// to avoid a checker that cries wolf on legitimate data. Where it still flags real rows (see
// each flag's own comment), that's recorded as a TRUE finding, per the packet's own acceptance
// clause ("clean korea/us facts produce none, OR DOCUMENTED TRUE POSITIVES") — not a bug to
// suppress by loosening the check.

/** Strip the trailing " — <value>" a fact's own `claim` always carries (`${label} — ${value}`,
    migrate-facts.mjs) to recover the claim STEM — the part that's supposed to say WHAT is being
    claimed, independent of the number. */
function claimStem(claim) {
  return (claim ?? "").replace(/\s—\s[^—]*$/, "");
}

/** The stem's LEAF text: everything after its first "→" segment. A claim's first segment is
    always the section/group label (migrate-facts.mjs's `label` = `s.title ?? s.group`), which
    recurs across every unrelated claim in that section ("Budget & daily costs" alone is not a
    signal — nearly every Korea/Japan money claim starts with some group name). Dropping it and
    keeping only what's more specific is what let this design tell Japan's genuine ¥11,410
    misattribution (shares "Sendai"+"Tokyo") apart from Korea's "Budget & daily costs → X" vs
    "Budget & daily costs → Y" pairs, which share nothing but the group label once it's dropped.
    A stem with no "→" at all has no leaf — it IS just the bare group label (see bareEchoRows). */
function leafText(stem) {
  const segs = stem.split("→").map((s) => s.trim());
  return segs.length > 1 ? segs.slice(1).join(" → ") : "";
}

const STOPWORDS = new Set(["this", "that", "with", "from", "your", "when", "what", "where", "which"]);

/** Lowercased words ≥4 chars, punctuation/arrows stripped, a small set of generic connectors
    dropped. Deliberately NOT a full stopword list or a stemmer — see the module comment: this
    is a structural signal, not NLP, and adding more suppression here is how a real
    misattribution quietly stops being caught. Extend only against a demonstrated false positive,
    the same way MONEY_DIGITS in migrate-facts.mjs was extended against real corpus values. */
function significantWords(text) {
  return text
    .toLowerCase()
    .replace(/[→\-—,.()/:+]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

function normalizeValue(value) {
  return (value ?? "").replace(/[.,]+$/, "");
}

/** Flag (a): two rows, same normalized value, DIFFERENT source_url, and their claim stems'
    LEAF text shares ≥2 significant words. Two-word threshold (not one) is load-bearing — it is
    what excludes Korea's real same-value collisions that share only a recurring destination
    name ("Seoul", "Daejeon" — the guide's own city, appearing in nearly every claim) while
    still catching Japan's case 9 (¥11,410 attributed to jreast.co.jp AND ana.co.jp, whose
    stems share "Sendai" AND "Tokyo"). Verified: zero flags across korea/us/denmark's real
    facts.json at this threshold; exactly one at the fixture's known case 9 pair. */
export function misattributionCandidates(facts) {
  const rows = Object.entries(facts).filter(([id]) => id !== "traveler-origin");
  const byValue = new Map();
  for (const [id, f] of rows) {
    const key = normalizeValue(f.value);
    if (!byValue.has(key)) byValue.set(key, []);
    byValue.get(key).push([id, f]);
  }
  const out = [];
  for (const [value, group] of byValue) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const [idA, fA] = group[i];
        const [idB, fB] = group[j];
        if (fA.source_url === fB.source_url) continue;
        const wordsA = new Set(significantWords(leafText(claimStem(fA.claim))));
        const wordsB = significantWords(leafText(claimStem(fB.claim)));
        const shared = wordsB.filter((w) => wordsA.has(w));
        if (shared.length >= 2) {
          out.push({ ids: [idA, idB], value, shared, sources: [fA.source_url, fB.source_url] });
        }
      }
    }
  }
  return out;
}

/** Flag (b): a value ending in a trailing `,`/`.` with nothing after it — the migrate-facts.mjs
    MONEY_DIGITS defect (B2) class, but this checker catches it regardless of HOW it got into
    facts.json (hand-edited, migrated before B2 shipped, or a future migrator bug). Deterministic,
    zero ambiguity — a value never legitimately ends this way. */
export function malformedValueRows(facts) {
  return Object.entries(facts)
    .filter(([id, f]) => id !== "traveler-origin" && /[.,]$/.test(f.value ?? ""))
    .map(([id, f]) => ({ id, value: f.value }));
}

/** Flag (c): a claim stem with NO "→" leaf (see leafText) — i.e. the claim is nothing but the
    section/group label repeated verbatim — AND that same bare stem covers ≥2 DIFFERENT values.
    Both conditions matter: "no leaf" alone flags real, specific section titles too often
    (Korea's "Hongdae after dark", "Norebang, Han River & the ones Americans miss" are bare but
    genuinely distinct claims, each used for exactly one value); requiring repetition across
    different values is what isolates the actual defect — a claim so generic it cannot tell two
    different prices apart ("Local essentials — ¥1,000" / "Local essentials — ¥10,000": which is
    which?). This DOES still flag real rows in korea/denmark's corpus (e.g. Korea's "Money &
    currency" covers five different exchange-rate benchmarks) — a genuine finding of the same
    class D4 names, not a false positive to suppress. */
export function bareEchoRows(facts) {
  const rows = Object.entries(facts).filter(([id]) => id !== "traveler-origin");
  const byStem = new Map();
  for (const [id, f] of rows) {
    const stem = claimStem(f.claim);
    if (leafText(stem)) continue; // has a leaf — not bare
    if (!byStem.has(stem)) byStem.set(stem, []);
    byStem.get(stem).push([id, normalizeValue(f.value)]);
  }
  const out = [];
  for (const [stem, entries] of byStem) {
    const values = new Set(entries.map(([, v]) => v));
    if (values.size < 2) continue;
    out.push({ stem, ids: entries.map(([id]) => id), values: [...values] });
  }
  return out;
}

/** Roll all three flags for one guide's facts registry into one advisory report. `facts` may be
    null (a guide with no facts.json) — reports cleanly as nothing to check, not an error. */
export function checkFactsHygiene(facts) {
  if (!facts) return { status: "n/a", misattribution: [], malformed: [], bareEcho: [] };
  const misattribution = misattributionCandidates(facts);
  const malformed = malformedValueRows(facts);
  const bareEcho = bareEchoRows(facts);
  const clean = !misattribution.length && !malformed.length && !bareEcho.length;
  return { status: clean ? "clean" : "advisory", misattribution, malformed, bareEcho };
}

// ── CLI ──
import { readGuides, isMain } from "./lib.mjs";

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const slug = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1] : null;
  const guides = await readGuides();
  const targets = slug ? guides.filter((g) => g.slug === slug) : guides;
  for (const t of targets) {
    const r = checkFactsHygiene(t.facts);
    if (r.status === "n/a") { console.log(`[hygiene] ${t.slug}: n/a — no facts.json`); continue; }
    if (r.status === "clean") { console.log(`[hygiene] ${t.slug}: clean — no findings`); continue; }
    console.log(`[hygiene] ${t.slug}: ${r.misattribution.length + r.malformed.length + r.bareEcho.length} advisory finding(s)`);
    for (const m of r.misattribution) {
      console.log(`  ⚠ misattribution: ${m.ids.join(" <-> ")} both claim ${JSON.stringify(m.value)} from different sources (shared: ${m.shared.join(", ")})`);
    }
    for (const m of r.malformed) {
      console.log(`  ⚠ malformed value: ${m.id} — ${JSON.stringify(m.value)}`);
    }
    for (const b of r.bareEcho) {
      console.log(`  ⚠ bare echo: "${b.stem}" covers ${b.values.length} different values (${b.ids.join(", ")}) — which is which?`);
    }
  }
}
