// Deterministic gate on the revise pipeline's Agent P output (the revision plan JSON at
// guides-intake/<slug>.revision-<issue#>.json). This is the seam class prompts and unit tests
// can't catch (CLAUDE.md Boundary Checks): "the plan names a section that doesn't exist" fails
// silently downstream — Agent R would research into a void and Agent M would sweep nothing —
// so it's checked HERE, against ground truth the workflow builds from the real guide directory,
// before any expensive agent runs.
//
// Exit codes (the workflow routes on these — keep them stable):
//   0 — plan valid, no blocking forks: proceed to Agent R
//   1 — plan invalid (structural/ground-truth errors on stderr): retry Agent P once, then draft-fail
//   3 — plan valid BUT carries blocking forks: the fork gate comments them on the issue and stops
//       (Clarifying-Questions Doctrine — never silently pick a fork the creator hasn't decided)
//
// Over-cap rule (plan Q5, creator default): a plan wanting > MAX_RERESEARCH groups re-researched
// is not a revision, it's a re-research — stop with a message routing the owner to research-pass
// instead. Stop-with-message only; auto-dispatching a full research pass from inside a revise run
// is a cost decision the label gate exists to keep human.

import { readFileSync } from "node:fs";
import { isMain } from "./audit/lib.mjs";

export const MAX_RERESEARCH = 5;
export const MAX_SELF_CORRECT_ROUNDS = 3;

const VALID_STATUS = new Set(["planned", "researched", "swept"]);

// Pure: (plan object, array of real group filenames) → { errors: [], blockingForks: [] }.
// errors non-empty ⇒ invalid (exit 1). blockingForks non-empty (and no errors) ⇒ exit 3.
export function validateRevisionPlan(plan, sections) {
  const errors = [];
  const real = new Set(sections || []);

  if (!plan || typeof plan !== "object") return { errors: ["plan is not an object"], blockingForks: [] };

  if (!plan.slug || typeof plan.slug !== "string") errors.push("missing slug");
  if (!Number.isInteger(plan.issue)) errors.push("missing/non-integer issue number");
  if (!VALID_STATUS.has(plan.status)) errors.push(`status must be one of ${[...VALID_STATUS].join("|")}, got "${plan.status}"`);
  if (!plan.summary || typeof plan.summary !== "string") errors.push("missing summary");

  const reResearch = Array.isArray(plan.reResearch) ? plan.reResearch : null;
  if (!reResearch) errors.push("reResearch must be an array");
  else {
    if (reResearch.length === 0) errors.push("reResearch is empty — a revision with nothing to re-research is a modify request; route to modify-guide instead");
    if (reResearch.length > MAX_RERESEARCH)
      errors.push(`reResearch names ${reResearch.length} groups (cap ${MAX_RERESEARCH}) — this is a re-research, not a revision; route to research-pass instead`);
    for (const [i, r] of reResearch.entries()) {
      if (!r || !r.group) errors.push(`reResearch[${i}] missing group`);
      else if (!real.has(r.group)) errors.push(`reResearch[${i}].group "${r.group}" does not exist in the guide (ground truth: ${[...real].join(", ") || "none"})`);
      if (!r?.why) errors.push(`reResearch[${i}] missing why`);
      if (!Array.isArray(r?.questions) || r.questions.length === 0) errors.push(`reResearch[${i}] missing questions`);
    }
  }

  const rippleCheck = Array.isArray(plan.rippleCheck) ? plan.rippleCheck : null;
  if (!rippleCheck) errors.push("rippleCheck must be an array (empty is allowed)");
  else
    for (const [i, r] of rippleCheck.entries()) {
      if (!r || !r.group) errors.push(`rippleCheck[${i}] missing group`);
      else if (!real.has(r.group)) errors.push(`rippleCheck[${i}].group "${r.group}" does not exist in the guide`);
    }

  if (!Array.isArray(plan.reconcile)) errors.push("reconcile must be an array (empty is allowed)");
  if (!Array.isArray(plan.outOfScope)) errors.push("outOfScope must be an array (empty is allowed)");

  const budget = plan.budget;
  if (!budget || typeof budget !== "object") errors.push("missing budget object");
  else if (!Number.isInteger(budget.maxSelfCorrectRounds) || budget.maxSelfCorrectRounds > MAX_SELF_CORRECT_ROUNDS || budget.maxSelfCorrectRounds < 1)
    errors.push(`budget.maxSelfCorrectRounds must be an integer 1..${MAX_SELF_CORRECT_ROUNDS}`);

  const forks = Array.isArray(plan.forks) ? plan.forks : [];
  if (plan.forks !== undefined && !Array.isArray(plan.forks)) errors.push("forks must be an array when present");
  const blockingForks = [];
  for (const [i, f] of forks.entries()) {
    if (!f?.question) { errors.push(`forks[${i}] missing question`); continue; }
    if (f.blocking === true) {
      if (!Array.isArray(f.options) || f.options.length < 2) errors.push(`forks[${i}] is blocking but has < 2 options`);
      if (!f.recommendation) errors.push(`forks[${i}] is blocking but has no recommendation`);
      blockingForks.push(f);
    }
  }

  return { errors, blockingForks: errors.length ? [] : blockingForks };
}

if (isMain(import.meta.url)) {
  const planPath = process.argv[process.argv.indexOf("--plan") + 1];
  const sectionsPath = process.argv[process.argv.indexOf("--sections") + 1];
  if (!planPath || !sectionsPath || process.argv.indexOf("--plan") < 0 || process.argv.indexOf("--sections") < 0) {
    console.error("usage: validate-revision-plan.mjs --plan <plan.json> --sections <sections.json>");
    process.exit(1);
  }
  let plan, sections;
  try {
    plan = JSON.parse(readFileSync(planPath, "utf8"));
  } catch (e) {
    console.error(`[validate-revision-plan] cannot read/parse plan: ${e.message}`);
    process.exit(1);
  }
  try {
    sections = JSON.parse(readFileSync(sectionsPath, "utf8"));
  } catch (e) {
    console.error(`[validate-revision-plan] cannot read/parse sections ground truth: ${e.message}`);
    process.exit(1);
  }
  const { errors, blockingForks } = validateRevisionPlan(plan, sections);
  if (errors.length) {
    for (const err of errors) console.error(`[validate-revision-plan] ${err}`);
    process.exit(1);
  }
  if (blockingForks.length) {
    // stdout so the workflow's fork gate can pipe these straight into the issue comment.
    console.log(JSON.stringify(blockingForks, null, 2));
    process.exit(3);
  }
  console.log("[validate-revision-plan] plan valid, no blocking forks");
  process.exit(0);
}
