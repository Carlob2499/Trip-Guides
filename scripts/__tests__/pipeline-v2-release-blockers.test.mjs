// CODEX RELEASE-BLOCKER PROOFS for PR #68 (2026-08-20). One describe per defect, behavioral
// first — real git repositories, real bare origins, mocked GitHub responses only at the gh seam:
//
//   B1  answers routing resolves ACTIVE research ownership BEFORE historical slug publication —
//       proven at the REAL seam (resolveAnswerRouting against a real origin), not with
//       hand-selected routeAnswers flags. A published Run A never steals Run B's answer.
//   B2  finalization proves the EXACT run, not just the slug branch: the merge commit's own
//       run.v2.json must carry the runId being finalized. Run A's old merged PR is refused for
//       Run B — reproduced from the REAL merged-but-unfinalized recovery state (landing.pr
//       never pre-seeded).
//   B3  every non-merged AUTO landing leaves the remote research branch quarantined
//       (draft:true ON ORIGIN) — merge-conflict fallback AND hard failure — and a quarantine
//       that cannot be persisted is a BLOCKED landing, never a "safely draft" claim.
//   B4  announcement truth fails closed in recovery: a merged-but-unfinalized state with no
//       durable announce fact refuses to finalize without --announced.
//   FINAL  the deterministic Run A → Run B lifecycle, end to end: publish A, research B,
//       real answers routing picks B, gate PASS, non-merged failure + quarantine, retry,
//       merge, recovery refuses A's PR, recovery with B's PR publishes B.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

// Every test here drives REAL git against a real bare origin (multiple sequential subprocess
// round-trips); under full-suite worker contention the 5s default is a flake generator.
vi.setConfig({ testTimeout: 60_000 });

import {
  initRunV2, readRunStateV2, stageStart, stageComplete, markLandingGate,
  finalizeMergedLanding, V2_RESEARCH_STAGES,
} from "../pipeline/v2/run-state.mjs";
import { finalizeLandingRecovery } from "../pipeline/v2/landing-truth.mjs";
import { resolveAnswerRouting } from "../pipeline/questions.mjs";
import { flipDraft, quarantineRemoteBranch } from "../pipeline/publish.mjs";
import { executeLanding } from "../pipeline/landing.mjs";
import { ContractError } from "../pipeline/v2/contracts.mjs";

const SLUG = "blockerland";
const BRANCH = `research-v2/${SLUG}`;

let dir, repo, origin, g, intakeDir, guidesDir;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "wp-blockers-"));
  repo = path.join(dir, "repo");
  origin = path.join(dir, "origin.git");
  await mkdir(repo, { recursive: true });
  await mkdir(origin, { recursive: true });
  execFileSync("git", ["init", "-q", "--bare", "-b", "main", origin]);
  g = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  g("init", "-q", "-b", "main");
  g("config", "user.email", "t@t");
  g("config", "user.name", "t");
  intakeDir = path.join(repo, "guides-intake");
  guidesDir = path.join(repo, "src", "content", "guides");
  await mkdir(path.join(intakeDir, SLUG), { recursive: true });
  await mkdir(path.join(guidesDir, SLUG), { recursive: true });
  await writeFile(path.join(intakeDir, SLUG, "intake.md"), "# frozen traveler intent\n");
  await writeFile(path.join(guidesDir, SLUG, "_guide.json"), JSON.stringify({ draft: true, title: "Blockerland" }, null, 2) + "\n");
  g("add", "-A");
  g("commit", "-qm", "scaffold on main");
  g("remote", "add", "origin", origin);
  g("push", "-q", "-u", "origin", "main");
}, 30_000);
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

const gitAt = (cwd) => (args) => execFileSync("git", args, { cwd, encoding: "utf8" });
const showOrigin = (ref, rel) =>
  execFileSync("git", ["--git-dir", origin, "show", `${ref}:${rel}`], { encoding: "utf8" });

/** Seed a branch on ORIGIN carrying `files`, leaving the local repo back on main without it. */
async function seedOriginBranch(branchName, files) {
  g("checkout", "-qb", branchName);
  for (const [rel, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(repo, rel)), { recursive: true });
    await writeFile(path.join(repo, rel), content);
  }
  g("add", "-A");
  g("commit", "-qm", `seed ${branchName}`);
  g("push", "-q", "origin", branchName);
  g("checkout", "-q", "main");
  g("branch", "-qD", branchName);
}

async function completeAllStages(slug, opts) {
  for (const stage of V2_RESEARCH_STAGES) {
    await stageStart(slug, stage, opts);
    await stageComplete(slug, stage, opts);
  }
}

/** Publish the guide on main directly (Run A already live), keeping origin in sync. */
async function publishGuideOnMain() {
  const flipped = await flipDraft(SLUG, { guidesDir });
  expect(flipped.ok).toBe(true);
  g("add", "-A");
  g("commit", "-qm", "guide published on main (Run A live)");
  g("push", "-q", "origin", "main");
}

const ghFor = (prs) => (args) => {
  if (args[0] === "pr" && args[1] === "view") {
    const doc = prs[args[2]];
    if (!doc) throw new Error(`GraphQL: Could not resolve to a PullRequest with the number of ${args[2]}.`);
    return JSON.stringify(doc);
  }
  throw new Error(`unexpected gh call: ${args.join(" ")}`);
};
const prDoc = (pr, { oid, head = BRANCH, base = "main", mergedAt = "2026-08-20T12:34:56Z", state = "MERGED" } = {}) => ({
  state, mergedAt, baseRefName: base, headRefName: head,
  mergeCommit: oid ? { oid } : null, url: `https://github.com/x/y/pull/${pr}`,
});

// ── B1: active research ownership BEFORE historical publication — the REAL seam ──────────────

describe("B1 — answers-route: an active Run B owns answers even when Run A is published (real origin)", () => {
  const route = () => resolveAnswerRouting(SLUG, { hasAnswers: true, cwd: repo, guidesDir, git: gitAt(repo) });

  it("published main + ACTIVE V2 Run B on origin → target research, Run B's branch", async () => {
    await publishGuideOnMain();
    await seedOriginBranch(BRANCH, {
      [`guides-intake/${SLUG}/run.v2.json`]: JSON.stringify({ runId: `${SLUG}-20260820-bbb222`, status: "running" }),
    });
    const d = await route();
    expect(d).toMatchObject({ target: "research", branch: BRANCH });
  });

  it("published main + COMPLETE-but-unmerged Run B draft → Run B still owns the late answer", async () => {
    await publishGuideOnMain();
    await seedOriginBranch(BRANCH, {
      [`guides-intake/${SLUG}/run.v2.json`]: JSON.stringify({
        runId: `${SLUG}-20260820-bbb222`, status: "complete",
        landing: { outcome: "draft", pr: 92 }, publication: { published: false },
      }),
    });
    const d = await route();
    expect(d).toMatchObject({ target: "research", branch: BRANCH });
  });

  it("published main + NO active research → the change lifecycle absorbs the answer", async () => {
    await publishGuideOnMain();
    const d = await route();
    expect(d.target).toBe("change");
    expect(d.branch).toBe(null);
  });

  it("published main + ACTIVE V1 rollback → V1's branch owns the answer", async () => {
    await publishGuideOnMain();
    await seedOriginBranch(`research/${SLUG}`, {
      [`guides-intake/${SLUG}/state.json`]: JSON.stringify({
        slug: SLUG, stages: { scaffold: "2026-08-20T09:00:00Z", passA: null, passB: null, reconcile: null, verified: null },
      }),
    });
    const d = await route();
    expect(d).toMatchObject({ target: "research", branch: `research/${SLUG}` });
  });

  it("dual active (V1 AND V2 both mid-research) → explicit refusal, published or not", async () => {
    await publishGuideOnMain();
    await seedOriginBranch(BRANCH, {
      [`guides-intake/${SLUG}/run.v2.json`]: JSON.stringify({ runId: `${SLUG}-20260820-bbb222`, status: "running" }),
    });
    await seedOriginBranch(`research/${SLUG}`, {
      [`guides-intake/${SLUG}/state.json`]: JSON.stringify({ slug: SLUG, stages: { scaffold: null } }),
    });
    const d = await route();
    expect(d.conflict).toBe(true);
  });

  it("a merged V2 remnant branch is history — it owns nothing, publication routes to change", async () => {
    await publishGuideOnMain();
    await seedOriginBranch(BRANCH, {
      [`guides-intake/${SLUG}/run.v2.json`]: JSON.stringify({
        runId: `${SLUG}-20260810-aaa111`, status: "complete",
        landing: { outcome: "merged", pr: 80, mergedAt: "2026-08-10T10:00:00Z" },
        publication: { published: true },
      }),
    });
    const d = await route();
    expect(d.target).toBe("change");
  });
});

// ── B2: finalization proves the EXACT run, from the real recovery state ──────────────────────

describe("B2 — recovery refuses Run A's old merged PR when finalizing Run B (same branch name)", () => {
  let oidA, oidB, runIdA, runIdB;

  beforeEach(async () => {
    // Run A rides research-v2/<slug> and merges (its merge commit carries runId A)…
    g("checkout", "-qb", BRANCH);
    const runA = await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    runIdA = runA.runId;
    await completeAllStages(SLUG, { intakeDir });
    await markLandingGate(SLUG, { passed: true, intakeDir });
    g("add", "-A");
    g("commit", "-qm", "run A complete on the branch");
    g("checkout", "-q", "main");
    g("merge", "-q", "--no-ff", "-m", "merge run A", BRANCH);
    oidA = g("rev-parse", "HEAD").trim();
    g("branch", "-qD", BRANCH);
    // …and is FULLY finalized (published) on main.
    await finalizeMergedLanding(SLUG, { pr: 80, mergedAt: "2026-08-10T10:00:00Z", announced: true, intakeDir });
    g("add", "-A");
    g("commit", "-qm", "run A finalized on main");
    // Run B REUSES the same branch name, completes, merges — and finalization CRASHES before
    // reaching main: the durable main state is Run B's phase-1 record (landing.pr null, never
    // pre-seeded). This is the REAL merged-but-unfinalized recovery state.
    g("checkout", "-qb", BRANCH);
    const runB = await initRunV2(SLUG, { intakeDir, branchFresh: true, landMode: "auto" });
    runIdB = runB.runId;
    expect(runIdB).not.toBe(runIdA);
    await completeAllStages(SLUG, { intakeDir });
    await markLandingGate(SLUG, { passed: true, intakeDir });
    g("add", "-A");
    g("commit", "-qm", "run B complete on the branch");
    g("checkout", "-q", "main");
    g("merge", "-q", "--no-ff", "-m", "merge run B", BRANCH);
    oidB = g("rev-parse", "HEAD").trim();
    g("branch", "-qD", BRANCH);
    g("push", "-q", "origin", "main");
    const durable = await readRunStateV2(SLUG, { intakeDir });
    expect(durable.runId).toBe(runIdB);
    expect(durable.landing.outcome).toBe("pending"); // finalization still owed
    expect(durable.landing.pr).toBe(null); // NOT pre-seeded — the mismatch guard is not the prop under test
  }, 30_000);

  const PRS = () => ({
    80: prDoc(80, { oid: oidA, mergedAt: "2026-08-10T10:00:00Z" }),
    200: prDoc(200, { oid: oidB }),
    300: prDoc(300, { oid: oidB, head: "research-v2/otherland" }),
  });

  it("supplying Run A's old merged PR is REFUSED — same base, same head, different run", async () => {
    await expect(finalizeLandingRecovery(SLUG, {
      pr: 80, base: "main", cwd: repo, intakeDir, announced: "skipped", gh: ghFor(PRS()), git: gitAt(repo),
    })).rejects.toThrow(new RegExp(`merged run "${runIdA}", not the run being finalized \\("${runIdB}"\\)`));
    expect((await readRunStateV2(SLUG, { intakeDir })).publication.published).toBe(false);
  });

  it("supplying an unrelated same-base merged PR is REFUSED", async () => {
    await expect(finalizeLandingRecovery(SLUG, {
      pr: 300, base: "main", cwd: repo, intakeDir, announced: "skipped", gh: ghFor(PRS()), git: gitAt(repo),
    })).rejects.toThrow(/research-v2\/otherland/);
  });

  it("supplying Run B's ACTUAL merged PR succeeds, with GitHub's real mergedAt persisted to origin", async () => {
    const { state, mergedAt } = await finalizeLandingRecovery(SLUG, {
      pr: 200, base: "main", cwd: repo, intakeDir, announced: true, gh: ghFor(PRS()), git: gitAt(repo),
    });
    expect(mergedAt).toBe("2026-08-20T12:34:56Z"); // GitHub's value, never the retry clock
    expect(state.publication.published).toBe(true);
    expect(state.landing).toMatchObject({ outcome: "merged", pr: 200, mergedAt: "2026-08-20T12:34:56Z" });
    const remote = JSON.parse(showOrigin("main", `guides-intake/${SLUG}/run.v2.json`));
    expect(remote.landing.mergedAt).toBe("2026-08-20T12:34:56Z");
    expect(remote.publication.published).toBe(true);
  });

  // ── B4, on this same REAL merged-but-unfinalized state (never pre-seeded) ──
  it("B4: recovery WITHOUT --announced is REFUSED — a known real-world fact never silently becomes unknown", async () => {
    await expect(finalizeLandingRecovery(SLUG, {
      pr: 200, base: "main", cwd: repo, intakeDir, gh: ghFor(PRS()), git: gitAt(repo),
    })).rejects.toThrow(/no durable announcement fact/);
    expect((await readRunStateV2(SLUG, { intakeDir })).publication.published).toBe(false);
  });

  it("B4: --announced failed finalizes with the durable follow-up fact recorded", async () => {
    const { state } = await finalizeLandingRecovery(SLUG, {
      pr: 200, base: "main", cwd: repo, intakeDir, announced: false, gh: ghFor(PRS()), git: gitAt(repo),
    });
    expect(state.landing.announced).toBe(false);
  });

  it("B4: an ALREADY-finalized run re-recovers idempotently without demanding the flag again", async () => {
    await finalizeLandingRecovery(SLUG, {
      pr: 200, base: "main", cwd: repo, intakeDir, announced: "skipped", gh: ghFor(PRS()), git: gitAt(repo),
    });
    // The retry omits --announced: the fact (null = skipped) is already the recorded truth.
    const { state } = await finalizeLandingRecovery(SLUG, {
      pr: 200, base: "main", cwd: repo, intakeDir, gh: ghFor(PRS()), git: gitAt(repo),
    });
    expect(state.landing.outcome).toBe("merged");
  });
});

// ── B3: every non-merged AUTO landing leaves origin quarantined ──────────────────────────────

describe("B3 — the remote research branch is draft:true after EVERY non-merged auto landing (real remote)", () => {
  let logs, errs, outputs;
  const collect = () => {
    logs = []; errs = []; outputs = {};
    return {
      log: (m) => logs.push(String(m)),
      error: (m) => errs.push(String(m)),
      emit: (k, v) => { outputs[k] = v; },
    };
  };

  /** The pre-landing state: a gate-ready product run committed on its branch, branch on origin. */
  async function productRunOnBranch() {
    g("checkout", "-qb", BRANCH);
    await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    await completeAllStages(SLUG, { intakeDir });
    g("add", "-A");
    g("commit", "-qm", "run complete on the branch (gate not yet recorded)");
    g("push", "-q", "-u", "origin", BRANCH);
    return readRunStateV2(SLUG, { intakeDir });
  }

  // A no-op gh stub is the DEFAULT here: quarantineRemoteBranch now falls back to the REAL gh
  // CLI when no runner is injected (the production wiring under test in CASE D/E), and these
  // tests must stay hermetic. Cases proving the gh seam override it via `io`.
  const landOpts = (io, land, v2state) => ({
    branch: BRANCH, base: "main", passed: true, auto: true,
    title: "t", bodyFile: "unused", v2state,
    guidesDir, intakeDir, cwd: repo, git: gitAt(repo), land, gh: () => "", ...io,
  });

  it("CASE A: gate PASS → merge conflict → restore push succeeds ⇒ remote branch draft:true, PR draft outcome", async () => {
    const v2state = await productRunOnBranch();
    const io = collect();
    const res = await executeLanding(SLUG, landOpts(io, () => ({ outcome: "draft", pr: 92, announced: null }), v2state));
    expect(res).toMatchObject({ code: 0, outcome: "draft", pr: 92 });
    expect(outputs).toMatchObject({ gate: "passed", outcome: "draft", pr: "92" });
    // THE INVARIANT, on the REMOTE: origin's branch carries draft:true again.
    expect(JSON.parse(showOrigin(BRANCH, `src/content/guides/${SLUG}/_guide.json`)).draft).toBe(true);
    const state = await readRunStateV2(SLUG, { intakeDir });
    expect(state.landing).toMatchObject({ outcome: "draft", pr: 92 });
    expect(state.landingGate.status).toBe("passed");
    expect(state.publication.published).toBe(false);
    // …and the durable record itself reached origin's branch.
    expect(JSON.parse(showOrigin(BRANCH, `guides-intake/${SLUG}/run.v2.json`)).landing.outcome).toBe("draft");
  });

  it("CASE B: gate PASS → merge conflict → restore push FAILS ⇒ BLOCKED: failed outcome, exit 1, no safe-draft claim", async () => {
    const v2state = await productRunOnBranch();
    const io = collect();
    const dead = path.join(dir, "no-such-remote.git");
    const res = await executeLanding(SLUG, landOpts(io, () => {
      g("remote", "set-url", "origin", dead); // the remote dies between the merge attempt and the restore
      return { outcome: "draft", pr: 93, announced: null };
    }, v2state));
    expect(res.code).toBe(1);
    expect(res.outcome).toBe("failed");
    expect(outputs.outcome).toBe("failed"); // never reported as a safe draft fallback
    expect(errs.join("\n")).toContain("BLOCKED");
    expect(errs.join("\n")).toContain("undrafted, publishable");
    expect(logs.join("\n")).not.toContain("RESTORED"); // no safe-restore claim was logged
    const state = await readRunStateV2(SLUG, { intakeDir });
    expect(state.landing.outcome).toBe("failed");
    expect(state.landing.detail).toContain("could not be pushed");
    expect(state.landingGate.status).toBe("passed"); // research truth untouched
  });

  it("CASE C: gate PASS → hard merge/API failure after the flip ⇒ draft restored AND pushed before exit; landing failed; gate PASS", async () => {
    const v2state = await productRunOnBranch();
    const io = collect();
    await expect(executeLanding(SLUG, landOpts(io, () => { throw new Error("HTTP 401: bad credentials"); }, v2state)))
      .rejects.toThrow(/HTTP 401/);
    expect(outputs).toMatchObject({ gate: "passed", outcome: "failed" });
    // The remote branch is quarantined BEFORE the failure propagates.
    expect(JSON.parse(showOrigin(BRANCH, `src/content/guides/${SLUG}/_guide.json`)).draft).toBe(true);
    const state = await readRunStateV2(SLUG, { intakeDir });
    expect(state.landing.outcome).toBe("failed");
    expect(state.landing.detail).toContain("HTTP 401");
    expect(state.landing.detail).toContain("draft restored and pushed");
    expect(state.landingGate.status).toBe("passed");
    expect(state.publication.published).toBe(false);
    expect(JSON.parse(showOrigin(BRANCH, `guides-intake/${SLUG}/run.v2.json`)).landing.outcome).toBe("failed");
  });

  it("CASE C + dead remote: the quarantine failure is LOUD on top of the original error, never silent", async () => {
    const v2state = await productRunOnBranch();
    const io = collect();
    const dead = path.join(dir, "no-such-remote.git");
    await expect(executeLanding(SLUG, landOpts(io, () => {
      g("remote", "set-url", "origin", dead);
      throw new Error("HTTP 500: server error");
    }, v2state))).rejects.toThrow(/HTTP 500/); // the ORIGINAL failure survives, not masked
    expect(errs.join("\n")).toContain("BLOCKED");
    const state = await readRunStateV2(SLUG, { intakeDir });
    expect(state.landing.detail).toContain("DID NOT PERSIST");
  });

  it("CASE D: hard NON-CONFLICT failure after the PR went Ready ⇒ quarantine pushes draft:true AND returns the PR to draft (`pr ready --undo` actually attempted)", async () => {
    const v2state = await productRunOnBranch();
    const io = collect();
    const ghCalls = [];
    // land-branch.sh marked the PR Ready, then the merge died on a NON-conflict hard failure
    // (auth/API/rate-limit) — no draft conversion happens in the script on that path, so the
    // quarantine owns BOTH restores. The recording gh runner stands at the seam the real
    // default CLI runner occupies in production.
    await expect(executeLanding(SLUG, landOpts(
      { ...io, gh: (args) => { ghCalls.push(args); return ""; } },
      () => { throw new Error("HTTP 403: API rate limit exceeded"); }, v2state,
    ))).rejects.toThrow(/HTTP 403/);
    expect(outputs).toMatchObject({ gate: "passed", outcome: "failed" }); // landing failed, gate PASS
    // The hard invariant: origin's branch content is draft:true again…
    expect(JSON.parse(showOrigin(BRANCH, `src/content/guides/${SLUG}/_guide.json`)).draft).toBe(true);
    // …and the PR undraft was ATTEMPTED (and here succeeded), not skipped for lack of a runner.
    expect(ghCalls).toContainEqual(["pr", "ready", BRANCH, "--undo"]);
    const state = await readRunStateV2(SLUG, { intakeDir });
    expect(state.landing.outcome).toBe("failed");
    expect(state.landingGate.status).toBe("passed");
    expect(state.publication.published).toBe(false);
  });

  it("CASE E: content quarantine succeeds but the PR undraft FAILS ⇒ landing failed, remote safely draft:true, LOUD warning that the PR may still look Ready", async () => {
    const v2state = await productRunOnBranch();
    const io = collect();
    await expect(executeLanding(SLUG, landOpts(
      { ...io, gh: () => { throw new Error("HTTP 500: gh unavailable"); } },
      () => { throw new Error("HTTP 401: bad credentials"); }, v2state,
    ))).rejects.toThrow(/HTTP 401/);
    expect(outputs).toMatchObject({ gate: "passed", outcome: "failed" }); // landing stays failed
    // The hard invariant held despite the gh failure: origin's branch content is draft:true.
    expect(JSON.parse(showOrigin(BRANCH, `src/content/guides/${SLUG}/_guide.json`)).draft).toBe(true);
    const state = await readRunStateV2(SLUG, { intakeDir });
    expect(state.landing.outcome).toBe("failed");
    expect(state.landingGate.status).toBe("passed");
    // …and the failed best-effort undraft is LOUD, naming both truths: guide safe, PR suspect.
    const warned = errs.join("\n");
    expect(warned).toContain("safely draft:true");
    expect(warned).toContain("may still appear Ready");
  });

  it("quarantineRemoteBranch retry: a restore committed locally whose push was lost is pushed by the next attempt", async () => {
    await productRunOnBranch();
    // Simulate the flip riding the branch…
    const flipped = await flipDraft(SLUG, { guidesDir });
    expect(flipped.ok).toBe(true);
    g("add", "-A");
    g("commit", "-qm", "flip rides the branch");
    g("push", "-q", "origin", BRANCH);
    // …then a quarantine whose push dies.
    const dead = path.join(dir, "no-such-remote.git");
    g("remote", "set-url", "origin", dead);
    await expect(quarantineRemoteBranch(SLUG, { branch: BRANCH, guidesDir, cwd: repo, git: gitAt(repo), gh: () => "" })).rejects.toThrow();
    expect(JSON.parse(showOrigin(BRANCH, `src/content/guides/${SLUG}/_guide.json`)).draft).toBeUndefined(); // origin still exposed
    // The retry (remote healed) pushes the ALREADY-committed restore — the exact lost-push case.
    g("remote", "set-url", "origin", origin);
    const out = await quarantineRemoteBranch(SLUG, { branch: BRANCH, guidesDir, cwd: repo, git: gitAt(repo), gh: () => "" });
    expect(out.pushed).toBe(true);
    expect(out.prUndrafted).toBe(true); // the undraft is attempted on every successful quarantine
    expect(out.restored).toBe(false); // nothing new to restore — the push was the missing half
    expect(JSON.parse(showOrigin(BRANCH, `src/content/guides/${SLUG}/_guide.json`)).draft).toBe(true);
  });
});

// ── FINAL: the deterministic Run A → Run B lifecycle ─────────────────────────────────────────

describe("FINAL — Run A live, Run B researched, mis-routes refused, quarantined, recovered, published", () => {
  it("runs the whole 12-step lifecycle deterministically", async () => {
    const io = { log: () => {}, error: () => {}, emit: () => {} };

    // 1. Run A publishes: its branch merges and its landing is finalized on main.
    g("checkout", "-qb", BRANCH);
    const runA = await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    await completeAllStages(SLUG, { intakeDir });
    await markLandingGate(SLUG, { passed: true, intakeDir });
    const flippedA = await flipDraft(SLUG, { guidesDir }); // phase-1 flip rides Run A's merge
    expect(flippedA.ok).toBe(true);
    g("add", "-A");
    g("commit", "-qm", "run A complete, gate passed, flip rides the branch");
    g("checkout", "-q", "main");
    g("merge", "-q", "--no-ff", "-m", "merge run A", BRANCH);
    const oidA = g("rev-parse", "HEAD").trim();
    g("branch", "-qD", BRANCH);
    await finalizeMergedLanding(SLUG, { pr: 80, mergedAt: "2026-08-10T10:00:00Z", announced: true, intakeDir });
    g("add", "-A");
    g("commit", "-qm", "run A finalized on main");
    g("push", "-q", "origin", "main");
    expect(JSON.parse(showOrigin("main", `src/content/guides/${SLUG}/_guide.json`)).draft).toBeUndefined(); // LIVE

    // 2–3. Run B starts for the same slug and remains unpublished (active research on its branch).
    g("checkout", "-qb", BRANCH);
    const runB = await initRunV2(SLUG, { intakeDir, branchFresh: true, landMode: "auto" });
    expect(runB.runId).not.toBe(runA.runId);
    await stageStart(SLUG, "scaffold", { intakeDir });
    await stageComplete(SLUG, "scaffold", { intakeDir });
    g("add", "-A");
    g("commit", "-qm", "run B active on the branch");
    g("push", "-q", "-u", "origin", BRANCH);

    // 4–5. A traveler answer arrives while Run B is active: the REAL answers routing (real
    //      origin, real published main) selects Run B despite Run A existing live.
    g("checkout", "-q", "main");
    const routed = await resolveAnswerRouting(SLUG, { hasAnswers: true, cwd: repo, guidesDir, git: gitAt(repo) });
    expect(routed).toMatchObject({ target: "research", branch: BRANCH });

    // 6. Run B reaches gate PASS (the landing records the verdict itself in phase 1).
    g("checkout", "-q", BRANCH);
    for (const stage of V2_RESEARCH_STAGES.slice(1)) {
      await stageStart(SLUG, stage, { intakeDir });
      await stageComplete(SLUG, stage, { intakeDir });
    }
    g("add", "-A");
    g("commit", "-qm", "run B all stages complete");
    g("push", "-q", "origin", BRANCH);
    const stateB = await readRunStateV2(SLUG, { intakeDir });

    // 7. A non-merged HARD failure: the remote branch must come back quarantined.
    await expect(executeLanding(SLUG, {
      branch: BRANCH, base: "main", passed: true, auto: true, title: "t", bodyFile: "unused",
      v2state: stateB, guidesDir, intakeDir, cwd: repo, git: gitAt(repo),
      land: () => { throw new Error("HTTP 502: bad gateway"); }, gh: () => "", ...io,
    })).rejects.toThrow(/HTTP 502/);
    expect(JSON.parse(showOrigin(BRANCH, `src/content/guides/${SLUG}/_guide.json`)).draft).toBe(true);
    expect((await readRunStateV2(SLUG, { intakeDir })).landing.outcome).toBe("failed");
    expect((await readRunStateV2(SLUG, { intakeDir })).landingGate.status).toBe("passed");

    // 8–9. Retry: the merge SUCCEEDS on GitHub's side (simulated by a real merge pushed to
    //      origin by a separate clone, exactly what gh's merge does), but post-merge
    //      finalization crashes — leaving the REAL merged-but-unfinalized state on main.
    let oidB;
    const landPerformingMerge = () => {
      const ghSide = path.join(dir, "gh-side");
      execFileSync("git", ["clone", "-q", origin, ghSide]);
      const gs = (...args) => execFileSync("git", args, { cwd: ghSide, encoding: "utf8" });
      gs("config", "user.email", "gh@gh");
      gs("config", "user.name", "gh");
      gs("checkout", "-q", "main");
      gs("merge", "-q", "--no-ff", "-m", "merge run B (gh-side)", `origin/${BRANCH}`);
      oidB = gs("rev-parse", "HEAD").trim();
      gs("push", "-q", "origin", "main");
      gs("push", "-q", "origin", "--delete", BRANCH); // land-branch.sh deletes the branch on merge
      return { outcome: "merged", pr: 200, announced: false };
    };
    const crashRes = await executeLanding(SLUG, {
      branch: BRANCH, base: "main", passed: true, auto: true, title: "t", bodyFile: "unused",
      v2state: stateB, guidesDir, intakeDir, cwd: repo, git: gitAt(repo),
      land: landPerformingMerge,
      gh: () => { throw new Error("gh: connection reset"); }, // finalization cannot reach GitHub
      ...io,
    });
    expect(crashRes.code).toBe(1); // MERGE SUCCEEDED, finalization owed — the loud retryable exit
    expect(crashRes.outcome).toBe("merged");
    const durable = await readRunStateV2(SLUG, { intakeDir }); // the main checkout after the crash
    expect(durable.runId).toBe(runB.runId);
    expect(durable.publication.published).toBe(false);

    // 10. Recovery with Run A's OLD merged PR is REFUSED — the runId proof, at the real seam.
    const PRS = {
      80: prDoc(80, { oid: oidA, mergedAt: "2026-08-10T10:00:00Z" }),
      200: prDoc(200, { oid: oidB }),
    };
    await expect(finalizeLandingRecovery(SLUG, {
      pr: 80, base: "main", cwd: repo, intakeDir, announced: false, gh: ghFor(PRS), git: gitAt(repo),
    })).rejects.toThrow(ContractError);
    expect((await readRunStateV2(SLUG, { intakeDir })).publication.published).toBe(false);

    // (announcement truth fails closed on this same state: no flag, no durable fact → refusal.)
    await expect(finalizeLandingRecovery(SLUG, {
      pr: 200, base: "main", cwd: repo, intakeDir, gh: ghFor(PRS), git: gitAt(repo),
    })).rejects.toThrow(/no durable announcement fact/);

    // 11–12. Recovery with Run B's ACTUAL PR succeeds: Run B becomes published, durably, on origin.
    const { state: finalB, mergedAt } = await finalizeLandingRecovery(SLUG, {
      pr: 200, base: "main", cwd: repo, intakeDir, announced: false, gh: ghFor(PRS), git: gitAt(repo),
    });
    expect(mergedAt).toBe("2026-08-20T12:34:56Z"); // GitHub's own timestamp
    expect(finalB.publication.published).toBe(true);
    expect(finalB.landing).toMatchObject({ outcome: "merged", pr: 200, announced: false });
    const remote = JSON.parse(showOrigin("main", `guides-intake/${SLUG}/run.v2.json`));
    expect(remote.publication.published).toBe(true);
    expect(remote.runId).toBe(runB.runId);
  }, 60_000);
});
