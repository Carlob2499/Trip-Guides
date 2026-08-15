// THE single source of truth for the "Request a change" intake — the modify-side twin of
// scripts/intake-schema.mjs.
//
// Why it exists: modify's three fields were duplicated between .github/ISSUE_TEMPLATE/
// modify-guide.yml and scripts/parse-modify-issue.mjs, held together by nothing but two
// matching string literals. Rename a label in the form and the parser silently stops finding
// the field — the exact drift the intake contract test was built to prevent on the new-guide
// side. A contract test now asserts this array matches the checked-in form.
//
// Lives in src/lib/ (not scripts/) because BOTH sides import it: the node-side parser and the
// in-page change-request wizard. Same direction as facts.mjs and countries.mjs.

/** Field order matches the issue form. `id` doubles as the URL query-parameter name —
    GitHub: "the `id` is the canonical identifier for the field in URL query parameter
    prefills" (docs/communities/…/syntax-for-githubs-form-schema, checked 2026-08-02).
    The array itself now lives in `issue-forms.mjs` alongside revise's, because the revise
    parser falls back to THESE labels when an issue is escalated from the modify form — two
    sets that reference each other must not live in two files. Re-exported here so this module
    stays the one import site for everything modify-shaped.

    import-then-export, NOT a bare `export … from`: a bare re-export forwards the symbol to
    importers without creating a LOCAL binding, so renderModifyIssueBody() below would see an
    undefined MODIFY_FIELDS while every test importing it from outside passed. */
import { MODIFY_FIELDS } from "./issue-forms.mjs";
export { MODIFY_FIELDS };

export const MODIFY_TEMPLATE = "modify-guide.yml";
export const MODIFY_LABEL = "modify-request";

/** A change request is a short, specific description ("this price is wrong, it's now X"), not
    an essay — and the whole payload rides in a URL, which browsers and GitHub both cap. Bound
    it in the UI so a request can never be silently truncated on the way to the issue. */
export const CHANGE_MAX = 1200;

/** …and long enough to act on. "no" or "wrong" names no fact and gives the editor nothing to
    verify, so it is not a change request. Lives here, beside the cap, because BOTH filing paths
    have to enforce it: the wizard as a friendly "a little more detail" before the reporter
    commits, and the Worker as the actual gate — a client-side minimum is advice, and POST /change
    is reachable without the wizard. Batch 3 found exactly that gap by forcing the failure path. */
export const CHANGE_MIN = 10;

// ── Section-hint hardening (W0/S2) ───────────────────────────────────────────────────────
// `section` is free text from a PUBLIC issue body and it flows into the modify agent's prompt
// as a "Section hint" — the one field on the modify path that reaches the trusted prompt
// channel (the `change` text goes through a DATA file instead). Left raw, someone could stuff
// a multi-line injection payload there. Neutralised here so BOTH sides share one definition:
// the node parser sanitises what arrives, and the in-page wizard sanitises what it sends, so
// the wizard can never offer a value the parser would silently drop.
//   · first line only (kills multi-line payloads outright)
//   · trim + cap (a section label is a short heading, never prose)
//   · allowlist the punctuation real group names use; anything carrying injection-shaped
//     structure ({ } $ ` # < > | \) fails and the hint is dropped entirely. A missing hint is
//     always safer than an attacker-authored one — the agent finds the section itself.
export const SECTION_ALLOWED = /^[\p{L}\p{N} .,:&'()/-]*$/u;
export const SECTION_MAX = 80;

export function sanitizeSection(raw) {
  if (!raw) return "";
  const oneLine = String(raw).split(/[\r\n]/, 1)[0].trim().slice(0, SECTION_MAX);
  return SECTION_ALLOWED.test(oneLine) ? oneLine : "";
}

// ── Change-text hardening (batch 3) ──────────────────────────────────────────────────────
// Needed the moment the Worker started RENDERING the issue body itself instead of handing the
// reporter a prefilled form. The body is a sequence of "### <Label>\n\n<value>" blocks, and
// matchField() (intake-schema.mjs) finds a field with an UNANCHORED `###\s+<Label>` — so a
// change text carrying its own "### Section" wins over the real Section block further down,
// and the parser hands the pipeline an attacker-authored section hint. (Verified against the
// real parser, not assumed: escaping only line-INITIAL hashes still let the forged field
// through, because the match doesn't require a line start.)
//
// So every run of two or more hashes is escaped, anywhere in the value: "\#\#\#" renders as a
// literal "###" on GitHub — the reporter's text reads exactly as written — while no contiguous
// "###" survives for the parser to latch onto. Single hashes ("room #4", "#1") are left alone;
// one hash can never form a field marker.
//
// The `change` text stays a DATA-channel value either way — it reaches the agent through a file,
// never the prompt (that is what `section`'s allowlist is for). This closes the *parser* seam,
// not the prompt one.
export function escapeFieldMarkers(text) {
  return String(text ?? "").replace(/#{2,}/g, (run) => run.replace(/#/g, "\\#"));
}

/** Drop every C0/C1 control character except newline and tab. Written as a code-point test
    rather than a regex class because the class needs \u-escapes, and a mangled one here would
    silently strip nothing (or everything) — a predicate this small is worth the honesty. A
    change request is prose; a stray NUL or ANSI escape in it only ever confuses a log, a diff
    or a terminal downstream. */
const C0_END = 0x20;
const C1_START = 0x7f;
const C1_END = 0x9f;

export function stripControlChars(raw) {
  let out = "";
  for (const ch of String(raw ?? "")) {
    if (ch === "\n" || ch === "\t") { out += ch; continue; }
    const c = ch.codePointAt(0);
    if (c < C0_END || (c >= C1_START && c <= C1_END)) continue;
    out += ch;
  }
  return out;
}

/** The change text as it may be written into an issue body: normalised newlines, no stray
    control characters, capped at the documented limit, field markers neutralised last (the
    escapes it adds are rendering, not the reporter's text, so they don't spend the cap). */
export function sanitizeChange(raw) {
  const text = stripControlChars(String(raw ?? "").replace(/\r\n?/g, "\n"))
    .trim()
    .slice(0, CHANGE_MAX);
  return escapeFieldMarkers(text);
}

/** One title for both filing paths — the prefilled URL and the Worker's own POST. */
export function modifyIssueTitle(slug) {
  return `Modify: ${slug ?? ""}`.trim();
}

/**
 * Render a modify issue body byte-compatible with what GitHub's Issue Form produces for
 * `.github/ISSUE_TEMPLATE/modify-guide.yml` — "### <Label>\n\n<value>", the literal
 * "_No response_" for an empty field. The modify-side twin of intake-proxy.mjs's
 * renderIssueBody, and for the same reason: a Worker-filed change request must round-trip
 * through parseModifyIssue() identically to a human-submitted one, so the change pipeline
 * cannot tell the two apart. Derived from MODIFY_FIELDS, never from typed headings.
 */
export function renderModifyIssueBody({ slug, change, section } = {}) {
  const values = {
    slug: String(slug ?? "").trim(),
    change: sanitizeChange(change),
    section: sanitizeSection(section),
  };
  return MODIFY_FIELDS.map((f) => {
    const v = values[f.id];
    return `### ${f.label}\n\n${v ? v : "_No response_"}`;
  }).join("\n\n");
}

/**
 * The prefilled "new issue" URL. Every value is encoded; empty optional fields are omitted
 * rather than sent blank (GitHub renders an omitted field as "_No response_", which the parser
 * already normalises to "").
 */
export function buildModifyIssueUrl(repo, { slug, change, section } = {}) {
  // Built with encodeURIComponent rather than URLSearchParams so this module stays usable
  // from every context that imports it — the Astro page render, the browser bundle, and a
  // plain node script — without depending on which globals each one exposes.
  const params = [
    ["template", MODIFY_TEMPLATE],
    ["labels", MODIFY_LABEL],
    ["title", modifyIssueTitle(slug)],
  ];
  if (slug) params.push(["slug", slug]);
  if (change) params.push(["change", String(change).slice(0, CHANGE_MAX)]);
  if (section) params.push(["section", section]);
  const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return `https://github.com/${repo}/issues/new?${qs}`;
}
