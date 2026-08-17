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
//     critic, draft-only landing, the same concurrency group as V1 research).

// @protects-file Pass B cannot see Pass A; the critic cannot see the process; a void stage cannot land.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  forbiddenForPassB, forbiddenForCritic, verifyPassBWorkspace, preparePassBWorkspace,
  removePassBWorkspace, collectPassB, prepareCriticInput, restoreCriticInput,
} from "../pipeline/v2/workspace.mjs";
import { ContractError } from "../pipeline/v2/contracts.mjs";
import { validateStageOutput } from "../pipeline-v2.mjs";
import { initRunV2, readRunStateV2 } from "../pipeline/v2/run-state.mjs";
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
  runId: `${SLUG}-passb`,
  candidates: [{ id: "c-hidden-izakaya", name: "Hidden Izakaya", branch: null, priority: "food", status: "shortlisted", shortlisted: true, reason: null, worth: null }],
  evidence: [{
    id: "b-1", candidateId: "c-hidden-izakaya", claim: "Queue-free after 20:30 on weekdays",
    kind: "experiential", origin: "passB",
    source: { url: "https://example.com/local-blog", kind: "firsthand", language: "ja", publishedAt: "2026-06-01", family: null, independent: true },
    verifiedOn: "2026-08-01", firsthand: true,
  }],
  reservations: [], transport: [], disagreements: [],
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
  };

  it("scaffold: named problems when the scaffold is missing; clean when present", async () => {
    expect(await validateStageOutput(SLUG, "scaffold", opts())).not.toEqual([]);
    await scaffold();
    expect(await validateStageOutput(SLUG, "scaffold", opts())).toEqual([]);
  });

  it("passA: no evidence artifact OR no passA-origin records = a void pass", async () => {
    await scaffold();
    expect((await validateStageOutput(SLUG, "passA", opts())).join()).toMatch(/owes the evidence artifact/);
    await writeEvidence(SLUG, passBDoc({ runId: "r1" }), { intakeDir: opts().intakeDir });
    expect((await validateStageOutput(SLUG, "passA", opts())).join()).toMatch(/no Pass-A records/);
  });

  it("reconcile: undispositioned findings and missing coverage are named", async () => {
    await scaffold();
    // merged evidence with a passB record but NO disposition and NO coverage doc
    await writeEvidence(SLUG, passBDoc({ runId: "r1" }), { intakeDir: opts().intakeDir });
    const problems = await validateStageOutput(SLUG, "reconcile", opts());
    expect(problems.join()).toMatch(/no reconciliation disposition/);
    expect(problems.join()).toMatch(/coverage/);
  });

  it("reconcile: clean when dispositions + coverage are complete", async () => {
    await scaffold();
    const doc = passBDoc({ runId: "r1" });
    doc.reconciliation = [{ findingId: "b-1", disposition: "adopt", note: "woven in" }];
    await writeEvidence(SLUG, doc, { intakeDir: opts().intakeDir });
    await writeCoverage(SLUG, {
      slug: SLUG, runId: "r1",
      asks: [{ id: "ask-1", ask: "food", status: "covered", where: ["01-plan.json"], evidenceIds: [], reason: null }],
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

  it("is manual-only (workflow_dispatch), and nothing auto-dispatches it", () => {
    expect(text).toContain("workflow_dispatch:");
    expect(text).not.toMatch(/^\s+issues:\s*$/m);
    expect(text).not.toContain("schedule:");
    // V1 dispatch untouched: new-guide.yml still starts research-pass.yml, not V2.
    const newGuide = readFileSync(path.join(ROOT, ".github", "workflows", "new-guide.yml"), "utf8");
    expect(newGuide).toContain("gh workflow run research-pass.yml");
    expect(newGuide).not.toContain("research-pass-v2.yml");
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
    // the collection checkout happens AFTER the agent step
    const agentIdx = job.indexOf("Run research agent — Pass B");
    const collectIdx = job.indexOf("Checkout the run branch for collection");
    expect(agentIdx).toBeGreaterThan(0);
    expect(collectIdx).toBeGreaterThan(agentIdx);
    expect(job).toContain("collect-passb");
  });

  it("the critic job is depth-1 and prepares/restores the blind input around the agent", () => {
    const job = text.split(/^ {2}critic:/m)[1].split(/^ {2}land:/m)[0];
    expect(job).toContain("fetch-depth: 1");
    const prepare = job.indexOf("prepare-critic");
    const agent = job.indexOf("Run research agent — Critic");
    const restore = job.indexOf("restore-critic");
    expect(prepare).toBeGreaterThan(0);
    expect(agent).toBeGreaterThan(prepare);
    expect(restore).toBeGreaterThan(agent);
  });

  it("every stage job checkpoints start BEFORE its agent and validates AFTER (begin/finish)", () => {
    for (const stage of ["passA", "reconcile"]) {
      const job = text.split(new RegExp(`^  ${stage}:`, "m"))[1].split(/^ {2}[a-zA-Z]+:$/m)[0];
      const begin = job.indexOf("begin-stage");
      const agent = job.indexOf("anthropics/claude-code-action");
      const finish = job.indexOf("finish-stage");
      expect(begin).toBeGreaterThan(0);
      expect(agent).toBeGreaterThan(begin);
      expect(finish).toBeGreaterThan(agent);
    }
  });

  it("lands as a DRAFT PR always — V2 does not publish while being proven", () => {
    const job = text.split(/^ {2}land:/m)[1];
    expect(job).toContain("--land pr");
    expect(job).toContain("--gate"); // the real evidence gate still runs; only the merge is withheld
    expect(job).not.toContain("--announce"); // nothing to announce: nothing publishes
    expect(job).toContain("pipeline-v2.mjs validate"); // fail-closed artifact validation gates landing
  });

  it("the bounded retry is void-gated and re-dispatches with void_retry=true", () => {
    expect(text).toContain("void_retry=true");
    expect(text.match(/outputs\.void == 'true'/g)?.length).toBeGreaterThanOrEqual(3);
    expect(text).toContain("auto-retry");
  });
});
