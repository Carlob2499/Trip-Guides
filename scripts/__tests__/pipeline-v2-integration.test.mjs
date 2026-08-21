// Integration + correction-pass contracts for the /new → V2 product connection:
//
//   · run.v2.json carries the intake ISSUE durably: recorded once at init, inherited by every
//     resume/retry (which carry no issue input), never rewired;
//   · LANDING AUTHORITY is never a typed input: intent is derived from infrastructure facts
//     (default-branch ref + selector), recorded once, immutable — and even a recorded "auto"
//     cannot merge without landing-time authority AND the two-phase landing transaction;
//   · the PUBLICATION TRANSACTION never gets ahead of reality: gate PASS and merge success are
//     separate facts, "published" is schema-invalid without a CONFIRMED merged outcome, and the
//     function that finalizes it independently re-verifies intent, gate, completeness and PR
//     identity (the retired recordProductLanding() wrote published before landBranch ran — the
//     tests here pin that class of bug out);
//   · V1 is a REAL rollback path: a V1 landing never touches V2 state merely because a
//     historical run.v2.json sits in its checkout, and a stale complete V2 branch never steals
//     answers from an active V1 run;
//   · a merged run's history on main never becomes a future run's identity: fresh branches
//     start FRESH runs (old runs archived, never destroyed);
//   · late answers to a complete-but-unmerged draft run re-open the deterministic resume point
//     so the work genuinely absorbs them — never apply-and-reland-unchanged.

// @protects-file No state or event claims a merge before GitHub confirms it; no dispatch input can buy publication; V1 rollback and V2 re-research stay uncontaminated.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  initRunV2, readRunStateV2, stageStart, stageComplete, landingMode, markLandingGate,
  recordLandingOutcome, finalizeMergedLanding, reopenForAnswers, V2_RESEARCH_STAGES,
} from "../pipeline/v2/run-state.mjs";
import { buildRunEvents } from "../pipeline/v2/events.mjs";
import { routeAnswers } from "../pipeline/questions.mjs";
import { ContractError } from "../pipeline/v2/contracts.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const readRepo = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const SLUG = "testland";

let intakeDir;
beforeEach(async () => { intakeDir = await mkdtemp(path.join(tmpdir(), "waypoint-integration-")); });
afterEach(async () => { await rm(intakeDir, { recursive: true, force: true }); });

async function completeAllStages(slug, dir) {
  for (const stage of V2_RESEARCH_STAGES) {
    await stageStart(slug, stage, { intakeDir: dir });
    await stageComplete(slug, stage, { intakeDir: dir });
  }
}

/** A complete product-intent run with a passed gate — the state a real landing reaches just
    before landBranch runs. */
async function gatePassedProductRun(dir) {
  await initRunV2(SLUG, { intakeDir: dir, landMode: "auto" });
  await completeAllStages(SLUG, dir);
  await markLandingGate(SLUG, { passed: true, intakeDir: dir });
  return readRunStateV2(SLUG, { intakeDir: dir });
}

// ── durable issue context ────────────────────────────────────────────────────

describe("run.v2.json carries the intake issue durably", () => {
  it("init records the issue; a resume WITHOUT one inherits it", async () => {
    const created = await initRunV2(SLUG, { intakeDir, issue: "84" });
    expect(created.issue).toBe("84");
    const resumed = await initRunV2(SLUG, { intakeDir }); // a retry dispatch passes nothing
    expect(resumed.issue).toBe("84");
    expect(resumed.runId).toBe(created.runId);
  });

  it("a manual run has no issue (null, honest) — and a later /new adoption can heal it", async () => {
    const created = await initRunV2(SLUG, { intakeDir });
    expect(created.issue).toBeNull();
    const healed = await initRunV2(SLUG, { intakeDir, issue: "91" });
    expect(healed.issue).toBe("91");
    expect((await readRunStateV2(SLUG, { intakeDir })).issue).toBe("91"); // durable, not in-memory
  });

  it("rewiring a run to a DIFFERENT issue is refused — an answer must never land on the wrong thread", async () => {
    await initRunV2(SLUG, { intakeDir, issue: "84" });
    await expect(initRunV2(SLUG, { intakeDir, issue: "99" })).rejects.toThrow(/#84/);
  });

  it("a non-numeric issue is refused by the schema itself", async () => {
    await expect(initRunV2(SLUG, { intakeDir, issue: "84; rm -rf /" })).rejects.toThrow(ContractError);
  });

  it("a pre-integration run.v2.json (no issue/landMode/landing fields) still parses — defaults fill in", async () => {
    const created = await initRunV2(SLUG, { intakeDir });
    const file = path.join(intakeDir, SLUG, "run.v2.json");
    const raw = JSON.parse(readFileSync(file, "utf8"));
    delete raw.issue;
    delete raw.landMode;
    delete raw.landing;
    delete raw.previousRuns;
    writeFileSync(file, JSON.stringify(raw, null, 2) + "\n");
    const read = await readRunStateV2(SLUG, { intakeDir });
    expect(read.runId).toBe(created.runId);
    expect(read.issue).toBeNull();
    expect(read.landMode).toBe("pr"); // absent intent is DRAFT intent, never product
    expect(read.landing.outcome).toBe("pending");
  });
});

// ── landing intent: derived, recorded once, immutable ────────────────────────

describe("landing intent is immutable per run — requests cannot mutate it (amended scars)", () => {
  it("defaults to pr — a run created without derived authority is draft-only", async () => {
    expect((await initRunV2(SLUG, { intakeDir })).landMode).toBe("pr");
  });

  it("the derived product dispatch records auto at creation", async () => {
    expect((await initRunV2(SLUG, { intakeDir, landMode: "auto" })).landMode).toBe("auto");
  });

  it("a resume request cannot ESCALATE a draft run to product — the request is not consulted (amended scar)", async () => {
    // Amended from the throw-on-mismatch pin: refusing broke legitimate resumes whose derived
    // value changed with the environment; IGNORING the request removes the entire attack
    // surface — recorded intent is simply immutable, and landing-time authority (land-mode +
    // finalizeMergedLanding) still gates the merge independently.
    await initRunV2(SLUG, { intakeDir });
    const resumed = await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    expect(resumed.landMode).toBe("pr");
    expect((await readRunStateV2(SLUG, { intakeDir })).landMode).toBe("pr"); // durably unchanged
  });

  it("a resume request cannot STRIP a product run to draft either (amended scar)", async () => {
    await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    const resumed = await initRunV2(SLUG, { intakeDir, landMode: "pr" });
    expect(resumed.landMode).toBe("auto");
  });
});

describe("landingMode — the ONE deterministic landing decision", () => {
  it("pr while ANY stage is incomplete, whatever the intent — an unfinished run never merges", async () => {
    const state = await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    expect(landingMode(state)).toBe("pr");
  });

  it("pr for a COMPLETE run whose intent is draft — canaries stay drafts forever", async () => {
    await initRunV2(SLUG, { intakeDir });
    await completeAllStages(SLUG, intakeDir);
    expect(landingMode(await readRunStateV2(SLUG, { intakeDir }))).toBe("pr");
  });

  it("auto ONLY for a complete run with recorded product intent", async () => {
    await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    await completeAllStages(SLUG, intakeDir);
    expect(landingMode(await readRunStateV2(SLUG, { intakeDir }))).toBe("auto");
  });

  it("pr when there is no run at all", () => {
    expect(landingMode(null)).toBe("pr");
  });

  it("the CLI invokes THIS function — no reimplemented twin (wiring scar)", () => {
    const src = readRepo("scripts/pipeline-v2.mjs");
    const landModeCase = src.split('case "land-mode"')[1].split(/\n {4}case "/)[0];
    expect(landModeCase).toContain("landingMode(state)");
    // The decision composes landing-time authority; it never re-derives completeness itself.
    expect(landModeCase).toContain("--product-authority");
    expect(landModeCase).not.toMatch(/nextStageV2\(state\)/);
  });
});

// ── the publication transaction: no state ahead of reality ───────────────────

describe("the landing transaction — published only AFTER a confirmed merge", () => {
  it("phase 1 (gate PASS) leaves publication FALSE and no merged/published event exists", async () => {
    const state = await gatePassedProductRun(intakeDir);
    expect(state.landingGate.status).toBe("passed");
    expect(state.publication.published).toBe(false);
    expect(state.landing.outcome).toBe("pending");
    const events = buildRunEvents({ state });
    const texts = events.decisions.map((d) => d.text).join("\n");
    expect(texts).toContain("Landing evidence gate PASSED");
    expect(texts).not.toMatch(/Published|merged|PR #/);
  });

  it("published:true without a merged landing outcome is SCHEMA-INVALID — the bug class cannot return", async () => {
    await gatePassedProductRun(intakeDir);
    const file = path.join(intakeDir, SLUG, "run.v2.json");
    const raw = JSON.parse(readFileSync(file, "utf8"));
    raw.publication.published = true;
    raw.publication.publishedAt = "2026-08-20T18:00:00.000Z";
    writeFileSync(file, JSON.stringify(raw, null, 2) + "\n");
    await expect(readRunStateV2(SLUG, { intakeDir })).rejects.toThrow(/CONFIRMED merged landing/);
  });

  it("landingGate failed + published is schema-invalid too", async () => {
    await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    await completeAllStages(SLUG, intakeDir);
    const file = path.join(intakeDir, SLUG, "run.v2.json");
    const raw = JSON.parse(readFileSync(file, "utf8"));
    raw.landingGate = { status: "failed", checkedAt: "2026-08-20T18:00:00.000Z", failure: "verify failed" };
    raw.landing = { outcome: "merged", pr: 9, mergedAt: "2026-08-20T18:00:00.000Z", announced: null, finalizedAt: null, detail: null };
    raw.publication.published = true;
    raw.publication.publishedAt = "2026-08-20T18:00:00.000Z";
    raw.status = "failed";
    raw.failure = { class: "gate-failure", detail: "verify failed", at: "2026-08-20T18:00:00.000Z" };
    writeFileSync(file, JSON.stringify(raw, null, 2) + "\n");
    await expect(readRunStateV2(SLUG, { intakeDir })).rejects.toThrow(/passed landing gate|merged landing without a passed gate/);
  });

  it("merge CONFLICT → draft fallback: gate stays PASS, publication stays false, events say exactly that", async () => {
    await gatePassedProductRun(intakeDir);
    const state = await recordLandingOutcome(SLUG, { outcome: "draft", pr: 70, detail: "gate passed but the merge fell back to a draft PR (conflict)", intakeDir });
    expect(state.landingGate.status).toBe("passed");
    expect(state.landing).toMatchObject({ outcome: "draft", pr: 70 });
    expect(state.publication.published).toBe(false);
    const texts = buildRunEvents({ state }).decisions.map((d) => d.text).join("\n");
    expect(texts).toContain("Draft PR #70 opened for human review");
    expect(texts).not.toMatch(/Published/);
  });

  it("PR-creation/merge API failure → landing failed, publication false, surfaced honestly", async () => {
    await gatePassedProductRun(intakeDir);
    const state = await recordLandingOutcome(SLUG, { outcome: "failed", detail: "gh pr merge: HTTP 403", intakeDir });
    expect(state.landing.outcome).toBe("failed");
    expect(state.publication.published).toBe(false);
    const texts = buildRunEvents({ state }).decisions.map((d) => d.text).join("\n");
    expect(texts).toContain("Landing FAILED");
    expect(texts).toContain("nothing merged, nothing published");
  });

  it("a CONFIRMED merge finalizes: published true, PR identity durable, deployedLive still unknown", async () => {
    await gatePassedProductRun(intakeDir);
    const state = await finalizeMergedLanding(SLUG, { pr: 71, announced: true, intakeDir });
    expect(state.landing).toMatchObject({ outcome: "merged", pr: 71, announced: true });
    expect(state.publication.published).toBe(true);
    expect(state.publication.deployedLive).toBeNull(); // merged is NOT live — still distinct facts
    const texts = buildRunEvents({ state }).decisions.map((d) => d.text).join("\n");
    expect(texts).toContain("Published — PR #71 merged");
  });

  it("finalization is IDEMPOTENT — the post-merge retry path re-runs safely", async () => {
    await gatePassedProductRun(intakeDir);
    await finalizeMergedLanding(SLUG, { pr: 71, intakeDir });
    const again = await finalizeMergedLanding(SLUG, { pr: 71, intakeDir });
    expect(again.landing.pr).toBe(71);
    expect(again.publication.published).toBe(true);
  });

  it("finalization REFUSES a draft-intent run — landMode pr cannot be merged-finalized, whoever asks", async () => {
    await initRunV2(SLUG, { intakeDir }); // landMode pr
    await completeAllStages(SLUG, intakeDir);
    await markLandingGate(SLUG, { passed: true, intakeDir });
    await expect(finalizeMergedLanding(SLUG, { pr: 72, intakeDir })).rejects.toThrow(/draft\/test run cannot be finalized/);
  });

  it("finalization REFUSES an unpassed gate and a missing PR identity", async () => {
    await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    await completeAllStages(SLUG, intakeDir);
    await expect(finalizeMergedLanding(SLUG, { pr: 73, intakeDir })).rejects.toThrow(/unpassed gate/);
    await markLandingGate(SLUG, { passed: true, intakeDir });
    await expect(finalizeMergedLanding(SLUG, { pr: 0, intakeDir })).rejects.toThrow(/PR number/);
  });

  it("a failed safety notice is recorded durably (announced:false) and events surface it — merge never un-claimed", async () => {
    await gatePassedProductRun(intakeDir);
    const state = await finalizeMergedLanding(SLUG, { pr: 74, announced: false, intakeDir });
    expect(state.landing.announced).toBe(false);
    expect(state.publication.published).toBe(true); // the merge is real regardless
    const texts = buildRunEvents({ state }).decisions.map((d) => d.text).join("\n");
    expect(texts).toContain("safety notice FAILED to file");
    expect(texts).toContain("Published — PR #74 merged");
  });
});

// ── the land CLI: fail-safe defaults, branch-identity, no escalation ─────────

describe("pipeline.mjs land — authority at the CLI seam", () => {
  const src = readRepo("scripts/pipeline.mjs");
  const landCase = src.split('case "land"')[1].split('case "resolve-change"')[0];

  it("omitted --land resolves to pr — publication never happens by omission (fail-safe scar)", () => {
    expect(landCase).toContain('(get("--land") || "pr") === "auto"');
    expect(landCase).not.toContain('(get("--land") || "auto")');
  });

  it("V2 handling keys on EXACT branch identity, never on file presence — V1 rollback stays clean", () => {
    // A V1 landing whose checkout carries a historical run.v2.json (after a product merge) must
    // not read, mutate, or emit V2 state. The guard is the branch namespace, slug-exact.
    expect(landCase).toContain("branch === `research-v2/${slug}`");
    expect(landCase).toMatch(/isV2Landing/);
  });

  it("--land auto on a draft-intent V2 run is REFUSED — the CLI cannot escalate (scar)", () => {
    expect(landCase).toContain('v2state.landMode !== "auto"');
    expect(landCase).toContain("--land auto refused");
  });

  it("phase order: gate record before the land seam; finalize/record only AFTER the outcome exists", () => {
    // The transaction body moved to landing.mjs's executeLanding (Codex blocker 3); the phase
    // order lives there now, and the CLI delegates rather than re-implementing.
    const landing = readRepo("scripts/pipeline/landing.mjs");
    const gateRecord = landing.indexOf("markLandingGate");
    const landAt = landing.indexOf("result = land({");
    const finalize = landing.indexOf("finalizeMergedLanding");
    const outcomeRecord = landing.indexOf("recordLandingOutcome");
    expect(gateRecord).toBeGreaterThan(0);
    expect(landAt).toBeGreaterThan(gateRecord);
    expect(finalize).toBeGreaterThan(landAt);
    expect(outcomeRecord).toBeGreaterThan(0);
    // The retired premature-publication call is gone by name — from both layers.
    expect(landing).not.toContain("recordProductLanding");
    expect(landCase).not.toContain("recordProductLanding");
    expect(landCase).toContain("executeLanding(slug");
  });

  it("a post-merge finalization failure is loud and names the idempotent retry command", () => {
    const landing = readRepo("scripts/pipeline/landing.mjs");
    expect(landing).toContain("MERGE SUCCEEDED");
    expect(landing).toContain("finalize-landing --slug");
  });
});

describe("landBranch — the outcome contract carries the announce fact", () => {
  it("the parser accepts the announce-annotated merged line and the plain draft line", () => {
    // The seam contract with land-branch.sh: a failed safety notice after a successful merge is
    // REPORTED (announced:false), never swallowed (the old `|| true`) and never a merge failure.
    const src = readRepo("scripts/pipeline/publish.mjs");
    expect(src).toContain("announce=(ok|failed|skipped)");
    expect(src).toMatch(/announced.*=.*m\[1\] === "merged"/);
    const sh = readRepo("scripts/land-branch.sh");
    expect(sh).toContain('echo "merged:$PR_NUM announce=$ANNOUNCE"');
    expect(sh).toContain("safety notice FAILED to file");
    // The notice creation specifically no longer swallows its failure (`gh pr ready || true`
    // remains — an idempotent nicety, not a safety net).
    expect(sh).not.toMatch(/gh issue create[^\n]*\|\| true/);
  });
});

// ── V1 rollback + fresh-run semantics ────────────────────────────────────────

describe("fresh-run semantics — history never becomes a new run's identity", () => {
  it("run A merges → a FRESH branch for the same slug starts run B with A archived", async () => {
    // Run A: complete, gate passed, merged, published — the state main carries after cutover.
    await gatePassedProductRun(intakeDir);
    const runA = await finalizeMergedLanding(SLUG, { pr: 80, intakeDir });
    // Run B: the workflow's branch step created research-v2/testland FRESH from main.
    const runB = await initRunV2(SLUG, { intakeDir, issue: "120", branchFresh: true });
    expect(runB.runId).not.toBe(runA.runId);
    expect(runB.status).toBe("pending");
    expect(runB.attempts.total).toBe(0);
    expect(runB.landing.outcome).toBe("pending");
    expect(runB.publication.published).toBe(false);
    expect(runB.landingGate.status).toBe("pending");
    expect(runB.issue).toBe("120"); // the new run's own context, not A's
    // A remains inspectable history, never destroyed.
    expect(runB.previousRuns).toHaveLength(1);
    expect(runB.previousRuns[0]).toMatchObject({ runId: runA.runId, mergedPr: 80 });
    expect(runB.previousRuns[0].publishedAt).toBeTruthy();
  });

  it("a fresh branch inheriting NON-merged state is an anomaly — refused loudly, never 'resumed'", async () => {
    await initRunV2(SLUG, { intakeDir, landMode: "auto" });
    await completeAllStages(SLUG, intakeDir); // complete but never merged
    await expect(initRunV2(SLUG, { intakeDir, branchFresh: true })).rejects.toThrow(/neither an active run to resume nor merged history/);
  });

  it("an EXISTING branch (branchFresh false) still resumes the active run — resume semantics intact", async () => {
    const created = await initRunV2(SLUG, { intakeDir, issue: "84" });
    const resumed = await initRunV2(SLUG, { intakeDir, branchFresh: false });
    expect(resumed.runId).toBe(created.runId);
  });
});

describe("answers routing — one definition of active, across generations", () => {
  it("routeAnswers sends active research to its run BEFORE consulting publication (Codex blocker 1)", () => {
    expect(routeAnswers({ hasAnswers: true, researchActive: true, researchBranch: "research-v2/x", published: false }).target).toBe("research");
    // A published Run A on main never steals an answer from Run B's live research branch.
    expect(routeAnswers({ hasAnswers: true, researchActive: true, researchBranch: "research-v2/x", published: true }).target).toBe("research");
    // Only when no run owns the answer does publication route it to the change lifecycle.
    expect(routeAnswers({ hasAnswers: true, researchActive: false, researchBranch: null, published: true }).target).toBe("change");
  });

  it("the answers-route matrix lives in THE shared resolver — no private precedence rule, and branch inspection is UNCONDITIONAL", () => {
    // The matrix itself — stale complete V2 never outranks active V1, dual-active refuses — is
    // behaviorally proven in run-generation.test.mjs against resolveActiveGeneration; the REAL
    // seam (real origin, real branches, published main) is proven in
    // pipeline-v2-release-blockers.test.mjs. This pin holds the resolution to questions.mjs's
    // resolveAnswerRouting, consuming that one resolver, with active ownership resolved BEFORE
    // historical publication — never gated on `if (!published)` again.
    const q = readRepo("scripts/pipeline/questions.mjs");
    const fn = q.split("export async function resolveAnswerRouting")[1];
    expect(fn).toContain("const v2 = inspect(");
    expect(fn).toContain("const v1 = inspect(");
    expect(fn).toContain("resolveActiveGeneration({");
    expect(fn).toContain('"v2-complete-draft"');
    // publication is computed AFTER ownership resolution, and no publication guard wraps the
    // branch inspection.
    expect(fn.indexOf("resolveActiveGeneration({")).toBeLessThan(fn.indexOf("let published"));
    expect(fn).not.toContain("if (!published)");
    const src = readRepo("scripts/pipeline.mjs");
    const routeCase = src.split('case "answers-route"')[1].split('case "answers-apply"')[0];
    expect(routeCase).toContain("resolveAnswerRouting(slug");
    expect(routeCase).toContain("refusing to guess which run owns the answer");
  });
});

describe("reopenForAnswers — a late answer genuinely re-enters the work", () => {
  it("a COMPLETE unmerged draft run re-opens at reconcile; landing verdicts reset; history survives", async () => {
    await initRunV2(SLUG, { intakeDir });
    await completeAllStages(SLUG, intakeDir);
    await markLandingGate(SLUG, { passed: true, intakeDir });
    await recordLandingOutcome(SLUG, { outcome: "draft", pr: 67, intakeDir });
    const { reopened, state } = await reopenForAnswers(SLUG, { intakeDir });
    expect(reopened).toBe(true);
    expect(state.resume.nextStage).toBe("reconcile");
    expect(state.stages.reconcile.status).toBe("queued");
    expect(state.stages.critic.status).toBe("queued");
    expect(state.stages.passA.status).toBe("complete"); // expensive work stays done
    expect(state.stages.reconcile.attempts).toBeGreaterThan(0); // cost history visible, not erased
    expect(state.landingGate.status).toBe("pending");
    expect(state.landing.outcome).toBe("pending");
  });

  it("no-ops while work is still owed — the active run absorbs the answer as-is", async () => {
    await initRunV2(SLUG, { intakeDir });
    await stageStart(SLUG, "scaffold", { intakeDir });
    await stageComplete(SLUG, "scaffold", { intakeDir });
    const { reopened } = await reopenForAnswers(SLUG, { intakeDir });
    expect(reopened).toBe(false);
    expect((await readRunStateV2(SLUG, { intakeDir })).resume.nextStage).toBe("passA");
  });

  it("REFUSES a published/merged run — those answers take the change lifecycle", async () => {
    await gatePassedProductRun(intakeDir);
    await finalizeMergedLanding(SLUG, { pr: 81, intakeDir });
    await expect(reopenForAnswers(SLUG, { intakeDir })).rejects.toThrow(/change lifecycle/);
  });

  it("change.yml calls it between answers-apply and the redispatch (wiring pin)", () => {
    const step = readRepo(".github/workflows/change.yml").split("Record answers on the active research run")[1].split("- name:")[0];
    const apply = step.indexOf("answers-apply");
    const reopen = step.indexOf("reopen-answers");
    const redispatch = step.indexOf("gh workflow run research-pass-v2.yml");
    expect(reopen).toBeGreaterThan(apply);
    expect(redispatch).toBeGreaterThan(reopen);
  });
});

// ── the workflows: authority boundaries in the wiring ────────────────────────

describe("new-guide.yml — the /new dispatch", () => {
  const text = readRepo(".github/workflows/new-guide.yml");

  it("the V2 product invocation is a workflow_call threading the intake issue — and NO landing input exists to pass", () => {
    // The trusted entry point (hardening pass): a reusable-workflow call, which runs the V2
    // pipeline under THIS workflow's "issues" event — the provenance deriveLandIntent trusts —
    // and which `gh workflow run` (workflow_dispatch) structurally cannot impersonate.
    const job = text.split(/^ {2}research-v2:$/m)[1];
    expect(job).toContain("uses: ./.github/workflows/research-pass-v2.yml");
    expect(job).toContain("slug: ${{ needs.scaffold.outputs.slug }}");
    expect(job).toContain("issue: ${{ format('{0}', github.event.issue.number) }}");
    expect(job).toContain("secrets: inherit");
    expect(job).not.toMatch(/^\s+land:/m); // authority is derived, never typed (side-door scar)
    expect(job).toContain("if: vars.WAYPOINT_RESEARCH_ENGINE == 'v2'");
    // Per-slug exclusion survives the call: a reusable workflow's own workflow-level
    // concurrency is not applied, so the caller job carries the guide-<slug> group.
    expect(job).toContain("group: guide-${{ needs.scaffold.outputs.slug }}");
    // No `gh workflow run research-pass-v2` remains anywhere in /new — the call is the only V2 path.
    expect(text).not.toContain("gh workflow run research-pass-v2.yml");
  });

  it("the V1 dispatch still threads the issue — V1 behavior preserved as the unconditional default", () => {
    const dispatch = text.split("Auto-start the research pass")[1].split("- name:")[0];
    const v1 = dispatch.split("else")[1];
    expect(v1).toContain("research-pass.yml");
    expect(v1).toContain('-f issue="$ISSUE"');
  });
});

describe("research-pass-v2.yml — landing authority is infrastructure, never input (side-door scars)", () => {
  const text = readRepo(".github/workflows/research-pass-v2.yml");

  it("the workflow_dispatch surface has NO land input — a human cannot type their way to publication", () => {
    const inputs = text.split("workflow_dispatch:")[1].split("permissions:")[0];
    expect(inputs).not.toMatch(/^ {6}land:$/m);
    expect(inputs).toMatch(/^ {6}issue:$/m); // issue continuity input remains
  });

  it("the trusted product checkout is refreshed to the post-scaffold default branch, BEFORE npm ci and branch creation, and NEVER on workflow_dispatch (live scar: malta/#69, run 32454262582)", () => {
    // The setup job's first checkout has no `ref` — it runs at the CALLING workflow's
    // triggering SHA (workflow_call semantics), which predates new-guide.yml's own scaffold
    // commit to the default branch. The first live product canary proved this: `/new` minted
    // landMode=auto correctly, then init refused because the pre-scaffold tree carried neither
    // guides-intake/malta/intake.md nor src/content/guides/malta/_guide.json. GitHub Actions'
    // reusable-workflow checkout snapshot cannot be reproduced by a Node unit test — this pins
    // our own workflow-file CONTRACT: the refresh step exists, is guarded off the manual
    // (workflow_dispatch) path so a developer's chosen ref is never silently replaced, and
    // fetches/checks out the default branch strictly BEFORE dependency install and BEFORE the
    // research branch is created from it.
    const setup = text.split(/^ {2}setup:$/m)[1].split(/^ {2}passA:$/m)[0];
    const checkout = setup.indexOf("uses: actions/checkout@");
    const refresh = setup.indexOf("Refresh the trusted product checkout to the post-scaffold default branch");
    const guard = setup.indexOf('if: github.event_name != \'workflow_dispatch\'', refresh);
    const fetchBase = setup.indexOf('git fetch --no-tags origin "$BASE"');
    const checkoutBase = setup.indexOf('git checkout -B "$BASE" FETCH_HEAD');
    const setupNode = setup.indexOf("uses: actions/setup-node@");
    const npmCi = setup.indexOf("run: npm ci");
    const branchStep = setup.indexOf('pipeline.mjs branch --slug "$SLUG" --prefix research-v2');

    expect(checkout).toBeGreaterThanOrEqual(0);
    expect(refresh).toBeGreaterThan(checkout);
    expect(guard).toBeGreaterThan(refresh);
    expect(guard).toBeLessThan(fetchBase);
    expect(fetchBase).toBeGreaterThan(refresh);
    expect(checkoutBase).toBeGreaterThan(fetchBase);
    expect(setupNode).toBeGreaterThan(checkoutBase);
    expect(npmCi).toBeGreaterThan(setupNode);
    expect(branchStep).toBeGreaterThan(npmCi);

    const refreshStep = setup.slice(refresh - 40, fetchBase + 200);
    expect(refreshStep).toContain("BASE: ${{ github.event.repository.default_branch }}");
    // No typed input can enable this on the untrusted (manual) path — it keys ONLY on the
    // real GitHub event name, the same provenance fact deriveLandIntent trusts.
    expect(refreshStep).not.toMatch(/inputs\./);
  });

  it("init DERIVES intent through land-intent (provenance + ref + selector), and passes the fresh-branch signal", () => {
    const init = text.split("Init or resume the V2 run")[1].split("- name:")[0];
    expect(init).toContain("ON_DEFAULT: ${{ github.ref_name == github.event.repository.default_branch }}");
    expect(init).toContain("ENGINE: ${{ vars.WAYPOINT_RESEARCH_ENGINE }}");
    // Hardening pass: the derivation is the tested deriveLandIntent() behind the land-intent
    // subcommand, keyed on github.event_name — a manual workflow_dispatch can never mint auto,
    // whatever ref/selector it runs under (the old two-fact shell derivation is gone).
    expect(init).toContain("EVENT_NAME: ${{ github.event_name }}");
    expect(init).toMatch(/LAND=\$\(node scripts\/pipeline-v2\.mjs land-intent/);
    expect(init).not.toMatch(/LAND=auto/);
    expect(init).toContain('--branch-fresh "$FRESH"');
    expect(init).toContain('BRANCH_RESUMED: ${{ steps.branch.outputs.resumed }}');
  });

  it("the landing decision re-checks PRODUCT AUTHORITY at landing time — a feature-ref run can never auto-merge", () => {
    const mode = text.split("Determine the landing mode")[1].split("- name:")[0];
    expect(mode).toContain("ON_DEFAULT: ${{ github.ref_name == github.event.repository.default_branch }}");
    expect(mode).toContain('--product-authority "$AUTHORITY"');
  });

  it("void-retry redispatches pass NEITHER issue nor land — the durable record is the carrier", () => {
    const retries = [...text.matchAll(/gh workflow run research-pass-v2\.yml[^;]*?void_retry=true/gs)];
    expect(retries.length).toBeGreaterThanOrEqual(3);
    for (const [block] of retries) {
      expect(block).not.toContain("-f land");
      expect(block).not.toContain("-f issue");
    }
  });

  it("the land job carries issues:write — the auto-published safety notice can actually file (permission scar)", () => {
    // The job-level permissions override used to drop issues:write, and land-branch.sh's old
    // `|| true` hid every resulting failure: the safety net silently did not exist.
    const landJob = text.split(/^ {2}land:$/m)[1].split(/^ {2}questions:$/m)[0];
    const perms = landJob.split("steps:")[0];
    expect(perms).toContain("issues: write");
    expect(perms).toContain("contents: write");
  });

  it("the questions job fetches the run's CURRENT home — branch, or the LATEST default branch after a merge", () => {
    const job = text.split(/^ {2}questions:$/m)[1];
    expect(job).toContain("always()");
    expect(job).toContain("post-merge default branch");
    expect(job).toMatch(/git fetch origin "\$BASE"/);
    expect(job).toContain("git checkout -B \"$BASE\" FETCH_HEAD");
    expect(job).toContain("run.v2.json"); // the durable record, not this dispatch's inputs
    expect(job).toContain("pipeline.mjs questions");
  });
});

describe("change.yml — the answers-to-active-research leg", () => {
  const text = readRepo(".github/workflows/change.yml");

  it("the change job may re-dispatch research — actions:write present (live 403, run 32379790925)", () => {
    const changeJob = text.split(/^ {2}change:$/m)[1];
    const perms = changeJob.split("steps:")[0];
    expect(perms).toContain("actions: write");
    const resolveJob = text.split(/^ {2}resolve:$/m)[1].split(/^ {2}change:$/m)[0];
    expect(resolveJob).not.toContain("actions: write");
  });

  it("both engines' re-dispatch commands live in the answers step, branch-selected", () => {
    const step = text.split("Record answers on the active research run")[1].split("- name:")[0];
    expect(step).toContain("research-pass-v2.yml");
    expect(step).toContain("research-pass.yml");
    expect(step).toContain('research-v2/*');
  });
});
