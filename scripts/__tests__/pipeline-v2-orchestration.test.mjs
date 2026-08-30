// M4 of Pipeline V2 — orchestration and MECHANICAL isolation, tested with zero network.
//
// The claims under test are the ones prose used to make and the Japan run disproved:
//   · the prepared Pass-B input EXCLUDES Pass-A outputs (a real git repo proves it here);
//   · a Pass-B artifact is validated and transferred by the workflow, and one that testifies
//     for other passes (wrong origin, premature reconciliation) is refused;
//   · the critic's forbidden files are deleted from its working tree and restored after;
//   · a stage that produced nothing durable is a recorded VOID failure, not a green step;
//   · routing resumes at the interrupted stage; attempts and auto-retries stay bounded;
//   · the workflow YAML wires all of it (baseline checkout for Pass B, fetch-depth 1 for the
//     critic, durable-intent landing — draft unless the run earned product mode — and the same
//     concurrency group as V1 research).

// @protects-file Pass B cannot see Pass A; the critic cannot see the process; a void stage cannot land.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  forbiddenForPassB, forbiddenForCritic, verifyPassBWorkspace, preparePassBWorkspace,
  removePassBWorkspace, collectPassB, prepareCriticInput, restoreCriticInput,
} from "../pipeline/v2/workspace.mjs";
import { ContractError } from "../pipeline/v2/contracts.mjs";
import { validateStageOutput, stageScopeProblems, allowedStagePaths } from "../pipeline-v2.mjs";
import { initRunV2, readRunStateV2, V2_RESEARCH_STAGES } from "../pipeline/v2/run-state.mjs";
import { writeEvidence } from "../pipeline/v2/evidence.mjs";
import { writeCoverage } from "../pipeline/v2/coverage.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SLUG = "testland";

// ── a real repo fixture: scaffold commit, then Pass-A commit ────────────────

let repo;
const git = (args, cwd = repo) => execFileSync("git", args, { cwd, encoding: "utf8" });

async function writeRepoFile(rel, content) {
  const abs = path.join(repo, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, content);
}

const passBDoc = (extra = {}) => ({
  schemaVersion: "wp-evidence/2.0",
  slug: SLUG,
  runId: `${SLUG}-20260817-abc123`,
  candidates: [{ id: "c-hidden-izakaya", name: "Hidden Izakaya", branch: null, priority: "food", status: "shortlisted", shortlisted: true, reason: null, worth: null }],
  evidence: [{
    id: "b-1", candidateId: "c-hidden-izakaya", claim: "Queue-free after 20:30 on weekdays",
    kind: "experiential", origin: "passB",
    source: { url: "https://example.com/local-blog", kind: "firsthand", access: "fetched", language: "ja", publishedAt: "2026-06-01", family: null, independent: true },
    verifiedOn: "2026-08-01", firsthand: true,
  }],
  reservations: [], transport: [], disagreements: [],
  depth: {
    reservations: { requiredCandidateIds: [], notApplicableReason: "no booking obligation in fixture" },
    transport: { requiredRouteIds: [], notApplicableReason: "no fragile route in fixture" },
  },
  saturation: { stopped: true, trend: "duplicates", unresolvedCouldChange: false, note: "resident sources converged" },
  passB: { nativeLanguage: { used: true, why: "English coverage was listicles", searchClasses: ["tabelog"], yield: "one izakaya" } },
  reconciliation: [],
  ...extra,
});

beforeEach(async () => {
  repo = await mkdtemp(path.join(tmpdir(), "waypoint-iso-"));
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "test"]);
  git(["config", "user.email", "test@example.com"]);
  // The scaffold commit: frozen intake + ledger skeleton + guide backbone. No research.
  await writeRepoFile(`guides-intake/${SLUG}/intake.md`, "# Intake\n\n- **Dates (fixed):** 2026-10-01 – 2026-10-08\n");
  await writeRepoFile(`guides-intake/${SLUG}/ledger.md`, "# Ledger\n\n## Questions for the traveler\n\n(none yet)\n");
  await writeRepoFile(`src/content/guides/${SLUG}/_guide.json`, JSON.stringify({ draft: true, country: "Testland" }));
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "scaffold"]);
});

afterEach(async () => {
  await rm(repo, { recursive: true, force: true });
});

async function commitPassAWork() {
  await writeRepoFile(`src/content/guides/${SLUG}/01-plan.json`, JSON.stringify([{ type: "prose", group: "Plan", body: "<p>Pass A wrote this.</p>" }]));
  await writeRepoFile(`guides-intake/${SLUG}/evidence.v2.json`, JSON.stringify(passBDoc({ evidence: [], runId: "r1", candidates: [] })));
  await writeRepoFile(`guides-intake/${SLUG}/run.v2.json`, "{}"); // presence is what isolation cares about
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "passA"]);
}

describe("mechanical Pass-B isolation (real git)", () => {
  it("the prepared workspace at the scaffold baseline EXCLUDES Pass-A outputs and includes the intake", async () => {
    const baseline = git(["rev-parse", "HEAD"]).trim();
    await commitPassAWork();

    const ws = path.join(repo, "..", `passb-ws-${path.basename(repo)}`);
    preparePassBWorkspace(SLUG, { baseCommit: baseline, destDir: ws, cwd: repo });
    try {
      // Pass A's guide content, evidence and run state are ABSENT — not hidden, absent.
      expect(existsSync(path.join(ws, "src", "content", "guides", SLUG, "01-plan.json"))).toBe(false);
      for (const rel of forbiddenForPassB(SLUG)) {
        expect(existsSync(path.join(ws, rel)), `${rel} must be absent`).toBe(false);
      }
      // What Pass B may receive is present: frozen intake + scaffold-time ledger + backbone.
      expect(existsSync(path.join(ws, "guides-intake", SLUG, "intake.md"))).toBe(true);
      expect(existsSync(path.join(ws, "src", "content", "guides", SLUG, "_guide.json"))).toBe(true);
    } finally {
      removePassBWorkspace(ws, { cwd: repo });
    }
  });

  it("REFUSES a workspace whose baseline is not clean (fail closed, workspace torn down)", async () => {
    await commitPassAWork();
    const dirty = git(["rev-parse", "HEAD"]).trim(); // baseline wrongly recorded AFTER Pass A
    const ws = path.join(repo, "..", `passb-bad-${path.basename(repo)}`);
    expect(() => preparePassBWorkspace(SLUG, { baseCommit: dirty, destDir: ws, cwd: repo }))
      .toThrow(/CONTAINS research artifacts/);
    expect(existsSync(ws)).toBe(false); // torn down, not left half-prepared
  });

  it("refuses to prepare without a recorded baseline — no guessing", () => {
    expect(() => preparePassBWorkspace(SLUG, { baseCommit: null, destDir: "x", cwd: repo }))
      .toThrow(/refusing to guess/);
  });

  it("verifyPassBWorkspace also demands the frozen intake", async () => {
    const empty = await mkdtemp(path.join(tmpdir(), "waypoint-empty-"));
    try {
      expect(() => verifyPassBWorkspace(SLUG, empty)).toThrow(/missing the frozen intake/);
    } finally {
      await rm(empty, { recursive: true, force: true });
    }
  });
});

describe("collectPassB — the workflow transfers, Pass B never commits", () => {
  let from, into;
  beforeEach(async () => {
    from = await mkdtemp(path.join(tmpdir(), "waypoint-from-"));
    into = await mkdtemp(path.join(tmpdir(), "waypoint-into-"));
  });
  afterEach(async () => {
    await rm(from, { recursive: true, force: true });
    await rm(into, { recursive: true, force: true });
  });

  const writeArtifact = async (doc) => {
    const rel = path.join("guides-intake", SLUG, "passB.v2.json");
    await mkdir(path.join(from, path.dirname(rel)), { recursive: true });
    await writeFile(path.join(from, rel), JSON.stringify(doc));
  };

  it("validates and transfers a clean artifact", async () => {
    await writeArtifact(passBDoc());
    const { dest } = await collectPassB(SLUG, { fromDir: from, intoDir: into });
    expect(existsSync(dest)).toBe(true);
    const doc = JSON.parse(await readFile(dest, "utf8"));
    expect(doc.evidence[0].origin).toBe("passB");
  });

  it("a MISSING artifact is a blocking void, not an empty result", async () => {
    await expect(collectPassB(SLUG, { fromDir: from, intoDir: into })).rejects.toThrow(/void Pass B/);
  });

  it("an empty artifact needs a typed no-yield explanation", async () => {
    const empty = passBDoc({ evidence: [], candidates: [], passB: { nativeLanguage: { used: false, why: "local-language search was not relevant", searchClasses: [], yield: null }, noYieldReason: null } });
    await writeArtifact(empty);
    await expect(collectPassB(SLUG, { fromDir: from, intoDir: into })).rejects.toThrow(/no typed passB.noYieldReason/);
    empty.passB.noYieldReason = "All local results duplicated official Pass-A candidates; no defensible novel experiential claim survived.";
    await writeArtifact(empty);
    await expect(collectPassB(SLUG, { fromDir: from, intoDir: into })).resolves.toBeTruthy();
  });

  it("REFUSES an artifact testifying for other passes (foreign origin)", async () => {
    const doc = passBDoc();
    doc.evidence[0].origin = "passA";
    await writeArtifact(doc);
    await expect(collectPassB(SLUG, { fromDir: from, intoDir: into })).rejects.toThrow(/cannot testify/);
  });

  it("REFUSES an artifact that reconciles — that is stage 3's job", async () => {
    const doc = passBDoc({ reconciliation: [{ findingId: "b-1", disposition: "agree", note: "self-approved" }] });
    await writeArtifact(doc);
    await expect(collectPassB(SLUG, { fromDir: from, intoDir: into })).rejects.toThrow(/reconcile stage's job/);
  });

  it("REFUSES malformed JSON fail-closed", async () => {
    const rel = path.join("guides-intake", SLUG, "passB.v2.json");
    await mkdir(path.join(from, path.dirname(rel)), { recursive: true });
    await writeFile(path.join(from, rel), "{broken");
    await expect(collectPassB(SLUG, { fromDir: from, intoDir: into })).rejects.toThrow(ContractError);
  });
});

describe("critic blindness — prepared input, then restore", () => {
  it("deletes every forbidden file present, and restores the tracked ones", async () => {
    await commitPassAWork();
    // an UNtracked artifact too — deleted and correctly NOT restored
    await writeRepoFile(`guides-intake/${SLUG}/coverage.v2.json`, "{}");

    const { deleted } = prepareCriticInput(SLUG, { cwd: repo });
    expect(deleted).toContain(`guides-intake/${SLUG}/evidence.v2.json`);
    expect(deleted).toContain(`guides-intake/${SLUG}/run.v2.json`);
    expect(deleted).toContain(`guides-intake/${SLUG}/coverage.v2.json`);
    for (const rel of deleted) expect(existsSync(path.join(repo, rel))).toBe(false);

    const { restored } = restoreCriticInput(SLUG, { cwd: repo, deleted });
    expect(existsSync(path.join(repo, `guides-intake/${SLUG}/evidence.v2.json`))).toBe(true);
    expect(existsSync(path.join(repo, `guides-intake/${SLUG}/run.v2.json`))).toBe(true);
    // the untracked file was never committed evidence — it stays gone
    expect(existsSync(path.join(repo, `guides-intake/${SLUG}/coverage.v2.json`))).toBe(false);
    expect(restored).not.toContain(`guides-intake/${SLUG}/coverage.v2.json`);
  });

  it("the forbidden set covers V2 artifacts, V1 state and V1 passB", () => {
    const set = forbiddenForCritic(SLUG).join(" ");
    for (const name of ["evidence.v2.json", "run.v2.json", "coverage.v2.json", "passB.v2.json", "state.json", "passB.json", "coverage.json"]) {
      expect(set).toContain(name);
    }
  });
});

describe("validateStageOutput — the void check with teeth", () => {
  let dir;
  const opts = () => ({ intakeDir: path.join(dir, "guides-intake"), guidesDir: path.join(dir, "src", "content", "guides") });
  beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), "waypoint-stage-")); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  const scaffold = async () => {
    await mkdir(path.join(dir, "guides-intake", SLUG), { recursive: true });
    await mkdir(path.join(dir, "src", "content", "guides", SLUG), { recursive: true });
    await writeFile(path.join(dir, "guides-intake", SLUG, "intake.md"), "# intake");
    await writeFile(path.join(dir, "src", "content", "guides", SLUG, "_guide.json"), "{}");
    await writeFile(path.join(dir, "src", "content", "guides", SLUG, "01-plan.json"), JSON.stringify({ sections: [{ title: "Food" }] }));
  };

  it("scaffold: named problems when the scaffold is missing; clean when present", async () => {
    expect(await validateStageOutput(SLUG, "scaffold", opts())).not.toEqual([]);
    await scaffold();
    expect(await validateStageOutput(SLUG, "scaffold", opts())).toEqual([]);
  });

  it("passA: no evidence artifact OR no passA-origin records = a void pass", async () => {
    await scaffold();
    expect((await validateStageOutput(SLUG, "passA", opts())).join()).toMatch(/owes the evidence artifact/);
    await writeEvidence(SLUG, passBDoc(), { intakeDir: opts().intakeDir });
    expect((await validateStageOutput(SLUG, "passA", opts())).join()).toMatch(/no Pass-A records/);
  });

  it("reconcile: undispositioned findings and missing coverage are named", async () => {
    await scaffold();
    // merged evidence with a passB record but NO disposition and NO coverage doc
    await writeEvidence(SLUG, passBDoc(), { intakeDir: opts().intakeDir });
    const problems = await validateStageOutput(SLUG, "reconcile", opts());
    expect(problems.join()).toMatch(/no reconciliation disposition/);
    expect(problems.join()).toMatch(/coverage/);
  });

  it("reconcile: clean when dispositions + coverage are complete", async () => {
    await scaffold();
    const doc = passBDoc();
    doc.reconciliation = [{ findingId: "b-1", disposition: "adopt", note: "woven in" }];
    await writeEvidence(SLUG, doc, { intakeDir: opts().intakeDir });
    await writeCoverage(SLUG, {
      slug: SLUG, runId: doc.runId,
      asks: [{ id: "ask-1", ask: "food", status: "covered", where: ["01-plan.json#food"], evidenceIds: ["b-1"], reason: null }],
    }, { intakeDir: opts().intakeDir });
    expect(await validateStageOutput(SLUG, "reconcile", opts())).toEqual([]);
  });

  it("critic: the ledger must carry the critic artifacts", async () => {
    await scaffold();
    await writeFile(path.join(dir, "guides-intake", SLUG, "ledger.md"), "# nothing");
    const problems = await validateStageOutput(SLUG, "critic", opts());
    expect(problems.join()).toMatch(/Critic findings/);
    await writeFile(
      path.join(dir, "guides-intake", SLUG, "ledger.md"),
      "## Critic findings\n\nNone — guide passes the bar test.\n\n## Citation audit\n\n5 sampled, all support.\n",
    );
    await writeFile(path.join(dir, "guides-intake", SLUG, "pipeline-patterns.fragment.md"), "- Honest blank — no reusable process finding.\n");
    expect(await validateStageOutput(SLUG, "critic", opts())).toEqual([]);
  });
});

describe("routing + bounded attempts survive a resume (state on disk)", () => {
  let dir;
  beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), "waypoint-route-")); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it("a fresh read of the same state file resumes where the last process stopped", async () => {
    await initRunV2(SLUG, { intakeDir: dir });
    const { stageStart, stageComplete } = await import("../pipeline/v2/run-state.mjs");
    await stageStart(SLUG, "scaffold", { intakeDir: dir });
    await stageComplete(SLUG, "scaffold", { intakeDir: dir });
    await stageStart(SLUG, "passA", { intakeDir: dir });
    // simulate the cut-off: a different "process" reads the durable file cold
    const state = await readRunStateV2(SLUG, { intakeDir: dir });
    expect(state.resume.nextStage).toBe("passA"); // the interrupted stage, never the next one
    expect(state.stages.passA.attempts).toBe(1);
  });
});

// ── workflow wiring — the YAML carries the isolation, pinned as text ─────────

describe("research-pass-v2.yml — wiring", () => {
  const text = readFileSync(path.join(ROOT, ".github", "workflows", "research-pass-v2.yml"), "utf8");

  it("is dispatchable + callable as a historical path; new-guide.yml calls only the V3 route", () => {
    expect(text).toContain("workflow_dispatch:");
    expect(text).toContain("workflow_call:");
    expect(text).not.toMatch(/^\s+issues:\s*$/m);
    expect(text).not.toContain("schedule:");
    // V2 remains callable for historical replay and rollback evidence. The trusted product entry
    // routes explicit V3 selections to V3 and keeps V1 as the unset/non-V3 fallback.
    const newGuide = readFileSync(path.join(ROOT, ".github", "workflows", "new-guide.yml"), "utf8");
    expect(newGuide).toContain("gh workflow run research-pass.yml");
    expect(newGuide).toContain("uses: ./.github/workflows/research-pass-v3.yml");
    expect(newGuide).not.toContain("uses: ./.github/workflows/research-pass-v2.yml");
    expect(newGuide).toContain("if: vars.WAYPOINT_RESEARCH_ENGINE == 'v3'");
    expect(newGuide).toContain("ENGINE: ${{ vars.WAYPOINT_RESEARCH_ENGINE }}");
    // …and new-guide.yml is the ONLY caller in the repo (the trust boundary is structural).
    const workflowsDir = path.join(ROOT, ".github", "workflows");
    const callers = readdirSync(workflowsDir)
      .filter((f) => f.endsWith(".yml") && f !== "new-guide.yml")
      .filter((f) => readFileSync(path.join(workflowsDir, f), "utf8").includes("uses: ./.github/workflows/research-pass-v2.yml"));
    expect(callers).toEqual([]);
    // The V2 workflow's own default-branch guard keys on the SAME variable — one switch.
    expect(text).toContain("vars.WAYPOINT_RESEARCH_ENGINE != 'v2'");
  });

  it("V1 research, V2 research AND change share ONE guide-<slug> concurrency group (M6 exclusion)", () => {
    expect(text).toContain("group: guide-${{ inputs.slug }}");
    const v1 = readFileSync(path.join(ROOT, ".github", "workflows", "research-pass.yml"), "utf8");
    expect(v1).toContain("group: guide-${{ inputs.slug }}");
    const change = readFileSync(path.join(ROOT, ".github", "workflows", "change.yml"), "utf8");
    expect(change).toContain("group: guide-${{ needs.resolve.outputs.slug }}");
  });

  it("the passB job's agent world is the BASELINE checkout at depth 1, verified clean", () => {
    const job = text.split(/^ {2}passB:/m)[1].split(/^ {2}reconcile:/m)[0];
    expect(job).toContain("ref: ${{ needs.setup.outputs.baseline }}");
    expect(job).toContain("fetch-depth: 1");
    expect(job).toContain("verify-passb-workspace");
    expect(job).toContain("rm -rf .control"); // the control-plane world is gone before the agent
    expect(job).toContain("rm -rf .git");
    // the collection checkout happens AFTER the agent step
    const agentIdx = job.indexOf("Run research agent — Pass B");
    const collectIdx = job.indexOf("Checkout the run branch for collection");
    expect(agentIdx).toBeGreaterThan(0);
    expect(collectIdx).toBeGreaterThan(agentIdx);
    expect(job).toContain("collect-passb");
  });

  it("agents receive no Bash, no explicit GitHub token, and control-plane output is path-scoped", () => {
    expect(text).not.toContain("--allowedTools Bash");
    expect(text).not.toContain("github_token:");
    expect(text).toContain("--mount type=bind,src=\"$GITHUB_WORKSPACE\",dst=/workspace");
    expect(text).toContain("Read(//workspace/**)");
    expect(text).toContain("Read(//proc/**)");
    expect(text).toContain("@anthropic-ai/claude-code@2.1.233");
    expect(text).toContain("node:22-bookworm-slim@sha256:");
    expect(stageScopeProblems(SLUG, "passA", [`.github/workflows/pwn.yml`]).join()).toMatch(/forbidden path/);
    expect(stageScopeProblems(SLUG, "passA", [`src/content/guides/${SLUG}/01-plan.json`])).toEqual([]);
    expect(stageScopeProblems(SLUG, "passA", [`guides-intake/${SLUG}/intake.md`]).join()).toMatch(/forbidden path/);
  });

  it("the critic job removes forbidden input AND git objects, then collects in a fresh checkout", () => {
    const job = text.split(/^ {2}critic:/m)[1].split(/^ {2}land:/m)[0];
    expect(job).toContain("fetch-depth: 1");
    const prepare = job.indexOf("prepare-critic");
    const agent = job.indexOf("Run research agent — Critic");
    const removeGit = job.indexOf("rm -rf .git");
    const collect = job.indexOf("path: collect");
    expect(prepare).toBeGreaterThan(0);
    expect(agent).toBeGreaterThan(prepare);
    expect(removeGit).toBeGreaterThan(prepare);
    expect(removeGit).toBeLessThan(agent);
    expect(collect).toBeGreaterThan(agent);
    expect(job).not.toContain("restore-critic");
    expect(job).toContain("reconcile-critic-truth");
    // The gate diffs the sandbox against this checkout's PRE-copy guide, so it must stay ahead
    // of the rsync — and its failure path must still retain the critic's prose work first.
    expect(job.indexOf("reconcile-critic-truth")).toBeLessThan(job.indexOf("rsync -a --delete"));
    expect(job.indexOf("retain_critic_output ||")).toBeLessThan(job.indexOf("verify-failed --slug \"$SLUG\" --stage critic"));
  });

  it("every stage job checkpoints start BEFORE its agent and validates AFTER (begin/finish)", () => {
    for (const stage of ["passA", "reconcile"]) {
      const job = text.split(new RegExp(`^  ${stage}:`, "m"))[1].split(/^ {2}[a-zA-Z]+:$/m)[0];
      const begin = job.indexOf("begin-stage");
      const agent = job.indexOf("Run research agent");
      const finish = job.indexOf("finish-stage");
      expect(begin).toBeGreaterThan(0);
      expect(agent).toBeGreaterThan(begin);
      expect(finish).toBeGreaterThan(agent);
    }
  });

  it("reconcile runs the critic's canonical build/schema gate before acceptance (R-C/W1-B)", () => {
    const reconcile = text.split(/^ {2}reconcile:/m)[1].split(/^ {2}geocode:/m)[0];
    const critic = text.split(/^ {2}critic:/m)[1].split(/^ {2}land:/m)[0];
    const build = reconcile.indexOf("npm run build");
    const finish = reconcile.indexOf("finish-stage --slug \"$SLUG\" --stage reconcile");
    expect(build).toBeGreaterThan(reconcile.indexOf("Run research agent — Reconcile"));
    expect(build).toBeLessThan(finish);
    expect(reconcile).toContain('verify-failed --slug "$SLUG" --stage reconcile');
    expect(critic).toContain("npm run build");
    expect(text.indexOf("  critic:")).toBeGreaterThan(text.indexOf("  reconcile:"));
  });

  it("lands by the run's DURABLE intent — deterministic land-mode, never a hardcoded merge (I02)", () => {
    const job = text.split(/^ {2}land:/m)[1].split(/^ {2}[a-zA-Z]+:$/m)[0];
    // The mode is computed by tested code from run.v2.json (product intent + every stage
    // complete), never taken from this dispatch's inputs and never hardcoded to auto.
    expect(job).toContain("pipeline-v2.mjs land-mode");
    expect(job).toContain('--land "$LAND"');
    expect(job).not.toContain("--land auto"); // auto exists only as land-mode's earned verdict
    expect(job).toContain("--gate"); // the real evidence gate still decides
    expect(job).toContain("--announce"); // a product merge files the vetoable auto-published notice
    expect(job).toContain("pipeline-v2.mjs validate"); // fail-closed artifact validation gates landing
    // land-mode runs BEFORE the land step so the decision exists when landing needs it.
    expect(job.indexOf("land-mode")).toBeLessThan(job.indexOf('--land "$LAND"'));
    // A merged product landing already carries its record in the merge commit — the post-record
    // is skipped so it cannot resurrect the deleted branch.
    expect(job).toContain("outputs.outcome != 'merged'");
  });

  // SUPERSEDED by the reliability pass (2026-08-22). The retry used to be gated on the `void`
  // STEP OUTPUT, which meant an ordinary deterministic gate failure — the commonest repairable
  // failure there is — never reached the retry command at all (Portugal, run
  // portugal-20260822-7c041e). Eligibility is now read from the durable run state; the full
  // contract lives in pipeline-v2-reliability.test.mjs.
  it("the bounded retry asks the durable state machine and re-dispatches the same slug", () => {
    expect(text).toContain("void_retry=true"); // the re-dispatch input survives for compatibility
    expect(text).not.toContain("outputs.void == 'true'"); // …but no longer decides anything
    expect(text.match(/auto-retry --slug "\$SLUG" --stage/g)?.length).toBe(4);
  });
});

// ── R-A: paid critic work survives a deterministic critic-truth failure ──────

describe("research-pass-v2.yml — a routed evidence-owner replay does not re-spend the critic (R-A)", () => {
  const text = readFileSync(path.join(ROOT, ".github", "workflows", "research-pass-v2.yml"), "utf8");
  const criticJob = text.split(/^ {2}critic:$/m)[1].split(/^ {2}land:$/m)[0];
  const step = (name) => criticJob.split(new RegExp(`^ {6}- name: ${name}$`, "m"))[1]?.split(/^ {6}- name: /m)[0] ?? "";

  // Routing to reconcile only RE-QUEUES the critic, so without an explicit guard the ordinary
  // critic job follows the repair and invokes the paid model a second time — regenerating the
  // retained guide/handoff and revalidating the owner's relation against a different pass.
  it("gates every model-input step on the replay decision begin-stage emits", () => {
    // The decision is emitted by the command the job already runs, so there is no second source.
    expect(step("Checkpoint stage start")).toMatch(/id: begin/);
    for (const name of [
      "Stage retry feedback \\(validator data, this stage only\\)",
      "Generate the machine-contract capsule",
      "Build the critic's source-domain fetch policy",
      "Prepare the critic's blind input",
      "Compose critic prompt",
      "Replace git history with a local-only sandbox repository",
      "Run research agent — Critic",
    ]) {
      expect(step(name)).toMatch(/if: steps\.begin\.outputs\.replay != 'true'/);
    }
  });

  it("still runs the deterministic tail when the agent step was skipped for a replay", () => {
    // `success() && steps.agent.outcome == 'success'` alone would skip the tail on a replay,
    // stranding the repaired run with nothing to validate.
    expect(step("Collect allowed output, compose, validate, commit, checkpoint"))
      .toMatch(/steps\.begin\.outputs\.replay == 'true'/);
  });
});

describe("research-pass-v2.yml — a critic-truth failure retains the paid critic pass (R-A)", () => {
  const text = readFileSync(path.join(ROOT, ".github", "workflows", "research-pass-v2.yml"), "utf8");

  /** The `Collect allowed output…` step's real shell body, dedented so it can be executed. */
  function finishScript() {
    const step = text.split(/^ {6}- name: Collect allowed output, compose, validate, commit, checkpoint$/m)[1];
    const body = step.split(/^ {8}run: \|$/m)[1].split(/^ {6}- name: /m)[0];
    return body.split("\n").map((line) => line.slice(10)).join("\n");
  }

  /** Run that script against a fake collect tree with node/npm/rsync stubbed out, so the
      ORDERING is exercised rather than described. The stub fails reconcile-critic-truth exactly
      the way a deterministic accounting failure does, and snapshots the tree at the moment
      verify-failed is invoked — which is what the retry actually gets to keep. */
  async function runFinishStep() {
    const root = await mkdtemp(path.join(tmpdir(), "waypoint-critic-retain-"));
    const ws = path.join(root, "ws");
    const collect = path.join(root, "collect");
    const temp = path.join(root, "temp");
    const bin = path.join(root, "bin");
    for (const d of [temp, bin, path.join(ws, "guides-intake", "tottori"), path.join(ws, "src", "content", "guides", "tottori"),
      path.join(collect, "guides-intake", "tottori"), path.join(collect, "src", "content", "guides", "tottori")]) {
      await mkdir(d, { recursive: true });
    }
    // The paid critic pass: rewritten prose in the sandbox, stale copies in the trusted checkout.
    await writeFile(path.join(ws, "guides-intake", "tottori", "ledger.md"), "## Critic findings\nthe paid analysis\n");
    await writeFile(path.join(ws, "guides-intake", "tottori", "pipeline-patterns.fragment.md"), "| 2026-08-26 | tottori | [critic] | lens | pattern | open |\n");
    await writeFile(path.join(ws, "guides-intake", "tottori", "critic-corrections.v2.json"), '{"corrections":[{"target":"05-transit.json#/0/steps/2"}]}\n');
    await writeFile(path.join(ws, "src", "content", "guides", "tottori", "05-transit.json"), '[{"note":"corrected by the critic"}]\n');
    await writeFile(path.join(collect, "guides-intake", "tottori", "ledger.md"), "## Critic findings\n(stale)\n");
    await writeFile(path.join(collect, "guides-intake", "tottori", "pipeline-patterns.fragment.md"), "(stale)\n");

    const stub = (name, body) => writeFile(path.join(bin, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
    await stub("npm", "exit 0");
    // Real copy semantics: the retention has to actually land the critic's guide edits, so the
    // stub copies src→dst (the last two non-flag args) rather than just recording the call.
    await stub("rsync", [
      'echo "rsync $*" >> "$RUNNER_TEMP/calls.txt"',
      'for a in "$@"; do case "$a" in -*) ;; *) src=$dst; dst=$a ;; esac; done',
      'mkdir -p "$dst"; cp -R "$src." "$dst"',
      "exit 0",
    ].join("\n"));
    await stub("node", [
      'echo "node $*" >> "$RUNNER_TEMP/calls.txt"',
      'case "$*" in',
      '  *reconcile-critic-truth*) echo "critic changed 05-transit.json#/0/steps/2 without declaring the edit"; exit 1 ;;',
      // Snapshot exactly what verify-failed would find to retain, at the moment it runs.
      '  *verify-failed*) cp "guides-intake/tottori/ledger.md" "$RUNNER_TEMP/ledger-at-verify-failed.md"; ',
      '     cp "guides-intake/tottori/pipeline-patterns.fragment.md" "$RUNNER_TEMP/fragment-at-verify-failed.md"; ',
      '     cp "src/content/guides/tottori/05-transit.json" "$RUNNER_TEMP/guide-at-verify-failed.json"; ',
      '     cp "guides-intake/tottori/critic-corrections.v2.json" "$RUNNER_TEMP/handoff-at-verify-failed.json"; exit 0 ;;',
      'esac',
      "exit 0",
    ].join("\n"));
    await writeFile(path.join(root, "finish.sh"), finishScript());
    execFileSync("git", ["init", "-q", collect]);

    let status = 0;
    try {
      execFileSync("bash", [path.join(root, "finish.sh")], {
        cwd: collect,
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SLUG: "tottori", BRANCH: "research-v2/tottori", GITHUB_WORKSPACE: ws, RUNNER_TEMP: temp },
      });
    } catch (err) { status = err.status; }
    return { root, collect, temp, status, calls: readFileSync(path.join(temp, "calls.txt"), "utf8") };
  }

  it("retains the WHOLE critic pass BEFORE recording findings, and still fails the stage", async () => {
    const { root, collect, temp, status, calls } = await runFinishStep();
    try {
      // Not a green step, and the successful tail never runs.
      expect(status).toBe(1);
      expect(calls).toContain("reconcile-critic-truth");
      expect(calls).toContain("verify-failed");
      expect(calls).not.toContain("finish-stage");
      expect(calls).not.toContain("compose-guide");

      // Everything the pass produced — guide edits, ledger, process memory — is already in the
      // trusted checkout when verify-failed runs, which is what makes it retainable at all.
      // #107 exited before any copy, so the retry re-spent the whole critic pass.
      expect(readFileSync(path.join(temp, "ledger-at-verify-failed.md"), "utf8")).toContain("the paid analysis");
      expect(readFileSync(path.join(temp, "fragment-at-verify-failed.md"), "utf8")).toContain("[critic]");
      expect(readFileSync(path.join(temp, "guide-at-verify-failed.json"), "utf8")).toContain("corrected");
      // The handoff too — a malformed-handoff failure has to be able to REPAIR it next attempt.
      expect(readFileSync(path.join(temp, "handoff-at-verify-failed.json"), "utf8")).toContain("/0/steps/2");
      expect(readFileSync(path.join(collect, "guides-intake", "tottori", "ledger.md"), "utf8")).toContain("the paid analysis");
      expect(readFileSync(path.join(collect, "src", "content", "guides", "tottori", "05-transit.json"), "utf8")).toContain("corrected");
      // The retention happens BEFORE the findings are recorded, not after.
      expect(calls.indexOf("rsync")).toBeLessThan(calls.indexOf("verify-failed"));
    } finally { await rm(root, { recursive: true, force: true }); }
  });

  it("the retention helper carries the whole critic pass, and only its own allowed paths", () => {
    const helper = text.split("retain_critic_output() {")[1].split("\n          }\n")[0];
    const lines = helper.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("cp ") || l.startsWith("rsync "));
    expect(lines).toHaveLength(4);
    const joined = lines.join("\n");
    for (const p of ["src/content/guides/$SLUG/", "guides-intake/$SLUG/ledger.md",
      "guides-intake/$SLUG/pipeline-patterns.fragment.md", "guides-intake/$SLUG/critic-corrections.v2.json"]) {
      expect(joined).toContain(p);
    }
    // The handoff is what a malformed-handoff failure repairs, so it is retained when present —
    // and optional, because "no handoff at all" is itself one of the failures being retained.
    expect(helper).toMatch(/if \[ -f "\$GITHUB_WORKSPACE\/guides-intake\/\$SLUG\/critic-corrections\.v2\.json" \]/);
    const allowed = allowedStagePaths("tottori", "critic");
    for (const p of ["src/content/guides/tottori", "guides-intake/tottori/ledger.md",
      "guides-intake/tottori/pipeline-patterns.fragment.md", "guides-intake/tottori/critic-corrections.v2.json"]) {
      expect(allowed).toContain(p);
    }
  });

  it("retaining the guide edits cannot let the next attempt pass: the baseline is a REQUIRED commit", () => {
    // This is what makes retention safe. reconcile-critic-truth reads its "before" out of the
    // commit the critic stage started from — `reconcile` is the stage immediately before
    // `critic` — and REFUSES when it cannot, rather than falling back to the retained tree.
    const cli = readFileSync(path.join(ROOT, "scripts", "pipeline-v2.mjs"), "utf8");
    const step = cli.split('case "reconcile-critic-truth"')[1].split("case \"")[0];
    expect(step).toContain("requireCriticBaseline(state, slug)");
    expect(step).not.toMatch(/\?\s*guideDocsAt|:\s*null/); // no silent fallback in the gate's path
    expect(V2_RESEARCH_STAGES.indexOf("reconcile")).toBe(V2_RESEARCH_STAGES.indexOf("critic") - 1);
    // begin-stage only checkpoints run state, so it cannot move the baseline the critic was handed.
    const begin = cli.split('case "begin-stage"')[1].split("case \"")[0];
    expect(begin).toContain(`guides-intake/${"${slug}"}/run.v2.json`);
    expect(begin).not.toContain("src/content/guides");
  });
});
