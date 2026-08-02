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
    prefills" (docs/communities/…/syntax-for-githubs-form-schema, checked 2026-08-02). */
export const MODIFY_FIELDS = [
  { id: "slug", label: "Guide slug", kind: "input", required: true },
  { id: "change", label: "What needs to change", kind: "textarea", required: true },
  { id: "section", label: "Section", kind: "input", required: false },
];

export const MODIFY_TEMPLATE = "modify-guide.yml";
export const MODIFY_LABEL = "modify-request";

/** A change request is a short, specific description ("this price is wrong, it's now X"), not
    an essay — and the whole payload rides in a URL, which browsers and GitHub both cap. Bound
    it in the UI so a request can never be silently truncated on the way to the issue. */
export const CHANGE_MAX = 1200;

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
    ["title", `Modify: ${slug ?? ""}`.trim()],
  ];
  if (slug) params.push(["slug", slug]);
  if (change) params.push(["change", String(change).slice(0, CHANGE_MAX)]);
  if (section) params.push(["section", section]);
  const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return `https://github.com/${repo}/issues/new?${qs}`;
}
