// M1 of Pipeline V2 (the archived V2 build prompt: docs/archive/INDEX.md → FABLE_IMPLEMENTATION_PROMPT) — publication-safety
// repairs to the CURRENT (V1/shared) landing code, pinned so they cannot regress:
//
//   1. `pipeline land --gate` runs the REAL evidence gate — build first, then the networked
//      verify — not verify alone. It used to run only the verify and then tell publishGuide the
//      gate had passed, so a guide whose build was broken could publish.
//   2. The workflows run artifacts, compose and integrity BEFORE the landing step, so their
//      verdicts can block a merge instead of arriving after one.
//   3. The contradiction preflight commits the file its --write actually mutates (the ledger).
//      It used to commit intake.md — the one file the check never writes — so every preflight
//      finding was silently left uncommitted and lost with the runner.

// @protects-file No lifecycle can publish before build, compose, integrity and required evidence pass.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { landingGate } from "../pipeline/publish.mjs";
import { preflightCommitPath } from "../pipeline/gate.mjs";
import { applyContradictions } from "../audit/check-intake-contradictions.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const readRepo = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

describe("landingGate — the landing step runs the REAL evidence gate", () => {
  it("runs build FIRST, then the networked markdown verify", () => {
    const seen = [];
    const gate = landingGate("korea", { exec: (cmd) => { seen.push(cmd); return { code: 0, out: "ok" }; } });
    expect(gate.passed).toBe(true);
    expect(seen[0]).toBe("npm run build");
    expect(seen[1]).toContain("--network");
    expect(seen[1]).toContain("--markdown");
    expect(seen[1]).toContain("--slug korea");
  });

  it("short-circuits on a failing build — verify never runs, the gate fails", () => {
    const seen = [];
    const gate = landingGate("korea", { exec: (cmd) => { seen.push(cmd); return { code: 1, out: "schema error: bad section" }; } });
    expect(gate.passed).toBe(false);
    expect(seen).toEqual(["npm run build"]);
    // The scorecard (the PR body) says WHY there is no verify scorecard.
    expect(gate.scorecard).toContain("build FAILED");
    expect(gate.scorecard).toContain("schema error: bad section");
  });

  it("a failing verify fails the gate and its output becomes the scorecard", () => {
    const gate = landingGate("korea", {
      exec: (cmd) => (cmd === "npm run build" ? { code: 0, out: "" } : { code: 1, out: "## Scorecard\nNEEDS WORK" }),
    });
    expect(gate.passed).toBe(false);
    expect(gate.scorecard).toContain("NEEDS WORK");
  });

  it("refuses an invalid slug before running anything — it becomes a shell argument", () => {
    expect(() => landingGate("korea; rm -rf /", { exec: () => ({ code: 0, out: "" }) })).toThrow(/valid slug/i);
  });

  it("the land subcommand actually uses it (the CLI seam is wired, not a second copy)", () => {
    const src = readRepo("scripts/pipeline.mjs");
    const landCase = src.split('case "land"')[1]?.split("case ")[0] || "";
    expect(landCase).toContain("landingGate(");
    // The old shape — a bare verify with no build — must not come back.
    expect(landCase).not.toMatch(/execSync\(`npm run verify/);
  });
});

describe("preflight commits the file it writes", () => {
  let intakeDir;
  beforeEach(async () => {
    intakeDir = await mkdtemp(path.join(tmpdir(), "waypoint-preflight-"));
  });
  afterEach(async () => {
    await rm(intakeDir, { recursive: true, force: true });
  });

  it("applyContradictions writes the LEDGER, never the frozen intake — and the preflight commit path names that same file", async () => {
    const slug = "testland";
    const dir = path.join(intakeDir, slug);
    await mkdir(dir, { recursive: true });
    const intakeText = [
      "# New Guide Intake — Testland",
      "",
      "- **Dates (target):** 2026-10-15 – 2026-10-22",
      "",
      "Comments: still deciding between Oct 15 or Oct 22 for the start.",
      "",
    ].join("\n");
    await writeFile(path.join(dir, "intake.md"), intakeText);

    const { applied } = await applyContradictions(slug, intakeDir);
    expect(applied).toBeGreaterThan(0);

    // The finding landed in the ledger…
    const ledger = await readFile(path.join(dir, "ledger.md"), "utf8");
    expect(ledger).toContain("## Questions for the traveler");
    expect(ledger).toContain(`q-${slug}-dates-range`);
    // …and the intake is byte-identical: frozen intent is never written.
    expect(await readFile(path.join(dir, "intake.md"), "utf8")).toBe(intakeText);

    // The commit pathspec the preflight gate stages is exactly the file that was written.
    expect(preflightCommitPath(slug).replace(/\\/g, "/")).toBe(`guides-intake/${slug}/ledger.md`);
    expect(preflightCommitPath(slug)).not.toContain("intake.md");
  });
});

// ── workflow order — the gates run where they can still block ────────────────
// Text-level boundary checks, same technique as prompt-contract.test.mjs: the workflows are the
// one place ordering lives, and nothing else executes them before CI does.

function stepNames(yamlText) {
  return [...yamlText.matchAll(/^ {6}- name: (.+)$/gm)].map((m) => m[1].trim());
}

describe("research-pass.yml — gate order", () => {
  const text = readRepo(".github/workflows/research-pass.yml");
  const names = stepNames(text);
  const at = (name) => {
    const i = names.indexOf(name);
    expect(i, `step "${name}" exists`).toBeGreaterThanOrEqual(0);
    return i;
  };

  it("critic artifact gate, integrity, void remediation and compose ALL precede landing", () => {
    const land = at("Land the branch");
    expect(at("Critic artifact gate")).toBeLessThan(land);
    expect(at("Run-integrity gate")).toBeLessThan(land);
    expect(at("Auto-retry once after a void run")).toBeLessThan(land);
    expect(at("File a stuck issue after a second void run")).toBeLessThan(land);
    expect(at("Compose check")).toBeLessThan(land);
  });

  it("landing downgrades to a draft PR when integrity or compose failed", () => {
    const landStep = text.split("- name: Land the branch")[1].split("- name:")[0];
    expect(landStep).toContain('--land "$LAND"');
    for (const guard of ['"$VOID" = "true"', '"${VIOLATIONS:-0}" != "0"', '"$COMPOSE_OUTCOME" = "failure"']) {
      expect(landStep).toContain(guard);
    }
    expect(landStep).toContain("--gate");
  });

  it("compose is continue-on-error (a draft PR still lands) and enforce turns it red", () => {
    const composeStep = text.split("- name: Compose check")[1].split("- name:")[0];
    expect(composeStep).toContain("continue-on-error: true");
    const enforceStep = text.split("- name: Enforce run integrity")[1].split("- name:")[0];
    expect(enforceStep).toContain("--compose");
    expect(names.indexOf("Enforce run integrity")).toBeGreaterThan(names.indexOf("Land the branch"));
  });
});

describe("change.yml — gate order", () => {
  const text = readRepo(".github/workflows/change.yml");
  const names = stepNames(text);
  const at = (name) => {
    const i = names.indexOf(name);
    expect(i, `step "${name}" exists`).toBeGreaterThanOrEqual(0);
    return i;
  };

  it("fork gate, continuity artifacts and integrity ALL precede landing", () => {
    const land = at("Land the branch");
    expect(at("Fork gate")).toBeLessThan(land);
    expect(at("Continuity artifact gate")).toBeLessThan(land);
    expect(at("Run-integrity gate")).toBeLessThan(land);
  });

  it("the change integrity gate ENFORCES (no remediation between report and verdict)", () => {
    const step = text.split("- name: Run-integrity gate")[1].split("- name:")[0];
    expect(step).toContain("--enforce");
  });

  it("landing still runs the real evidence gate", () => {
    const landStep = text.split("- name: Land the branch")[1].split("- name:")[0];
    expect(landStep).toContain("--gate");
  });
});

describe("gate enforce — compose verdict reaches the red/green decision", () => {
  it("the enforce dispatcher accepts a compose outcome (wired through the CLI)", () => {
    const src = readRepo("scripts/pipeline.mjs");
    expect(src).toContain('compose: get("--compose")');
    const gateSrc = readRepo("scripts/pipeline/gate.mjs");
    expect(gateSrc).toMatch(/compose === "failure"/);
  });
});
