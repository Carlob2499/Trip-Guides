// PUBLISHING — the one path from "a branch full of work" to "live on the site".
//
// There is no separate publication event any more. A guide that reaches `verified` with a clean
// evidence gate publishes itself as part of landing: the draft flag comes off in the same step
// that opens and merges the PR. The old graduate-guide workflow, its issue form, its approval
// label and scripts/graduate-guide.mjs are all deleted — a human approval step that always said
// yes to the same evidence this code checks was ceremony, not a safeguard.
//
// What is NOT lost with it:
//   · the evidence gate itself — `npm run build` + `npm run verify --network` still decide;
//     publishGuide() refuses to flip anything without a passing verdict.
//   · the veto — land-branch.sh files the "🚀 Auto-published" issue with a one-line rollback
//     whenever an announce URL is passed, so a self-publish is still visible and reversible.
//   · the "nobody asked for this, so a human signs it off" rule — a plan whose `land` is "pr"
//     never auto-merges however green it is.
//
// Guide shape: `draft` only ever lives in the meta file (`<slug>/_guide.json`), so publishing is a
// single-file edit and no section file is touched. `verified` is deliberately NOT written here:
// replacing a scaffold's warning with a real verification date is a content judgement, not a flag
// flip.

import { readFile, writeFile } from "node:fs/promises";
import { execFileSync, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveGuidePath } from "../lib/guide-shape.mjs";
import { isValidSlug } from "../lib/slug.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GUIDES_DIR = path.join(ROOT, "src", "content", "guides");

export const PUBLISH_ERRORS = {
  NOT_FOUND: "not_found",
  NOT_DRAFT: "not_draft",
  NO_EVIDENCE: "no_evidence",
};

// The draft flip. Deletes the key rather than setting `draft: false`, matching every already-live
// guide's meta file. Returns { ok: true, slug, country, metaPath } or { ok: false, error, slug }.
export async function flipDraft(slug, { guidesDir = GUIDES_DIR } = {}) {
  const located = resolveGuidePath(slug, guidesDir);
  if (!located) return { ok: false, error: PUBLISH_ERRORS.NOT_FOUND, slug };

  const guide = JSON.parse(await readFile(located.metaPath, "utf8"));
  if (!guide.draft) return { ok: false, error: PUBLISH_ERRORS.NOT_DRAFT, slug };

  delete guide.draft;
  await writeFile(located.metaPath, JSON.stringify(guide, null, 2) + "\n");
  return { ok: true, slug, country: guide.country || "", metaPath: located.metaPath };
}

// The INVERSE flip (hardening pass, 2026-08-20): re-quarantine a guide as a draft. Exists for
// exactly one caller — the merge-conflict fallback in `pipeline land`. Auto-landing removes the
// draft flag BEFORE the merge attempt (the flip must ride the merge); when that merge then hits
// a conflict and falls back to a draft PR, the branch would otherwise carry publishable,
// undrafted guide content that a human resolving the conflict could merge — silently bypassing
// the publication contract. Restoring draft:true keeps every NON-merged outcome unpublished.
// Idempotent: already-draft returns { ok: false, error: NOT_DRAFT }-inverse ({ changed: false }).
export async function restoreDraft(slug, { guidesDir = GUIDES_DIR } = {}) {
  const located = resolveGuidePath(slug, guidesDir);
  if (!located) return { ok: false, error: PUBLISH_ERRORS.NOT_FOUND, slug };
  const guide = JSON.parse(await readFile(located.metaPath, "utf8"));
  if (guide.draft === true) return { ok: true, changed: false, slug, metaPath: located.metaPath };
  const next = { draft: true, ...guide };
  next.draft = true; // draft leads the meta file, matching the scaffolder's shape
  await writeFile(located.metaPath, JSON.stringify(next, null, 2) + "\n");
  return { ok: true, changed: true, slug, metaPath: located.metaPath };
}

// REMOTE QUARANTINE (Codex blocker 3, 2026-08-20): auto-landing removes the draft flag and
// pushes it BEFORE the merge attempt, so EVERY landing that ends without a confirmed merge must
// put draft:true back ON ORIGIN — a local restore that never reaches the remote leaves a
// publishable branch behind while the log claims "safely draft". This is the one durable
// re-quarantine: restore the flag, commit it, and ALWAYS push (the retry case is exactly "the
// restore commit exists locally but its push never landed"). A push failure THROWS — quarantine
// that is not on origin is not quarantine, and the caller must treat it as a blocking failure.
// The PR (where one exists) is returned to draft best-effort (`gh pr ready --undo`) — ALWAYS
// attempted, against the real gh CLI when no runner is injected, because the production path
// (pipeline.mjs → executeLanding) supplies none; an injected-runner-only attempt was a dead path
// in the product. The guide-content flag is the hard invariant, the PR state the visible
// secondary: a failed undraft warns loudly (the guide is safe, the PR may still look Ready)
// instead of failing the quarantine.
export async function quarantineRemoteBranch(slug, {
  branch, reason = "failed landing", guidesDir = GUIDES_DIR, cwd = ROOT, git, gh, warn = console.warn,
} = {}) {
  if (!branch) throw new Error("quarantineRemoteBranch requires the research branch to re-quarantine");
  const runGit = git || ((args) => execFileSync("git", args, { cwd, encoding: "utf8" }));
  const runGh = gh || ((args) => execFileSync("gh", args, { cwd, encoding: "utf8" }));
  const restored = await restoreDraft(slug, { guidesDir });
  if (!restored.ok) {
    throw new Error(`could not restore the draft flag for ${slug} (${restored.error}) — the remote branch cannot be proven quarantined`);
  }
  if (restored.changed) {
    runGit(["add", "--", restored.metaPath]);
    runGit(["commit", "--only", "-m", `chore(${slug}): restore draft after ${reason} — nothing published`, "--", restored.metaPath]);
  }
  runGit(["push", "origin", `HEAD:${branch}`]);
  let prUndrafted;
  try { runGh(["pr", "ready", branch, "--undo"]); prUndrafted = true; }
  catch (err) {
    prUndrafted = false;
    warn(`[quarantine] ${slug} — the remote guide content is safely draft:true on origin/${branch}, but the PR could not be returned to draft (${err?.message || err}); it may still appear Ready on GitHub. Undraft it by hand: gh pr ready ${branch} --undo`);
  }
  return { restored: restored.changed, pushed: true, prUndrafted };
}

// THE evidence gate — build + networked verify. One implementation, used by the automated landing
// path and by the manual `pipeline publish` override alike, so "published" means the same thing
// whoever triggered it. Returns { passed, steps: [{ cmd, code }] }.
export function evidenceGate(slug, { run = defaultRun } = {}) {
  if (!isValidSlug(slug)) throw new Error(`"${slug}" isn't a valid slug`);
  const steps = [];
  for (const cmd of ["npm run build", `npm run verify -- --slug ${slug} --network`]) {
    const code = run(cmd);
    steps.push({ cmd, code });
    if (code !== 0) return { passed: false, steps };
  }
  return { passed: true, steps };
}

function defaultRun(cmd) {
  try { execSync(cmd, { cwd: ROOT, stdio: "inherit" }); return 0; }
  catch (err) { return typeof err?.status === "number" ? err.status : 1; }
}

// The LANDING evidence gate — the same two steps evidenceGate() defines (build, then the
// networked verify), run with output captured so the verify scorecard can become the PR body.
// This exists because `pipeline land --gate` used to run ONLY the networked verify and then tell
// publishGuide the gate had passed — a landing could publish a guide whose build was broken.
// One contract, two consumers: evidenceGate() for the manual publish override (stdio inherited),
// landingGate() for the landing step (output captured). Both run build first and short-circuit.
export function landingGate(slug, { exec = defaultExecCapture } = {}) {
  if (!isValidSlug(slug)) throw new Error(`"${slug}" isn't a valid slug`);
  const steps = [];
  const build = exec("npm run build");
  steps.push({ cmd: "npm run build", code: build.code });
  if (build.code !== 0) {
    const tail = String(build.out || "").split("\n").slice(-40).join("\n");
    return {
      passed: false,
      steps,
      scorecard: `## Evidence gate — build FAILED (exit ${build.code})\n\nThe networked verify was not run: the build is the schema gate, and a guide that cannot build cannot publish.\n\n\`\`\`\n${tail}\n\`\`\`\n`,
    };
  }
  const cmd = `npm run verify -- --slug ${slug} --markdown --network`;
  const verify = exec(cmd);
  steps.push({ cmd, code: verify.code });
  return { passed: verify.code === 0, steps, scorecard: String(verify.out || "") };
}

function defaultExecCapture(cmd) {
  try { return { code: 0, out: execSync(cmd, { cwd: ROOT, encoding: "utf8" }) }; }
  catch (err) {
    return {
      code: typeof err?.status === "number" ? err.status : 1,
      out: `${err?.stdout || ""}${err?.stderr || ""}`,
    };
  }
}

// Publish: gate (unless the caller already ran it this run) then flip.
export async function publishGuide(slug, { gatePassed = null, guidesDir = GUIDES_DIR, run = defaultRun } = {}) {
  if (gatePassed === null) {
    const gate = evidenceGate(slug, { run });
    if (!gate.passed) return { ok: false, error: PUBLISH_ERRORS.NO_EVIDENCE, slug, gate };
  } else if (gatePassed !== true) {
    return { ok: false, error: PUBLISH_ERRORS.NO_EVIDENCE, slug };
  }
  return flipDraft(slug, { guidesDir });
}

// ── branches ─────────────────────────────────────────────────────────────────

// Resume the run's branch if a prior (cut-off) run created it, so the agent starts with the
// committed partial progress in the working tree; otherwise start it fresh. Six lines of bash
// that were copy-pasted into three workflows and had already drifted between them.
export function startOrResumeBranch(name, { cwd = ROOT, syncCurrent = false } = {}) {
  const git = (args, opts = {}) => execFileSync("git", args, { cwd, encoding: "utf8", ...opts });
  // Capture the workflow's current code BEFORE a resume checks out the durable run branch.
  // Without this, the research branch can silently roll the control plane back to whatever
  // scripts existed when the run first started (Yamagata Run-B attempt 6, after PR #109).
  const currentHead = syncCurrent ? git(["rev-parse", "HEAD"]).trim() : null;
  let exists;
  try { git(["ls-remote", "--exit-code", "--heads", "origin", name], { stdio: "pipe" }); exists = true; }
  catch { exists = false; }
  if (exists) {
    git(["fetch", "origin", name], { stdio: "inherit" });
    git(["checkout", name], { stdio: "inherit" });
    if (syncCurrent) {
      const before = git(["rev-parse", "HEAD"]).trim();
      try {
        git(["merge", "--no-edit", currentHead], { stdio: "inherit" });
      } catch (err) {
        try { git(["merge", "--abort"], { stdio: "ignore" }); } catch { /* no merge to abort */ }
        throw err;
      }
      const after = git(["rev-parse", "HEAD"]).trim();
      // Later V2 stages run in fresh jobs and re-check out this remote branch, so a local-only
      // merge is insufficient. Push only when synchronization actually moved the branch.
      if (after !== before) git(["push", "origin", `HEAD:${name}`], { stdio: "inherit" });
    }
  } else {
    git(["checkout", "-b", name], { stdio: "inherit" });
  }
  return { name, resumed: exists };
}

// ── landing ──────────────────────────────────────────────────────────────────

// Commit whatever publishing changed, on the branch the run is already on. No-op when the tree is
// clean (a guide that was already live has nothing to commit).
export function commitAll(message, { cwd = ROOT } = {}) {
  const status = execFileSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" }).trim();
  if (!status) return false;
  execFileSync("git", ["add", "-A"], { cwd, stdio: "inherit" });
  execFileSync("git", ["commit", "-m", message], { cwd, stdio: "inherit" });
  execFileSync("git", ["push"], { cwd, stdio: "inherit" });
  return true;
}

// Hand the branch to the shared lander. It prints exactly `merged:<n> announce=<ok|failed|skipped>`
// or `draft:<n>`; anything else is a bug in that script, not something to guess about. `announced`
// is null for draft outcomes (nothing to announce), true/false for merges — false means the merge
// SUCCEEDED and the safety notice did not file, a fact the caller records rather than hides.
export function landBranch({ branch, base = "main", title, bodyFile, passed, announceUrl = "", cwd = ROOT }) {
  const args = ["scripts/land-branch.sh", branch, base, title, bodyFile, passed ? "true" : "false"];
  if (announceUrl) args.push(announceUrl);
  const out = execFileSync("bash", args, { cwd, encoding: "utf8" });
  const line = out.trim().split("\n").filter(Boolean).pop() || "";
  const m = line.match(/^(merged|draft):(\d+)(?: announce=(ok|failed|skipped))?$/);
  if (!m) throw new Error(`land-branch.sh printed "${line}" — expected "merged:<n> announce=<ok|failed|skipped>" or "draft:<n>"`);
  const announced = m[1] === "merged" ? (m[3] === "ok" ? true : m[3] === "failed" ? false : null) : null;
  return { outcome: m[1], pr: Number(m[2]), announced };
}
