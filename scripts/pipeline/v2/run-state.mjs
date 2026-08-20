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

/** Create a fresh V2 run. Refuses to clobber an existing one unless force. */
export async function initRunV2(slug, {
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
} = {}) {
  const existing = await readRunStateV2(slug, { intakeDir });
  if (existing && !force) {
    // Complete and stuck records are deliberately durable too. A redispatch may re-run landing
    // or surface the stuck state, but it must not silently mint a new run whose "baseline"
    // already contains the prior run's evidence. Starting over requires an explicit --force
    // decision and a deliberately fresh branch.
    if (JSON.stringify(existing.inputs) !== JSON.stringify(inputs)) {
      throw new ContractError(
        `resume inputs differ from durable run ${existing.runId}; redispatch with section/model/effort/criticModel recorded in run.v2.json`,
      );
    }
    // Run context is durable and immutable: a redispatch that omits issue/landMode inherits the
    // recorded values (that is the point — retries and answer-redispatches carry nothing), and a
    // redispatch naming DIFFERENT values is cross-wiring, refused. The one write allowed is
    // healing a null issue with a real one (a manual first dispatch later adopted by /new).
    if (issue && existing.issue && issue !== existing.issue) {
      throw new ContractError(`run ${existing.runId} reports to issue #${existing.issue} — refusing to rewire it to #${issue}`);
    }
    if (landMode && landMode !== (existing.landMode || "pr")) {
      throw new ContractError(
        `run ${existing.runId} landing mode is "${existing.landMode || "pr"}" and immutable — a draft/test run never silently becomes a publishing one (or vice versa). Land by hand via \`pipeline.mjs publish\` if that is the deliberate intent.`,
      );
    }
    if (issue && !existing.issue) {
      existing.issue = issue;
      return save(touch(existing, now), intakeDir);
    }
    return existing;
  }
  const state = {
    schemaVersion: RUN_SCHEMA,
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
    landingGate: { status: "pending", checkedAt: null, failure: null },
    telemetry: null,
  };
  return save(state, intakeDir);
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
export async function stageStart(slug, stage, { model = null, effort = null, now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
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
  st.attempts += 1;
  openAttempt(st, now);
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
  closeAttempt(st, now, "complete");
  if (commit) st.commit = commit;
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
  closeAttempt(st, now, "failed", failureClass);
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

/** One automatic redispatch for a recognized usage/capacity interruption or a proven void run.
    Bounded: past the cap the caller must NOT redispatch. */
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

/** The product-landing record (I02): landing gate PASS + published, written BEFORE the merge so
    both facts ride the merge commit — an auto-merged landing deletes its branch, so a record made
    after it has nowhere durable to live. Fail-closed by construction: markLandingGate(passed)
    sets run status "complete", and the schema refuses "complete" unless EVERY stage is complete —
    an incomplete run throws here, before any draft flag is touched. Returns null when the slug
    has no V2 run (a V1 landing), the final state otherwise. deployedLive stays null: merged is
    not live, and this function must never claim otherwise. */
export async function recordProductLanding(slug, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = await readRunStateV2(slug, { intakeDir }); // throws on malformed — refuse, don't guess
  if (!state) return null;
  await markLandingGate(slug, { passed: true, now, intakeDir });
  return markPublished(slug, { now, intakeDir });
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
