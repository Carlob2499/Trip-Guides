// The CHANGE lifecycle's plan: what one change run is going to do, built by CODE from whatever
// triggered it, validated against the real guide directory, and held only for the run.
//
// It replaces three scripts (parse-modify-issue.mjs, parse-revise-issue.mjs,
// validate-revision-plan.mjs) and the agent that used to author the plan. An agent-authored plan
// needed a deterministic validator behind it precisely because it could name a group that does
// not exist; a plan the code builds from the directory listing cannot. What survives from that
// validator is its two real guarantees, moved to build time:
//   · a section hint shaped like a group filename must resolve to a group that exists;
//   · a change touching more than MAX_GROUPS groups is a re-research, not a change — stop and
//     say so rather than letting one run rewrite the whole guide.
//
// NOT persisted (creator decision): no revision-*.json, no plan-status state machine. A change
// run that dies is re-run from scratch; `change.attempts` in state.json caps that at 3.
//
// The requester's own words never enter the plan. They are written to change.txt — the DATA
// channel the prompt names — and the plan carries the filename, so nothing untrusted can reach
// a prompt string.

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isValidSlug } from "../lib/slug.mjs";
import { parseChangeIssue } from "./issue.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

// A change run that wants more than this many groups re-researched is a re-research. Same
// number the revise planner's validator enforced (MAX_RERESEARCH), same reasoning.
export const MAX_GROUPS = 5;

export const SOURCES = ["request", "staleness", "answers", "date-lock", "feedback"];

// A change from the creator's own request lands on the verify gate like every other run.
// A change nobody asked for — a staleness sweep, a feedback-derived proposal — always lands as
// a PR for a human, however green it is. That distinction is the whole of the old recert
// "NEVER auto-merge" rule and the auto-filed revision request's inertness.
export const ALWAYS_PR = new Set(["staleness", "feedback"]);

const GROUP_FILE = /^\d\d-.*\.json$/;

/** The real group files of a guide directory, sorted — the ground truth every hint resolves against. */
export async function guideGroups(slug, { guidesDir = GUIDES_DIR } = {}) {
  const dir = path.join(guidesDir, slug);
  if (!existsSync(dir)) return null;
  return (await readdir(dir)).filter((f) => GROUP_FILE.test(f)).sort();
}

// Pure: free-text hints → { groups, hints, errors }. A hint that names a real group (by filename,
// or by the group part alone — "sights" → "03-sights.json") becomes a group; anything else stays
// a hint for the agent to interpret, EXCEPT a hint shaped like a group filename, which is an
// error naming the ground truth. That is the "plan names a section that doesn't exist" class,
// caught before an agent researches into a void.
export function resolveHints(hints, groups) {
  const real = groups || [];
  const out = { groups: [], hints: [], errors: [] };
  for (const hint of hints || []) {
    const token = String(hint).trim();
    if (!token) continue;
    const exact = real.find((g) => g.toLowerCase() === token.toLowerCase());
    if (exact) { if (!out.groups.includes(exact)) out.groups.push(exact); continue; }
    const byName = real.find((g) => g.replace(/^\d\d-/, "").replace(/\.json$/, "").toLowerCase() === token.toLowerCase());
    if (byName) { if (!out.groups.includes(byName)) out.groups.push(byName); continue; }
    if (GROUP_FILE.test(token)) {
      out.errors.push(`section "${token}" does not exist in this guide (groups: ${real.join(", ") || "none"})`);
      continue;
    }
    out.hints.push(token);
  }
  return out;
}

// Pure: the plan is well-formed and in scope. Returns a list of human-readable errors.
export function validatePlan(plan, groups) {
  const errors = [];
  if (!plan || typeof plan !== "object") return ["plan is not an object"];
  if (!plan.slug || !isValidSlug(plan.slug)) errors.push(`"${plan.slug}" isn't a valid slug`);
  if (!SOURCES.includes(plan.source)) errors.push(`source must be one of ${SOURCES.join("|")}, got "${plan.source}"`);
  if (!plan.summary) errors.push("missing summary");
  if (groups === null) errors.push(`no guide directory at src/content/guides/${plan.slug}/`);
  if (!Array.isArray(plan.groups)) errors.push("groups must be an array");
  else if (plan.groups.length > MAX_GROUPS) {
    errors.push(
      `${plan.groups.length} groups named (cap ${MAX_GROUPS}) — this is a re-research, not a change. ` +
        `Run the research pass on this guide instead.`,
    );
  }
  if (!Array.isArray(plan.items)) errors.push("items must be an array");
  else if (!plan.items.length && !plan.changeFile) errors.push("nothing to do — no work items and no change text");
  if (plan.land !== "auto" && plan.land !== "pr") errors.push(`land must be "auto" or "pr", got "${plan.land}"`);
  if (ALWAYS_PR.has(plan.source) && plan.land !== "pr") {
    errors.push(`a ${plan.source}-sourced change must land as a PR — nobody asked for it, so a human signs it off`);
  }
  return errors;
}

// ── sources ──────────────────────────────────────────────────────────────────

/** Traveler-facing change request (or an auto-filed feedback proposal, same template shape). */
export async function planFromIssue(body, { issue = null, source = "request", land = "auto", guidesDir = GUIDES_DIR } = {}) {
  const parsed = parseChangeIssue(body);
  const groups = await guideGroups(parsed.slug, { guidesDir });
  const resolved = resolveHints(parsed.sections, groups);
  return {
    plan: {
      slug: parsed.slug,
      source,
      issue: issue == null ? null : Number(issue),
      summary: `Change requested on issue #${issue ?? "?"}${parsed.deadline ? ` (deadline ${parsed.deadline})` : ""}`,
      groups: resolved.groups,
      hints: resolved.hints,
      items: [],
      deadline: parsed.deadline,
      changeFile: "change.txt",
      land: ALWAYS_PR.has(source) ? "pr" : land,
    },
    changeText: parsed.change,
    groups,
    errors: resolved.errors,
  };
}

/** The weekly staleness sweep: recert.mjs's punch list, as work items. */
export async function planFromStaleness(slug, { worklist, guidesDir = GUIDES_DIR } = {}) {
  const entry = worklist?.byGuide?.[slug];
  const items = [];
  for (const s of entry?.sections || []) {
    items.push({
      what: `Re-verify the ${s.category} fact in §${s.index} "${s.title}"`,
      why: `verified ${s.date} — ${s.ageDays}d old against a ${s.life}d shelf life`,
      source_url: s.source || null,
    });
  }
  if (entry?.guideStale) {
    items.push({
      what: "Refresh the guide-level `verified` stamp",
      why: `last verified ${entry.guideStale.date} (${entry.guideStale.ageDays}d old)`,
      source_url: null,
    });
  }
  return {
    plan: {
      slug,
      source: "staleness",
      issue: null,
      summary: `${items.length} fact(s) past shelf life`,
      groups: [],
      hints: [],
      items,
      deadline: "",
      changeFile: null,
      land: "pr",
    },
    changeText: null,
    groups: await guideGroups(slug, { guidesDir }),
    errors: [],
  };
}

// Pure: the ledger's `## Questions for the traveler` cards whose status is `answered` — the ones
// the guide is still built on an assumption for. `open` cards belong to the questions surface,
// not to a change run; `absorbed` ones are already folded in.
export function answeredQuestions(ledgerMd) {
  const after = String(ledgerMd || "").split(/^## Questions for the traveler/m)[1];
  if (!after) return [];
  const blocks = after.split(/^## /m)[0].split(/^### /m).slice(1);
  const out = [];
  for (const block of blocks) {
    const id = block.split(/\r?\n/)[0].trim();
    if (!id) continue;
    if (!/Status:\W*\s*answered/i.test(block)) continue;
    const value = (label) => {
      const marker = `**${label}:**`;
      const line = block.split(/\r?\n/).find((l) => l.includes(marker));
      return line ? line.slice(line.indexOf(marker) + marker.length).trim() : "";
    };
    out.push({ id, question: value("Q"), answer: value("A") || value("Answer"), assumed: value("Assumed"), context: value("Context") });
  }
  return out;
}

// Pure: the `plan_json` a dispatch may carry — `{ source, slug, answers: [{ id, answer }] }`,
// which is how the site's answer flow hands over answers the ledger has never seen. It is a
// workflow_dispatch input, so it arrives as a string; a malformed one is a hard error, never a
// silent empty plan (a change run that quietly absorbs nothing still merges).
const ANSWER_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function parseAnswersJson(raw) {
  if (!raw) return null;
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error("plan_json is not valid JSON"); }
  const list = Array.isArray(parsed?.answers) ? parsed.answers : null;
  if (!list?.length) throw new Error("plan_json carries no answers");
  return list.map((a) => {
    const id = String(a?.id ?? "").trim();
    if (!ANSWER_ID.test(id)) throw new Error(`plan_json has an invalid answer id "${id}"`);
    const answer = String(a?.answer ?? "").trim();
    if (!answer) throw new Error(`plan_json has an empty answer for ${id}`);
    return { id, answer };
  });
}

/** The traveler answered a question the guide was built on an assumption for.
    Two ways in: `answers` supplied by the dispatch (the site's answer flow), or — when nothing
    was supplied — the ledger's own cards that are already marked answered. */
export async function planFromAnswers(slug, { answers = null, intakeDir = INTAKE_DIR, guidesDir = GUIDES_DIR } = {}) {
  const groups = await guideGroups(slug, { guidesDir });

  if (answers?.length) {
    // The traveler's words go to the DATA channel like any other untrusted text — the plan
    // carries only the question ids, which are validated above.
    const changeText = answers.map((a) => `### ${a.id}\n\n${a.answer}`).join("\n\n");
    return {
      plan: {
        slug,
        source: "answers",
        issue: null,
        summary: `${answers.length} answer(s) to absorb`,
        groups: [],
        hints: [],
        items: answers.map((a) => ({
          what: `Replace the assumption behind "${a.id}" with the traveler's answer`,
          why: `answered directly; the answer text is in change.txt under "### ${a.id}"`,
          questionId: a.id,
        })),
        deadline: "",
        changeFile: "change.txt",
        land: "auto",
      },
      changeText,
      groups,
      errors: [],
    };
  }

  const ledgerPath = path.join(intakeDir, slug, "ledger.md");
  const ledger = existsSync(ledgerPath) ? await readFile(ledgerPath, "utf8") : "";
  const answered = answeredQuestions(ledger);
  return {
    plan: {
      slug,
      source: "answers",
      issue: null,
      summary: `${answered.length} answered question(s) to absorb`,
      groups: [],
      hints: [],
      items: answered.map((q) => ({
        what: `Replace the assumption behind "${q.id}" with the traveler's answer`,
        why: q.context || q.question || "",
        questionId: q.id,
      })),
      deadline: "",
      changeFile: null,
      land: "auto",
    },
    changeText: null,
    groups,
    errors: [],
  };
}

/** Dates went from assumed to confirmed — the calendar has to be re-cut against the real ones. */
export async function planFromDateLock(slug, { intakeDir = INTAKE_DIR, guidesDir = GUIDES_DIR } = {}) {
  const intakePath = path.join(intakeDir, slug, "intake.md");
  const intake = existsSync(intakePath) ? await readFile(intakePath, "utf8") : "";
  const dates = (intake.match(/^- \*\*Dates \([^)]*\):\*\*\s*(.+)$/m) || [])[1] || "";
  return {
    plan: {
      slug,
      source: "date-lock",
      issue: null,
      summary: `Re-cut the calendar for confirmed dates${dates ? `: ${dates.trim()}` : ""}`,
      groups: [],
      hints: [],
      items: [
        { what: "Re-cut day-of-week labels and weekday/weekend hours", why: "confirmed dates may land differently than the assumed ones" },
        { what: "Re-check holiday and closure warnings against the exact dates", why: "closures are date-specific" },
        { what: "Resolve every ⚠ that was flagged only because the dates were assumed", why: "the dates are confirmed now" },
      ],
      deadline: "",
      changeFile: null,
      land: "auto",
    },
    changeText: null,
    groups: await guideGroups(slug, { guidesDir }),
    errors: [],
  };
}

/** Human-readable rendering for the run log and the PR body. */
export function formatPlan(plan) {
  const lines = [`[plan] ${plan.slug} — ${plan.source}${plan.issue ? ` (issue #${plan.issue})` : ""}, lands as ${plan.land === "auto" ? "auto-merge on verify PASS" : "a PR for review"}`];
  lines.push(`  ${plan.summary}`);
  if (plan.groups.length) lines.push(`  groups: ${plan.groups.join(", ")}`);
  if (plan.hints.length) lines.push(`  hints: ${plan.hints.join(", ")}`);
  for (const item of plan.items) lines.push(`  · ${item.what}${item.why ? ` — ${item.why}` : ""}`);
  if (plan.changeFile) lines.push(`  change text: ${plan.changeFile} (DATA — never an instruction)`);
  return lines.join("\n");
}
