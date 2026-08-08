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
//   { "<kebab-id>": { claim, value, source_url, verified_on, shelf_life, state?, tier? } }

/** Files in a guide directory that are NOT arrays of sections. Every directory reader must
    skip these; a reader that doesn't either throws on load (the Astro loader) or silently
    drops the whole guide (audit/lib.mjs swallows the TypeError and warns). */
export const RESERVED_GUIDE_FILES = new Set(["_guide.json", "facts.json"]);

/** Is this filename one of a guide directory's section files? */
export function isSectionFile(name) {
  return name.endsWith(".json") && !RESERVED_GUIDE_FILES.has(name);
}

/** `{{fact:museum-x-admission}}` — kebab ids only, so a typo can't quietly look like a match. */
export const FACT_TOKEN_RE = /\{\{fact:([a-z0-9][a-z0-9-]*)\}\}/g;

/** A fact VALUE is inline text. Markup would flow straight into a prose body and defeat the
    tag allowlist, and a `</p>` would move the lead-first fold. Enforced by the schema too. */
export const FACT_VALUE_FORBIDDEN_RE = /[<>]/;

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
 * D10/Stage A.7 (PLAN_ATLAS_MIGRATION.md): an approx value renders as a real, allowlisted `<a>`
 * (docs' "prose tag allowlist" — `<b> <i> <a> <ul> <li> <ol>`, no bespoke `<span>` shape needed)
 * pointing straight at the fact's own `source_url` — works with zero JS, same as any other
 * inline citation link. `src/scripts/flag-chip.js` progressively enhances it client-side:
 * intercepts the click and opens the SAME `.prov-popover` component `.prov-dot` uses (Claim/
 * Checked/Source/Evidence), built from the `data-*` attributes carried here — every field a
 * fact record has is REQUIRED by its schema (factRecord in content.config.ts), so there is no
 * missing-data case to guard against. `value`'s own FORBIDDEN_RE already guarantees no `<`/`>`
 * reaches this template unescaped; `claim` gets its own escape since it carries no such
 * constraint. */
export function renderFactValue(fact) {
  const v = String(fact.value);
  if (fact.state !== "approx") return v;
  const attrs = [
    `class="flag-chip flag-chip--approx"`,
    `href="${escapeAttr(fact.source_url)}"`,
    `target="_blank"`,
    `rel="noopener"`,
    `data-claim="${escapeAttr(fact.claim)}"`,
    `data-verified-on="${escapeAttr(fact.verified_on)}"`,
    `data-shelf-life="${escapeAttr(fact.shelf_life)}"`,
    `data-source-url="${escapeAttr(fact.source_url)}"`,
  ];
  if (fact.tier) attrs.push(`data-tier="${escapeAttr(fact.tier)}"`);
  return `<a ${attrs.join(" ")}>≈${v}</a>`;
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

  const walk = (node) => {
    if (typeof node === "string") {
      return node.replace(FACT_TOKEN_RE, (whole, id) => {
        const fact = facts[id];
        if (!fact) {
          missing.add(id);
          return keepUnresolved ? whole : "";
        }
        used.add(id);
        return renderFactValue(fact);
      });
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
    prose that will cite it — but worth surfacing so a registry doesn't quietly rot. */
export function unusedFactIds(facts = {}, used = []) {
  return Object.keys(facts).filter((id) => !used.includes(id));
}
