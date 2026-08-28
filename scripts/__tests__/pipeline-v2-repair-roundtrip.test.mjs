// POST-#105 R-A — THE REPAIR-TO-GREEN ROUND TRIP, ACROSS A REAL WORKFLOW BOUNDARY.
//
// The unit regressions in pipeline-v2-post-105-repair.test.mjs prove the pieces: the gate refuses
// an unresolvable supersession, the evidence owner can declare it, and the same correction then
// passes. They all run inside ONE live temp filesystem, which is exactly what the fifth
// adversarial review said they could not prove — the real pipeline crosses a checkout boundary
// between the failure and the repair, and anything not COMMITTED AND PUSHED at that boundary is
// simply gone when the retry clones the branch again.
//
// So this file drives the real CLI, as a subprocess, in a real git repo with a real remote, and
// destroys the first checkout before asserting. What it pins:
//
//   · critic truth exits 3 and writes the proven critic-correction records into evidence;
//   · the routed transition COMMITS AND PUSHES the retained guide, handoff, ledger and that
//     evidence mutation — a fresh clone has all of it;
//   · the real retry command, invoked exactly as the critic job invokes it (`--stage critic`),
//     resolves to the RECONCILE owner and allows one bounded repair dispatch;
//   · the owner declares the typed relation, and the SAME retained critic output then passes
//     against the SAME pinned pre-critic baseline — no research or guide work regenerated;
//   · the disproven evidence stops satisfying the BINDING ask while the replacement carries it.
//
// @protects-file The routed evidence-owner repair survives the checkout boundary and reaches green.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm, cp, symlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EVIDENCE_SCHEMA, CRITIC_CORRECTIONS_SCHEMA, supersededEvidenceIds } from "../pipeline/v2/contracts.mjs";
import { coverageProblems } from "../pipeline/v2/coverage.mjs";
import { initRunV2, stageStart, stageComplete } from "../pipeline/v2/run-state.mjs";
import {
  TOTTORI_FACTS, TOTTORI_TRANSIT_BEFORE, TOTTORI_TRANSIT_AFTER,
  tottoriBusOriginRecords, tottoriConstraintsAsk,
} from "./fixtures/tottori-scar.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const SLUG = "tottori";
const TRANSIT = "05-transit.json";
const DROPPED = "https://hinomarubus.co.jp/timetable_route/3455/?tab=2";
const CORRECTION = "critic-correction-05-transit-json-0-source-url";
const RETIRED = ["ev-bus-route-exists", "ev-bus-downbound-schedule"];
const SOURCE = {
  url: "https://hinomarubus.co.jp/timetable_route/3450/?tab=2", kind: "operator", access: "fetched",
  language: "ja", publishedAt: null, family: "hinomarubus", independent: true, appliesToYears: [],
};
const FRESHNESS = { perishable: true, shelfLife: "transit", recheckOn: "2026-10-26" };

const before = JSON.parse(TOTTORI_TRANSIT_BEFORE);
const after = JSON.parse(TOTTORI_TRANSIT_AFTER);
const POINTERS = [
  "/0/source_url", "/0/steps/2", "/0/steps/3", "/0/steps/4", "/0/steps/5", "/0/steps/6", "/0/steps/7",
  "/1/center/lat", "/1/center/lng", "/1/span",
];
const at = (doc, pointer) => pointer.split("/").slice(1).reduce((node, key) => node?.[key], doc);
const asText = (v) => typeof v === "string" ? v : JSON.stringify(v);
const corrections = () => POINTERS.map((p) => ({
  target: `${TRANSIT}#${p}`,
  previousValue: at(before, p) === undefined ? null : asText(at(before, p)),
  correctedValue: asText(at(after, p)),
  claim: `Tottori transfer fact at ${p}`, source: SOURCE, verifiedOn: "2026-08-26", freshness: FRESHNESS,
}));

let root, origin, sandbox, runId;
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

/** Run the REAL CLI inside a checkout. Returns { code, out } rather than throwing, because the
    routed class is defined by its exit code. */
function cli(cwd, args, env = {}) {
  const r = spawnSync("node", [path.join(cwd, "scripts", "pipeline-v2.mjs"), ...args],
    { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  return { code: r.status, out: `${r.stdout || ""}${r.stderr || ""}` };
}

/** A checkout that IS a working copy of this repo's control plane, so the CLI's own ROOT is the
    temp repo and every git call it makes touches the fixture, never the real tree. */
async function makeCheckout(name) {
  const dir = path.join(root, name);
  execFileSync("git", ["clone", "-q", origin, dir]);
  git(dir, "config", "user.name", "test");
  git(dir, "config", "user.email", "test@example.com");
  await cp(path.join(REPO, "scripts"), path.join(dir, "scripts"), { recursive: true });
  await cp(path.join(REPO, "src", "lib"), path.join(dir, "src", "lib"), { recursive: true }); // the CLI imports it
  await cp(path.join(REPO, "package.json"), path.join(dir, "package.json"));
  if (!existsSync(path.join(dir, "node_modules"))) await symlink(path.join(REPO, "node_modules"), path.join(dir, "node_modules"));
  return dir;
}

const evidenceAt = async (dir) => JSON.parse(await readFile(path.join(dir, "guides-intake", SLUG, "evidence.v2.json"), "utf8"));
const stateAt = async (dir) => JSON.parse(await readFile(path.join(dir, "guides-intake", SLUG, "run.v2.json"), "utf8"));
/** The five budget/history numbers the routed round trip must keep honest. */
const accounting = (state) => ({
  total: state.attempts.total, autoRetries: state.attempts.autoRetries,
  reconcile: state.stages.reconcile.attempts, critic: state.stages.critic.attempts,
  criticHistory: state.stages.critic.history.map((h) => `${h.attempt}:${h.status}/${h.failureClass ?? "-"}`),
});

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), "waypoint-roundtrip-"));
  origin = path.join(root, "origin.git");
  execFileSync("git", ["init", "-q", "--bare", "-b", "main", origin]);

  // Seed the branch: the pre-critic guide and the reconcile-era evidence, exactly as the run
  // would have left them.
  const seed = path.join(root, "seed");
  execFileSync("git", ["clone", "-q", origin, seed]);
  git(seed, "config", "user.name", "test");
  git(seed, "config", "user.email", "test@example.com");
  await mkdir(path.join(seed, "src", "content", "guides", SLUG), { recursive: true });
  await mkdir(path.join(seed, "guides-intake", SLUG), { recursive: true });
  await writeFile(path.join(seed, "src", "content", "guides", SLUG, "facts.json"), TOTTORI_FACTS);
  await writeFile(path.join(seed, "src", "content", "guides", SLUG, TRANSIT), TOTTORI_TRANSIT_BEFORE);
  await writeFile(path.join(seed, "guides-intake", SLUG, "ledger.md"), "# Ledger\n");
  await writeFile(path.join(seed, "guides-intake", SLUG, "pipeline-patterns.fragment.md"), "");
  git(seed, "add", "-A");
  git(seed, "commit", "-q", "-m", "reconcile");
  const reconcileSha = git(seed, "rev-parse", "HEAD"); // the PRE-CRITIC guide snapshot

  // Durable run state, built with the REAL state API so it is schema-valid by construction:
  // reconcile COMPLETE at that snapshot, critic RUNNING with the snapshot pinned as its baseline.
  const intakeDir = path.join(seed, "guides-intake");
  await initRunV2(SLUG, { intakeDir, inputs: { section: "s", model: "m", effort: "high", criticModel: "c" } });
  for (const stage of ["scaffold", "passA", "passB", "reconcile"]) {
    await stageStart(SLUG, stage, { intakeDir, baseline: reconcileSha });
    await stageComplete(SLUG, stage, { intakeDir, commit: reconcileSha });
  }
  await stageStart(SLUG, "critic", { intakeDir, baseline: reconcileSha });
  runId = JSON.parse(await readFile(path.join(intakeDir, SLUG, "run.v2.json"), "utf8")).runId;

  // The reconcile-era evidence, under the run's own id.
  await writeFile(path.join(seed, "guides-intake", SLUG, "evidence.v2.json"), JSON.stringify({
    schemaVersion: EVIDENCE_SCHEMA, slug: SLUG, runId, candidates: [],
    evidence: tottoriBusOriginRecords(), reconciliation: [],
  }, null, 2) + "\n");

  git(seed, "add", "-A");
  git(seed, "commit", "-q", "-m", "critic started");
  git(seed, "push", "-q", "origin", "main");

  // The critic's sandbox: the corrected guide and a truthful, complete handoff.
  sandbox = path.join(root, "sandbox");
  await mkdir(path.join(sandbox, "src", "content", "guides", SLUG), { recursive: true });
  await mkdir(path.join(sandbox, "guides-intake", SLUG), { recursive: true });
  await writeFile(path.join(sandbox, "src", "content", "guides", SLUG, "facts.json"), TOTTORI_FACTS);
  await writeFile(path.join(sandbox, "src", "content", "guides", SLUG, TRANSIT), TOTTORI_TRANSIT_AFTER);
  await writeFile(path.join(sandbox, "guides-intake", SLUG, "critic-corrections.v2.json"), JSON.stringify({
    schemaVersion: CRITIC_CORRECTIONS_SCHEMA, slug: SLUG, runId, corrections: corrections(),
  }, null, 2) + "\n");
  await writeFile(path.join(sandbox, "guides-intake", SLUG, "ledger.md"), "# Ledger\n\n## Critic findings\nthe paid analysis\n");
}, 120_000);

afterAll(async () => { await rm(root, { recursive: true, force: true }); });

describe("R-A — the routed evidence-owner repair survives a fresh checkout and reaches green", () => {
  it("runs the whole round trip across the workflow boundary", async () => {
    // ── attempt 1: the critic's corrections are proven, and the supersession is unresolvable ──
    const first = await makeCheckout("attempt1");
    const truth = cli(first, ["reconcile-critic-truth", "--slug", SLUG, "--from", sandbox]);
    expect(truth.code).toBe(3);                                   // the ROUTED class, not a plain failure
    expect(truth.out).toMatch(/EVIDENCE OWNER \(reconcile\) resolves this/);
    expect(truth.out).toMatch(/still resting: ev-bus-route-exists, ev-bus-downbound-schedule/);

    // The proven corrections went into evidence BEFORE the refusal — that is what gives the
    // owner real finding ids — but nothing is committed yet.
    expect((await evidenceAt(first)).evidence.filter((r) => r.origin === "critic")).toHaveLength(10);

    // ── the workflow's retention, then the routed transition ──
    await cp(path.join(sandbox, "src", "content", "guides", SLUG), path.join(first, "src", "content", "guides", SLUG), { recursive: true });
    for (const f of ["critic-corrections.v2.json", "ledger.md"]) {
      await cp(path.join(sandbox, "guides-intake", SLUG, f), path.join(first, "guides-intake", SLUG, f));
    }
    await writeFile(path.join(root, "truth-out.txt"), truth.out);
    const routed = cli(first, ["needs-reconcile", "--slug", SLUG, "--file", path.join(root, "truth-out.txt"), "--branch", "main"]);
    expect(routed.code).toBe(0);
    expect(routed.out).toMatch(/routed to reconcile/);

    // ── the job is STILL in failure(), so its generic tail runs. It must not relabel a routed
    //    outcome: the critic is deliberately queued, so the usual "already failed" guard misses it
    //    and a coarse process-plane `unknown` would land on a stage that did not fail. ──
    const beforeTail = await stateAt(first);
    const tail = cli(first, ["record-agent-failure", "--slug", SLUG, "--stage", "critic",
      "--agent-conclusion", "success", "--branch", "main"]);
    expect(tail.code).toBe(0);
    expect(tail.out).toMatch(/ROUTED to the evidence owner/);
    const afterTail = await stateAt(first);
    expect(afterTail.stages.critic.status).toBe("queued");                       // still queued
    expect(afterTail.stages.critic.failure).toBeNull();                          // not relabelled
    expect(afterTail.stages.critic.baseline).toBe(beforeTail.stages.critic.baseline);
    expect(afterTail.stages.critic.history).toEqual(beforeTail.stages.critic.history);
    expect(afterTail.stages.reconcile.failure.class).toBe("gate-failure");        // owner keeps it
    expect(afterTail.failure.class).toBe("gate-failure");                         // run-level intact
    expect(afterTail.resume.nextStage).toBe("reconcile");
    // The workflow's other generic recorder is guarded identically.
    const failStage = cli(first, ["fail-stage", "--slug", SLUG, "--stage", "critic", "--class", "gate-failure", "--detail", "generic"]);
    expect(failStage.code).toBe(0);
    expect((await stateAt(first)).stages.critic.status).toBe("queued");

    // ── destroy the checkout: everything that matters must now be on the remote ──
    await rm(first, { recursive: true, force: true });
    const second = await makeCheckout("attempt2");

    // 1. the retained critic work crossed the boundary…
    expect(await readFile(path.join(second, "src", "content", "guides", SLUG, TRANSIT), "utf8")).toBe(TOTTORI_TRANSIT_AFTER);
    expect(existsSync(path.join(second, "guides-intake", SLUG, "critic-corrections.v2.json"))).toBe(true);
    expect(await readFile(path.join(second, "guides-intake", SLUG, "ledger.md"), "utf8")).toMatch(/the paid analysis/);
    // 2. …and so did the trusted evidence mutation the owner must relate to.
    const carried = await evidenceAt(second);
    expect(carried.evidence.some((r) => r.id === CORRECTION)).toBe(true);
    expect(carried.evidence.filter((r) => r.origin === "critic")).toHaveLength(10);
    // 3. the routed run state names the owner, and keeps the critic's pinned baseline.
    const state = await stateAt(second);
    expect(state.stages.reconcile.status).toBe("failed");
    expect(state.stages.critic.status).toBe("queued");
    expect(state.resume.nextStage).toBe("reconcile");
    expect(state.stages.critic.baseline).toBeTruthy();

    // ── the REAL retry command, invoked exactly as the critic job invokes it ──
    const outFile = path.join(root, "gh-output.txt");
    await writeFile(outFile, "");
    const retry = cli(second, ["auto-retry", "--slug", SLUG, "--stage", "critic"], { GITHUB_OUTPUT: outFile });
    const emitted = await readFile(outFile, "utf8");
    expect(retry.code).toBe(0);
    expect(emitted).toMatch(/allowed=true/);          // the repair dispatch launches…
    expect(emitted).toMatch(/stage=reconcile/);       // …at the owner, not the blind critic
    // One incident, one reservation.
    expect((await stateAt(second)).attempts.autoRetries).toBe(1);

    // ── the owner declares the typed relation (its authority, its artifact) ──
    const evidence = await evidenceAt(second);
    evidence.reconciliation.push({
      findingId: CORRECTION, disposition: "replace",
      note: "the critic re-fetched the operator timetable; these rest on the timetable the item no longer cites",
      corroborates: { kind: "none", evidenceIds: [] },
      supersedes: { kind: "evidence", evidenceIds: RETIRED },
    });
    await writeFile(path.join(second, "guides-intake", SLUG, "evidence.v2.json"), JSON.stringify(evidence, null, 2) + "\n");
    git(second, "add", "-A", "--", `guides-intake/${SLUG}/evidence.v2.json`);
    git(second, "commit", "-q", "-m", "reconcile: declare the supersession");
    // …and the repair dispatch completes the owner's stage, exactly as begin/finish-stage do.
    const repairIntake = path.join(second, "guides-intake");
    await stageStart(SLUG, "reconcile", { intakeDir: repairIntake, baseline: git(second, "rev-parse", "HEAD") });
    await stageComplete(SLUG, "reconcile", { intakeDir: repairIntake, commit: git(second, "rev-parse", "HEAD") });
    // The critic's pinned baseline is NOT disturbed by the owner's re-completion — that is what
    // lets the retained output be revalidated against the tree the critic originally received.
    expect((await stateAt(second)).stages.critic.baseline).toBe(state.stages.critic.baseline);

    // ── the critic job dispatches again — and THE PAID MODEL MUST NOT RUN. ──
    // This is the seam the sixth review caught: routing to reconcile only re-queues the critic,
    // so the ordinary critic job would follow the repair and invoke the model a second time,
    // regenerating the very guide/handoff that was retained and revalidating the repaired
    // relation against a NEW nondeterministic pass instead of the one the owner just judged.
    const criticAttempts = (await stateAt(second)).stages.critic.attempts;
    const beginOut = path.join(root, "critic-begin-output.txt");
    await writeFile(beginOut, "");
    const begin = cli(second, ["begin-stage", "--slug", SLUG, "--stage", "critic", "--branch", "main"],
      { GITHUB_OUTPUT: beginOut });
    expect(begin.code).toBe(0);
    // The decision the workflow gates its whole model-input block on, emitted by the same command
    // the critic job already runs. `replay=true` means: skip prepare/prompt/agent, run the tail.
    expect(await readFile(beginOut, "utf8")).toMatch(/replay=true/);

    const replayState = await stateAt(second);
    // Attempt accounting: a deterministic replay is NOT another model attempt.
    expect(replayState.stages.critic.attempts).toBe(criticAttempts);
    // The original paid attempt is preserved, not closed as a synthetic failed/unknown.
    expect(replayState.stages.critic.history).toHaveLength(1);
    expect(replayState.stages.critic.history[0].failureClass).toBeNull();
    expect(replayState.stages.critic.history[0].status).not.toBe("failed");
    // …against the tree the critic was ORIGINALLY handed, never its own retained edits.
    expect(replayState.stages.critic.baseline).toBe(state.stages.critic.baseline);

    // ── the deterministic tail, over the RETAINED BYTES on the branch (no sandbox, no agent) ──
    const again = cli(second, ["reconcile-critic-truth", "--slug", SLUG, "--from", second]);
    expect(again.code).toBe(0);
    expect(again.out).toMatch(/critic guide truth reconciled/);
    expect(again.out).toMatch(/against pre-critic baseline/);

    // The stage completes on that replay. (finish-stage validates the whole critic artifact set —
    // coverage, geocode — which this evidence-shaped fixture deliberately does not carry, so the
    // completion is driven through the same state API finish-stage calls once validation passes.)
    await stageComplete(SLUG, "critic", { intakeDir: path.join(second, "guides-intake"), commit: git(second, "rev-parse", "HEAD") });
    const done = await stateAt(second);
    expect(done.stages.critic.status).toBe("complete");
    // Still ONE attempt, closed truthfully as complete: the paid pass succeeded, and the
    // dependency failure that interrupted it belonged to reconcile.
    expect(done.stages.critic.history).toHaveLength(1);
    expect(done.stages.critic.history[0].status).toBe("complete");
    expect(done.stages.critic.replay).toBeFalsy();  // the marker is spent

    // ── the whole incident's budget ledger, stated exactly ──
    // ONE paid critic pass, ONE evidence-owner repair, ONE auto-retry reservation, and no
    // manufactured failure anywhere in the critic's history.
    expect(accounting(done)).toEqual({
      // attempts.total is bumped by the dispatch/setup path, which this stage-level fixture
      // deliberately does not drive — asserting a number it never produced would be theatre.
      total: 0,
      autoRetries: 1,      // one reservation for one routed incident
      reconcile: 2,        // the original pass and the repair
      critic: 1,           // the paid pass. The replay is NOT a second one.
      criticHistory: ["1:complete/-"],
    });

    // ── and the evidence is self-consistent: the disproven records no longer carry the ask ──
    const finalEvidence = await evidenceAt(second);
    expect([...supersededEvidenceIds(finalEvidence)].sort()).toEqual([...RETIRED].sort());
    const ask = (ids) => ({ schemaVersion: "wp-coverage/2.0", slug: SLUG, runId, asks: [{ ...tottoriConstraintsAsk(), evidenceIds: ids }] });
    const binding = { evidenceDoc: finalEvidence, bindingAskIds: new Set(["constraints"]) };
    expect(coverageProblems(ask(RETIRED), binding).join("\n")).toMatch(/all cited evidence is disproven or superseded/);
    expect(coverageProblems(ask([CORRECTION]), binding)).toEqual([]);
    // The item really did stop citing the timetable those records rest on.
    expect(before[0].source_url).toBe(DROPPED);
    expect(after[0].source_url).not.toBe(DROPPED);
  }, 180_000);
});
