/**
 * Feedback-driven revision proposals — pure shaping only, no network (gateway.ts fetches).
 *
 * What they are: when the deterministic feedback signals trip for a guide, the pipeline files an
 * INERT proposal — "the trip diverged from the guide here; this is worth re-researching". It has
 * always existed; what changed in batch 3 is who can say yes. Approval used to be a label the
 * owner applied in GitHub (`revision-approved`); with the label gone, the proposal renders on the
 * progress page with an approve button that dispatches the change run.
 *
 * So this module's whole job is turning issue records into something a person can decide about,
 * and — the part that matters — deciding which proposals belong to THIS guide. The label is
 * repo-wide; the slug is not in it.
 */

import { REVISE_FIELDS, labelFor } from "../../../lib/issue-forms.mjs";

/** The label the pipeline files these under; change.yml also auto-runs on it. */
export const REVISION_LABEL = "revision-request";

export interface RevisionProposal {
  /** Issue number — what POST /approve hands change.yml to read the plan from. */
  issue: number;
  /** The proposal's own summary line, already free of verbatim traveler feedback (the privacy
   *  rule extends to issue bodies — raw freeform critiques are summarised into patterns, never
   *  pasted; see CLAUDE.md's learnings loop). */
  title: string;
  /** Why this was proposed, as filed. Empty when the body carries no reason field. */
  reason: string;
  /** ISO timestamp the proposal was filed. */
  createdAt: string;
}

/** Raw issue shape this reads — a subset of GitHub's, named here so the parser's input is a
 *  contract rather than "whatever the API returned". */
export interface RawIssue {
  number?: number;
  title?: string;
  body?: string | null;
  created_at?: string;
  pull_request?: unknown;
}

/** Pull an issue-form field's value out of a rendered body. Mirrors matchField()'s convention
 *  (scripts/intake-schema.mjs) — the LABEL comes from REVISE_FIELDS so a renamed field can't
 *  drift this out of sync, which is the failure that convention exists to prevent. Kept local
 *  rather than imported because intake-schema.mjs pulls zod, and this runs in the browser. */
function issueField(body: string, label: string): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = String(body || "").match(new RegExp(`###\\s+${esc}\\s*\\n+([\\s\\S]*?)(?=\\n###\\s|$)`));
  const v = m ? m[1].trim() : "";
  return v === "_No response_" || v === "_No response_." ? "" : v;
}

/** Does this proposal belong to `slug`? Checked against the body's own slug field FIRST (the
 *  authoritative one — it is what the pipeline's parser reads), then the title, because the
 *  auto-filed proposals carry the slug there too ("Revise: <slug> (feedback-driven)") and a
 *  hand-written one may carry only that. A proposal that names neither is not shown: attaching
 *  it to the wrong guide would offer the owner a one-click run against a guide they weren't
 *  looking at. */
export function proposalMatchesSlug(issue: RawIssue, slug: string): boolean {
  const want = String(slug || "").trim().toLowerCase();
  if (!want) return false;
  const inBody = issueField(issue.body || "", labelFor(REVISE_FIELDS, "slug")).trim().toLowerCase();
  if (inBody) return inBody === want;
  return new RegExp(`(^|[^a-z0-9-])${want}([^a-z0-9-]|$)`, "i").test(issue.title || "");
}

/** Issue records → the proposals for this guide, newest first. Pull requests share the issues
 *  endpoint and are dropped: a PR carrying the label is not something to approve here. */
export function toProposals(issues: RawIssue[] | null | undefined, slug: string): RevisionProposal[] {
  return (issues ?? [])
    .filter((i) => i && !i.pull_request && Number.isInteger(i.number))
    .filter((i) => proposalMatchesSlug(i, slug))
    .map((i) => ({
      issue: i.number as number,
      title: String(i.title || "").replace(/^Revise:\s*/i, "").trim() || "Revision proposal",
      reason: issueField(i.body || "", labelFor(REVISE_FIELDS, "what-changed")),
      createdAt: String(i.created_at || ""),
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
