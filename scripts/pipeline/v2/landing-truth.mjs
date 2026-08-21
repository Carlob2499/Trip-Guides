// PIPELINE V2 — landing truth (hardening pass, 2026-08-20).
//
// The finalize-landing recovery path used to trust local run state plus a typed PR number, and
// stamped `mergedAt` with the RETRY's own clock. Local state is a claim; GitHub is the truth.
// Everything here exists to make phase-2 finalization prove the merge against GitHub before a
// single publication fact is written, and to make the recovery durable — a finalization that
// only changed the local checkout is not a finalization.
//
// Injectable `gh`/`git` runners so the refusal matrix is testable with mocked GitHub responses
// and real temporary repositories (zero network in tests).

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ContractError } from "./contracts.mjs";
import { readRunStateV2, finalizeMergedLanding } from "./run-state.mjs";
import { emitRunEvents, readGeocodeReport } from "./events.mjs";
import { readEvidence } from "./evidence.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function makeGh(cwd) {
  return (args) => execFileSync("gh", args, { cwd, encoding: "utf8" });
}
function makeGit(cwd) {
  return (args) => execFileSync("git", args, { cwd, encoding: "utf8" });
}

/** The repository default branch, or throw. gh (authoritative) first, the local origin/HEAD
    symref as the offline fallback — never a hardcoded "main". */
export function resolveDefaultBranch({ gh, git, cwd = ROOT } = {}) {
  const runGh = gh || makeGh(cwd);
  const runGit = git || makeGit(cwd);
  try {
    const name = JSON.parse(runGh(["repo", "view", "--json", "defaultBranchRef"]))?.defaultBranchRef?.name;
    if (name) return name;
  } catch { /* fall through to the local symref */ }
  try {
    const m = runGit(["symbolic-ref", "refs/remotes/origin/HEAD"]).trim().match(/^refs\/remotes\/origin\/(.+)$/);
    if (m) return m[1];
  } catch { /* fall through to the refusal */ }
  throw new ContractError("could not determine the repository default branch (gh unavailable, no origin/HEAD symref) — pass --base explicitly");
}

/** Prove, against GitHub itself, that PR #pr IS the merged landing of THIS RUN — not merely of
    this slug's branch name. Branch names are REUSED across generations (Run A and Run B both
    land from research-v2/<slug>), so base+head identity alone would let an operator finalize
    Run B against Run A's old merged PR (Codex blocker 2). The immutable identity is the runId
    inside guides-intake/<slug>/run.v2.json in the MERGE COMMIT's own tree — the run state rode
    the branch into the merge (phase 1), so the merge commit carries exactly the run it landed.
    Refuses: open PRs, closed-unmerged PRs, wrong base/head, a merge commit GitHub cannot name,
    a merge commit whose tree carries no readable run state for the slug, and any runId other
    than the one being finalized. `expectedRunId` is REQUIRED — no caller may skip the proof.
    Returns GitHub's own facts ({ mergedAt, url, mergeCommit }) — mergedAt is never invented. */
export function verifyMergedPr({ slug, pr, expectedRunId, base = "main", branch = `research-v2/${slug}`, gh, git, cwd = ROOT } = {}) {
  if (!Number.isInteger(pr) || pr < 1) {
    throw new ContractError(`"${pr}" is not a PR number — a merge without identity cannot be verified`);
  }
  if (!expectedRunId) {
    throw new ContractError("verifyMergedPr requires the runId being finalized — a branch name is reused across generations and cannot identify the run");
  }
  const runGh = gh || makeGh(cwd);
  const runGit = git || makeGit(cwd);
  let raw;
  try {
    raw = runGh(["pr", "view", String(pr), "--json", "state,mergedAt,baseRefName,headRefName,mergeCommit,url"]);
  } catch (err) {
    throw new ContractError(
      `PR #${pr} could not be read from GitHub (${String(err?.message || err).split("\n")[0]}) — ` +
        `refusing to finalize a merge GitHub cannot confirm`,
    );
  }
  let doc;
  try { doc = JSON.parse(raw); }
  catch { throw new ContractError(`GitHub's answer for PR #${pr} was not parseable — refusing to finalize on it`); }
  if (doc.state !== "MERGED") {
    throw new ContractError(`PR #${pr} is ${doc.state || "in an unknown state"} on GitHub, not MERGED — nothing to finalize`);
  }
  if (!doc.mergedAt) {
    throw new ContractError(`PR #${pr} reports MERGED but carries no mergedAt — refusing to invent one`);
  }
  if (doc.baseRefName !== base) {
    throw new ContractError(`PR #${pr} merged into "${doc.baseRefName}", not the expected default branch "${base}" — not this run's landing`);
  }
  if (doc.headRefName !== branch) {
    throw new ContractError(`PR #${pr}'s head is "${doc.headRefName}", not "${branch}" — it is not ${slug}'s V2 landing, whatever else it merged`);
  }
  const mergeOid = doc.mergeCommit?.oid;
  if (!mergeOid) {
    throw new ContractError(`PR #${pr} reports MERGED but GitHub names no merge commit — the landing cannot be tied to a run, refusing`);
  }
  // THE RUN-IDENTITY PROOF: read the run state out of the merge commit's own tree. The commit
  // is on the default branch's history; if the local odb lacks it, one fetch of the base brings
  // it in. Still unreadable after that → refuse, never guess.
  const showRunState = () => runGit(["show", `${mergeOid}:guides-intake/${slug}/run.v2.json`]);
  let mergedRaw;
  try { mergedRaw = showRunState(); }
  catch {
    try {
      runGit(["fetch", "origin", base]);
      mergedRaw = showRunState();
    } catch {
      throw new ContractError(
        `PR #${pr}'s merge commit ${mergeOid} carries no readable guides-intake/${slug}/run.v2.json — ` +
          `cannot prove which run it landed, refusing to finalize on it`,
      );
    }
  }
  let mergedRunId;
  try { mergedRunId = JSON.parse(mergedRaw)?.runId; }
  catch { throw new ContractError(`the run state in PR #${pr}'s merge commit is not parseable — cannot prove which run it landed`); }
  if (mergedRunId !== expectedRunId) {
    throw new ContractError(
      `PR #${pr} merged run "${mergedRunId || "(unknown)"}", not the run being finalized ("${expectedRunId}") — ` +
        `research branches are reused across generations, and this PR is another generation's landing`,
    );
  }
  return { mergedAt: doc.mergedAt, url: doc.url || null, mergeCommit: mergeOid };
}

/** Commit exactly `paths` and push them to origin/<branch>. A push failure THROWS — local
    success is not durable success, and the caller must hear about it as a failure. */
export function commitAndPushRunRecord({ cwd = ROOT, paths, message, branch, git } = {}) {
  const runGit = git || makeGit(cwd);
  const present = paths.filter((rel) => existsSync(path.join(cwd, rel)));
  if (!present.length) return { committed: false, pushed: false };
  const dirty = runGit(["status", "--porcelain", "--", ...present]).trim();
  if (dirty) {
    runGit(["add", "--", ...present]);
    runGit(["commit", "--only", "-m", message, "--", ...present]);
  }
  // Push even when this invocation committed nothing new: the retry case is exactly "the commit
  // exists locally but never reached the remote". origin rejecting the push fails the recovery.
  runGit(["push", "origin", `HEAD:${branch}`]);
  return { committed: Boolean(dirty), pushed: true };
}

/** The finalize-landing RECOVERY, whole: resolve/validate the default branch, prove the merge
    against GitHub — INCLUDING that the supplied PR merged exactly this run (runId proof, Codex
    blocker 2) — finalize the publication record with GitHub's own mergedAt, re-emit events,
    then commit AND push the record to the remote default branch. Any failure — verification,
    finalization, commit, push — throws; a recovery is successful only when the finalized state
    is durably on the remote default branch.

    ANNOUNCEMENT TRUTH FAILS CLOSED (Codex recovery-correctness, 2026-08-20): after a real
    merge the announcement either filed, failed, or was never in play — a fact the landing log
    printed. When the durable state does not already carry it, a recovery invoked without
    `announced` must NOT silently finalize with "unknown": it refuses, and the operator passes
    --announced ok|failed|skipped (skipped = no announce URL was configured, the one case where
    null IS the honest recorded value). */
export async function finalizeLandingRecovery(slug, {
  pr,
  announced = null,
  base = null,
  cwd = ROOT,
  intakeDir = undefined,
  gh,
  git,
} = {}) {
  const runGit = git || makeGit(cwd);
  const resolvedBase = base || resolveDefaultBranch({ gh, git: runGit, cwd });
  const current = runGit(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  if (current !== resolvedBase) {
    throw new ContractError(
      `finalize-landing must run on a "${resolvedBase}" checkout (currently on "${current}") — ` +
        `after the merge the run state's only home is the default branch`,
    );
  }
  const stateOpts = intakeDir ? { intakeDir } : {};
  const durable = await readRunStateV2(slug, stateOpts);
  if (!durable) {
    throw new ContractError(`no durable V2 run state for "${slug}" on this ${resolvedBase} checkout — nothing to finalize`);
  }
  const alreadyFinalized = durable.landing?.outcome === "merged" && durable.publication?.published;
  if (!alreadyFinalized && announced == null && durable.landing?.announced == null) {
    throw new ContractError(
      `run ${durable.runId} carries no durable announcement fact and none was supplied — refusing to finalize a ` +
        `real-world outcome as "unknown". Re-run with --announced ok|failed (the landing log's announce= value) ` +
        `or --announced skipped (no announce URL was configured for this landing).`,
    );
  }
  const verified = verifyMergedPr({ slug, pr, expectedRunId: durable.runId, base: resolvedBase, gh, git: runGit, cwd });
  const announcedValue = announced === "skipped" ? null : announced;
  const state = await finalizeMergedLanding(slug, { pr, mergedAt: verified.mergedAt, announced: announcedValue, ...stateOpts });
  await emitRunEvents(slug, {
    state: await readRunStateV2(slug, stateOpts),
    evidence: await readEvidence(slug, stateOpts).catch(() => null),
    geocode: await readGeocodeReport(slug, stateOpts),
    ...stateOpts,
  });
  commitAndPushRunRecord({
    cwd,
    git: runGit,
    branch: resolvedBase,
    paths: [`guides-intake/${slug}/run.v2.json`, `guides-intake/${slug}/events.json`],
    message: `research-v2(${slug}): landing finalized — PR #${pr} merged`,
  });
  return { state, base: resolvedBase, mergedAt: verified.mergedAt };
}
