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
  return path.join(intakeDir, slug, "run.v2.json");
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
  return parseOrThrow(runStateSchema, raw, { file, what: "V2 run state" });
}

async function save(state, intakeDir = INTAKE_DIR) {
  state.updatedAt = state.updatedAt || new Date().toISOString();
  await mkdir(path.join(intakeDir, state.slug), { recursive: true });
  await writeFile(runStatePath(state.slug, intakeDir), JSON.stringify(state, null, 2) + "\n");
  return state;
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

/** Create a fresh V2 run. Refuses to clobber an existing one unless force. */
export async function initRunV2(slug, {
  lifecycle = "research",
  stages = V2_RESEARCH_STAGES,
  cap = V2_ATTEMPT_CAP,
  autoRetryCap = V2_AUTO_RETRY_CAP,
  now = new Date().toISOString(),
  intakeDir = INTAKE_DIR,
  force = false,
} = {}) {
  const existing = await readRunStateV2(slug, { intakeDir });
  if (existing && !force) {
    const done = !nextStageV2(existing);
    if (!done && existing.status !== "stuck") return existing; // resume, never restart
  }
  const state = {
    schemaVersion: RUN_SCHEMA,
    slug,
    runId: newRunId(slug, { now: new Date(now) }),
    lifecycle,
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
  st.status = "running";
  st.startedAt = now;
  st.endedAt = null;
  st.failure = null;
  st.attempts += 1;
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
  st.status = "complete";
  st.endedAt = now;
  st.failure = null;
  if (commit) st.commit = commit;
  recomputeResume(state);
  state.status = nextStageV2(state) ? "running" : "complete";
  return save(touch(state, now), intakeDir);
}

/** Checkpoint stage FAILURE with a classification. The stage stays the resume point. */
export async function stageFail(slug, stage, { failureClass = "unknown", detail = "", now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  const st = requireStage(state, stage);
  st.status = "failed";
  st.endedAt = now;
  st.failure = { class: failureClass, detail, at: now };
  state.status = "failed";
  state.failure = { class: failureClass, detail, at: now };
  recomputeResume(state);
  return save(touch(state, now), intakeDir);
}

/** Bump the run-level attempt counter (once per dispatch, before agents). Returns the state; the
    caller checks `overCap`. */
export async function bumpRunAttempt(slug, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
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
  const allowed = state.attempts.autoRetries <= state.attempts.autoRetryCap;
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

export async function markDeployedLive(slug, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = requireRun(await readRunStateV2(slug, { intakeDir }), slug);
  state.publication.deployedLive = true;
  state.publication.deployedAt = now;
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
