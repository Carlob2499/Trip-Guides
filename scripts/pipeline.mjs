// The generation-pipeline CHECKPOINT spine — what makes a dual-pass run resumable.
//
// The research stages (Pass A / Pass B / reconcile) are judgment work a Claude session does, not a
// script — so "orchestration" here is not a program that runs research. It is a durable, git-tracked
// record of WHICH stages a guide has cleared, so a headless research-pass run that gets cut off by a
// wall-clock or usage limit resumes at the next un-done stage instead of restarting from scratch.
//
// The record lives in the guide's own run-state directory: guides-intake/<slug>/state.json
// (committed — git is the durable store; the checkpoint survives because it's committed after
// each pass), beside intake.md (frozen traveler intent) and ledger.md (research state). The stages:
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
import { fileURLToPath } from "node:url";
import { isValidSlug } from "./lib/slug.mjs";
import { isMain } from "./audit/lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INTAKE_DIR = path.join(ROOT, "guides-intake");

// Ordered stages. `scaffold` is set by the scaffolder; the rest by the research agent as it clears
// them. `verified` is the last one: a guide that reaches it has passed the evidence gate and
// publishes itself as part of landing (scripts/pipeline/publish.mjs) — there is no separate
// approval event between "verified" and "live".
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
    case "reconcile": return `Reconcile A + B into ONE guide and fill the "## Research reconciliation" ledger in guides-intake/${slug}/ledger.md (AGREE / A-only / B-only / CONFLICT). Log any re-plan in "## Amendments". ${cp}`;
    case "verified": return `Loop \`npm run verify -- --slug ${slug}\` + \`npm run build\` → fix each blocking finding against a primary source → re-run until verify PASSes and build is clean. ${cp}`;
    default: return cp;
  }
}

export function statePath(slug, intakeDir = INTAKE_DIR) {
  return path.join(intakeDir, slug, "state.json");
}

export async function readState(slug, { intakeDir = INTAKE_DIR } = {}) {
  const p = statePath(slug, intakeDir);
  if (!existsSync(p)) return null;
  try { return JSON.parse(await readFile(p, "utf8")); }
  catch { return null; }
}

// Read-modify-WRITE-WHOLE: every mutator below mutates the object readState parsed, so any
// top-level key this module doesn't know about survives a checkpoint untouched. That is what
// lets a second lifecycle add its own block (e.g. `change`) to state.json later without
// these writers needing to learn about it.
async function saveState(state, intakeDir = INTAKE_DIR) {
  await mkdir(path.join(intakeDir, state.slug), { recursive: true });
  await writeFile(statePath(state.slug, intakeDir), JSON.stringify(state, null, 2) + "\n");
  return state;
}

// Empty stage map with every stage null (not-yet-cleared).
function emptyStages() {
  return Object.fromEntries(STAGE_ORDER.map((s) => [s, null]));
}

// Create (or, with force, reset) a guide's pipeline state, marking `scaffold` cleared. Idempotent
// by default: if state already exists it's returned untouched, so re-scaffolding never wipes
// research progress.
export async function initState(slug, { force = false, now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const existing = await readState(slug, { intakeDir });
  if (existing && !force) return existing;
  return saveState({ slug, createdAt: now, updatedAt: now, stages: { ...emptyStages(), scaffold: now }, attempts: 0, notes: [] }, intakeDir);
}

// How many times a research-pass RUN has started work on this guide (not stages — one run may
// clear several stages, or none if it's cut off early). The circuit breaker: a headless run
// that keeps getting cut off before reaching `verified` should eventually stop and ask a human
// instead of silently resuming forever. Called once per workflow run, before the agent starts.
export async function bumpAttempt(slug, { now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  const state = (await readState(slug, { intakeDir })) || { slug, createdAt: now, updatedAt: now, stages: emptyStages(), attempts: 0, notes: [] };
  state.attempts = (state.attempts || 0) + 1;
  state.updatedAt = now;
  return saveState(state, intakeDir);
}

// Mark a stage cleared (idempotent — re-checkpointing refreshes the timestamp, never errors).
// Records an optional note for the human trail. Creates the state if absent (so a checkpoint on a
// pre-state guide self-heals rather than throwing).
export async function checkpoint(slug, stage, { note = null, now = new Date().toISOString(), intakeDir = INTAKE_DIR } = {}) {
  if (!STAGE_ORDER.includes(stage)) throw new Error(`unknown stage "${stage}" — one of: ${STAGE_ORDER.join(", ")}`);
  const state = (await readState(slug, { intakeDir })) || { slug, createdAt: now, updatedAt: now, stages: emptyStages(), notes: [] };
  state.stages[stage] = now;
  state.updatedAt = now;
  if (note) state.notes.push({ stage, note, at: now });
  return saveState(state, intakeDir);
}

// PREVENTIVE half of the checkpoint contract (docs/archive/PLAN_FACTORY_V2 P1; QA finding F1). The prompt
// tells the agent to commit after each stage; this makes skipping that mechanically impossible.
// A stage may only be checkpointed once its PREDECESSOR is durable — i.e. present in the
// COMMITTED state at HEAD, not merely sitting in the working tree.
//
// Japan is the worked example: passA/passB/reconcile were all checkpointed within 35ms (10:32:26)
// and only committed 7 seconds later (10:32:33). At the moment `--checkpoint passB` ran, passA
// existed nowhere but the working tree — so this guard would have refused it, at the exact moment
// the contract broke, instead of the defect surviving to a post-mortem.
//
// Pure: takes the committed state as data. Returns the blocking predecessor stage, or null.
export function uncommittedPredecessor(stage, committedState) {
  const i = STAGE_ORDER.indexOf(stage);
  if (i <= 0) return null; // scaffold has no predecessor; unknown stages are rejected elsewhere
  const prev = STAGE_ORDER[i - 1];
  return committedState?.stages?.[prev] ? null : prev;
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
  lines.push(`[pipeline] ${slug} — ${nextStage(state) ? "IN PROGRESS" : "COMPLETE"} (updated ${state.updatedAt}, ${state.attempts || 0} attempt(s))`);
  for (const s of STAGE_ORDER) {
    const at = state.stages?.[s];
    lines.push(`  ${at ? "✓" : "○"} ${STAGE_LABEL[s]}${at ? ` — ${at.slice(0, 10)}` : ""}`);
  }
  const next = nextStage(state);
  if (next) lines.push(`  → NEXT (${next}): ${stageHint(slug, next)}`);
  else lines.push(`  → All stages cleared. It publishes on landing; to publish by hand: \`node scripts/pipeline.mjs publish --slug ${slug}\` (runs build + networked verify first).`);
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

// THE issue-body source for the change lifecycle — the live issue, read through `gh`. Both
// readers (resolve-change and `plan --from-issue`) call this one function, so they cannot end up
// looking at different text for the same issue: the workflow used to hand one of them
// `github.event.issue.body` (the payload snapshot from when the label landed) and leave the other
// to fetch, which disagreed whenever the issue was edited in between and left the fetch path
// exercised on only one of the two trigger shapes.
async function issueBody(num) {
  const { gh } = await import("./lib/cli.mjs");
  return gh(["issue", "view", String(num), "--json", "body", "-q", ".body"]);
}

// ── subcommands ──────────────────────────────────────────────────────────────
// Every branch returns an exit code; nothing here throws to the top level, so a workflow step
// gets a reason on stderr rather than a stack trace.
async function runSubcommand(cmd, rest, get) {
  const has = (flag) => rest.includes(flag) || process.argv.includes(flag);
  const slug = get("--slug");
  const needSlug = () => {
    if (!slug || !isValidSlug(slug)) {
      console.error(`[pipeline] ${cmd} needs a valid --slug (lowercase, digits, single hyphens).`);
      return false;
    }
    return true;
  };
  // Step outputs go through the shared writer, which REFUSES a value containing a newline: the
  // runner reads $GITHUB_OUTPUT line by line, so a multi-line value is extra outputs, not a long
  // one. It throws; the CLI entry point turns that into a one-line error and a non-zero exit.
  const { emitOutput: emit } = await import("./lib/cli.mjs");

  switch (cmd) {
    case "prompt": {
      const file = rest.find((a) => !a.startsWith("--"));
      if (!file) { console.error("[pipeline] prompt needs a file: pipeline.mjs prompt prompts/<name>.md"); return 1; }
      const { composePrompt } = await import("./pipeline/prompt.mjs");
      return composePrompt(file);
    }

    case "branch": {
      if (!needSlug()) return 1;
      const { startOrResumeBranch } = await import("./pipeline/publish.mjs");
      const suffix = get("--suffix") ? `-${get("--suffix")}` : "";
      const name = `${get("--prefix") || "research"}/${slug}${suffix}`;
      const { resumed } = startOrResumeBranch(name);
      emit("name", name);
      console.log(`[branch] ${resumed ? "resumed" : "started"} ${name}`);
      return 0;
    }

    case "route": {
      if (!needSlug()) return 1;
      const state = await readState(slug);
      const next = state ? nextStage(state) : "scaffold";
      emit("next", next || "");
      emit("done", String(!next));
      // The critic and the coverage gate run on mechanical verification, not on the checkpoint
      // spine — a stage can be cleared while verify still says NEEDS WORK. Ask verify itself.
      if (has("--verify")) {
        const { execFileSync } = await import("node:child_process");
        let ok = true;
        try { execFileSync(process.execPath, [path.join(ROOT, "scripts", "verify-guide.mjs"), "--slug", slug], { cwd: ROOT, stdio: "ignore" }); }
        catch { ok = false; }
        emit("verified", String(ok));
        console.log(`[route] ${slug} — next: ${next || "(none)"}, verify: ${ok ? "PASS" : "NEEDS WORK"}`);
        return 0;
      }
      if (has("--json")) console.log(JSON.stringify(statusJson(slug, state)));
      else console.log(`[route] ${slug} — next stage: ${next || "(none — all stages cleared)"}`);
      return 0;
    }

    case "gate": {
      const kind = rest.find((a) => !a.startsWith("--"));
      const { runGate } = await import("./pipeline/gate.mjs");
      if (kind !== "enforce" && !needSlug()) return 1;
      return runGate(kind, {
        slug,
        lifecycle: get("--lifecycle") || "research",
        branch: get("--branch"),
        cap: get("--cap") ? Number(get("--cap")) : undefined,
        runKey: get("--run-key"),
        stage: get("--stage"),
        file: get("--file"),
        floors: has("--floors"),
        preHead: get("--pre-head"),
        preStages: get("--pre-stages"),
        issue: get("--issue"),
        isVoid: get("--void"),
        violations: get("--violations"),
        kinds: get("--kinds"),
        compose: get("--compose"),
        runUrl: get("--run-url"),
        enforce: has("--enforce"),
      });
    }

    case "questions": {
      if (!needSlug()) return 1;
      const { surfaceQuestions } = await import("./pipeline/questions.mjs");
      return surfaceQuestions({ slug, issue: get("--issue"), json: has("--json") });
    }

    // M6: where does a traveler answer belong? While research is ACTIVE it belongs to that
    // run's ledger on the research branch; only a published/complete guide gets a change run.
    // Reads the committed state on the CURRENT checkout (main) — an active research run's
    // stages are incomplete there by construction.
    case "answers-route": {
      if (!needSlug()) return 1;
      const { routeAnswers } = await import("./pipeline/questions.mjs");
      const { execFileSync } = await import("node:child_process");
      const { existsSync: exists, readFileSync } = await import("node:fs");

      let hasAnswers;
      try {
        const { parseAnswersJson } = await import("./pipeline/plan.mjs");
        hasAnswers = !!parseAnswersJson(process.env.PLAN_JSON)?.length;
      } catch { hasAnswers = false; }

      const metaPath = path.join(ROOT, "src", "content", "guides", slug, "_guide.json");
      let published;
      try { published = exists(metaPath) && !JSON.parse(readFileSync(metaPath, "utf8")).draft; } catch { published = false; }

      let researchBranch = null;
      let researchActive = false;
      if (!published) {
        // The active truth lives on the research branch, not main. Prefer V2 only when its own
        // committed run record says it still has a resume stage; a stale branch is not active.
        for (const [b, stateFile] of [
          [`research-v2/${slug}`, `guides-intake/${slug}/run.v2.json`],
          [`research/${slug}`, `guides-intake/${slug}/state.json`],
        ]) {
          let existsOnOrigin = false;
          try {
            execFileSync("git", ["ls-remote", "--exit-code", "--heads", "origin", b], { cwd: ROOT, stdio: "pipe" });
            existsOnOrigin = true;
          } catch { /* branch absent — try the next namespace */ }
          if (!existsOnOrigin) continue;
          try {
            execFileSync("git", ["fetch", "--depth=1", "origin", b], { cwd: ROOT, stdio: "pipe" });
            const raw = execFileSync("git", ["show", `FETCH_HEAD:${stateFile}`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
            const remoteState = JSON.parse(raw);
            const active = b.startsWith("research-v2/")
              ? ["pending", "running", "paused", "failed", "complete"].includes(remoteState.status)
              : ["passA", "passB", "reconcile", "verified"].some((stage) => !remoteState.stages?.[stage]);
            if (active) { researchBranch = b; researchActive = true; break; }
          } catch (err) {
            console.error(`[answers-route] ${b} exists but its committed state is unreadable: ${err.message}`);
            return 1;
          }
        }
      }

      const d = routeAnswers({ hasAnswers, researchActive, researchBranch, published });
      emit("target", d.target);
      emit("research_branch", d.branch || "");
      console.log(`[answers-route] ${slug} → ${d.target}${d.branch ? ` (${d.branch})` : ""} — ${d.reason}`);
      return 0;
    }

    // M6: record dispatched answers on the active research run's ledger (the caller has the
    // research branch checked out). Deterministic, zero-agent: the run's own resume reads the
    // answered cards. A missing card id reds the step — an answer that lands nowhere is lost.
    case "answers-apply": {
      if (!needSlug()) return 1;
      const { applyAnswersToLedger } = await import("./pipeline/questions.mjs");
      const { parseAnswersJson } = await import("./pipeline/plan.mjs");
      let answers;
      try { answers = parseAnswersJson(process.env.PLAN_JSON); }
      catch (err) { console.error(`[answers-apply] ${err.message}`); return 1; }
      if (!answers?.length) { console.error("[answers-apply] PLAN_JSON carries no answers — nothing to record."); return 1; }

      const result = await applyAnswersToLedger(slug, answers);
      const rel = `guides-intake/${slug}/ledger.md`;
      const branch = get("--branch");
      const { execFileSync } = await import("node:child_process");
      const dirty = execFileSync("git", ["status", "--porcelain", "--", rel], { cwd: ROOT, encoding: "utf8" }).trim();
      if (dirty) {
        execFileSync("git", ["add", rel], { cwd: ROOT });
        execFileSync("git", ["commit", "-m", `research(${slug}): traveler answered ${result.applied.filter((a) => !a.already).map((a) => a.id).join(", ")}`], { cwd: ROOT });
        if (branch) execFileSync("git", ["push", "origin", `HEAD:${branch}`], { cwd: ROOT });
      }
      console.log(`[answers-apply] ${slug} — ${result.applied.length} answer(s) recorded${result.applied.some((a) => a.already) ? " (some were already answered)" : ""}.`);
      if (result.missing.length) {
        console.error(`[answers-apply] no question card found for: ${result.missing.join(", ")} — those answers were NOT recorded; a human should check the ids.`);
        return 1;
      }
      return 0;
    }

    case "plan": {
      const { writeFile: write } = await import("node:fs/promises");
      const plan = await import("./pipeline/plan.mjs");
      let built;
      try {
        if (has("--from-issue")) {
          const num = get("--from-issue");
          if (!/^\d+$/.test(String(num ?? ""))) { console.error(`[plan] "${num}" isn't an issue number.`); return 1; }
          // One source (issueBody, above) — never $ISSUE_BODY. See that function's comment.
          built = await plan.planFromIssue(await issueBody(num), { issue: num, source: get("--source") || "request", land: get("--land") || "auto" });
          // Boundary check: the issue body is the authority on which guide this is about. If the
          // caller also named one and they disagree, something upstream resolved the wrong guide
          // — stop rather than edit whichever one wins by accident.
          if (slug && slug !== built.plan.slug) {
            console.error(`[plan] caller said --slug ${slug} but issue #${num} names ${built.plan.slug} — refusing to guess.`);
            return 1;
          }
        } else if (has("--from-staleness")) {
          if (!needSlug()) return 1;
          const { recertList } = await import("./recert.mjs");
          built = await plan.planFromStaleness(slug, { worklist: await recertList() });
        } else if (has("--from-answers")) {
          if (!needSlug()) return 1;
          // PLAN_JSON is the site answer flow's channel (the Worker's workflow_dispatch input);
          // with none supplied the ledger's own answered cards are the source.
          built = await plan.planFromAnswers(slug, { answers: plan.parseAnswersJson(process.env.PLAN_JSON) });
        } else if (has("--date-lock")) {
          if (!needSlug()) return 1;
          built = await plan.planFromDateLock(slug);
        } else {
          console.error("[plan] pick a source: --from-issue <n> | --from-staleness | --from-answers | --date-lock");
          return 1;
        }
      } catch (err) {
        console.error(`[plan] ${err.message}`);
        return 1;
      }

      const errors = [...built.errors, ...plan.validatePlan(built.plan, built.groups)];
      if (errors.length) {
        console.error(`[plan] ${built.plan.slug || "?"} — the change plan does not hold up:`);
        for (const e of errors) console.error(`  · ${e}`);
        return 1;
      }

      // The requester's own words go to their own file and are never interpolated anywhere.
      if (built.changeText != null) await write(built.plan.changeFile, built.changeText.endsWith("\n") ? built.changeText : built.changeText + "\n");
      const out = get("--out") || "change-plan.json";
      await write(out, JSON.stringify(built.plan, null, 2) + "\n");
      console.log(plan.formatPlan(built.plan));
      emit("slug", built.plan.slug);
      emit("land", built.plan.land);
      emit("plan_file", out);
      return 0;
    }

    case "land": {
      if (!needSlug()) return 1;
      const { publishGuide, commitAll, landBranch, landingGate, PUBLISH_ERRORS } = await import("./pipeline/publish.mjs");
      const { writeFileSync, readFileSync, existsSync: exists } = await import("node:fs");
      const bodyFile = get("--body-file") || "/tmp/scorecard.md";
      let passed = get("--passed") === "true";

      // THE evidence, produced by code. The agent's own verify runs are how it fixes things; this
      // one is what the verdict is based on, so a run cannot report a pass it did not earn. It is
      // the REAL evidence gate — build first (the schema gate), then the networked verify — the
      // same steps evidenceGate() defines, so `gatePassed: true` below is a claim that was earned.
      if (has("--gate")) {
        const gate = landingGate(slug);
        const prepend = get("--prepend");
        const summary = prepend && exists(prepend) ? readFileSync(prepend, "utf8").trimEnd() + "\n\n" : "";
        writeFileSync(bodyFile, summary + gate.scorecard);
        const state = await readState(slug);
        // Research also requires every stage cleared: a green verify on a half-researched guide
        // is a green verify on a half-researched guide.
        passed = gate.passed && (!has("--require-verified") || (state && !nextStage(state)));
        console.log(`[land] evidence gate — ${gate.steps.map((s) => `\`${s.cmd}\` exit ${s.code}`).join(", ")}, stages ${state && !nextStage(state) ? "complete" : "incomplete"} → passed=${passed}`);
      }

      const auto = (get("--land") || "auto") === "auto";

      // Auto-publish is the rule: a run that passed its evidence gate takes the draft flag off
      // here, in the same step that lands it. `--land pr` runs that nobody asked for stay drafts.
      if (passed && auto) {
        const published = await publishGuide(slug, { gatePassed: true });
        if (published.ok) {
          console.log(`[land] ${slug} published — draft flag removed from ${published.metaPath}`);
          commitAll(`feat(${slug}): publish — verify PASS`);
        } else if (published.error !== PUBLISH_ERRORS.NOT_DRAFT) {
          console.error(`[land] could not publish ${slug}: ${published.error}`);
          return 1;
        }
      }

      const result = landBranch({
        branch: get("--branch"),
        base: get("--base") || "main",
        title: get("--title"),
        bodyFile,
        passed: passed && auto,
        announceUrl: get("--announce") || "",
      });
      console.log(`[land] ${result.outcome}:${result.pr}`);
      emit("outcome", result.outcome);
      emit("pr", String(result.pr));
      // The GATE verdict as its own output: a failed gate deliberately still exits 0 here (the
      // draft PR is the designed fallback), so a caller recording gate state must never infer it
      // from this step's exit code — the V2 canary recorded a pass the gate never earned that way.
      emit("gate", passed ? "passed" : "failed");
      return 0;
    }

    // The concurrency key has to be known before the job that would compute it starts, so this
    // runs in a tiny first job: slug + issue + source, from either trigger shape.
    case "resolve-change": {
      const event = get("--event") || "workflow_dispatch";
      let resolved = { slug, issue: get("--issue") || "", source: get("--source") || "request" };
      // The issue number is validated BEFORE anything is emitted or fetched. It becomes a step
      // output, a branch suffix, a `gh issue` argument and a PR title — a value that is not a
      // number has no valid use in any of them, so it is refused here rather than carried.
      if (resolved.issue !== "" && !/^\d+$/.test(String(resolved.issue))) {
        console.error(`[resolve] "${resolved.issue}" isn't an issue number.`);
        return 1;
      }
      if (event === "issues") {
        const { resolveSlug } = await import("./pipeline/issue.mjs");
        // ONE issue-body source for the whole change lifecycle: the LIVE issue, read here the
        // same way `plan --from-issue` reads it. The event payload is a snapshot from the moment
        // the label landed, and using it here while the planner read the live body meant an edit
        // in between gave the two steps different text.
        if (!resolved.issue) { console.error("[resolve] an issues-triggered run needs --issue."); return 1; }
        try { resolved.slug = resolveSlug(await issueBody(resolved.issue)); }
        catch (err) { console.error(`[resolve] ${err.message}`); return 1; }
        // Both request labels mean the same thing now — the old modify/revise split was a
        // difference of weight, and the plan carries weight.
        resolved.source = "request";
      }
      if (!resolved.slug || !isValidSlug(resolved.slug)) {
        console.error(`[resolve] "${resolved.slug}" isn't a valid slug.`);
        return 1;
      }
      for (const [k, v] of Object.entries(resolved)) emit(k, v);
      console.log(`[resolve] ${resolved.slug} — source ${resolved.source}${resolved.issue ? `, issue #${resolved.issue}` : ""}`);
      return 0;
    }

    // Close the loop with whoever asked. A merged change closes the issue; a draft PR leaves it
    // open, because the edit has not landed yet.
    case "report": {
      const issue = get("--issue");
      if (!issue) { console.error("[report] --issue is required"); return 1; }
      const { readFileSync, existsSync: exists } = await import("node:fs");
      const { gh: ghCli } = await import("./lib/cli.mjs");
      const outcome = get("--outcome");
      const pr = get("--pr");
      const summaryFile = get("--summary");
      const summary = summaryFile && exists(summaryFile) ? readFileSync(summaryFile, "utf8").trim() : "";
      const merged = outcome === "merged";
      const body =
        (merged
          ? `Landed in #${pr} — live on the next deploy.`
          : `Left as draft PR #${pr}: it did not pass the evidence gate, or the merge hit a conflict. This issue stays open until the change lands.`) +
        (summary ? `\n\n---\n\n${summary}` : "");
      try {
        ghCli(["issue", "comment", String(issue), "--body", body]);
        if (merged) ghCli(["issue", "close", String(issue)]);
      } catch (err) {
        console.error(`[report] could not update #${issue}: ${err.message}`);
      }
      return 0;
    }

    case "publish": {
      if (!needSlug()) return 1;
      const { publishGuide, PUBLISH_ERRORS } = await import("./pipeline/publish.mjs");
      const result = await publishGuide(slug, { gatePassed: has("--gate-passed") ? true : null });
      if (result.ok) { console.log(`[publish] ${slug} is live on the next deploy — draft flag removed from ${result.metaPath}`); return 0; }
      if (result.error === PUBLISH_ERRORS.NOT_FOUND) { console.error(`[publish] no guide at src/content/guides/${slug}/_guide.json`); return 2; }
      if (result.error === PUBLISH_ERRORS.NOT_DRAFT) { console.error(`[publish] ${slug} is already published — nothing to do`); return 3; }
      console.error(`[publish] ${slug} did NOT pass the evidence gate (npm run build + npm run verify --network) — refusing to publish.`);
      return 4;
    }

    case "scaffold": {
      if (!needSlug()) return 1;
      const { runScaffold } = await import("./pipeline/scaffold.mjs");
      try { await runScaffold(get); return 0; }
      catch (err) { console.error(`[scaffold] ${err.message}`); return 1; }
    }

    default:
      console.error(`[pipeline] unknown subcommand "${cmd}" — one of: prompt, branch, route, gate, questions, answers-route, answers-apply, plan, land, scaffold, publish`);
      return 1;
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
// TWO forms, deliberately. The flag form is the checkpoint spine an agent touches by hand and is
// quoted verbatim in prompts, the skill and the docs — it does not change:
//   node scripts/pipeline.mjs --slug korea --status [--json]
//   node scripts/pipeline.mjs --slug korea --checkpoint passA --note "anchor verified vs official"
//   node scripts/pipeline.mjs --slug korea --init [--force] | --bump-attempt [--json]
//
// The subcommand form is the ORCHESTRATION the workflows call, so no workflow contains business
// logic. Each loads its module lazily, so the hot checkpoint path above stays a two-file program:
//   prompt <file>                        compose an agent prompt from prompts/ (WP_* → {{vars}})
//   route --slug <s> [--json]            next stage
//   gate <kind> …                        budget · artifacts · coverage · compose · integrity · forks
//   questions --slug <s> [--issue <n>]   surface open traveler questions
//   plan --from-issue <n> | --from-staleness | --from-answers | --date-lock --slug <s>
//   land --slug <s> --branch <b> …       publish (draft flip) + open/merge the PR
//   scaffold --slug <s> --issue <n>      commit a new scaffold to main, reply, close the issue
//   publish --slug <s>                   manual override: the same evidence gate, then the flip
// NO top-level await in this block, deliberately. Subcommand modules (gate.mjs) statically
// import THIS module back; a top-level await here suspends this module's evaluation, the
// dynamic import of the subcommand then waits on that evaluation, and the process deadlocks
// and drains (Node exit 13, "unsettled top-level await") — the exact failure the first live
// V2 canary hit at `gate preflight`. An async main invoked as a plain promise lets module
// evaluation finish immediately, so the cycle resolves.
async function cliMain() {
  const argv = process.argv.slice(2);
  const get = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);

  if (argv[0] && !argv[0].startsWith("--")) {
    // The subcommands return exit codes rather than throwing — except for the refusals that must
    // stop a run outright (a step output carrying a newline). Catch here so even those reach the
    // log as one line, keeping this file's "a reason on stderr, never a stack trace" contract.
    try {
      process.exit(await runSubcommand(argv[0], argv.slice(1), get));
    } catch (err) {
      console.error(`[pipeline] ${err?.message || err}`);
      process.exit(1);
    }
  }

  const slug = get("--slug");
  if (!slug) { console.error("Usage: node scripts/pipeline.mjs --slug <slug> [--status [--json] | --init [--force] | --checkpoint <stage> [--note ..] | --bump-attempt [--json]]"); process.exit(1); }
  if (!isValidSlug(slug)) {
    // S4: an unvalidated slug becomes a path segment in statePath() below — `--slug
    // ../../x` would write the state file outside guides-intake/ entirely.
    console.error(`[pipeline] "${slug}" isn't a valid slug (lowercase, digits, single hyphens) — aborting before any path is built.`);
    process.exit(1);
  }
  const asJson = argv.includes("--json");

  if (argv.includes("--init")) {
    const state = await initState(slug, { force: argv.includes("--force") });
    console.log(`[pipeline] ${slug} — state initialized (scaffold cleared).`);
    console.log(statusLines(slug, state).join("\n"));
  } else if (argv.includes("--checkpoint")) {
    const stage = get("--checkpoint");
    // Enforce the commit-after-each-stage contract at the CLI boundary — the one place the
    // research agent actually touches the spine. Skipped only when there is no git repo at all
    // (a tool-environment fact, not a discipline failure); a repo where the predecessor simply
    // isn't committed yet is exactly the case this exists to catch.
    if (STAGE_ORDER.includes(stage)) {
      const { execFileSync } = await import("node:child_process");
      const inRepo = (() => {
        try { execFileSync("git", ["rev-parse", "--git-dir"], { cwd: ROOT, stdio: "pipe" }); return true; }
        catch { return false; }
      })();
      if (inRepo) {
        let committed;
        try {
          committed = JSON.parse(execFileSync("git", ["show", `HEAD:guides-intake/${slug}/state.json`], { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }));
        } catch { committed = null; }
        const blocker = uncommittedPredecessor(stage, committed);
        if (blocker) {
          console.error(`[pipeline] REFUSING to checkpoint "${stage}" — its predecessor "${blocker}" is not committed at HEAD.`);
          console.error(`  The contract is checkpoint AND COMMIT after EACH stage, so a cut-off run resumes at the next`);
          console.error(`  un-done stage instead of restarting. Batching stages into one commit at the end is not resumable.`);
          console.error(`  Fix: commit "${blocker}" first —`);
          console.error(`    git add -A && git commit -m "research(${slug}): ${blocker}" && git push`);
          console.error(`  then re-run this checkpoint.`);
          process.exit(4);
        }
      }
    }
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

if (isMain(import.meta.url)) {
  cliMain().catch((err) => {
    console.error(`[pipeline] ${err?.message || err}`);
    process.exit(1);
  });
}
