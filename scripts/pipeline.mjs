// The generation-pipeline CHECKPOINT spine — what makes a dual-pass run resumable.
//
// The research stages (Pass A / Pass B / reconcile) are judgment work a Claude session does, not a
// script — so "orchestration" here is not a program that runs research. It is a durable, git-tracked
// record of WHICH stages a guide has cleared, so a headless research-pass run that gets cut off by a
// wall-clock or usage limit resumes at the next un-done stage instead of restarting from scratch.
//
// The record lives beside the intake: guides-intake/<slug>.state.json (committed — git is the
// durable store; the checkpoint survives because it's committed after each pass). The stages:
//
//   scaffold → passA → passB → reconcile → verified
//
// Flow: the scaffolder marks `scaffold` on creation. The research agent (research-pass.yml, or an
// interactive session) reads the state, does only the un-done stages, and after EACH one runs
//   `npm run pipeline -- --slug <slug> --checkpoint <stage>` + commits,
// so partial progress is persisted. `--status` prints where a guide is and the exact next action.
//
// Plain .mjs, node built-ins only — the `node`-run scripts and workflows import/CLI it directly.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

// Ordered stages. `scaffold` is set by the scaffolder; the rest by the research agent as it clears
// them. A guide is "done" (draft-ready for human graduation) when `verified` is set.
export const STAGE_ORDER = ["scaffold", "passA", "passB", "reconcile", "verified"];

export const STAGE_LABEL = {
  scaffold: "Scaffold created",
  passA: "Pass A — canonical & verified",
  passB: "Pass B — local, authentic, crowd-aware",
  reconcile: "Reconcile A + B → one guide",
  verified: "verify PASS + build clean",
};

// What to DO to clear each remaining stage — printed by --status so the next step is unambiguous
// whether a human or the headless Action is reading it. Kept in step with the guide-author skill's
// Research workflow; the skill is the full detail, these are the one-line cues.
function stageHint(slug, stage) {
  const cp = `then: npm run pipeline -- --slug ${slug} --checkpoint ${stage}`;
  switch (stage) {
    case "passA": return `Run Pass A (primary/official sources): VERIFY the anchor event's date + venue against a T0 source FIRST, then must-dos, entry/visa, transit, hours, prices. Keep the verification ledger. ${cp}`;
    case "passB": return `Run Pass B INDEPENDENTLY (resident/blog/forum angle): off-peak timing + crowd reality per marquee sight, novel local alternatives to the tourist traps. Verify every lead vs a primary source before it enters the guide. ${cp}`;
    case "reconcile": return `Reconcile A + B into ONE guide and fill the "## Research reconciliation" ledger in guides-intake/${slug}.md (AGREE / A-only / B-only / CONFLICT). Log any re-plan in "## Amendments". ${cp}`;
    case "verified": return `Loop \`npm run verify -- --slug ${slug}\` + \`npm run build\` → fix each blocking finding against a primary source → re-run until verify PASSes and build is clean. ${cp}`;
    default: return cp;
  }
}

export function statePath(slug) {
  return path.join(INTAKE_DIR, `${slug}.state.json`);
}

export async function readState(slug) {
  const p = statePath(slug);
  if (!existsSync(p)) return null;
  try { return JSON.parse(await readFile(p, "utf8")); }
  catch { return null; }
}

async function saveState(state) {
  await mkdir(INTAKE_DIR, { recursive: true });
  await writeFile(statePath(state.slug), JSON.stringify(state, null, 2) + "\n");
  return state;
}

// Empty stage map with every stage null (not-yet-cleared).
function emptyStages() {
  return Object.fromEntries(STAGE_ORDER.map((s) => [s, null]));
}

// Create (or, with force, reset) a guide's pipeline state, marking `scaffold` cleared. Idempotent
// by default: if state already exists it's returned untouched, so re-scaffolding never wipes
// research progress.
export async function initState(slug, { force = false, now = new Date().toISOString() } = {}) {
  const existing = await readState(slug);
  if (existing && !force) return existing;
  return saveState({ slug, createdAt: now, updatedAt: now, stages: { ...emptyStages(), scaffold: now }, attempts: 0, notes: [] });
}

// How many times a research-pass RUN has started work on this guide (not stages — one run may
// clear several stages, or none if it's cut off early). The circuit breaker: a headless run
// that keeps getting cut off before reaching `verified` should eventually stop and ask a human
// instead of silently resuming forever. Called once per workflow run, before the agent starts.
export async function bumpAttempt(slug, { now = new Date().toISOString() } = {}) {
  const state = (await readState(slug)) || { slug, createdAt: now, updatedAt: now, stages: emptyStages(), attempts: 0, notes: [] };
  state.attempts = (state.attempts || 0) + 1;
  state.updatedAt = now;
  return saveState(state);
}

// Mark a stage cleared (idempotent — re-checkpointing refreshes the timestamp, never errors).
// Records an optional note for the human trail. Creates the state if absent (so a checkpoint on a
// pre-state guide self-heals rather than throwing).
export async function checkpoint(slug, stage, { note = null, now = new Date().toISOString() } = {}) {
  if (!STAGE_ORDER.includes(stage)) throw new Error(`unknown stage "${stage}" — one of: ${STAGE_ORDER.join(", ")}`);
  const state = (await readState(slug)) || { slug, createdAt: now, updatedAt: now, stages: emptyStages(), notes: [] };
  state.stages[stage] = now;
  state.updatedAt = now;
  if (note) state.notes.push({ stage, note, at: now });
  return saveState(state);
}

// First un-cleared stage in order, or null when every stage is done.
export function nextStage(state) {
  if (!state) return STAGE_ORDER[0];
  return STAGE_ORDER.find((s) => !state.stages?.[s]) || null;
}

// Human/agent-readable status: a checklist + the exact next action.
export function statusLines(slug, state) {
  const lines = [];
  if (!state) {
    lines.push(`[pipeline] ${slug} — no state file yet (not scaffolded, or pre-P2).`);
    lines.push(`  → scaffold it first (New-guide issue form or \`node scripts/scaffold-guide.mjs\`), which initializes state.`);
    return lines;
  }
  lines.push(`[pipeline] ${slug} — ${nextStage(state) ? "IN PROGRESS" : "READY for human graduation"} (updated ${state.updatedAt}, ${state.attempts || 0} attempt(s))`);
  for (const s of STAGE_ORDER) {
    const at = state.stages?.[s];
    lines.push(`  ${at ? "✓" : "○"} ${STAGE_LABEL[s]}${at ? ` — ${at.slice(0, 10)}` : ""}`);
  }
  const next = nextStage(state);
  if (next) lines.push(`  → NEXT (${next}): ${stageHint(slug, next)}`);
  else lines.push(`  → All stages cleared. Human graduates via the rubric (docs/GUIDE_RUBRIC.md) + \`npm run verify -- --slug ${slug} --network\`.`);
  return lines;
}

// Machine-readable status for a workflow step to branch on (`jq`) — the CLI/agent-facing
// statusLines() above stays the human-readable default; this is additive, not a replacement.
export function statusJson(slug, state) {
  return {
    slug,
    exists: !!state,
    nextStage: state ? nextStage(state) : "scaffold",
    attempts: state?.attempts || 0,
    updatedAt: state?.updatedAt || null,
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
// node scripts/pipeline.mjs --slug korea --status [--json]
// node scripts/pipeline.mjs --slug korea --checkpoint passA --note "anchor verified vs official site"
// node scripts/pipeline.mjs --slug korea --init [--force]
// node scripts/pipeline.mjs --slug korea --bump-attempt [--json]
function isMain(moduleUrl) {
  return process.argv[1] != null && moduleUrl === pathToFileURL(process.argv[1]).href;
}

if (isMain(import.meta.url)) {
  const argv = process.argv.slice(2);
  const get = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);
  const slug = get("--slug");
  if (!slug) { console.error("Usage: node scripts/pipeline.mjs --slug <slug> [--status [--json] | --init [--force] | --checkpoint <stage> [--note ..] | --bump-attempt [--json]]"); process.exit(1); }
  const asJson = argv.includes("--json");

  if (argv.includes("--init")) {
    const state = await initState(slug, { force: argv.includes("--force") });
    console.log(`[pipeline] ${slug} — state initialized (scaffold cleared).`);
    console.log(statusLines(slug, state).join("\n"));
  } else if (argv.includes("--checkpoint")) {
    const stage = get("--checkpoint");
    const state = await checkpoint(slug, stage, { note: get("--note") });
    console.log(`[pipeline] ${slug} — checkpoint "${stage}" recorded.`);
    console.log(statusLines(slug, state).join("\n"));
  } else if (argv.includes("--bump-attempt")) {
    const state = await bumpAttempt(slug);
    if (asJson) console.log(JSON.stringify(statusJson(slug, state)));
    else { console.log(`[pipeline] ${slug} — attempt ${state.attempts} recorded.`); console.log(statusLines(slug, state).join("\n")); }
  } else {
    // default + --status: print state
    const state = await readState(slug);
    if (asJson) console.log(JSON.stringify(statusJson(slug, state)));
    else console.log(statusLines(slug, state).join("\n"));
  }
}
