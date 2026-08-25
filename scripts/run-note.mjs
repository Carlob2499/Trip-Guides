import { isValidSlug } from "./lib/slug.mjs";

export const RUN_NOTE_MAX = 2000;

export function validateRunNoteRequest(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, status: 400, error: "invalid note request" };
  }
  const slug = typeof raw.slug === "string" ? raw.slug.trim() : "";
  const runId = typeof raw.runId === "string" ? raw.runId.trim() : "";
  const issue = Number(raw.issue);
  const note = typeof raw.note === "string" ? raw.note.trim() : "";

  if (!isValidSlug(slug)) return { ok: false, status: 400, error: "invalid slug" };
  if (!runId || runId.length > 160 || !runId.startsWith(`${slug}-`)) {
    return { ok: false, status: 400, error: "invalid run id" };
  }
  if (!Number.isInteger(issue) || issue <= 0) {
    return { ok: false, status: 400, error: "invalid issue" };
  }
  if (!note || note.length > RUN_NOTE_MAX) {
    return { ok: false, status: 400, error: `note must be 1-${RUN_NOTE_MAX} characters` };
  }
  return { ok: true, value: { slug, runId, issue, note } };
}

/**
 * The run-state record is the authority for where an owner note belongs. V2 stores `issue`
 * durably and refuses to rewire it on resume, so an exact slug + runId + issue match is a real
 * join rather than a browser assertion. V1 has no equivalent identity and must not use this.
 */
export function matchesRunNoteTarget(rawRun, target) {
  if (!rawRun || typeof rawRun !== "object" || Array.isArray(rawRun)) return false;
  if (!/^wp-run\/2\./.test(String(rawRun.schemaVersion ?? ""))) return false;
  return rawRun.slug === target.slug &&
    rawRun.runId === target.runId &&
    Number.isInteger(rawRun.issue) && rawRun.issue === target.issue;
}

export function renderRunNoteComment({ slug, runId, note }) {
  return [
    `<!-- waypoint-run-note:${runId} -->`,
    `### Waypoint owner note`,
    `Run: \`${runId}\` · guide: \`${slug}\``,
    "",
    note.trim(),
  ].join("\n");
}
