// R13 — THE deterministic lifecycle proof (hardening pass, 2026-08-20). One test walks the
// full non-production sequence the requirement names, against the REAL modules — real run-state
// transitions, a real git repository for the workspace machinery, the real Pass-B verifier, the
// real Progress adapter and resolver, and a mocked GitHub for the merge confirmation:
//
//   /new → Run A (trusted product authority) → Pass A → clean Pass-B baseline → questions →
//   gate PASS → landing → merge confirmed → publication finalized → Progress resolves Run A →
//   Run B for the SAME slug starts fresh → unpublished → owns questions/events/answers →
//   Run A's publication never makes Run B look complete → Run B's Pass-B workspace is clean.
//
// This complements the focused failure-path suites (pipeline-v2-hardening.test.mjs) — it is the
// happy-path spine those failure paths branch off. Zero network, zero production state.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  initRunV2, readRunStateV2, stageStart, stageComplete, markLandingGate, finalizeMergedLanding,
  deriveLandIntent, landingMode, V2_RESEARCH_STAGES,
} from "../pipeline/v2/run-state.mjs";
import { verifyMergedPr } from "../pipeline/v2/landing-truth.mjs";
import {
  resetFreshRunWorkspace, preparePassBWorkspace, removePassBWorkspace, verifyPassBWorkspace,
  staleRunArtifactPaths,
} from "../pipeline/v2/workspace.mjs";
import { emitRunEvents } from "../pipeline/v2/events.mjs";
import { parseQuestions, routeAnswers } from "../pipeline/questions.mjs";
import { resolveActiveGeneration } from "../../src/lib/run-generation.mjs";
import { adaptV2Snapshot, deriveProgress, derivePageState } from "../../src/features/pipeline-progress/model/progress.ts";
import { parseRunEvents, eventsForRun } from "../../src/features/pipeline-progress/model/run-events.ts";

const SLUG = "lifecycleland";

let dir, repo, intakeDir, g;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "wp-lifecycle-"));
  repo = path.join(dir, "repo");
  await mkdir(repo, { recursive: true });
  g = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  g("init", "-q", "-b", "main");
  g("config", "user.email", "t@t");
  g("config", "user.name", "t");
  intakeDir = path.join(repo, "guides-intake");
  // The scaffold /new lands on main before any research: frozen intake + draft guide meta.
  await mkdir(path.join(intakeDir, SLUG), { recursive: true });
  await mkdir(path.join(repo, "src", "content", "guides", SLUG), { recursive: true });
  await writeFile(path.join(intakeDir, SLUG, "intake.md"), "# frozen traveler intent\n");
  await writeFile(path.join(repo, "src", "content", "guides", SLUG, "_guide.json"), JSON.stringify({ draft: true, title: "Lifecycleland" }) + "\n");
  g("add", "-A");
  g("commit", "-qm", "scaffold on main");
});
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

const mergedPr = (pr) => (args) => {
  if (args[0] === "pr" && args[1] === "view") {
    return JSON.stringify({
      state: "MERGED", mergedAt: "2026-08-20T15:00:00Z", baseRefName: "main",
      headRefName: `research-v2/${SLUG}`, url: `https://github.com/x/y/pull/${pr}`,
    });
  }
  throw new Error(`unexpected gh call: ${args.join(" ")}`);
};

describe("R13 — the deterministic lifecycle, end to end", () => {
  it("Run A publishes; Run B for the same slug starts fresh, unpublished, and owns its own surfaces", async () => {
    // 1–2. /new creates Run A with TRUSTED product authority (the workflow_call provenance).
    const intent = deriveLandIntent({ eventName: "issues", onDefault: true, engine: "v2" });
    expect(intent).toBe("auto");
    g("checkout", "-qb", `research-v2/${SLUG}`);
    const runA = await initRunV2(SLUG, { intakeDir, landMode: intent, issue: "150", branchFresh: true });
    expect(runA.landMode).toBe("auto");
    // The fresh-run reset on a first run: nothing to remove, baseline = HEAD (clean by birth).
    const { baseline: baselineA } = resetFreshRunWorkspace(SLUG, { cwd: repo });
    await stageStart(SLUG, "scaffold", { intakeDir });
    await stageComplete(SLUG, "scaffold", { commit: baselineA, intakeDir });

    // 3. Pass A completes (its artifact rides the run branch).
    await writeFile(path.join(intakeDir, SLUG, "evidence.v2.json"), JSON.stringify({ runId: runA.runId, from: "passA" }) + "\n");
    await stageStart(SLUG, "passA", { intakeDir });
    await stageComplete(SLUG, "passA", { intakeDir });
    g("add", "-A");
    g("commit", "-qm", "passA output on the run branch");

    // 4. Pass B begins from a CLEAN baseline — the real worktree + the real verifier.
    const wsA = path.join(dir, "passb-a");
    preparePassBWorkspace(SLUG, { baseCommit: baselineA, destDir: wsA, cwd: repo });
    try {
      expect(verifyPassBWorkspace(SLUG, wsA)).toBe(true);
      expect(existsSync(path.join(wsA, "guides-intake", SLUG, "evidence.v2.json"))).toBe(false); // Pass A absent
    } finally {
      removePassBWorkspace(wsA, { cwd: repo });
    }
    await stageStart(SLUG, "passB", { intakeDir });
    await stageComplete(SLUG, "passB", { intakeDir });

    // 5. questions/reconciliation can occur: a question card in the ledger parses and, with the
    //    V2 run active, answers ROUTE to this run.
    await writeFile(path.join(intakeDir, SLUG, "ledger.md"),
      "## Questions for the traveler\n\n### q-pace\n- **Q:** Slow mornings or packed days?\n- **Assumed:** packed\n- **Status:** open\n");
    const cards = parseQuestions(await readFile(path.join(intakeDir, SLUG, "ledger.md"), "utf8"));
    expect(cards).toHaveLength(1);
    await stageStart(SLUG, "reconcile", { intakeDir });
    await stageComplete(SLUG, "reconcile", { intakeDir });

    // 6. the critic clears; the evidence gate PASSES; the landing decision is auto.
    await stageStart(SLUG, "critic", { intakeDir });
    await stageComplete(SLUG, "critic", { intakeDir });
    await markLandingGate(SLUG, { passed: true, intakeDir });
    expect(landingMode(await readRunStateV2(SLUG, { intakeDir }))).toBe("auto");
    g("add", "-A");
    g("commit", "-qm", "run A complete on the branch, gate passed");

    // 7–9. landing: the merge is CONFIRMED against (mocked) GitHub; finalization records
    //       publication with GitHub's own mergedAt. Simulate the merge in git too.
    g("checkout", "-q", "main");
    g("merge", "-q", "--no-ff", "-m", "merge run A", `research-v2/${SLUG}`);
    g("branch", "-qD", `research-v2/${SLUG}`); // land-branch.sh deletes the branch on merge
    const verified = verifyMergedPr({ slug: SLUG, pr: 200, gh: mergedPr(200) });
    const finalA = await finalizeMergedLanding(SLUG, { pr: 200, mergedAt: verified.mergedAt, announced: true, intakeDir });
    expect(finalA.publication.published).toBe(true);
    expect(finalA.landing.mergedAt).toBe("2026-08-20T15:00:00Z");
    await emitRunEvents(SLUG, { state: finalA, intakeDir });
    g("add", "-A");
    g("commit", "-qm", "run A finalized on main");

    // 10. Progress resolves Run A correctly: no branches → the merged record is history/done.
    const resolvedAfterA = resolveActiveGeneration({ v2Exists: false, v2State: null, v1Exists: false, v1State: null });
    expect(resolvedAfterA.decision).toBe("none");
    const snapA = adaptV2Snapshot(JSON.parse(await readFile(path.join(intakeDir, SLUG, "run.v2.json"), "utf8")));
    expect(snapA.published).toBe(true);
    expect(snapA.landingOutcome).toBe("merged");
    const viewA = deriveProgress(snapA.state, { now: new Date("2026-08-20T16:00:00Z"), published: snapA.published, runStatus: snapA.runStatus, landingOutcome: snapA.landingOutcome });
    expect(derivePageState({ view: viewA, hasRun: true, blockingForks: 0 })).toBe("done");

    // 11–12. Run B for the SAME slug: a fresh branch over the merged history, a NEW run, the
    //        prior run archived, the workspace reset to a clean current-run state.
    g("checkout", "-qb", `research-v2/${SLUG}`);
    const runB = await initRunV2(SLUG, { intakeDir, landMode: "auto", issue: "151", branchFresh: true });
    expect(runB.runId).not.toBe(runA.runId);
    expect(runB.previousRuns).toEqual([expect.objectContaining({ runId: runA.runId, mergedPr: 200 })]);
    const { baseline: baselineB, reset } = resetFreshRunWorkspace(SLUG, { cwd: repo });
    expect(reset).toBe(true);
    for (const rel of staleRunArtifactPaths(SLUG)) {
      expect(existsSync(path.join(repo, rel)), rel).toBe(false);
    }
    await stageStart(SLUG, "scaffold", { intakeDir });
    await stageComplete(SLUG, "scaffold", { commit: baselineB, intakeDir });

    // 13 + 15. Run B is UNPUBLISHED — even at gate PASS before its own merge, and even though
    //          the guide is live on main from Run A. Its Progress view is NOT complete.
    for (const stage of V2_RESEARCH_STAGES.slice(1)) {
      await stageStart(SLUG, stage, { intakeDir });
      await stageComplete(SLUG, stage, { intakeDir });
    }
    await markLandingGate(SLUG, { passed: true, intakeDir });
    const stateB = await readRunStateV2(SLUG, { intakeDir });
    expect(stateB.publication.published).toBe(false); // gate PASS is not publication
    expect(stateB.landing.outcome).toBe("pending"); // Run A's merge is not Run B's merge
    const snapB = adaptV2Snapshot(JSON.parse(await readFile(path.join(intakeDir, SLUG, "run.v2.json"), "utf8")));
    expect(snapB.published).toBe(false);
    const viewB = deriveProgress(snapB.state, {
      now: new Date("2026-08-20T17:00:00Z"),
      published: snapB.published, // the RUN's own fact — never main's draft-flag probe
      runStatus: snapB.runStatus, landingOutcome: snapB.landingOutcome,
    });
    expect(viewB.isDone).toBe(false); // Run A's deployment does not satisfy Run B
    expect(derivePageState({ view: viewB, hasRun: true, blockingForks: 0 })).not.toBe("done");

    // 14. questions/events/answers resolve to Run B — at this point Run B is complete-but-
    //     unmerged (gate PASS, no merge), so the resolver's "complete draft" decision still
    //     hands it every surface: its branch owns the questions, events and answers.
    const resolvedB = resolveActiveGeneration({ v2Exists: true, v2State: stateB, v1Exists: false, v1State: null });
    expect(resolvedB.decision).toBe("v2-complete-draft");
    const route = routeAnswers({ hasAnswers: true, researchActive: true, researchBranch: `research-v2/${SLUG}`, published: false });
    expect(route).toMatchObject({ target: "research", branch: `research-v2/${SLUG}` });
    // Run A's event stream survives ONLY in main's history (the fresh-run reset removed it from
    // Run B's branch — exactly the point), and it can never render against Run B (runId join).
    const eventsOnMain = parseRunEvents(JSON.parse(g("show", `main:guides-intake/${SLUG}/events.json`)));
    expect(eventsOnMain.available).toBe(true);
    expect(eventsForRun(eventsOnMain, runB.runId).available).toBe(false);
    expect(eventsForRun(eventsOnMain, runA.runId).available).toBe(true);

    // 16. Run B's Pass-B workspace stays clean — the real verifier, against Run B's baseline.
    const wsB = path.join(dir, "passb-b");
    preparePassBWorkspace(SLUG, { baseCommit: baselineB, destDir: wsB, cwd: repo });
    try {
      expect(verifyPassBWorkspace(SLUG, wsB)).toBe(true);
    } finally {
      removePassBWorkspace(wsB, { cwd: repo });
    }
  }, 60_000);
});
