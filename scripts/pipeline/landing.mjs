// THE LANDING TRANSACTION — extracted from `pipeline.mjs land` (Codex blocker 3, 2026-08-20)
// so the non-merged quarantine invariant is behaviorally provable against a real git remote,
// not pinned by source strings. The CLI keeps argument parsing, the evidence gate, and the V2
// authority checks; everything from the phase-1 draft flip to the outcome record lives here,
// with every process boundary injectable (git runner, gh runner, the land-branch.sh seam).
//
// THE INVARIANT this module owes (and its tests prove): an AUTO landing that ends WITHOUT a
// confirmed merge leaves the remote research branch quarantined — draft:true pushed to origin —
// on EVERY path: the merge-conflict fallback AND the hard failure (auth/API/rate-limit). A
// quarantine that cannot be persisted to origin is a BLOCKED landing, reported as failed and
// exiting non-zero — never as a safe draft fallback.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  publishGuide, commitAll, landBranch as realLandBranch, quarantineRemoteBranch, PUBLISH_ERRORS,
} from "./publish.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The whole post-gate landing: phase-1 flip (auto), the land-branch.sh seam, the two-phase V2
    outcome record, and the remote quarantine on every non-merged auto outcome. Returns
    { code, outcome, pr }; a HARD landing failure still throws (after quarantining and recording)
    so the CLI exit stays loud. `v2state` is the pre-merge run state for a V2 landing — its
    runId is the identity the merged-PR verification proves. */
export async function executeLanding(slug, {
  branch,
  base = "main",
  passed,
  auto,
  title,
  bodyFile,
  announceUrl = "",
  v2state = null,
  guidesDir = undefined,
  intakeDir = undefined,
  cwd = ROOT,
  git = null,
  gh = undefined,
  land = realLandBranch,
  emit = () => {},
  log = console.log,
  error = console.error,
} = {}) {
  const isV2Landing = branch === `research-v2/${slug}`;
  const guideOpts = guidesDir ? { guidesDir } : {};
  const stateOpts = intakeDir ? { intakeDir } : {};
  const runGit = git || ((args) => execFileSync("git", args, { cwd, encoding: "utf8" }));

  let runState = v2state;
  if (isV2Landing && !runState) {
    const { readRunStateV2 } = await import("./v2/run-state.mjs");
    runState = await readRunStateV2(slug, stateOpts); // fail-closed: malformed throws
    if (!runState) {
      error(`[land] ${branch} carries no run.v2.json — a V2 landing without its own run state is refused.`);
      return { code: 1, outcome: null, pr: null };
    }
  }

  const emitV2Events = async () => {
    const { readRunStateV2 } = await import("./v2/run-state.mjs");
    const { emitRunEvents, readGeocodeReport } = await import("./v2/events.mjs");
    const { readEvidence } = await import("./v2/evidence.mjs");
    await emitRunEvents(slug, {
      state: await readRunStateV2(slug, stateOpts),
      evidence: await readEvidence(slug, stateOpts).catch(() => null),
      geocode: await readGeocodeReport(slug, stateOpts),
      ...stateOpts,
    });
  };
  const commitV2Record = (message, toBranch) => {
    const paths = [`guides-intake/${slug}/run.v2.json`, `guides-intake/${slug}/events.json`];
    runGit(["add", "--", ...paths.filter((p) => existsSync(path.join(cwd, p)))]);
    try { runGit(["commit", "--only", "-m", message, "--", ...paths]); } catch { return; /* clean */ }
    if (toBranch) runGit(["push", "origin", `HEAD:${toBranch}`]);
  };
  const quarantine = (reason) => quarantineRemoteBranch(slug, { branch, reason, cwd, git: runGit, gh, ...guideOpts });

  // Auto-publish is the rule: a run that passed its evidence gate takes the draft flag off
  // here, in the same step that lands it. `--land pr` runs that nobody asked for stay drafts.
  if (passed && auto) {
    if (isV2Landing) {
      // PHASE 1 of the landing transaction: ONLY the gate verdict rides the branch into the
      // merge. publication stays false and no merged/published event exists until GitHub
      // confirms an outcome (phase 2, after landBranch). The draft-flag flip below is
      // proposal CONTENT (V1 parity), not a publication claim — the claim lives in
      // run.v2.json and is schema-refused without a confirmed merge.
      const { markLandingGate } = await import("./v2/run-state.mjs");
      await markLandingGate(slug, { passed: true, ...stateOpts });
      await emitV2Events();
      log(`[land] ${slug} — V2 gate verdict recorded (phase 1); publication awaits the confirmed merge.`);
    }
    const published = await publishGuide(slug, { gatePassed: true, ...guideOpts });
    if (published.ok) {
      log(`[land] ${slug} published — draft flag removed from ${published.metaPath}`);
      commitAll(`feat(${slug}): publish — verify PASS`, { cwd });
    } else if (published.error !== PUBLISH_ERRORS.NOT_DRAFT) {
      error(`[land] could not publish ${slug}: ${published.error}`);
      return { code: 1, outcome: null, pr: null };
    } else if (isV2Landing) {
      // Already-published guide (a V2 re-research): the gate record still has to ride the
      // merge — commitAll no-ops when the tree is clean, so this is safe either way.
      commitAll(`chore(${slug}): V2 landing gate verdict — verify PASS`, { cwd });
    }
  }

  let result;
  try {
    result = land({ branch, base, title, bodyFile, passed: passed && auto, announceUrl, cwd });
  } catch (err) {
    // A HARD landing failure (auth, rate limit, API error — land-branch.sh already refuses to
    // disguise these as draft fallback). Nothing merged, nothing published — but the draft flip
    // already rode the branch to origin, so the branch MUST be re-quarantined before this exits
    // (Codex blocker 3B); a quarantine that cannot be persisted is called out as BLOCKED, never
    // left implicit. The GATE verdict is emitted even on this path: research truth and landing
    // truth are separate facts, and the workflow's crash handler keys on the gate output.
    emit("gate", passed ? "passed" : "failed");
    emit("outcome", "failed");
    let quarantineNote = "";
    if (passed && auto) {
      try {
        await quarantine("hard landing failure");
        log(`[land] ${slug} — draft flag restored and pushed to origin/${branch}; the remote branch is quarantined again.`);
        quarantineNote = "; draft restored and pushed";
      } catch (qErr) {
        quarantineNote = "; DRAFT RESTORE DID NOT PERSIST — the remote branch may be publishable";
        error(`[land] BLOCKED: the landing failed AND the draft quarantine could not be persisted to origin/${branch}: ${qErr?.message || qErr} — the remote research branch may carry an undrafted, publishable guide. Quarantine it by hand before anything merges it.`);
      }
    }
    if (isV2Landing) {
      const { recordLandingOutcome } = await import("./v2/run-state.mjs");
      await recordLandingOutcome(slug, {
        outcome: "failed",
        detail: (String(err?.message || err).slice(0, 200) + quarantineNote).slice(0, 300),
        ...stateOpts,
      });
      await emitV2Events();
      try { commitV2Record(`research-v2(${slug}): landing FAILED (no merge, no publication)`, branch); }
      catch (recErr) { error(`[land] could not persist the failed-landing record to origin/${branch}: ${recErr?.message || recErr}`); }
    }
    throw err;
  }
  log(`[land] ${result.outcome}:${result.pr}`);

  // MERGE-CONFLICT FALLBACK STAYS UNPUBLISHED AND REMOTELY QUARANTINED (Codex blocker 3A).
  // Auto-landing removed the draft flag BEFORE the merge attempt (the flip must ride the
  // merge); a conflict fell back to a draft PR whose branch still carries the UNDRAFTED guide.
  // Restore draft:true and PUSH it: only a durable restore may report the safe draft outcome —
  // a restore that cannot reach origin makes this a BLOCKED landing (failed, exit 1), because
  // a human resolving the conflict could otherwise merge a publishable branch around the whole
  // V2 finalization contract.
  if (result.outcome === "draft" && passed && auto) {
    try {
      await quarantine("merge-conflict fallback");
      log(`[land] ${slug} — draft flag RESTORED after the merge conflict; the fallback PR carries no publishable flip.`);
    } catch (qErr) {
      error(`[land] BLOCKED: the merge conflicted AND the draft quarantine could not be persisted to origin/${branch}: ${qErr?.message || qErr} — the remote research branch may carry an undrafted, publishable guide. Quarantine it by hand before anything merges it.`);
      if (isV2Landing) {
        const { recordLandingOutcome } = await import("./v2/run-state.mjs");
        await recordLandingOutcome(slug, {
          outcome: "failed",
          pr: result.pr,
          detail: "merge conflict fell back to a draft PR but the draft restore could not be pushed — the remote branch may be publishable",
          ...stateOpts,
        });
        await emitV2Events();
        try { commitV2Record(`research-v2(${slug}): landing BLOCKED — conflict fallback could not be re-quarantined`, branch); }
        catch (recErr) { error(`[land] could not persist the blocked-landing record to origin/${branch}: ${recErr?.message || recErr}`); }
      }
      emit("outcome", "failed");
      emit("pr", String(result.pr));
      emit("gate", passed ? "passed" : "failed");
      return { code: 1, outcome: "failed", pr: result.pr };
    }
  }

  if (isV2Landing) {
    const { recordLandingOutcome, finalizeMergedLanding } = await import("./v2/run-state.mjs");
    if (result.outcome === "merged") {
      // PHASE 2: land-branch.sh reported the merge; the research branch is deleted.
      // Finalize the publication fact ON THE DEFAULT BRANCH — the run state's only home now —
      // after independently re-verifying the merge against GitHub (base, head, MERGED state,
      // and the RUN IDENTITY: the merge commit's own run.v2.json must carry this run's runId)
      // and taking GitHub's own mergedAt, never this process's clock. A failure here is loud
      // and retryable (the merge is real; history is never rewritten): the printed
      // finalize-landing command is complete and runnable exactly as printed — the announce
      // fact always rides it (ok|failed|skipped), so the recovery never has to guess it.
      const annFlag = result.announced === true ? " --announced ok" : result.announced === false ? " --announced failed" : " --announced skipped";
      try {
        runGit(["fetch", "origin", base]);
        runGit(["checkout", "-B", base, `origin/${base}`]);
        const { verifyMergedPr } = await import("./v2/landing-truth.mjs");
        const verified = verifyMergedPr({ slug, pr: result.pr, expectedRunId: runState?.runId, base, gh, git: runGit, cwd });
        await finalizeMergedLanding(slug, { pr: result.pr, mergedAt: verified.mergedAt, announced: result.announced ?? null, ...stateOpts });
        await emitV2Events();
        commitV2Record(`research-v2(${slug}): landing finalized — PR #${result.pr} merged`, base);
        log(`[land] ${slug} — merge confirmed (PR #${result.pr}, merged ${verified.mergedAt}); publication finalized on ${base}.`);
      } catch (err) {
        error(`[land] MERGE SUCCEEDED (PR #${result.pr}) but post-merge finalization failed: ${err?.message || err}`);
        error(`[land] retry on a ${base} checkout: node scripts/pipeline-v2.mjs finalize-landing --slug ${slug} --pr ${result.pr}${annFlag}`);
        emit("outcome", result.outcome);
        emit("pr", String(result.pr));
        emit("gate", passed ? "passed" : "failed");
        return { code: 1, outcome: result.outcome, pr: result.pr };
      }
    } else {
      // draft outcome: gate fail, or gate pass that hit a merge conflict (already durably
      // re-quarantined above). The branch lives; record exactly that. publication stays false.
      await recordLandingOutcome(slug, {
        outcome: "draft",
        pr: result.pr,
        detail: passed && auto ? "gate passed but the merge fell back to a draft PR (conflict)" : null,
        ...stateOpts,
      });
      await emitV2Events();
      commitV2Record(`research-v2(${slug}): landing outcome draft (PR #${result.pr})`, branch);
    }
  }

  emit("outcome", result.outcome);
  emit("pr", String(result.pr));
  // The GATE verdict as its own output: a failed gate deliberately still exits 0 here (the
  // draft PR is the designed fallback), so a caller recording gate state must never infer it
  // from this step's exit code — the V2 canary recorded a pass the gate never earned that way.
  emit("gate", passed ? "passed" : "failed");
  return { code: 0, outcome: result.outcome, pr: result.pr };
}
