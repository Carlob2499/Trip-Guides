// PIPELINE V2 — durable run state: the resumable, fail-closed record of one research/change run.
//
// V1's `state.json` records only WHICH stages cleared (a timestamp per stage). V2 records what a
// resume actually needs: per-stage status/attempts/model/effort, failure classification, the
// resume point, bounded auto-retries, and publication vs deployed-live as distinct facts.
//
// File: guides-intake/<slug>/run.v2.json — beside V1's state.json, never replacing it while V1
// exists. Read-modify-write-whole (the V1 writer's rule, kept): unknown top-level keys survive.
//
// FAIL CLOSED: a run.v2.json that exists but does not validate throws ContractError. Only a file
// that does not exist reads as "no V2 run" — that is the one honest absence.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RUN_SCHEMA, TELEMETRY_SCHEMA, runStateSchema, parseOrThrow, assertVersionCompatible, ContractError,
} from "./contracts.mjs";
import { readState as readStateV1, STAGE_ORDER as V1_STAGE_ORDER } from "../../pipeline.mjs";
import { isValidSlug } from "../../lib/slug.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

// V2 research stages. `verified` is not a stage any more — verification is the landing gate's
// job, and publication/deployed-live are separate facts on `publication`. The critic is a real
// stage with its own status instead of an implicit tail on `verified`.
export const V2_RESEARCH_STAGES = ["scaffold", "passA", "passB", "reconcile", "critic"];

// Bounded attempts: same total cap V1 research runs under (preserved deliberately — the prompt
// pins the research attempt cap at five for initial V2 compatibility), one automatic redispatch.
export const V2_ATTEMPT_CAP = 5;
export const V2_AUTO_RETRY_CAP = 1;
// A human answer re-opening a completed run grants this many further dispatches for the
// reopened tail (reconcile → critic → landing). The AUTONOMOUS cap stays what it was — the
// grant exists only on the human-triggered reopen path, so a run still cannot loop on its own;
// a late answer arriving at the cap must not be dead on arrival (hardening pass, 2026-08-20).
export const V2_REOPEN_ATTEMPT_GRANT = 2;

export function runStatePath(slug, intakeDir = INTAKE_DIR) {
  if (!isValidSlug(slug)) throw new ContractError(`invalid run-state slug "${slug}"`);
  const root = path.resolve(intakeDir);
  const file = path.resolve(root, slug, "run.v2.json");
  if (!file.startsWith(root + path.sep)) throw new ContractError(`run-state path escapes ${root}`);
  return file;
}

export function newRunId(slug, { now = new Date() } = {}) {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `${slug}-${stamp}-${randomBytes(3).toString("hex")}`;
}

/** Fail-closed read. Returns null ONLY when the file does not exist. */
export async function readRunStateV2(slug, { intakeDir = INTAKE_DIR } = {}) {
  const file = runStatePath(slug, intakeDir);
  if (!existsSync(file)) return null;
  let raw;
  try {
    raw = JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    throw new ContractError(
      `run state at ${file} is not valid JSON (${err.message}) — refusing to treat it as "no run". ` +
        `Restore it from git (git checkout -- ${path.relative(ROOT, file)}) or fix it by hand before resuming.`,
      { file },
    );
  }
  assertVersionCompatible(raw.schemaVersion, RUN_SCHEMA, { file });
  const state = parseOrThrow(runStateSchema, raw, { file, what: "V2 run state" });
  if (state.slug !== slug) {
    throw new ContractError(`V2 run state at ${file} belongs to "${state.slug}", not requested slug "${slug}"`, { file });
  }
  if (JSON.stringify(state.stageOrder) !== JSON.stringify(V2_RESEARCH_STAGES) ||
      Object.keys(state.stages).sort().join("|") !== [...V2_RESEARCH_STAGES].sort().join("|")) {
    throw new ContractError(`V2 research run ${state.runId} has a non-canonical stage order/key set`, { file });
  }
  if (state.resume.nextStage !== nextStageV2(state)) {
    throw new ContractError(`V2 run ${state.runId} resume.nextStage disagrees with its stage statuses`, { file });
  }
  return state;
}

async function save(state, intakeDir = INTAKE_DIR) {
  state.updatedAt = state.updatedAt || new Date().toISOString();
  const file = runStatePath(state.slug, intakeDir);
  const validated = parseOrThrow(runStateSchema, state, { file, what: "V2 run state (on write)" });
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(validated, null, 2) + "\n");
  return validated;
}

function touch(state, now) {
  state.updatedAt = now;
  return state;
}

/** First stage (in order) that is not complete — the resume point. */
export function nextStageV2(state) {
  return state.stageOrder.find((s) => state.stages[s]?.status !== "complete") || null;
}

function resumeAction(state) {
  const next = nextStageV2(state);
  if (!next) return "all stages complete — land via the workflow's evidence gate";
  const st = state.stages[next];
  if (st?.status === "failed") return `re-run stage "${next}" (failed: ${st.failure?.class || "unknown"}) — a resumed run repeats the interrupted stage, never skips ahead`;
  return `run stage "${next}"`;
}

function recomputeResume(state) {
  state.resume = { nextStage: nextStageV2(state), action: resumeAction(state) };
  return state;
}

// ── per-attempt history (wp-run/2.1) ─────────────────────────────────────────
// Every attempt keeps its own start/end/status record so a retried stage's real cost stays
// visible — the last attempt's timestamps no longer silently overwrite the first's.

function openAttempt(st, now) {
  st.history = st.history || [];
  // An attempt still "running" when a new one starts was interrupted without a recorded
  // failure (runner death, aborted step). Close it honestly rather than leaving it open forever.
  for (const h of st.history) {
    if (h.status === "running") {
      h.status = "failed";
      h.failureClass = "unknown";
      h.endedAt = now;
      const ms = Date.parse(now) - Date.parse(h.startedAt);
      h.durationSec = Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 1000) : null;
    }
  }
  st.history.push({ attempt: st.attempts, startedAt: now, endedAt: null, status: "running", failureClass: null, durationSec: null });
}

function closeAttempt(st, now, status, failureClass = null) {
  st.history = st.history || [];
  let open = [...st.history].reverse().find((h) => h.status === "running");
  if (!open) {
    // A control-plane failure before begin-stage still deserves an honest record.
    open = { attempt: Math.max(1, st.attempts), startedAt: st.startedAt || now, endedAt: null, status: "running", failureClass: null, durationSec: null };
    st.history.push(open);
  }
  open.endedAt = now;
  open.status = status;
  open.failureClass = failureClass;
  const ms = Date.parse(now) - Date.parse(open.startedAt);
  open.durationSec = Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 1000) : null;
}

/** What the attempts actually cost: successful / failed / cumulative seconds (null = unknown). */
export function stageAttemptStats(st) {
  const history = st?.history || [];
  const sum = (rows) => {
    const known = rows.filter((h) => h.durationSec !== null);
    return known.length ? known.reduce((total, h) => total + h.durationSec, 0) : null;
  };
  return {
    successfulSec: sum(history.filter((h) => h.status === "complete")),
    failedSec: sum(history.filter((h) => h.status === "failed")),
    cumulativeSec: sum(history.filter((h) => h.status !== "running")),
  };
}

/** The canonical fresh-run shape (one writer — init and fresh-run archival both use it). */
function freshRunState(slug, { engine, lifecycle, stages, cap, autoRetryCap, now, inputs, issue, landMode }) {
  return {
    schemaVersion: RUN_SCHEMA,
    engine,
    slug,
    runId: newRunId(slug, { now: new Date(now) }),
    lifecycle,
    inputs,
    issue: issue || null,
    landMode: landMode || "pr",
    status: "pending",
    createdAt: now,
    updatedAt: now,
    stageOrder: [...stages],
    stages: Object.fromEntries(stages.map((s) => [s, {
      status: "queued", startedAt: null, endedAt: null, attempts: 0, model: null, effort: null, commit: null, failure: null,
    }])),
    attempts: { total: 0, cap, autoRetries: 0, autoRetryCap },
    resume: { nextStage: stages[0], action: `run stage "${stages[0]}"` },
    failure: null,
    publication: { published: false, publishedAt: null, deployedLive: null, deployedAt: null },
    landing: { outcome: "pending", pr: null, mergedAt: null, announced: null, finalizedAt: null, detail: null },
    previousRuns: [],
    landingGate: { status: "pending", checkedAt: null, failure: null },
    telemetry: null,
  };
}

/** Create a fresh V2 run. Refuses to clobber an existing one unless force. `branchFresh` is the
    fresh-run signal from the workflow's branch step: the research-v2 branch did NOT exist and
    was just created from the default branch, so any state found on disk is inherited history. */
export async function initRunV2(slug, {
  engine = "v2",
  lifecycle = "research",
  stages = V2_RESEARCH_STAGES,
  cap = V2_ATTEMPT_CAP,
  autoRetryCap = V2_AUTO_RETRY_CAP,
  now = new Date().toISOString(),
  intakeDir = INTAKE_DIR,
  force = false,
  inputs = { section: "", model: "claude-sonnet-5", effort: "high", criticModel: "claude-opus-5" },
  issue = null,
  landMode = null,
  branchFresh = false,
} = {}) {
  const existing = await readRunStateV2(slug, { intakeDir });
  if (existing && !force && branchFresh) {
    // FRESH-RUN SEMANTICS (correction pass): the research-v2 branch was JUST created from the
    // default branch, so `existing` is HISTORY that rode a prior merge — it is not this
    // dispatch's run, and silently "resuming" a terminal run would land the old content again.
    // A merged, published prior run starts a NEW run with the old one archived (append-only,
    // never destroyed). Anything else reaching a fresh branch is an anomaly: refuse loudly.
    if (existing.publication?.published && existing.landing?.outcome === "merged") {
      const archived = [...(existing.previousRuns || []), {
        runId: existing.runId,
        status: existing.status,
        endedAt: existing.updatedAt || null,
        publishedAt: existing.publication.publishedAt || null,
        mergedPr: existing.landing?.pr ?? null,
      }];
      const state = freshRunState(slug, { engine, lifecycle, stages, cap, autoRetryCap, now, inputs, issue, landMode });
      state.previousRuns = archived;
      return save(state, intakeDir);
    }
    throw new ContractError(
      `a fresh research-v2 branch inherited run ${existing.runId} (status "${existing.status}", ` +
        `landing "${existing.landing?.outcome || "pending"}") from the default branch — that is neither an ` +
        `active run to resume nor merged history to archive. Investigate how it reached the default branch ` +
        `before dispatching again.`,
    );
  }
  if (existing && !force) {
    // Complete and stuck records are deliberately durable too. A redispatch may re-run landing
    // or surface the stuck state, but it must not silently mint a new run whose "baseline"
    // already contains the prior run's evidence.
    if (existing.engine !== engine) {
      throw new ContractError(
        `run ${existing.runId} belongs to engine "${existing.engine}" — refusing to resume it through engine "${engine}"`,
      );
    }
    if (JSON.stringify(existing.inputs) !== JSON.stringify(inputs)) {
      throw new ContractError(
        `resume inputs differ from durable run ${existing.runId}; redispatch with section/model/effort/criticModel recorded in run.v2.json`,
      );
    }
    // Run context is durable and immutable. issue: a redispatch that omits it inherits; naming a
    // DIFFERENT one is cross-wiring, refused; healing a null with a real one is the one write.
    if (issue && existing.issue && issue !== existing.issue) {
      throw new ContractError(`run ${existing.runId} reports to issue #${existing.issue} — refusing to rewire it to #${issue}`);
    }
    // landMode: recorded at creation and IMMUTABLE — a resume request can neither escalate a
    // draft run to product nor strip a product run to draft. The request is simply not consulted
    // on resume (logged when it differs, so drift is visible); landing-time authority is
    // separately enforced by the landing decision (product authority) and by the landing
    // transaction itself, so even a recorded "auto" cannot merge without both.
    if (landMode && landMode !== (existing.landMode || "pr")) {
      console.error(`[run-state] resume requested landMode "${landMode}" but run ${existing.runId} records "${existing.landMode || "pr"}" — recorded intent is immutable; request ignored.`);
    }
    if (issue && !existing.issue) {
      existing.issue = issue;
      return save(touch(existing, now), intakeDir);
    }
    return existing;
  }
  return save(freshRunState(slug, { engine, lifecycle, stages, cap, autoRetryCap, now, inputs, issue, landMode }), intakeDir);
}

function requireRun(state, slug) {
  if (!state) {
    throw new ContractError(
      `no V2 run state for "${slug}" — init one first (initRunV2 / the V2 workflow's init step).`,
    );
  }
  return state;
}

function requireStage(state, stage) {
  if (!state.stageOrder.includes(stage)) {
    throw new ContractError(`unknown stage "${stage}" — this run's stages are: ${state.stageOrder.join(" → ")}`);
  }
  return state.stages[stage];
}

/** Checkpoint stage START — before the agent is invoked, so a crash mid-stage is attributable. */
export async function stageStart(slug, stage, { model = null, effort = null, baseline = null, now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  const st = requireStage(state, stage);
  const next = nextStageV2(state);
  if (stage !== next) {
    throw new ContractError(`cannot start stage "${stage}" — the durable next stage is "${next || "none"}"`);
  }
  if (state.status === "stuck") {
    throw new ContractError(`cannot start stage "${stage}" — run ${state.runId} is stuck at its attempt cap`);
  }
  st.status = "running";
  st.startedAt = now;
  st.endedAt = null;
  st.failure = null;
  // A starting stage has no completion snapshot: leaving the old one let a re-opened stage that
  // legitimately completes as a NO-OP keep a stale SHA and present it downstream as fresh.
  st.commit = null;
  if (baseline && !st.baseline) st.baseline = baseline; // pinned once: the tree it first received
  // A REPLAY revalidates retained work deterministically — no model runs, so it is not another
  // attempt. Its original attempt is deliberately left open for stageComplete to close honestly:
  // opening a new one here would both inflate the budget and let openAttempt's stale-attempt
  // sweep brand the paid pass `failed/unknown` for a dependency failure that was reconcile's.
  if (!st.replay) {
    st.attempts += 1;
    openAttempt(st, now);
  }
  if (model) st.model = model;
  if (effort) st.effort = effort;
  state.status = "running";
  state.failure = null;
  recomputeResume(state);
  // While a stage is mid-flight the resume point is THAT stage: a resumed run repeats the
  // interrupted stage, it never skips ahead on uncommitted work.
  state.resume = { nextStage: stage, action: `stage "${stage}" was running — validate its output; re-run it if incomplete` };
  return save(touch(state, now), intakeDir);
}

/** Checkpoint stage COMPLETE — after the workflow validated and committed the stage's output. */
export async function stageComplete(slug, stage, { commit = null, now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  const st = requireStage(state, stage);
  if (st.status !== "running") {
    throw new ContractError(`cannot complete stage "${stage}" from status "${st.status}" — checkpoint its start first`);
  }
  st.status = "complete";
  st.endedAt = now;
  st.failure = null;
  st.replay = false; // spent
  closeAttempt(st, now, "complete");
  // Unconditional: a stage that produced no new file commit still HANDS ON a tree, and the
  // caller passes that HEAD. Writing only truthy commits kept the previous run's SHA.
  st.commit = commit;
  recomputeResume(state);
  state.status = nextStageV2(state) ? "running" : "complete";
  return save(touch(state, now), intakeDir);
}

/** Checkpoint stage FAILURE with a classification. The stage stays the resume point. */
export async function stageFail(slug, stage, { failureClass = "unknown", detail = "", now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  const st = requireStage(state, stage);
  if (st.status === "failed") return state;
  // Setup/control-plane failures can occur before the durable begin checkpoint. Preserve them
  // honestly instead of producing a failed stage that violates its own timestamp contract.
  if (!st.startedAt) st.startedAt = now;
  st.status = "failed";
  st.endedAt = now;
  st.failure = { class: failureClass, detail, at: now };
  st.replay = false; // a failed replay is the stage's own again: the next retry runs the model
  closeAttempt(st, now, "failed", failureClass);
  // A usage-limit is an availability interruption, not a quality attempt. Refund the dispatch
  // charge exactly once; retry policy still stops visibly until a deliberate later redispatch.
  if (failureClass === "usage-limit" && state.attempts.total > 0) state.attempts.total -= 1;
  state.status = "failed";
  state.failure = { class: failureClass, detail, at: now };
  recomputeResume(state);
  return save(touch(state, now), intakeDir);
}

/** Bump the run-level attempt counter (once per dispatch, before agents). Returns the state; the
    caller checks `overCap`. */
export async function bumpRunAttempt(slug, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  if (state.status === "complete") {
    return { state, overCap: false, attempts: state.attempts.total, cap: state.attempts.cap };
  }
  if (state.status === "stuck") {
    return { state, overCap: true, attempts: state.attempts.total, cap: state.attempts.cap };
  }
  // The attempt budget bounds AGENT research spend. A dispatch with every research stage
  // already complete only re-runs the deterministic landing gate — free of agent cost, so it
  // consumes no attempt (canary scar: two landing-only re-dispatches tripped the cap).
  if (!nextStageV2(state)) {
    return { state, overCap: false, attempts: state.attempts.total, cap: state.attempts.cap };
  }
  state.attempts.total += 1;
  const overCap = state.attempts.total > state.attempts.cap;
  if (overCap) state.status = "stuck";
  await save(touch(state, now), intakeDir);
  return { state, overCap, attempts: state.attempts.total, cap: state.attempts.cap };
}

/** Reserve the run's ONE bounded automatic repair for a policy-approved REPAIRABLE failure.
    Bounded: past the cap the caller must NOT redispatch.

    This function only spends the budget — it does not decide who may. Eligibility lives in
    `recovery.mjs` (`retryEligibility`) and today permits ONLY `gate-failure` and `void-run`,
    and only with actionable validator feedback for the same runId/stage. In particular
    `usage-limit` is deliberately NEVER auto-retryable (PR #75): an interrupted process proves
    nothing about the artifact, and re-dispatching into a closed usage window burns the repair a
    later real failure is owed. It stops visibly instead. */
export async function recordAutoRetry(slug, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  state.attempts.autoRetries += 1;
  const allowed = state.status !== "stuck" &&
    state.attempts.total < state.attempts.cap &&
    state.attempts.autoRetries <= state.attempts.autoRetryCap;
  await save(touch(state, now), intakeDir);
  return { state, allowed, autoRetries: state.attempts.autoRetries, cap: state.attempts.autoRetryCap };
}

/** Publication and deployed-live are distinct facts, marked separately. */
export async function markPublished(slug, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  state.publication.published = true;
  state.publication.publishedAt = now;
  return save(touch(state, now), intakeDir);
}

/** The deterministic landing decision (I02): "auto" ONLY when the run records product intent
    (landMode "auto", set at init by the accepted /new dispatch) AND every stage is complete.
    Everything else — controlled/draft runs, incomplete runs, no run at all — is "pr". */
export function landingMode(state) {
  return state?.landMode === "auto" && !nextStageV2(state) ? "auto" : "pr";
}

/** LANDING INTENT AT INIT (hardening pass, 2026-08-20): only the trusted /new product flow may
    mint an auto-authorized run. new-guide.yml invokes research-pass-v2.yml through workflow_call,
    so the trusted invocation runs under the CALLER's event ("issues") — while every manual /
    developer invocation is a `workflow_dispatch`. Being on the default branch with the selector
    set is necessary but NOT sufficient: a maintainer typing `gh workflow run` on main with the
    selector live still gets a draft-PR run. Missing/blank provenance fails safe to "pr". */
export function deriveLandIntent({ eventName = "", onDefault = false, engine = "" } = {}) {
  const trustedProvenance = Boolean(eventName) && eventName !== "workflow_dispatch";
  return trustedProvenance && onDefault === true && ["v2", "v3"].includes(engine) ? "auto" : "pr";
}

// ── the landing transaction (correction pass, 2026-08-20) ────────────────────
// Gate PASS and merge success are SEPARATE facts, recorded in two phases. Phase 1 (pre-merge,
// rides the branch): markLandingGate — the gate verdict is a real pre-merge fact. Phase 2 (only
// after gh CONFIRMS an outcome): recordLandingOutcome for draft/failed, finalizeMergedLanding
// for merged. publication.published is written by finalizeMergedLanding ALONE, and the schema
// refuses it without a confirmed merged outcome — no state or event can get ahead of reality.
// The retired recordProductLanding() wrote published before landBranch ran; its replacement
// tests pin that this can never come back.

/** Phase-2 record for a NON-merged outcome: the draft-PR fallback (gate fail, or gate pass with
    a merge conflict) and the hard-failure case. Never touches publication. */
export async function recordLandingOutcome(slug, { outcome, pr = null, detail = null, now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  if (!["draft", "failed"].includes(outcome)) {
    throw new ContractError(`recordLandingOutcome records draft or failed — a merge is finalizeMergedLanding's job, and "${outcome}" is not an outcome`);
  }
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  state.landing = { ...state.landing, outcome, pr: pr ?? state.landing?.pr ?? null, detail: detail ?? null };
  return save(touch(state, now), intakeDir);
}

/** Phase-2 finalization for a CONFIRMED merge. Fail-closed on every authority fact it can check
    itself: durable product intent (landMode "auto"), a passed gate, every stage complete (the
    schema's complete-run rule), and a real PR number from the confirmed merge. Idempotent — a
    post-merge finalization that failed to commit can be retried without rewriting history.
    `announced` records whether the auto-publish safety notice was filed (false = the merge
    succeeded and the notice did NOT — a durable follow-up fact, never a rollback reason). */
export async function finalizeMergedLanding(slug, { pr, mergedAt = new Date().toISOString(), announced = null, now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  if (!Number.isInteger(pr) || pr < 1) throw new ContractError("finalizeMergedLanding requires the merged PR number — a merge without identity is not confirmed");
  if (state.landMode !== "auto") {
    throw new ContractError(`run ${state.runId} has landing intent "${state.landMode}" — a draft/test run cannot be finalized as a product merge, whoever asks`);
  }
  if (state.landingGate?.status !== "passed") {
    throw new ContractError(`run ${state.runId} landing gate is "${state.landingGate?.status}" — a merge cannot be finalized past an unpassed gate`);
  }
  // Run/landing identity must agree: a retry naming a DIFFERENT PR than the one this run's
  // landing recorded is finalizing someone else's merge — refused, never reconciled by guessing.
  if (state.landing?.pr && state.landing.pr !== pr) {
    throw new ContractError(`run ${state.runId} landing records PR #${state.landing.pr} — refusing to finalize it against PR #${pr}`);
  }
  if (state.landing?.outcome === "merged" && state.publication?.published) return state; // idempotent retry
  // Announcement truth survives recovery: a retry that omits --announced must not downgrade a
  // recorded announced=true/false to unknown. Only an explicit value overwrites.
  const announcedFact = announced ?? state.landing?.announced ?? null;
  state.landing = { outcome: "merged", pr, mergedAt, announced: announcedFact, finalizedAt: now, detail: null };
  state.publication.published = true;
  state.publication.publishedAt = state.publication.publishedAt || mergedAt;
  // deployedLive stays exactly as it was (normally null): merged is NOT live.
  return save(touch(state, now), intakeDir);
}

/** True while the critic is QUEUED FOR A DETERMINISTIC REPLAY of its retained pass.

    One fact, three readers, and they all see the critic before it starts: begin-stage decides
    not to invoke the model, and the job's generic failure tail (record-agent-failure, fail-stage)
    stands down because the critic did not fail — it is deliberately queued, so the usual
    "already failed, do not overwrite" guard does not catch it and a coarse process-plane
    `unknown` would land on a stage that is mid-repair. Once the replay is running, a genuine
    failure is the stage's own again and records normally. */
export function isCriticReplay(state) {
  const critic = state?.stages?.critic;
  return Boolean(critic?.replay && critic.status === "queued");
}

/** ROUTE a critic-truth failure the critic has no authority to fix to the stage that does.

    The blind critic never reads evidence.v2.json, so "declare the supersession relation" is an
    instruction it cannot follow, and auto-retrying it would spend the run's one quality retry on
    a stage that must fail again. Reconcile OWNS evidence, so the failure is recorded against
    reconcile — honestly: reconcile's artifact is what is incomplete — while the critic returns to
    `queued` with its retained work and pinned baseline, so the repaired run revalidates the SAME
    output against the ORIGINAL tree. History stays: routing is visible cost, not erased cost. */
export async function routeToEvidenceOwner(slug, { detail = "", now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  const reconcile = requireStage(state, "reconcile");
  const critic = requireStage(state, "critic");
  if (reconcile.status !== "complete") {
    throw new ContractError(`cannot route critic truth to reconcile: reconcile is "${reconcile.status}", not complete`);
  }
  reconcile.status = "failed";
  reconcile.endedAt = now;
  reconcile.commit = null; // its completion no longer describes an accepted artifact
  reconcile.failure = { class: "gate-failure", detail, at: now };
  critic.status = "queued";
  // The retained pass is REVALIDATED, not re-run: routing only re-queues the critic, so without
  // this the ordinary critic job would follow the owner's repair and spend the paid model again,
  // regenerating the very guide/handoff being retained and judging the owner's relation against
  // a different, nondeterministic pass. Its history stays open and unscarred (see stageStart).
  critic.replay = true;
  critic.startedAt = null;
  critic.endedAt = null;
  critic.failure = null;
  critic.commit = null;
  // critic.baseline is deliberately KEPT — the repaired attempt owes a diff against the tree the
  // critic was originally handed, not against its own retained edits now sitting in the branch.
  state.status = "failed";
  state.failure = { class: "gate-failure", detail, at: now };
  // This route is autonomous control-plane bookkeeping, not new spending authority. It may
  // reassign the failed artifact to its real owner, but it MUST NOT mint attempt headroom. If the
  // run is already at its quality-attempt cap, retryEligibility() leaves the routed failure
  // visible and requires a human decision rather than manufacturing an unauthorized sixth try.
  recomputeResume(state);
  await save(touch(state, now), intakeDir);
  return state;
}

/** Late answers to a COMPLETE-but-unmerged draft run (correction pass): re-open the deterministic
    resume point so the remaining work genuinely consumes the answer — reconcile re-reads the
    answered ledger cards, the critic re-judges, landing re-runs. Refuses on published/merged
    runs (those take the change lifecycle) and no-ops on runs with work still owed. History is
    preserved: stage attempt records stay; only status/resume/landing verdicts re-open. */
export async function reopenForAnswers(slug, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  if (state.publication?.published || state.landing?.outcome === "merged") {
    throw new ContractError(`run ${state.runId} is published — a late answer takes the change lifecycle, not a research re-open`);
  }
  if (nextStageV2(state)) return { state, reopened: false }; // work still owed — the run absorbs it as-is
  for (const stage of ["reconcile", "critic"]) {
    const st = state.stages[stage];
    st.status = "queued";
    st.startedAt = null;
    st.endedAt = null;
    st.failure = null;
    // A human answer opens a NEW tail: the old snapshot and the old handed-to tree both describe
    // work about to be redone. history and attempts stay — a re-open is visible cost.
    st.commit = null;
    st.baseline = null;
  }
  state.status = "running";
  state.failure = null;
  state.landingGate = { status: "pending", checkedAt: null, failure: null };
  state.landing = { outcome: "pending", pr: null, mergedAt: null, announced: null, finalizedAt: null, detail: null };
  // USER-TRIGGERED REOPEN vs AUTONOMOUS BUDGET (hardening pass): a run that completed AT the
  // attempt cap would otherwise re-open straight into "stuck" — the next dispatch's budget bump
  // exceeds the exhausted cap before any answer-absorbing work runs. A human answer is not an
  // autonomous retry: extend the cap just enough for the reopened tail. Bounded per reopen, and
  // reopens only ever happen on a real human answer — automatic retries stay capped as before.
  if (state.attempts.total + V2_REOPEN_ATTEMPT_GRANT > state.attempts.cap) {
    state.attempts.cap = state.attempts.total + V2_REOPEN_ATTEMPT_GRANT;
  }
  recomputeResume(state);
  await save(touch(state, now), intakeDir);
  return { state, reopened: true };
}

export async function markDeployedLive(slug, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  state.publication.deployedLive = true;
  state.publication.deployedAt = now;
  return save(touch(state, now), intakeDir);
}

export async function markLandingGate(slug, { passed, detail = null, now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  state.landingGate = { status: passed ? "passed" : "failed", checkedAt: now, failure: passed ? null : (detail || "landing evidence gate failed") };
  state.status = passed ? "complete" : "failed";
  state.failure = passed ? null : { class: "gate-failure", detail: state.landingGate.failure, at: now };
  return save(touch(state, now), intakeDir);
}

/** Record (or merge) the telemetry summary. Unknown stays null — never zero, never guessed. */
export async function recordTelemetry(slug, telemetry, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  state.telemetry = { schemaVersion: TELEMETRY_SCHEMA, ...state.telemetry, ...telemetry };
  return save(touch(state, now), intakeDir);
}

// ── V1 adapter ───────────────────────────────────────────────────────────────
// While V1 exists its guides keep their state.json untouched; consumers that want ONE shape read
// through this. Historical guide data is never bulk-rewritten to satisfy V2.

/** Map a V1 state.json into the V2 run-state SHAPE (view only — never written to disk). */
export function adaptV1RunState(v1) {
  if (!v1) return null;
  const stages = Object.fromEntries(V1_STAGE_ORDER.map((s) => [s, {
    status: v1.stages?.[s] ? "complete" : "queued",
    startedAt: null,
    endedAt: v1.stages?.[s] || null,
    attempts: 0, // V1 never recorded per-stage attempts — unknown is not zero, but the field is structural; run-level total carries the truth
    model: null,
    effort: null,
    commit: null,
    failure: null,
  }]));
  const next = V1_STAGE_ORDER.find((s) => !v1.stages?.[s]) || null;
  return {
    schemaVersion: "wp-run/2.0",
    slug: v1.slug,
    runId: `v1-${v1.slug}`,
    lifecycle: "research",
    status: next ? "running" : "complete",
    createdAt: v1.createdAt || v1.updatedAt || "",
    updatedAt: v1.updatedAt || "",
    stageOrder: [...V1_STAGE_ORDER],
    stages,
    attempts: { total: v1.attempts || 0, cap: 5, autoRetries: 0, autoRetryCap: 1 },
    resume: { nextStage: next, action: next ? `run stage "${next}" (V1 checkpoint spine)` : "all V1 stages cleared" },
    failure: null,
    publication: { published: false, publishedAt: null, deployedLive: null, deployedAt: null },
    telemetry: null,
    v1: true,
  };
}

/** One reader for both generations: V2 file wins when present (fail-closed), else the V1 view. */
export async function readAnyRunState(slug, { intakeDir = INTAKE_DIR } = {}) {
  const v2 = await readRunStateV2(slug, { intakeDir });
  if (v2) return { version: 2, state: v2 };
  const v1 = await readStateV1(slug, { intakeDir });
  if (v1) return { version: 1, state: adaptV1RunState(v1) };
  return { version: 0, state: null };
}
