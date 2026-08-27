// PIPELINE V2 — a failed gate must hand its retry something ACTIONABLE.
//
// Canary luxembourg-20260821-99c13e (2026-08-21) reached the critic, the schema gate
// (`npm run build`) correctly rejected an explicit theme.primary at 2.53:1 against the dark
// ground, and the run then could not converge: the findings parser was written for
// `npm run verify`'s scorecard grammar, matched zero lines of Astro's output, and stored the
// placeholder "offline verify failed — see the run log scorecard". The retry agent runs in a
// container and cannot open an Actions log, so the one bounded auto-retry was spent blind.
// Two defects, both pinned here:
//
//   A  extractGateFindings falls back to a bounded, normalised tail of whatever the tool
//      actually said — generically, with no per-tool parser (an Astro-shaped parser would fail
//      the NEXT tool the same way the scorecard parser failed Astro);
//   B  ONE findings array feeds the durable record, the failure detail and the console line —
//      the live run logged "0 finding(s) recorded" while feedback.v2.json carried one.
//
// Plus the repair-scope clarification the same canary exposed: the critic owns _guide.json, so
// validator feedback naming an invalid explicit theme is its repair, not the workflow's.
//
// @protects-file A blocked research run tells its own retry what to fix, instead of failing silently and re-spending the work.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractGateFindings, GATE_NO_OUTPUT_FINDING } from "../pipeline/v2/feedback.mjs";
import { recordGateFailure, allowedStagePaths, criticFetchTools } from "../pipeline-v2.mjs";
import { forbiddenForCritic } from "../pipeline/v2/workspace.mjs";
import {
  initRunV2, stageStart, stageComplete, readRunStateV2, V2_RESEARCH_STAGES,
} from "../pipeline/v2/run-state.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CRITIC_PROMPT = readFileSync(path.join(ROOT, "prompts", "research-critic-v2.md"), "utf8");
const SLUG = "testland";

// The escape byte a TTY-less runner still emits (the real captured canary output carried these).
const ESC = String.fromCharCode(0x1b);
const colour = (code, text) => `${ESC}[${code}m${text}${ESC}[39m`;

/** The extraction as it stood BEFORE this fix. Test 1 asserts equivalence against it, so
    "scorecard behavior is unchanged" is a comparison rather than an assertion of faith. */
const legacyScorecardFindings = (raw) => raw.split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^[⚠✗·]/.test(line) || /·\s*FAIL/.test(line))
  .map((line) => line.slice(0, 400));

const SCORECARD = [
  "Waypoint verify — testland",
  "",
  "⚠ 3 perishable facts past shelf life (fx: 2, transit: 1)",
  "✗ facts.json: fare-day-ticket has no source_url",
  "· routes · FAIL — 2 of 7 transit-leg durations unattested",
  "· sources · pass",
  "",
  "Scorecard: FAIL",
].join("\n");

// Canary #2's shape: Astro's schema rejection, colour codes intact, buried under a stack trace.
const ASTRO_BUILD_FAILURE = [
  "",
  "> waypoint@0.0.1 build",
  "> astro build",
  "",
  `${colour(36, "11:04:18")} ${colour(34, "[content]")} Syncing content`,
  `${colour(36, "11:04:19")} ${colour(34, "[types]")} Generated 412ms`,
  "",
  colour(31, "[InvalidContentEntryDataError] guides → luxembourg data does not match collection schema."),
  `  ${colour(31, "theme.primary")}: theme.primary #9c2f2a has only 2.53:1 contrast against the dark background #0f1317 — needs ≥3:1 on both grounds. Pick a mid-value colour (or supply a lighter tone).`,
  "",
  "  Hint:",
  "    See https://docs.astro.build/en/guides/content-collections/ for more information on content schemas.",
  "  Stack trace:",
  "    at file:///home/runner/work/Trip-Guides/Trip-Guides/node_modules/astro/dist/content/utils.js:107:19",
  "    at Array.map (<anonymous>)",
  "    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)",
  "    at async createContentTypesGenerator (/home/runner/work/Trip-Guides/Trip-Guides/node_modules/astro/dist/content/types-generator.js:45:3)",
  "    at async AstroBuilder.build (/home/runner/work/Trip-Guides/Trip-Guides/node_modules/astro/dist/core/build/index.js:70:5)",
  "",
].join("\n");

describe("extractGateFindings — the scorecard grammar still wins outright", () => {
  it("extracts the validator's own ⚠ / ✗ / · FAIL findings, byte-for-byte as before", () => {
    const findings = extractGateFindings(SCORECARD);
    expect(findings).toEqual(legacyScorecardFindings(SCORECARD));
    expect(findings).toContain("✗ facts.json: fare-day-ticket has no source_url");
    expect(findings).toContain("· routes · FAIL — 2 of 7 transit-leg durations unattested");
  });

  it("does not fall back to the tail when structured findings exist", () => {
    const findings = extractGateFindings(SCORECARD);
    // The tail would have dragged in the header and the verdict line; the structured path must not.
    expect(findings).not.toContain("Waypoint verify — testland");
    expect(findings).not.toContain("Scorecard: FAIL");
    expect(findings.every((f) => /^[⚠✗·]/.test(f) || /·\s*FAIL/.test(f))).toBe(true);
  });
});

describe("extractGateFindings — an unknown tool's failure becomes actionable", () => {
  it("keeps the Astro schema rejection the canary lost: class, field, offending value, threshold", () => {
    const findings = extractGateFindings(ASTRO_BUILD_FAILURE);
    expect(findings.length).toBeGreaterThan(0);
    const block = findings.join("\n");
    expect(block).toContain("InvalidContentEntryDataError");
    expect(block).toContain("theme.primary");
    expect(block).toContain("#9c2f2a");
    expect(block).toContain("2.53:1 contrast against the dark background #0f1317");
    expect(block).toContain("≥3:1");
    // The defect being pinned out: the retry used to receive only this placeholder.
    expect(block).not.toContain("see the run log scorecard");
    expect(findings).not.toEqual([GATE_NO_OUTPUT_FINDING]);
  });

  it("strips the colour codes rather than injecting them into the retry prompt", () => {
    const block = extractGateFindings(ASTRO_BUILD_FAILURE).join("\n");
    expect(block).not.toContain(ESC);
    expect(block).not.toMatch(/\[3[0-9]m/);
  });

  it("drops stack frames and dependency paths — generically, not by knowing Astro", () => {
    const block = extractGateFindings(ASTRO_BUILD_FAILURE).join("\n");
    expect(block).not.toContain("node_modules");
    expect(block).not.toContain("processTicksAndRejections");
    // Nothing in the extractor may name the tool it is reading.
    const source = readFileSync(path.join(ROOT, "scripts", "pipeline", "v2", "feedback.mjs"), "utf8");
    const code = source.split("\n").filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*")).join("\n");
    expect(code).not.toMatch(/astro|InvalidContentEntryData|theme\.primary/i);
  });

  it("bounds an arbitrary tool's output: tail only, blanks gone, per-line and total caps held", () => {
    const noisy = Array.from({ length: 120 }, (_, i) => `frobnicator: step ${i} did something ${"·".repeat(0)}${"x".repeat(900)}`)
      .flatMap((line) => [line, "", "   "])
      .join("\n");
    const findings = extractGateFindings(noisy);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.length).toBeLessThanOrEqual(20);
    expect(findings.every((f) => f.length <= 400)).toBe(true);
    expect(findings.join("").length).toBeLessThanOrEqual(4000);
    expect(findings.some((f) => f.trim() === "")).toBe(false);
    // The TAIL, not the head — the lines nearest the failure are the ones a retry needs.
    expect(findings.at(-1)).toContain("step 119");
    expect(findings.join("\n")).not.toContain("step 0 did");
  });

  it("keeps output that is nothing BUT stack frames rather than letting the noise filter blank it", () => {
    const allFrames = Array.from({ length: 8 }, (_, i) => `    at someFn (/srv/app/node_modules/pkg/dist/x.js:${i}:1)`).join("\n");
    const findings = extractGateFindings(allFrames);
    expect(findings).not.toEqual([GATE_NO_OUTPUT_FINDING]);
    expect(findings.length).toBeGreaterThan(0);
  });
});

describe("extractGateFindings — an admitted blank, never a fabricated zero", () => {
  it.each([["empty string", ""], ["whitespace only", "   \n\n\t\n  "], ["nullish", null], ["ansi only", `${ESC}[2J${ESC}[H`]])(
    "returns exactly one honest finding for %s",
    (_label, input) => {
      const findings = extractGateFindings(input);
      expect(findings).toEqual([GATE_NO_OUTPUT_FINDING]);
      expect(findings.length).toBe(1);
      expect(findings.length).not.toBe(0);
    },
  );
});

describe("recordGateFailure — one findings array, one count, everywhere", () => {
  let dir;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "wp-gate-feedback-"));
    await initRunV2(SLUG, { intakeDir: dir, landMode: "pr" });
    // A real run reaches the critic through the durable stage order; stageStart refuses to skip.
    for (const stage of V2_RESEARCH_STAGES.slice(0, -1)) {
      await stageStart(SLUG, stage, { intakeDir: dir });
      await stageComplete(SLUG, stage, { intakeDir: dir });
    }
    await stageStart(SLUG, "critic", { intakeDir: dir });
  });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it("stores exactly the findings it returns, and reports that same count in the failure detail", async () => {
    const retryFindings = await recordGateFailure(SLUG, "critic", ASTRO_BUILD_FAILURE, { intakeDir: dir });

    const feedback = JSON.parse(await readFile(path.join(dir, SLUG, "feedback.v2.json"), "utf8"));
    const active = feedback.entries.filter((e) => e.stage === "critic" && e.status === "active");
    expect(active).toHaveLength(1);
    expect(active[0].findings).toEqual(retryFindings);

    const state = await readRunStateV2(SLUG, { intakeDir: dir });
    expect(state.stages.critic.failure.detail).toBe(`offline verify failed: ${retryFindings.length} finding(s)`);
    // The live contradiction: a detail saying 0 while the record carried 1.
    expect(state.stages.critic.failure.detail).not.toContain("0 finding(s)");
    expect(retryFindings.length).toBe(active[0].findings.length);
  });

  it("cannot claim zero findings even when the gate emitted nothing at all", async () => {
    const retryFindings = await recordGateFailure(SLUG, "critic", "", { intakeDir: dir });
    expect(retryFindings).toEqual([GATE_NO_OUTPUT_FINDING]);
    const state = await readRunStateV2(SLUG, { intakeDir: dir });
    expect(state.stages.critic.failure.detail).toBe("offline verify failed: 1 finding(s)");
  });

  it("leaves the stage failed and resumable — the retry repeats THIS stage, work retained", async () => {
    await recordGateFailure(SLUG, "critic", ASTRO_BUILD_FAILURE, { intakeDir: dir });
    const state = await readRunStateV2(SLUG, { intakeDir: dir });
    expect(state.stages.critic.status).toBe("failed");
    expect(state.stages.critic.failure.class).toBe("gate-failure");
    expect(state.status).toBe("failed");
    expect(state.resume.nextStage).toBe("critic");
    // A gate failure never resets the run's own attempt budget — the retry is bounded, not free.
    expect(state.attempts.total).toBe(0);
  });

  it("keeps the in-scope work: verify-failed commits the stage's paths BEFORE recording the failure", () => {
    // The retention commit is git-side and lives in the CLI case; pin that it is still there and
    // still scoped to allowedStagePaths, since a discarded critic pass is the original scar.
    const cli = readFileSync(path.join(ROOT, "scripts", "pipeline-v2.mjs"), "utf8");
    const caseBody = cli.slice(cli.indexOf('case "verify-failed":'), cli.indexOf('case "stage-feedback":'));
    expect(caseBody).toContain("retained for repair");
    expect(caseBody).toContain("allowedStagePaths(slug, stage)");
    expect(caseBody.indexOf("retained for repair")).toBeLessThan(caseBody.indexOf("recordGateFailure"));
    // FIX B, structurally: one array name feeds the record, the detail and the console line.
    expect(caseBody).toContain("const retryFindings = await recordGateFailure(slug, stage, gateOutput)");
    expect(caseBody).toContain("${retryFindings.length} finding(s) recorded for the retry");
    expect(caseBody).not.toContain("see the run log scorecard");
  });
});

describe("critic repair scope — validator feedback naming _guide.json is the critic's to fix", () => {
  it("still owns the whole guide directory, _guide.json included", () => {
    expect(allowedStagePaths("testland", "critic")).toContain("src/content/guides/testland");
  });

  it("says so in the prompt: repair the named field, and 'workflow-owned palette' does not exempt it", () => {
    const section = CRITIC_PROMPT.slice(CRITIC_PROMPT.indexOf("## Validator feedback"));
    expect(section).toMatch(/repair data/i);
    expect(section).toContain("_guide.json");
    expect(section).toContain("theme");
    expect(section).toMatch(/does\s+\n?NOT put an invalid explicit `_guide\.json\.theme` value outside your repair scope/);
    // The clarified sentence must still be anchored to the claim it clarifies.
    expect(CRITIC_PROMPT).toContain("composition/palette are the workflow's");
  });

  it("keeps critic agent blindness while the trusted tail may reconcile correction truth", () => {
    expect(allowedStagePaths("testland", "critic")).toEqual([
      "src/content/guides/testland",
      "guides-intake/testland/ledger.md",
      "guides-intake/testland/evidence.v2.json",
      "guides-intake/testland/coverage.v2.json",
      "guides-intake/testland/critic-corrections.v2.json",
      "guides-intake/testland/pipeline-patterns.fragment.md",
      "docs/evidence/pipeline-patterns.md",
    ]);
    // The agent's own tool policy: the same base grants as before, plus WebFetch domains only.
    const tools = criticFetchTools("nowhere", { guidesDir: path.join(tmpdir(), "no-guides"), intakeDir: path.join(tmpdir(), "no-intake") })
      .split(",");
    expect(tools.filter((t) => !t.startsWith("WebFetch(domain:"))).toEqual([
      "Read(//workspace/**)", "Edit(//workspace/**)", "Glob", "Grep", "WebSearch",
    ]);
    expect(forbiddenForCritic("testland")).toEqual(expect.arrayContaining([
      "guides-intake/testland/evidence.v2.json",
      "guides-intake/testland/critic-corrections.v2.json",
    ]));
  });
});
