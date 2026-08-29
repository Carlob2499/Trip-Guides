// POST-#105 R-A — THE ROUTED REPLAY DOES NOT RE-SPEND THE PAID CRITIC MODEL.
//
// The cross-checkout round trip (pipeline-v2-repair-roundtrip.test.mjs) proves the DECISION: after
// the evidence owner repairs the relation, the real `begin-stage` CLI reads durable state from a
// fresh clone and emits `replay=true`. What it cannot prove is what the JOB then does with that
// decision, because a GitHub Actions job is a sequence of separately-gated steps, not one script.
//
// So this file executes the critic job's real steps, in their real order, with their real `if:`
// guards evaluated, against stubs — and COUNTS `docker run`, which is the paid model invocation.
// The two files compose into the whole claim:
//
//   round trip : durable state after the owner's repair  ⇒  begin-stage emits replay=true
//   this file  : replay=true                             ⇒  the model is never invoked, the
//                                                           retained bytes are untouched, and the
//                                                           deterministic tail still runs
//
// The step guards are read from the YAML, never restated here: a guard that stops matching is a
// failure, not a silently-passing test.
//
// @protects-file A routed evidence-owner replay revalidates the retained critic pass; it never buys another.

import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm, cp } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
// Workflow parsing is a line-oriented contract. Normalize checkout line endings so the same
// assertions exercise the YAML on Windows (core.autocrlf=true) and Linux runners.
const WORKFLOW = readFileSync(path.join(ROOT, ".github", "workflows", "research-pass-v2.yml"), "utf8").replace(/\r\n/g, "\n");
const SLUG = "tottori";
const BASH = process.platform === "win32"
  ? [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]]
    .filter(Boolean)
    .map((root) => path.join(root, "Git", "bin", "bash.exe"))
    .find((candidate) => existsSync(candidate)) || "bash"
  : "bash";
const RETAINED_GUIDE = '[{"title":"Key transit routes","source_url":"https://hinomarubus.co.jp/timetable_route/3450/?tab=2"}]\n';
const RETAINED_HANDOFF = '{"corrections":[{"target":"05-transit.json#/0/source_url"}]}\n';

// ── the critic job's steps, read out of the workflow ─────────────────────────

/** Every `run:` step of the critic job, in order, with its guard. `uses:` steps are checkout /
    setup-node actions with no shell body — they are not part of what this proves. */
function criticRunSteps() {
  const job = WORKFLOW.split(/^ {2}critic:$/m)[1].split(/^ {2}land:$/m)[0];
  return job.split(/^ {6}- /m).slice(1).map((block) => {
    const name = /^name: (.+)$/m.exec(block)?.[1];
    if (!name) return null;                                        // a `uses:` step
    const guard = /^ {8}if: (.+)$/m.exec(block)?.[1]?.trim() ?? null;
    const inline = /^ {8}run: (?!\|)(.+)$/m.exec(block)?.[1];
    if (inline) return { name, guard, body: inline };
    const block_ = block.split(/^ {8}run: \|$/m)[1];
    if (!block_) return null;                                      // no shell body
    const body = block_.split(/^ {6}- /m)[0].split("\n").map((l) => l.slice(10)).join("\n");
    return { name, guard, body };
  }).filter(Boolean);
}

/** Evaluate the guard forms the critic job actually uses. Deliberately NOT a general Actions
    expression engine: an unrecognised guard throws, so a new one cannot be silently mis-evaluated
    into "this step ran". */
function guardHolds(guard, ctx) {
  if (guard === null) return !ctx.failed;
  const table = {
    "always()": () => true,
    "steps.begin.outputs.replay != 'true'": () => !ctx.failed && !ctx.replay,
    "success() && (steps.agent.outcome == 'success' || steps.begin.outputs.replay == 'true')":
      () => !ctx.failed && (ctx.agentOk || ctx.replay),
    // The form the critic carried BEFORE the replay wiring, and the one the other three stages
    // still carry. Kept so this regression's red-before against a pre-replay head is the model
    // invocation count itself, rather than an unrecognised-guard crash.
    "success() && steps.agent.outcome == 'success'": () => !ctx.failed && ctx.agentOk,
    "(failure() || cancelled())": () => ctx.failed,
    "failure() || cancelled()": () => ctx.failed,
    "failure() && steps.retry.outputs.allowed == 'true'": () => ctx.failed && ctx.retryAllowed,
    "(failure() || cancelled()) && (steps.retry.outputs.allowed != 'true' || steps.redispatch.outcome == 'failure')":
      () => ctx.failed && (!ctx.retryAllowed || ctx.redispatchFailed),
  };
  const fn = table[guard];
  if (!fn) throw new Error(`unrecognised step guard in the critic job — teach this test about it: ${guard}`);
  return fn();
}

/** Actions substitutes `${{ … }}` before the shell ever sees it, so this must too. Explicit and
    fail-closed for the same reason as the guards: a new expression must be taught to the test
    rather than silently expanding to nothing. */
function substituteExpressions(body, ctx) {
  const values = {
    "github.ref_name": "research-v2/tottori",
    "github.token": "x-token",
    "inputs.critic_model || 'claude-opus-5'": "claude-opus-5",
    "inputs.critic_model": "claude-opus-5",
    "inputs.effort || 'high'": "high",
    "inputs.effort": "high",
    "inputs.model": "claude-sonnet-5",
    "inputs.slug": SLUG,
    "needs.setup.outputs.branch": `research-v2/${SLUG}`,
    "secrets.CLAUDE_CODE_OAUTH_TOKEN": "x-oauth",
    "steps.agent.conclusion": ctx.agentConclusion,
    "steps.contract.outputs.capsule": "(capsule)",
    "steps.feedback.outputs.findings": "(findings)",
    "steps.fetch_policy.outputs.tools": "(tools)",
    "steps.prompt.outputs.text": "(prompt)",
    "steps.redispatch.outcome == 'failure'": String(ctx.redispatchFailed),
  };
  return body.replace(/\$\{\{([^}]*)\}\}/g, (_, expr) => {
    const key = expr.trim();
    if (!(key in values)) throw new Error(`unrecognised workflow expression — teach this test about it: ${key}`);
    return values[key];
  });
}

// ── running those steps against stubs ────────────────────────────────────────

/** Lay out a workspace that looks like the critic job's checkout of the RUN BRANCH after a routed
    exit 3: the retained corrected guide, the retained handoff, ledger and patterns are already
    there, because `needs-reconcile` committed and pushed them. */
async function layout(root) {
  const ws = path.join(root, "ws");
  const collect = path.join(root, "collect");
  for (const base of [ws, collect]) {
    await mkdir(path.join(base, "guides-intake", SLUG), { recursive: true });
    await mkdir(path.join(base, "src", "content", "guides", SLUG), { recursive: true });
    await writeFile(path.join(base, "src", "content", "guides", SLUG, "05-transit.json"), RETAINED_GUIDE);
    await writeFile(path.join(base, "guides-intake", SLUG, "critic-corrections.v2.json"), RETAINED_HANDOFF);
    await writeFile(path.join(base, "guides-intake", SLUG, "ledger.md"), "## Critic findings\nthe paid analysis\n");
    await writeFile(path.join(base, "guides-intake", SLUG, "pipeline-patterns.fragment.md"), "| row |\n");
  }
  await mkdir(path.join(ws, "scripts"), { recursive: true });
  await cp(path.join(ROOT, "scripts", "run-logged-command.sh"), path.join(ws, "scripts", "run-logged-command.sh"));
  // A real checkout: history plus the origin the credential-removal step rewrites.
  for (const base of [ws, collect]) {
    execFileSync("git", ["init", "-q", base]);
    execFileSync("git", ["remote", "add", "origin", "https://github.com/Carlob2499/Trip-Guides.git"], { cwd: base });
  }
  return { ws, collect };
}

async function stubs(bin, temp) {
  const write = (name, body) => writeFile(path.join(bin, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  // THE COUNTER: `docker run` is the paid critic model. Nothing else invokes it.
  await write("docker", `echo "docker $*" >> "${temp}/model-invocations.txt"\nexit 0`);
  await write("npm", `echo "npm $*" >> "${temp}/calls.txt"\nexit 0`);
  await write("rsync", [
    `echo "rsync $*" >> "${temp}/calls.txt"`,
    'for a in "$@"; do case "$a" in -*) ;; *) src=$dst; dst=$a ;; esac; done',
    'mkdir -p "$dst"; cp -R "$src." "$dst"',
    "exit 0",
  ].join("\n"));
  await write("node", [
    `echo "node $*" >> "${temp}/calls.txt"`,
    "case \"$*\" in",
    // begin-stage publishes the decision the round-trip test proves the REAL CLI derives from
    // durable state. Everything downstream of it is the genuine workflow wiring.
    '  *begin-stage*) [ -n "$GITHUB_OUTPUT" ] && echo "replay=$WP_TEST_REPLAY" >> "$GITHUB_OUTPUT" ;;',
    "esac",
    "exit 0",
  ].join("\n"));
}

/** Execute the critic job's steps for one scenario, and report what ran. */
async function runCriticJob({ replay }) {
  const root = await mkdtemp(path.join(tmpdir(), "waypoint-critic-replay-"));
  const { ws, collect } = await layout(root);
  const temp = path.join(root, "temp");
  const bin = path.join(root, "bin");
  await mkdir(temp, { recursive: true });
  await mkdir(bin, { recursive: true });
  await stubs(bin, temp);
  await writeFile(path.join(temp, "calls.txt"), "");
  await writeFile(path.join(temp, "model-invocations.txt"), "");
  const ghOutput = path.join(temp, "gh-output.txt");
  await writeFile(ghOutput, "");

  const ran = [];
  const ctx = { replay, failed: false, agentOk: false, retryAllowed: false, redispatchFailed: false, agentConclusion: "skipped" };
  for (const step of criticRunSteps()) {
    // The decision only exists AFTER begin-stage has emitted it, exactly as in Actions.
    if (!guardHolds(step.guard, ctx)) continue;
    ran.push(step.name);
    const script = path.join(temp, `step-${ran.length}.sh`);
    await writeFile(script, substituteExpressions(step.body, ctx));
    const cwd = /working-directory: collect/.test(step.body) ? collect : ws;
    let status = 0;
    try {
      execFileSync(BASH, [script], {
        cwd: step.name.startsWith("Collect allowed output") || step.name.startsWith("Record agent failure") ? collect : cwd,
        env: {
          // The workflow body runs under bash, but Vitest may be launched from Windows where
          // PATH entries are semicolon-delimited. Use the host delimiter so the command stubs
          // are discoverable on both platforms.
          ...process.env, PATH: [bin, process.env.PATH].join(path.delimiter),
          SLUG, BRANCH: `research-v2/${SLUG}`, GITHUB_WORKSPACE: ws, RUNNER_TEMP: temp,
          GITHUB_OUTPUT: ghOutput, GITHUB_REPOSITORY: "Carlob2499/Trip-Guides",
          WP_TEST_REPLAY: String(replay),
        },
        stdio: "pipe",
      });
    } catch (err) { status = err.status ?? 1; }
    if (step.name === "Run research agent — Critic") { ctx.agentOk = status === 0; ctx.agentConclusion = status === 0 ? "success" : "failure"; }
    if (status !== 0) ctx.failed = true;
  }
  return {
    root, ws, ran,
    modelInvocations: (await readFile(path.join(temp, "model-invocations.txt"), "utf8")).trim().split("\n").filter(Boolean).length,
    calls: await readFile(path.join(temp, "calls.txt"), "utf8"),
  };
}

// ── the claims ───────────────────────────────────────────────────────────────

describe("R-A — a routed evidence-owner replay revalidates the retained critic pass", () => {
  it("B: replay=true — the paid model is NOT invoked, and the retained bytes are untouched", async () => {
    const r = await runCriticJob({ replay: true });
    try {
      // 1. THE COUNT. This is the blocker: production must not buy a second critic pass.
      expect(r.modelInvocations).toBe(0);
      expect(r.ran).not.toContain("Run research agent — Critic");

      // 2. Nothing that exists only to prepare a NEW agent invocation runs — each of these
      //    mutates or destroys the retained output it was designed to replace.
      expect(r.ran).not.toContain("Prepare the critic's blind input");          // deletes forbidden files
      expect(r.ran).not.toContain("Replace git history with a local-only sandbox repository"); // rm -rf .git
      expect(r.ran).not.toContain("Compose critic prompt");
      expect(r.ran).not.toContain("Stage retry feedback (validator data, this stage only)");
      expect(r.ran).not.toContain("Generate the machine-contract capsule");
      expect(r.ran).not.toContain("Build the critic's source-domain fetch policy");
      // …and the checkout's own history survives, because the sandbox step never ran.
      expect(existsSync(path.join(r.ws, ".git"))).toBe(true);

      // 3. The retained critic output is byte-identical afterwards: nothing regenerated it,
      //    overwrote it with a pre-critic tree, or erased the handoff.
      expect(await readFile(path.join(r.ws, "src", "content", "guides", SLUG, "05-transit.json"), "utf8")).toBe(RETAINED_GUIDE);
      expect(await readFile(path.join(r.ws, "guides-intake", SLUG, "critic-corrections.v2.json"), "utf8")).toBe(RETAINED_HANDOFF);
      expect(await readFile(path.join(r.ws, "guides-intake", SLUG, "ledger.md"), "utf8")).toMatch(/the paid analysis/);

      // 4. The deterministic tail still runs in full — a replay is revalidation, not a free pass.
      expect(r.ran).toContain("Collect allowed output, compose, validate, commit, checkpoint");
      for (const call of ["reconcile-critic-truth", "compound-patterns", "compose-guide", "remap-coverage", "finish-stage"]) {
        expect(r.calls).toContain(call);
      }
      expect(r.calls).toMatch(/npm run build/);
      expect(r.calls).toMatch(/npm run verify/);
      // The critic is NOT completed just because reconcile was: finish-stage is what completes it.
      expect(r.calls).not.toContain("fail-stage");
    } finally { await rm(r.root, { recursive: true, force: true }); }
  }, 120_000);

  it("A: replay=false — an ordinary critic retry still invokes the model exactly once", async () => {
    const r = await runCriticJob({ replay: false });
    try {
      // The replay path must never become a general "skip the critic" escape hatch.
      expect(r.modelInvocations).toBe(1);
      expect(r.ran).toContain("Run research agent — Critic");
      expect(r.ran).toContain("Prepare the critic's blind input");
      expect(r.ran).toContain("Replace git history with a local-only sandbox repository");
      // …and it still reaches the same deterministic tail.
      expect(r.ran).toContain("Collect allowed output, compose, validate, commit, checkpoint");
      expect(r.calls).toContain("reconcile-critic-truth");
    } finally { await rm(r.root, { recursive: true, force: true }); }
  }, 120_000);
});
