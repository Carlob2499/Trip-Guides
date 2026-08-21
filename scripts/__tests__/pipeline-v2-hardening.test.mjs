// FINAL integration-hardening contracts for PR #68 (2026-08-20). One describe per requirement:
//
//   R1  only the trusted /new product flow can mint auto landing intent — manual dispatch on
//       main with the selector live still creates a draft-only run
//   R2  recovery finalization independently proves the merge against GitHub (mocked here) and
//       records GitHub's own mergedAt, refusing every mismatch
//   R3  recovery finalization persists to the REMOTE default branch (real git, real bare
//       origin) — a push failure is a failed recovery
//   R4  a second V2 run for a slug starts from a genuinely clean workspace: the fresh-run reset
//       removes the prior run's mutable artifacts and the REAL Pass-B verifier passes
//   R7  a late human answer re-opens a run even at the exhausted autonomous attempt cap
//   R8  research-gate truth and landing truth stay separate through the failure transitions
//   R9  the merge-conflict fallback re-quarantines the guide (restoreDraft)
//   R10 announcement truth survives recovery — announced is never downgraded to unknown
//
// Behavioral first: real state transitions, real git repositories, mocked GitHub responses.
// The few YAML/source pins here are wiring supplements to those behavioral proofs, not
// replacements for them.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  initRunV2, readRunStateV2, stageStart, stageComplete, markLandingGate, recordLandingOutcome,
  finalizeMergedLanding, reopenForAnswers, bumpRunAttempt, deriveLandIntent,
  V2_RESEARCH_STAGES, V2_ATTEMPT_CAP, V2_REOPEN_ATTEMPT_GRANT,
} from "../pipeline/v2/run-state.mjs";
import {
  verifyMergedPr, resolveDefaultBranch, finalizeLandingRecovery, commitAndPushRunRecord,
} from "../pipeline/v2/landing-truth.mjs";
import {
  resetFreshRunWorkspace, staleRunArtifactPaths, preparePassBWorkspace, removePassBWorkspace,
  verifyPassBWorkspace, forbiddenForPassB,
} from "../pipeline/v2/workspace.mjs";
import { restoreDraft, flipDraft } from "../pipeline/publish.mjs";
import { buildRunEvents } from "../pipeline/v2/events.mjs";
import { ContractError } from "../pipeline/v2/contracts.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const readRepo = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const SLUG = "hardland";

let dir;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), "wp-hardening-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

async function completeAllStages(slug, intakeDir) {
  for (const stage of V2_RESEARCH_STAGES) {
    await stageStart(slug, stage, { intakeDir });
    await stageComplete(slug, stage, { intakeDir });
  }
}

/** A complete product-intent run with a passed gate — the pre-landBranch state. */
async function gatePassedProductRun(intakeDir, slug = SLUG) {
  await initRunV2(slug, { intakeDir, landMode: "auto" });
  await completeAllStages(slug, intakeDir);
  await markLandingGate(slug, { passed: true, intakeDir });
  return readRunStateV2(slug, { intakeDir });
}

/** A real throwaway git repository with identity configured. */
function makeRepo(at, { branch = "main" } = {}) {
  const g = (...args) => execFileSync("git", args, { cwd: at, encoding: "utf8" });
  g("init", "-q", "-b", branch);
  g("config", "user.email", "test@test");
  g("config", "user.name", "test");
  return g;
}

/** A gh mock answering `pr view` from a fixture (and `repo view` when given a default branch). */
function ghMock({ pr = null, prError = null, defaultBranch = null } = {}) {
  return (args) => {
    if (args[0] === "pr" && args[1] === "view") {
      if (prError) throw new Error(prError);
      return JSON.stringify(pr);
    }
    if (args[0] === "repo" && args[1] === "view") {
      if (!defaultBranch) throw new Error("gh repo view unavailable");
      return JSON.stringify({ defaultBranchRef: { name: defaultBranch } });
    }
    throw new Error(`unexpected gh call: ${args.join(" ")}`);
  };
}

const MERGED_PR = (over = {}) => ({
  state: "MERGED",
  mergedAt: "2026-08-20T12:34:56Z",
  baseRefName: "main",
  headRefName: `research-v2/${SLUG}`,
  url: `https://github.com/Carlob2499/Trip-Guides/pull/91`,
  ...over,
});

// ── R1: only the trusted /new product flow may auto-land ─────────────────────

describe("R1 — landing intent: manual dispatch can never mint auto, whatever ref/selector", () => {
  it("CASE 1: manual workflow_dispatch + default branch + selector v2 → pr (the required matrix case)", () => {
    expect(deriveLandIntent({ eventName: "workflow_dispatch", onDefault: true, engine: "v2" })).toBe("pr");
  });

  it("CASE 2: the trusted /new invocation (workflow_call under the caller's issues event) + selector v2 → auto", () => {
    expect(deriveLandIntent({ eventName: "issues", onDefault: true, engine: "v2" })).toBe("auto");
  });

  it("trusted provenance alone is not enough: feature ref or selector off still → pr", () => {
    expect(deriveLandIntent({ eventName: "issues", onDefault: false, engine: "v2" })).toBe("pr");
    expect(deriveLandIntent({ eventName: "issues", onDefault: true, engine: "" })).toBe("pr");
    expect(deriveLandIntent({ eventName: "issues", onDefault: true, engine: "v1" })).toBe("pr");
  });

  it("missing/blank provenance fails SAFE to pr — absence of proof is not product authority", () => {
    expect(deriveLandIntent({ eventName: "", onDefault: true, engine: "v2" })).toBe("pr");
    expect(deriveLandIntent({})).toBe("pr");
    expect(deriveLandIntent()).toBe("pr");
  });

  it("an auto-intent run created by the trusted flow records auto; a manual run records pr (end to end through init)", async () => {
    const trusted = deriveLandIntent({ eventName: "issues", onDefault: true, engine: "v2" });
    const created = await initRunV2(SLUG, { intakeDir: dir, landMode: trusted });
    expect(created.landMode).toBe("auto");
    const manual = deriveLandIntent({ eventName: "workflow_dispatch", onDefault: true, engine: "v2" });
    const other = await initRunV2("otherland", { intakeDir: dir, landMode: manual });
    expect(other.landMode).toBe("pr");
  });

  it("wiring: the workflow derives intent through land-intent with github.event_name (never a bare ref+selector check)", () => {
    const text = readRepo(".github/workflows/research-pass-v2.yml");
    const init = text.split("Init or resume the V2 run")[1].split("- name:")[0];
    expect(init).toContain("land-intent");
    expect(init).toContain("EVENT_NAME: ${{ github.event_name }}");
    expect(init).toContain('--event-name "$EVENT_NAME"');
    expect(init).not.toMatch(/LAND=auto/); // the old shell derivation is gone
    // The trusted entry point is a workflow_call — declared on the V2 workflow…
    expect(text).toMatch(/^ {2}workflow_call:$/m);
    // …and new-guide.yml is its caller, with no `gh workflow run research-pass-v2` dispatch left.
    const newGuide = readRepo(".github/workflows/new-guide.yml");
    expect(newGuide).toContain("uses: ./.github/workflows/research-pass-v2.yml");
    expect(newGuide).not.toContain("gh workflow run research-pass-v2.yml");
    expect(newGuide).toContain("gh workflow run research-pass.yml"); // V1 default preserved
  });
});

// ── R2: recovery finalization proves the merge against GitHub ────────────────

describe("R2 — verifyMergedPr refuses everything but the real merged landing", () => {
  it("a nonexistent/unreadable PR is refused", () => {
    expect(() => verifyMergedPr({ slug: SLUG, pr: 91, gh: ghMock({ prError: "GraphQL: Could not resolve to a PullRequest" }) }))
      .toThrow(/could not be read from GitHub/);
  });

  it("an OPEN PR is refused — nothing merged yet", () => {
    expect(() => verifyMergedPr({ slug: SLUG, pr: 91, gh: ghMock({ pr: MERGED_PR({ state: "OPEN", mergedAt: null }) }) }))
      .toThrow(/is OPEN on GitHub/);
  });

  it("a CLOSED-but-unmerged PR is refused", () => {
    expect(() => verifyMergedPr({ slug: SLUG, pr: 91, gh: ghMock({ pr: MERGED_PR({ state: "CLOSED", mergedAt: null }) }) }))
      .toThrow(/is CLOSED on GitHub/);
  });

  it("a merged PR with the WRONG base branch is refused", () => {
    expect(() => verifyMergedPr({ slug: SLUG, pr: 91, gh: ghMock({ pr: MERGED_PR({ baseRefName: "gh-pages" }) }) }))
      .toThrow(/merged into "gh-pages"/);
  });

  it("an UNRELATED merged PR (wrong head — another slug, or not a research branch) is refused", () => {
    expect(() => verifyMergedPr({ slug: SLUG, pr: 91, gh: ghMock({ pr: MERGED_PR({ headRefName: "research-v2/otherland" }) }) }))
      .toThrow(/not "research-v2\/hardland"/);
    expect(() => verifyMergedPr({ slug: SLUG, pr: 91, gh: ghMock({ pr: MERGED_PR({ headRefName: "fix/typo" }) }) }))
      .toThrow(ContractError);
  });

  it("MERGED without a mergedAt is refused — the timestamp is never invented", () => {
    expect(() => verifyMergedPr({ slug: SLUG, pr: 91, gh: ghMock({ pr: MERGED_PR({ mergedAt: null }) }) }))
      .toThrow(/refusing to invent/);
  });

  it("the correct merged PR succeeds and returns GITHUB's mergedAt", () => {
    const out = verifyMergedPr({ slug: SLUG, pr: 91, gh: ghMock({ pr: MERGED_PR() }) });
    expect(out.mergedAt).toBe("2026-08-20T12:34:56Z");
  });

  it("finalizeMergedLanding persists GitHub's mergedAt, not the retry clock", async () => {
    await gatePassedProductRun(dir);
    const verified = verifyMergedPr({ slug: SLUG, pr: 91, gh: ghMock({ pr: MERGED_PR() }) });
    const state = await finalizeMergedLanding(SLUG, { pr: 91, mergedAt: verified.mergedAt, intakeDir: dir });
    expect(state.landing.mergedAt).toBe("2026-08-20T12:34:56Z");
    expect(state.publication.publishedAt).toBe("2026-08-20T12:34:56Z");
  });

  it("a MISMATCHED run/landing identity is refused — finalizing against a different PR than the landing recorded", async () => {
    await gatePassedProductRun(dir);
    await recordLandingOutcome(SLUG, { outcome: "draft", pr: 90, intakeDir: dir });
    await expect(finalizeMergedLanding(SLUG, { pr: 91, intakeDir: dir })).rejects.toThrow(/records PR #90/);
  });

  it("the finalize-landing CLI runs through the verifying recovery, not the bare state write (wiring)", () => {
    const src = readRepo("scripts/pipeline-v2.mjs");
    const finalizeCase = src.split('case "finalize-landing"')[1].split(/\n {4}case "/)[0];
    expect(finalizeCase).toContain("finalizeLandingRecovery");
    expect(finalizeCase).not.toContain("finalizeMergedLanding("); // never bypasses verification
  });
});

// ── R3: recovery persists to the REMOTE default branch ───────────────────────

describe("R3 — finalizeLandingRecovery is durable or it is failed (real git, real bare origin)", () => {
  let repo, origin, g, intakeDir;

  beforeEach(async () => {
    repo = path.join(dir, "repo");
    origin = path.join(dir, "origin.git");
    await mkdir(repo, { recursive: true });
    await mkdir(origin, { recursive: true });
    execFileSync("git", ["init", "-q", "--bare", "-b", "main", origin]);
    g = makeRepo(repo);
    intakeDir = path.join(repo, "guides-intake");
    // The post-merge default-branch state: run complete, gate passed, landing NOT yet finalized.
    await gatePassedProductRun(intakeDir);
    await writeFile(path.join(repo, "README.md"), "seed\n");
    g("add", "-A");
    g("commit", "-qm", "main after the merge (finalization still owed)");
    g("remote", "add", "origin", origin);
    g("push", "-q", "origin", "main");
  });

  const gitAt = (cwd) => (args) => execFileSync("git", args, { cwd, encoding: "utf8" });

  it("a successful recovery verifies, finalizes with GitHub's mergedAt, commits AND pushes to origin's default branch", async () => {
    const { state, base, mergedAt } = await finalizeLandingRecovery(SLUG, {
      pr: 91, base: "main", cwd: repo, intakeDir, gh: ghMock({ pr: MERGED_PR() }), git: gitAt(repo),
    });
    expect(base).toBe("main");
    expect(mergedAt).toBe("2026-08-20T12:34:56Z");
    expect(state.publication.published).toBe(true);
    // DURABLE: the finalized record is on the REMOTE default branch, not just the local checkout.
    const remote = execFileSync("git", ["--git-dir", origin, "show", `main:guides-intake/${SLUG}/run.v2.json`], { encoding: "utf8" });
    const doc = JSON.parse(remote);
    expect(doc.publication.published).toBe(true);
    expect(doc.landing).toMatchObject({ outcome: "merged", pr: 91, mergedAt: "2026-08-20T12:34:56Z" });
  });

  it("a PUSH FAILURE is a FAILED recovery — local success is not durable success", async () => {
    g("remote", "set-url", "origin", path.join(dir, "no-such-remote.git"));
    await expect(finalizeLandingRecovery(SLUG, {
      pr: 91, base: "main", cwd: repo, intakeDir, gh: ghMock({ pr: MERGED_PR() }), git: gitAt(repo),
    })).rejects.toThrow();
  });

  it("refuses to run anywhere but the default-branch checkout", async () => {
    g("checkout", "-q", "-b", "somewhere-else");
    await expect(finalizeLandingRecovery(SLUG, {
      pr: 91, base: "main", cwd: repo, intakeDir, gh: ghMock({ pr: MERGED_PR() }), git: gitAt(repo),
    })).rejects.toThrow(/must run on a "main" checkout/);
  });

  it("a GitHub refusal aborts BEFORE any publication fact is written", async () => {
    await expect(finalizeLandingRecovery(SLUG, {
      pr: 91, base: "main", cwd: repo, intakeDir, gh: ghMock({ pr: MERGED_PR({ state: "OPEN", mergedAt: null }) }), git: gitAt(repo),
    })).rejects.toThrow(/is OPEN/);
    expect((await readRunStateV2(SLUG, { intakeDir })).publication.published).toBe(false);
  });

  it("resolveDefaultBranch: gh first, origin/HEAD symref as fallback, refusal when neither answers", () => {
    expect(resolveDefaultBranch({ gh: ghMock({ defaultBranch: "main" }), git: gitAt(repo) })).toBe("main");
    // gh down → the local symref answers.
    g("remote", "set-head", "origin", "main");
    expect(resolveDefaultBranch({ gh: ghMock({}), git: gitAt(repo) })).toBe("main");
    const deadGit = () => { throw new Error("no repo"); };
    expect(() => resolveDefaultBranch({ gh: ghMock({}), git: deadGit })).toThrow(/pass --base/);
  });

  it("commitAndPushRunRecord pushes an ALREADY-committed record too — the exact retry case", async () => {
    // First recovery committed locally but its push never landed: simulate by committing the
    // finalized record locally with origin pointed away, then retrying the push alone.
    await finalizeMergedLanding(SLUG, { pr: 91, mergedAt: "2026-08-20T12:34:56Z", intakeDir });
    g("add", "-A");
    g("commit", "-qm", "finalized locally, push lost");
    const out = commitAndPushRunRecord({
      cwd: repo, branch: "main", git: gitAt(repo),
      paths: [`guides-intake/${SLUG}/run.v2.json`],
      message: "retry",
    });
    expect(out.pushed).toBe(true);
    const remote = execFileSync("git", ["--git-dir", origin, "show", `main:guides-intake/${SLUG}/run.v2.json`], { encoding: "utf8" });
    expect(JSON.parse(remote).publication.published).toBe(true);
  });
});

// ── R4: a second run for the same slug starts clean ──────────────────────────

describe("R4 — fresh-run reset: Run B never inherits Run A's mutable artifacts (real git + REAL verifier)", () => {
  let repo, g, intakeDir;

  beforeEach(async () => {
    repo = path.join(dir, "repo");
    await mkdir(repo, { recursive: true });
    g = makeRepo(repo);
    intakeDir = path.join(repo, "guides-intake");
    // Main as it stands after Run A's product merge: scaffold + guide + EVERY mutable artifact.
    await mkdir(path.join(intakeDir, SLUG), { recursive: true });
    await mkdir(path.join(repo, "src", "content", "guides", SLUG), { recursive: true });
    await writeFile(path.join(intakeDir, SLUG, "intake.md"), "# frozen intent\n");
    await writeFile(path.join(intakeDir, SLUG, "ledger.md"), "# research ledger\n");
    await writeFile(path.join(repo, "src", "content", "guides", SLUG, "_guide.json"), JSON.stringify({ title: "Hardland" }) + "\n");
    for (const rel of staleRunArtifactPaths(SLUG)) {
      await writeFile(path.join(repo, rel), JSON.stringify({ from: "run-A" }) + "\n");
    }
    // Run A itself: complete, gate passed, merged, published — committed as main history.
    await gatePassedProductRun(intakeDir);
    await finalizeMergedLanding(SLUG, { pr: 80, mergedAt: "2026-08-19T09:00:00Z", intakeDir });
    g("add", "-A");
    g("commit", "-qm", "main after Run A's merge");
    // The workflow's branch step cuts research-v2/<slug> FRESH from this history.
    g("checkout", "-q", "-b", `research-v2/${SLUG}`);
  });

  it("the MANDATORY lifecycle: merged Run A → fresh Run B → clean baseline → the REAL Pass-B verifier passes", async () => {
    // 3. initialize Run B (branch-fresh): a NEW run, Run A archived, nothing inherited as current.
    const runA = JSON.parse(await readFile(path.join(intakeDir, SLUG, "run.v2.json"), "utf8"));
    const runB = await initRunV2(SLUG, { intakeDir, branchFresh: true, issue: "140" });
    expect(runB.runId).not.toBe(runA.runId);
    expect(runB.previousRuns).toHaveLength(1);
    expect(runB.previousRuns[0]).toMatchObject({ runId: runA.runId, mergedPr: 80 });
    // 4. the fresh-run reset produces the clean baseline (what the CLI init step records).
    const { baseline, reset } = resetFreshRunWorkspace(SLUG, { cwd: repo });
    expect(reset).toBe(true);
    // Run A's mutable artifacts are gone from the branch tree AND the working tree…
    for (const rel of staleRunArtifactPaths(SLUG)) {
      expect(existsSync(path.join(repo, rel)), `${rel} must be gone from the working tree`).toBe(false);
      expect(() => execFileSync("git", ["cat-file", "-e", `${baseline}:${rel}`], { cwd: repo, stdio: "pipe" }),
        `${rel} must be gone from the baseline tree`).toThrow();
    }
    // …the baseline tree carries NO run state, while Run B's fresh record survives on disk.
    expect(() => execFileSync("git", ["cat-file", "-e", `${baseline}:guides-intake/${SLUG}/run.v2.json`], { cwd: repo, stdio: "pipe" })).toThrow();
    expect(JSON.parse(await readFile(path.join(intakeDir, SLUG, "run.v2.json"), "utf8")).runId).toBe(runB.runId);
    // 5+6. the REAL Pass-B workspace machinery: worktree at the baseline, REAL verifier passes.
    const ws = path.join(dir, "passb-ws");
    preparePassBWorkspace(SLUG, { baseCommit: baseline, destDir: ws, cwd: repo });
    try {
      expect(verifyPassBWorkspace(SLUG, ws)).toBe(true);
      // 7. Run A's artifacts are not in Pass B's world in any form.
      for (const rel of forbiddenForPassB(SLUG)) {
        expect(existsSync(path.join(ws, rel))).toBe(false);
      }
      expect(existsSync(path.join(ws, "guides-intake", SLUG, "intake.md"))).toBe(true); // the frozen intent IS there
    } finally {
      removePassBWorkspace(ws, { cwd: repo });
    }
  });

  it("WITHOUT the reset, the same baseline fails the verifier — the reset is what makes Run B possible", () => {
    const dirtyBaseline = g("rev-parse", "HEAD").trim();
    const ws = path.join(dir, "passb-dirty");
    expect(() => preparePassBWorkspace(SLUG, { baseCommit: dirtyBaseline, destDir: ws, cwd: repo }))
      .toThrow(/CONTAINS research artifacts/);
  });

  it("a first-ever run (nothing tracked) resets nothing and keeps HEAD as the baseline", async () => {
    const fresh = path.join(dir, "fresh-repo");
    await mkdir(fresh, { recursive: true });
    const gf = makeRepo(fresh);
    await mkdir(path.join(fresh, "guides-intake", "newland"), { recursive: true });
    await writeFile(path.join(fresh, "guides-intake", "newland", "intake.md"), "# intent\n");
    gf("add", "-A");
    gf("commit", "-qm", "scaffold only");
    const head = gf("rev-parse", "HEAD").trim();
    const { baseline, reset } = resetFreshRunWorkspace("newland", { cwd: fresh });
    expect(reset).toBe(false);
    expect(baseline).toBe(head);
  });

  it("wiring: the CLI init runs the reset for fresh branches BEFORE recording the scaffold baseline", () => {
    const src = readRepo("scripts/pipeline-v2.mjs");
    const initCase = src.split('case "init"')[1].split(/\n {4}case "/)[0];
    const resetAt = initCase.indexOf("resetFreshRunWorkspace");
    const baselineAt = initCase.indexOf('git(["rev-parse", "HEAD"])');
    expect(resetAt).toBeGreaterThan(0);
    expect(baselineAt).toBeGreaterThan(resetAt);
  });
});

// ── R7: late answers work past the exhausted autonomous budget ───────────────

describe("R7 — a human answer re-opens a run the autonomous budget had exhausted", () => {
  it("the required scenario: complete-unmerged at the cap → reopen → the next dispatch actually starts work", async () => {
    // 1. a completed, unmerged draft run at the maximum autonomous attempt budget (andorra's
    //    real end state: attempts 5/5, complete, draft PR).
    await initRunV2(SLUG, { intakeDir: dir });
    const file = path.join(dir, SLUG, "run.v2.json");
    for (let i = 0; i < V2_ATTEMPT_CAP; i++) await bumpRunAttempt(SLUG, { intakeDir: dir });
    await completeAllStages(SLUG, dir);
    await markLandingGate(SLUG, { passed: true, intakeDir: dir });
    await recordLandingOutcome(SLUG, { outcome: "draft", pr: 67, intakeDir: dir });
    expect(JSON.parse(readFileSync(file, "utf8")).attempts).toMatchObject({ total: V2_ATTEMPT_CAP, cap: V2_ATTEMPT_CAP });
    // 2-3. a valid late answer arrives → the run reopens.
    const { reopened, state } = await reopenForAnswers(SLUG, { intakeDir: dir });
    expect(reopened).toBe(true);
    expect(state.resume.nextStage).toBe("reconcile");
    // 4. reconciliation ACTUALLY starts: the next dispatch's budget bump does not mark it stuck…
    const budget = await bumpRunAttempt(SLUG, { intakeDir: dir });
    expect(budget.overCap).toBe(false);
    expect(budget.state.status).not.toBe("stuck");
    // …and the reconcile stage can begin (5: the answer is consumed by the re-run).
    await stageStart(SLUG, "reconcile", { intakeDir: dir });
    const after = await readRunStateV2(SLUG, { intakeDir: dir });
    expect(after.stages.reconcile.status).toBe("running");
    // 6. never stuck solely because the PREVIOUS autonomous attempts reached the old cap.
    expect(after.status).toBe("running");
  });

  it("the grant is bounded and human-gated: the cap extends by exactly the reopen grant, only when needed", async () => {
    await initRunV2(SLUG, { intakeDir: dir });
    for (let i = 0; i < V2_ATTEMPT_CAP; i++) await bumpRunAttempt(SLUG, { intakeDir: dir });
    await completeAllStages(SLUG, dir);
    await markLandingGate(SLUG, { passed: true, intakeDir: dir });
    await recordLandingOutcome(SLUG, { outcome: "draft", pr: 67, intakeDir: dir });
    const { state } = await reopenForAnswers(SLUG, { intakeDir: dir });
    expect(state.attempts.cap).toBe(V2_ATTEMPT_CAP + V2_REOPEN_ATTEMPT_GRANT);
    expect(state.attempts.total).toBe(V2_ATTEMPT_CAP); // history is not erased
  });

  it("a run with budget to spare re-opens WITHOUT any extension — the grant is not free headroom", async () => {
    await initRunV2(SLUG, { intakeDir: dir });
    await bumpRunAttempt(SLUG, { intakeDir: dir }); // 1 of 5
    await completeAllStages(SLUG, dir);
    await markLandingGate(SLUG, { passed: true, intakeDir: dir });
    await recordLandingOutcome(SLUG, { outcome: "draft", pr: 67, intakeDir: dir });
    const { state } = await reopenForAnswers(SLUG, { intakeDir: dir });
    expect(state.attempts.cap).toBe(V2_ATTEMPT_CAP); // untouched
  });
});

// ── R8: gate truth vs landing truth ──────────────────────────────────────────

describe("R8 — a landing failure never rewrites a passed research gate", () => {
  it("CASE A: gate PASS → GitHub merge failure ⇒ gate stays PASS, landing failed, publication false, events say the split", async () => {
    await gatePassedProductRun(dir);
    const state = await recordLandingOutcome(SLUG, { outcome: "failed", detail: "gh pr merge: HTTP 401", intakeDir: dir });
    expect(state.landingGate.status).toBe("passed"); // research truth untouched
    expect(state.status).toBe("complete"); // the RUN did not fail — the landing did
    expect(state.landing.outcome).toBe("failed");
    expect(state.publication.published).toBe(false);
    const texts = buildRunEvents({ state }).decisions.map((d) => d.text).join("\n");
    expect(texts).toContain("Landing evidence gate PASSED");
    expect(texts).toContain("Landing FAILED");
    expect(texts).not.toContain("Landing evidence gate FAILED");
  });

  it("CASE B: merge succeeded, finalization failed → the retry finalizes without rewriting anything", async () => {
    await gatePassedProductRun(dir);
    // The durable state after a merged-but-unfinalized landing is exactly the gate-passed state
    // (phase 2 never committed). The retry — with GitHub verification — completes it.
    const verified = verifyMergedPr({ slug: SLUG, pr: 91, gh: ghMock({ pr: MERGED_PR() }) });
    const state = await finalizeMergedLanding(SLUG, { pr: 91, mergedAt: verified.mergedAt, intakeDir: dir });
    expect(state.landingGate.status).toBe("passed");
    expect(state.landing.outcome).toBe("merged");
    expect(state.publication.published).toBe(true);
  });

  it("wiring: the land CLI emits the gate verdict on the HARD-failure path too, so the crash handler can see it", () => {
    const landCase = readRepo("scripts/pipeline.mjs").split('case "land"')[1].split('case "resolve-change"')[0];
    const catchBlock = landCase.split("} catch (err) {")[1].split("throw err;")[0];
    expect(catchBlock).toContain('emit("gate", passed ? "passed" : "failed")');
    expect(catchBlock).toContain('emit("outcome", "failed")');
  });

  it("wiring: the workflow's crash handler never rewrites a passed gate and never touches a merged run's gone branch", () => {
    const text = readRepo(".github/workflows/research-pass-v2.yml");
    const failedHandler = text.split("Record the landing gate failure (step crashed)")[1].split("- name:")[0];
    expect(text).toContain("failure() && steps.evidence_gate.outputs.gate != 'passed'");
    expect(failedHandler).toContain("--status failed");
    const preserveHandler = text.split("Preserve the passed gate verdict after a landing-side crash")[1].split(/\n {2}[a-z]/)[0];
    expect(text).toContain("steps.evidence_gate.outputs.gate == 'passed' && steps.evidence_gate.outputs.outcome != 'merged'");
    expect(preserveHandler).toContain("--status passed");
  });
});

// ── R9: the merge-conflict fallback stays unpublished ────────────────────────

describe("R9 — the conflict fallback re-quarantines the guide", () => {
  let guides;
  beforeEach(async () => {
    guides = path.join(dir, "guides");
    await mkdir(path.join(guides, SLUG), { recursive: true });
    await writeFile(path.join(guides, SLUG, "_guide.json"), JSON.stringify({ draft: true, title: "Hardland" }, null, 2) + "\n");
  });

  it("restoreDraft undoes the pre-merge flip: the fallback branch carries a DRAFT guide again", async () => {
    // The auto-landing sequence: flip off (rides the merge attempt)…
    const flipped = await flipDraft(SLUG, { guidesDir: guides });
    expect(flipped.ok).toBe(true);
    expect(JSON.parse(await readFile(path.join(guides, SLUG, "_guide.json"), "utf8")).draft).toBeUndefined();
    // …merge conflicts → restore: the guide is quarantined again, so a human resolving the
    // conflict and merging the PR merges a DRAFT, never a silent publication.
    const restored = await restoreDraft(SLUG, { guidesDir: guides });
    expect(restored).toMatchObject({ ok: true, changed: true });
    expect(JSON.parse(await readFile(path.join(guides, SLUG, "_guide.json"), "utf8")).draft).toBe(true);
    // Idempotent — a retried fallback does not churn the file.
    expect(await restoreDraft(SLUG, { guidesDir: guides })).toMatchObject({ ok: true, changed: false });
  });

  it("state side: gate PASS + conflict ⇒ draft landing recorded, publication false (with the run state agreeing)", async () => {
    await gatePassedProductRun(dir);
    const state = await recordLandingOutcome(SLUG, { outcome: "draft", pr: 92, detail: "gate passed but the merge fell back to a draft PR (conflict)", intakeDir: dir });
    expect(state.landing).toMatchObject({ outcome: "draft", pr: 92 });
    expect(state.publication.published).toBe(false);
    expect(state.landingGate.status).toBe("passed");
  });

  it("wiring: the land CLI restores the draft flag exactly on the passed+auto draft outcome", () => {
    const landCase = readRepo("scripts/pipeline.mjs").split('case "land"')[1].split('case "resolve-change"')[0];
    expect(landCase).toContain('result.outcome === "draft" && passed && auto');
    expect(landCase).toContain("restoreDraft(slug)");
    expect(landCase).toContain("restore draft after merge-conflict fallback");
  });
});

// ── R10: announcement truth survives recovery ────────────────────────────────

describe("R10 — announced is never downgraded by a retry", () => {
  it("a recorded announced:true survives a retry that omits the flag", async () => {
    await gatePassedProductRun(dir);
    // The durable pre-finalization record can carry the announce fact (landing still pending).
    const file = path.join(dir, SLUG, "run.v2.json");
    const raw = JSON.parse(readFileSync(file, "utf8"));
    raw.landing.announced = true;
    await writeFile(file, JSON.stringify(raw, null, 2) + "\n");
    const state = await finalizeMergedLanding(SLUG, { pr: 91, mergedAt: "2026-08-20T12:34:56Z", announced: null, intakeDir: dir });
    expect(state.landing.announced).toBe(true); // preserved, not nulled
  });

  it("announced:false (merge ok, notice failed) survives the same way — it is a follow-up fact, not noise", async () => {
    await gatePassedProductRun(dir);
    const file = path.join(dir, SLUG, "run.v2.json");
    const raw = JSON.parse(readFileSync(file, "utf8"));
    raw.landing.announced = false;
    await writeFile(file, JSON.stringify(raw, null, 2) + "\n");
    const state = await finalizeMergedLanding(SLUG, { pr: 91, mergedAt: "2026-08-20T12:34:56Z", intakeDir: dir });
    expect(state.landing.announced).toBe(false);
  });

  it("an explicit value still wins — the retry can SUPPLY the fact it knows", async () => {
    await gatePassedProductRun(dir);
    const state = await finalizeMergedLanding(SLUG, { pr: 91, mergedAt: "2026-08-20T12:34:56Z", announced: true, intakeDir: dir });
    expect(state.landing.announced).toBe(true);
  });

  it("wiring: the printed retry command carries the announce fact for BOTH outcomes, so it is complete as printed", () => {
    const landCase = readRepo("scripts/pipeline.mjs").split('case "land"')[1].split('case "resolve-change"')[0];
    expect(landCase).toContain('result.announced === true ? " --announced ok"');
    expect(landCase).toContain('result.announced === false ? " --announced failed"');
    expect(landCase).toMatch(/finalize-landing --slug \$\{slug\} --pr \$\{result\.pr\}\$\{annFlag\}/);
  });
});
