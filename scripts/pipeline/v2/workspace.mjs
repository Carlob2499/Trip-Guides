// PIPELINE V2 — mechanical stage isolation (M4).
//
// Separate Claude invocations alone are insufficient (the execution prompt's words). Two
// boundaries are enforced HERE, as prepared inputs, instead of asked for in prose:
//
//   PASS B   Its workspace is derived from the run's recorded BASELINE commit (the branch tip at
//            init, before any Pass-A work landed on the run branch), so Pass A's completed guide
//            and Pass-A-derived evidence are not present — not hidden, ABSENT. In CI the passB
//            job checks out that baseline sha directly (fetch-depth 1: not even in history);
//            locally/tests use preparePassBWorkspace(), a detached git worktree at the same
//            commit. Either way verifyPassBWorkspace() fails closed if a V2 research artifact is
//            somehow present. The WORKFLOW (collectPassB) validates and transfers the artifact —
//            Pass B never needs git/Bash to checkpoint itself.
//
//   CRITIC   Product blindness, not an incoherent file ban: the critic may read the finished
//            guide, frozen intake, the Guide Author skill, the rubric and the human ledger. It
//            may NOT read the raw evidence artifacts, V2 run state, or prior git history.
//            prepareCriticInput() deletes the forbidden files from the working tree before the
//            agent runs (the CI job also checks out with fetch-depth 1, so prior history is
//            mechanically absent); restoreCriticInput() puts them back afterwards so the
//            workflow's own bookkeeping still works. A Bash-equipped agent could in principle
//            dig a current-commit blob out of git — the boundary is the prepared input plus the
//            prompt contract, enforced as far as is practical (the execution prompt's own bar).

import { existsSync, rmSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ContractError, EVIDENCE_SCHEMA, evidenceDocSchema, parseOrThrow, assertVersionCompatible } from "./contracts.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function git(args, { cwd = ROOT } = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

/** The V2 research artifacts that must NEVER be visible to Pass B, and that the critic's
    prepared input excludes (V1 siblings included — same class of leak). */
export function forbiddenForPassB(slug) {
  return [
    `guides-intake/${slug}/evidence.v2.json`,
    `guides-intake/${slug}/run.v2.json`,
    `guides-intake/${slug}/coverage.v2.json`,
    `guides-intake/${slug}/passB.v2.json`,
  ];
}

export function forbiddenForCritic(slug) {
  return [
    ...forbiddenForPassB(slug),
    `guides-intake/${slug}/state.json`,
    `guides-intake/${slug}/passB.json`,
    `guides-intake/${slug}/coverage.json`,
  ];
}

/** Fail-closed check that a prepared Pass-B workspace really excludes Pass-A outputs. */
export function verifyPassBWorkspace(slug, workspaceDir) {
  const leaks = forbiddenForPassB(slug).filter((rel) => existsSync(path.join(workspaceDir, rel)));
  if (leaks.length) {
    throw new ContractError(
      `prepared Pass-B workspace at ${workspaceDir} CONTAINS research artifacts it must not see:\n` +
        leaks.map((l) => `  · ${l}`).join("\n") +
        `\nThe recorded baseline commit is not clean — Pass B cannot run on this input.`,
    );
  }
  const intake = path.join(workspaceDir, "guides-intake", slug, "intake.md");
  if (!existsSync(intake)) {
    throw new ContractError(
      `prepared Pass-B workspace at ${workspaceDir} is missing the frozen intake ` +
        `(guides-intake/${slug}/intake.md) — Pass B has nothing to research from.`,
    );
  }
  return true;
}

/** Local/test mechanism: a detached git worktree at the baseline commit. CI uses a direct
    baseline checkout instead; both must pass verifyPassBWorkspace. */
export function preparePassBWorkspace(slug, { baseCommit, destDir, cwd = ROOT }) {
  if (!baseCommit) throw new ContractError("preparePassBWorkspace needs the run's recorded baseline commit — refusing to guess one.");
  git(["worktree", "add", "--detach", destDir, baseCommit], { cwd });
  try {
    verifyPassBWorkspace(slug, destDir);
  } catch (err) {
    removePassBWorkspace(destDir, { cwd });
    throw err;
  }
  return { dir: destDir, baseCommit };
}

export function removePassBWorkspace(destDir, { cwd = ROOT } = {}) {
  try { git(["worktree", "remove", "--force", destDir], { cwd }); }
  catch { rmSync(destDir, { recursive: true, force: true }); }
}

/** Validate Pass B's output artifact and transfer it into the control-plane checkout. The
    WORKFLOW calls this after the agent returns — Pass B itself never commits. */
export async function collectPassB(slug, { fromDir, intoDir = ROOT }) {
  const rel = path.join("guides-intake", slug, "passB.v2.json");
  const src = path.join(fromDir, rel);
  if (!existsSync(src)) {
    throw new ContractError(
      `Pass B produced no artifact at ${src} — a void Pass B is a blocking failure, not an empty result.`,
      { file: src },
    );
  }
  let raw;
  try { raw = JSON.parse(await readFile(src, "utf8")); }
  catch (err) {
    throw new ContractError(`Pass B artifact at ${src} is not valid JSON (${err.message}).`, { file: src });
  }
  assertVersionCompatible(raw.schemaVersion, EVIDENCE_SCHEMA, { file: src });
  const doc = parseOrThrow(evidenceDocSchema, raw, { file: src, what: "Pass B artifact" });
  // Independence cuts both ways: a Pass-B artifact may carry ONLY Pass-B findings, and it never
  // reconciles anything — that is the reconcile stage's job on the other side of the wall.
  const foreign = doc.evidence.filter((e) => e.origin !== "passB");
  if (foreign.length) {
    throw new ContractError(
      `Pass B artifact carries ${foreign.length} record(s) with origin other than "passB" ` +
        `(${[...new Set(foreign.map((e) => e.origin))].join(", ")}) — an independent pass cannot testify for the other passes.`,
      { file: src },
    );
  }
  if (doc.reconciliation.length) {
    throw new ContractError(
      `Pass B artifact carries reconciliation dispositions — reconciling is the reconcile stage's job, not Pass B's.`,
      { file: src },
    );
  }
  const dest = path.join(intoDir, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, JSON.stringify(doc, null, 2) + "\n");
  return { doc, dest };
}

/** Delete the critic's forbidden files from the working tree. Returns what was deleted so the
    workflow can restore exactly that set. */
export function prepareCriticInput(slug, { cwd = ROOT } = {}) {
  const deleted = [];
  for (const rel of forbiddenForCritic(slug)) {
    const abs = path.join(cwd, rel);
    if (existsSync(abs)) {
      rmSync(abs);
      deleted.push(rel);
    }
  }
  return { deleted };
}

/** Restore the tracked files prepareCriticInput removed (untracked ones are simply gone, which
    is correct — they were never committed evidence). */
export function restoreCriticInput(slug, { cwd = ROOT, deleted = null } = {}) {
  const candidates = deleted ?? forbiddenForCritic(slug);
  const restored = [];
  for (const rel of candidates) {
    try {
      git(["checkout", "--", rel], { cwd });
      restored.push(rel);
    } catch {
      // not tracked at HEAD — nothing to restore
    }
  }
  return { restored };
}
