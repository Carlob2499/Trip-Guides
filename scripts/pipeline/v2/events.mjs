// PIPELINE V2 — the truthful Progress event emitter (Phase 9 of the finalization mandate).
//
// The progress cockpit has parsed guides-intake/<slug>/events.json since M-series, honest-empty
// while nothing emitted it. This module is the emitter — and it emits ONLY what a deterministic
// boundary can prove:
//
//   · stage transitions, attempts, retries, failures    — from run.v2.json (the workflow's own
//     checkpoints, never the model's account of itself)
//   · candidate funnel + disposition + saturation facts — from the VALIDATED evidence artifact
//     (structured, fail-closed contract data; not parsed prose)
//   · geocode outcomes                                  — from the deterministic attempt report
//   · landing gate + publication state                  — from run.v2.json
//
// What it deliberately never emits: per-request fetch telemetry (no trustworthy machine boundary
// observes the agent's WebFetch calls — the `fetches` panel stays honestly empty), "nuggets"
// (model prose rebranded as telemetry), token/cost counts (unknown stays unknown), and anything
// resembling live thoughts. Partial truthful telemetry beats a convincing fake cockpit.
//
// The UI's parser (src/features/pipeline-progress/model/run-events.ts) is optional-tolerant and
// buffers the tails, so this writer stays append-only per boundary call and bounded overall.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

export function eventsPath(slug, intakeDir = INTAKE_DIR) {
  return path.join(intakeDir, slug, "events.json");
}

const STAGE_LABEL = {
  scaffold: "Scaffold",
  passA: "Pass A (canonical research)",
  passB: "Pass B (independent research)",
  reconcile: "Reconcile",
  critic: "Fresh-context critic",
};

function label(stage) {
  return STAGE_LABEL[stage] || stage;
}

function fmtDuration(sec) {
  if (sec === null || sec === undefined) return null;
  if (sec < 90) return `${sec}s`;
  return `${Math.round(sec / 60)}m`;
}

/** Pure: derive the decision-log rows the durable artifacts can PROVE. */
export function buildRunEvents({ state, evidence = null, geocode = null } = {}) {
  const decisions = [];
  const push = (at, kind, text) => { if (at && text) decisions.push({ at, kind, text }); };

  for (const stage of state?.stageOrder || []) {
    const st = state.stages[stage];
    if (!st) continue;
    for (const h of st.history || []) {
      if (h.status === "running") {
        push(h.startedAt, "check", `${label(stage)} started (attempt ${h.attempt} of ${state.attempts?.cap ?? "?"})`);
      } else if (h.status === "complete") {
        push(h.startedAt, "check", `${label(stage)} started (attempt ${h.attempt} of ${state.attempts?.cap ?? "?"})`);
        const dur = fmtDuration(h.durationSec);
        push(h.endedAt, "decision", `${label(stage)} complete${dur ? ` in ${dur}` : ""}${h.attempt > 1 ? ` (attempt ${h.attempt})` : ""}`);
      } else if (h.status === "failed") {
        push(h.startedAt, "check", `${label(stage)} started (attempt ${h.attempt} of ${state.attempts?.cap ?? "?"})`);
        push(h.endedAt, "reject", `${label(stage)} attempt ${h.attempt} failed (${h.failureClass || "unknown"}) — deterministic findings recorded for the retry`);
      }
    }
  }

  if (evidence) {
    const at = state?.updatedAt;
    const candidates = evidence.candidates || [];
    if (candidates.length) {
      const shipped = candidates.filter((c) => c.status === "shipped").length;
      const rejected = candidates.filter((c) => c.status === "rejected").length;
      const detour = candidates.filter((c) => c.status === "detour").length;
      push(at, "decision",
        `Candidate funnel: ${candidates.length} evaluated · ${candidates.filter((c) => c.shortlisted).length} shortlisted · ${shipped} shipped · ${rejected} rejected${detour ? ` · ${detour} kept as detours` : ""}`);
    }
    if (evidence.reconciliation?.length) {
      const byKind = {};
      for (const r of evidence.reconciliation) byKind[r.disposition] = (byKind[r.disposition] || 0) + 1;
      push(at, "decision",
        `Reconcile dispositioned ${evidence.reconciliation.length} independent finding(s): ` +
          Object.entries(byKind).map(([k, n]) => `${n} ${k}`).join(" · "));
    }
    const sat = evidence.saturation;
    if (sat?.stopped) {
      push(at, "decision", `Adaptive search stopped: trend "${sat.trend}", unresolved evidence could not change the recommendation`);
    }
    const disagreements = evidence.disagreements || [];
    for (const d of disagreements.filter((x) => x.impact === "recommendation-changing")) {
      push(at, "check", `Decision-changing disagreement investigated: ${d.topic}`);
    }
  }

  if (geocode) {
    push(geocode.attemptedAt, "decision",
      `Deterministic geocode pass: ${geocode.resolved?.length ?? 0} resolved · ${geocode.unresolved?.length ?? 0} left as honest blanks`);
  }

  const gate = state?.landingGate;
  if (gate?.status === "passed") push(gate.checkedAt, "decision", "Landing evidence gate PASSED — draft PR opened");
  if (gate?.status === "failed") push(gate.checkedAt, "reject", `Landing evidence gate FAILED — ${gate.failure || "see run log"}`);
  if (state?.publication?.published) push(state.publication.publishedAt, "decision", "Published (merged)");
  if (state?.publication?.deployedLive) push(state.publication.deployedAt, "decision", "Confirmed live on the deployed site");

  decisions.sort((a, b) => String(a.at).localeCompare(String(b.at)));

  return {
    // fetches: no trustworthy machine boundary observes the agents' web requests — honestly empty.
    fetches: [],
    decisions,
    // nuggets are traveler-facing model findings; presenting them as telemetry is forbidden.
    nuggets: [],
    // counters: the UI shape leads with a "pages" count nothing deterministic can supply, and a
    // 0 there would render as a fact. The funnel counts already travel as decision rows.
    counters: null,
  };
}

/** Rebuild and write events.json from the durable artifacts. Idempotent per boundary call. */
export async function emitRunEvents(slug, { state, evidence = null, geocode = null, intakeDir = INTAKE_DIR } = {}) {
  const events = buildRunEvents({ state, evidence, geocode });
  const file = eventsPath(slug, intakeDir);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(events, null, 2) + "\n");
  return events;
}

export async function readGeocodeReport(slug, { intakeDir = INTAKE_DIR } = {}) {
  const file = path.join(intakeDir, slug, "geocode.v2.json");
  if (!existsSync(file)) return null;
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return null; }
}
