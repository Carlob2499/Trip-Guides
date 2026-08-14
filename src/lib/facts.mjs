// The perishable-fact registry: mechanics only (filenames, tokens, interpolation).
//
// WHY THIS EXISTS. A price or an opening time used to live as words inside a prose body, and
// the same figure was usually written in two or three places (the venue card, the budget line,
// the day plan). That made every correction a manual hunt — the "continuity sweep" — and made
// auditing citations so expensive that the done-gate could only afford to SAMPLE five facts.
// Here, a perishable fact is one record with one source and one date; prose references it as
// `{{fact:<id>}}` and the loader substitutes the value at build time. One edit updates every
// mention, the audit can walk all of them, and a bare invented number in prose becomes
// detectable rather than merely forbidden.
//
// This module is deliberately dependency-free and shared by BOTH the Astro loader
// (src/content.config.ts) and the node-side readers (scripts/audit/lib.mjs), so the site and
// the auditors can never disagree about what a guide actually says. The staleness table's twin
// declarations — kept in sync only by a test — are the cautionary precedent.
//
// SHAPE (validated by the zod schema in src/content.config.ts, which stays the one schema home):
//   { "<kebab-id>": { claim, value, source_url, verified_on, shelf_life, state?, tier?,
//                      risk?, entity?, evidence? } }
// risk/entity/evidence (B1, docs/PLAN_EVIDENCE_FIRST.md) are additive and optional, same as
// tier: risk is 0-4 (how much rigor the fact earned), entity groups every row researched as
// one unit (a venue/route/event), evidence is a short quoted locator phrase for later drift
// checks. Nothing populates them yet — that's later packets' work — so every fact written
// today is unaffected.

/** Files in a guide directory that are NOT arrays of sections. Every directory reader must
    skip these; a reader that doesn't either throws on load (the Astro loader) or silently
    drops the whole guide (audit/lib.mjs swallows the TypeError and warns). */
export const RESERVED_GUIDE_FILES = new Set(["_guide.json", "facts.json"]);

/** Registry ids with a RESERVED contract (D14/ADR 0003): not perishable prose figures, never
    referenced as a {{fact:…}} token, consumed directly by a derivation instead (the Atlas
    guide-record reads traveler-origin through the airport gazetteer). Consumers that reason
    about "normal" rows — the unused-row nag, the shelf-life staleness sweep — must skip
    these, or they permanently mis-report a row that is behaving exactly as designed. */
export const RESERVED_FACT_IDS = new Set(["traveler-origin"]);

/** Is this filename one of a guide directory's section files? */
export function isSectionFile(name) {
  return name.endsWith(".json") && !RESERVED_GUIDE_FILES.has(name);
}

/** `{{fact:museum-x-admission}}` — kebab ids only, so a typo can't quietly look like a match. */
export const FACT_TOKEN_RE = /\{\{fact:([a-z0-9][a-z0-9-]*)\}\}/g;

/** A fact VALUE is inline text. Markup would flow straight into a prose body and defeat the
    tag allowlist, and a `</p>` would move the lead-first fold. Enforced by the schema too. */
export const FACT_VALUE_FORBIDDEN_RE = /[<>]/;

/** A token that opens a WRITTEN RANGE — `{{fact:phone-esim-low}}–35,000 for 7–10 days`. Only
    the first half of the range is a registry token; the second half is literal prose. The
    ≈ approx. pill is appended after the value, so on a range it landed BETWEEN the two halves
    ("₩33,000 ≈ approx.–35,000") — the pill ruling (D10) was settled against single values and
    never covered this shape. Matching the tail lets it travel with the value so the pill sits
    after the whole span instead of splitting it.
    Deliberately tight: the dash must TOUCH the token and be followed by a number. A spaced
    dash is ordinary prose punctuation ("{{fact:fare}} — book ahead"), and swallowing that
    would move the pill into the middle of a sentence, trading one bug for a worse one. */
const RANGE_TAIL_RE = /^[–—-] ?\d[\d.,]*/;

/** Minimal HTML-attribute escaper — `claim` is free authored text (no FORBIDDEN_RE gate the
    way `value` has), so it can carry `&`/`"`/`<`/`>` and must not break out of the attribute
    it's embedded in below. Order matters: `&` first, or the later entities re-escape. */
function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Render a fact for insertion.
 * `≈` is DERIVED from state, never authored into `value` — that keeps one spelling of
 * "sourced-but-approximate" and stops a bare `≈` from being typed next to an unsourced number.
 *
 * D10/Stage A.7 (docs/archive/PLAN_ATLAS_MIGRATION.md): an approx value renders as the plain value followed
 * by a small `≈ approx.` pill — the design-handoff's literal flag-chip form ("≈ approx.",
 * README's notation table), creator-confirmed in the Stage A/B review pass over the
 * value-inside-the-pill alternative. The pill is a real, allowlisted `<a>` (prose tag
 * allowlist — no bespoke `<span>` shape needed) pointing straight at the fact's own
 * `source_url` — works with zero JS, same as any other inline citation link.
 * `src/scripts/provenance-dot.js` progressively enhances it client-side: intercepts the click
 * and opens the SAME `.prov-popover` component `.prov-dot` uses (Claim/Checked/Source/
 * Evidence), built from the `data-*` attributes carried here — every field a fact record has
 * is REQUIRED by its schema (factRecord in content.config.ts), so there is no missing-data
 * case to guard against. `value`'s own FORBIDDEN_RE already guarantees no `<`/`>` reaches this
 * template unescaped; `claim` gets its own escape since it carries no such constraint.
 * The plain-text exports (.ics/.gpx) strip tags keeping inner text, so this renders there as
 * "<value> ≈ approx." — the space before the pill is load-bearing for that stripping.
 *
 * `rangeTail` is the literal second half of a written range the caller has consumed on this
 * token's behalf (RANGE_TAIL_RE) — it renders as part of the value so the pill lands after the
 * whole range, never inside it.
 *
 * A11y: the `≈` is decoration beside the word it decorates, and a screen reader announcing
 * "almost equal to approx." says the same thing twice. FlagChip.jsx hides it with an
 * `aria-hidden` span around the glyph; this string cannot — prose-html.ts allows exactly one
 * `<span>` shape (`data-addr-kr`) and widening a stored-XSS gate to hold a glyph would be a
 * poor trade. `aria-label` on the `<a>` reaches the identical accessible name ("approx.",
 * which is the chip's visible text less the decoration) without touching the allowlist. */
export function renderFactValue(fact, rangeTail = "") {
  const v = String(fact.value) + rangeTail;
  if (fact.state !== "approx") return v;
  const attrs = [
    `class="flag-chip flag-chip--approx"`,
    `href="${escapeAttr(fact.source_url)}"`,
    `aria-label="approx."`,
    `target="_blank"`,
    `rel="noopener"`,
    `data-claim="${escapeAttr(fact.claim)}"`,
    `data-verified-on="${escapeAttr(fact.verified_on)}"`,
    `data-shelf-life="${escapeAttr(fact.shelf_life)}"`,
    `data-source-url="${escapeAttr(fact.source_url)}"`,
  ];
  if (fact.tier) attrs.push(`data-tier="${escapeAttr(fact.tier)}"`);
  return `${v} <a ${attrs.join(" ")}>≈ approx.</a>`;
}

/** Every fact id referenced anywhere in a value tree (deduped, in first-seen order). */
export function collectTokens(node, out = []) {
  if (typeof node === "string") {
    for (const m of node.matchAll(FACT_TOKEN_RE)) if (!out.includes(m[1])) out.push(m[1]);
  } else if (Array.isArray(node)) {
    for (const v of node) collectTokens(v, out);
  } else if (node && typeof node === "object") {
    for (const k of Object.keys(node)) collectTokens(node[k], out);
  }
  return out;
}

/**
 * Replace every `{{fact:id}}` in a value tree. Pure: returns a new tree plus what it used and
 * what it couldn't resolve. The CALLER decides how loudly to fail — the loader throws (an
 * unresolved token must never reach dist/), while an auditor may prefer to report.
 */
export function interpolateFacts(data, facts = {}, { keepUnresolved = true } = {}) {
  const used = new Set();
  const missing = new Set();

  // Scanned rather than String.replace()d because an approx token can CONSUME text that
  // follows it (the second half of a written range, RANGE_TAIL_RE) — a replace callback can
  // only rewrite what it matched, so the tail would be re-emitted after the pill.
  const walk = (node) => {
    if (typeof node === "string") {
      let out = "";
      let cursor = 0;
      for (const m of node.matchAll(FACT_TOKEN_RE)) {
        const [whole, id] = m;
        out += node.slice(cursor, m.index);
        cursor = m.index + whole.length;
        const fact = facts[id];
        if (!fact) {
          missing.add(id);
          if (keepUnresolved) out += whole;
          continue;
        }
        used.add(id);
        // Only an approx fact emits a pill, so only an approx fact has a range to be split
        // by one. A clean value leaves the text after it exactly where the author put it.
        const tail = fact.state === "approx" ? (RANGE_TAIL_RE.exec(node.slice(cursor)) ?? [""])[0] : "";
        cursor += tail.length;
        out += renderFactValue(fact, tail);
      }
      return out + node.slice(cursor);
    }
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      const out = {};
      for (const k of Object.keys(node)) out[k] = walk(node[k]);
      return out;
    }
    return node;
  };

  return { data: walk(data), used: [...used], missing: [...missing] };
}

/** Facts defined but never referenced. Not an error — a fact can be registered ahead of the
    prose that will cite it — but worth surfacing so a registry doesn't quietly rot. Reserved
    ids are excluded: they are never token-referenced BY CONTRACT, so reporting one as
    "referenced by nothing" would be a permanent false nag on a row doing its job. */
export function unusedFactIds(facts = {}, used = []) {
  return Object.keys(facts).filter((id) => !used.includes(id) && !RESERVED_FACT_IDS.has(id));
}
