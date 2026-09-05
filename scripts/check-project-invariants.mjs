#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const passes = [];
const file = (rel) => path.join(root, rel);
const read = (rel) => fs.readFileSync(file(rel), "utf8");
const normalizeText = (text) => text.replace(/\r\n?/g, "\n");
const pass = (label) => passes.push(label);
const fail = (message) => failures.push(message);

function requirePath(rel, label = rel, type = "file") {
  if (!fs.existsSync(file(rel))) {
    fail(`${label}: missing ${rel}`);
    return false;
  }
  const stat = fs.statSync(file(rel));
  if (type === "file" && !stat.isFile()) {
    fail(`${label}: expected a file at ${rel}`);
    return false;
  }
  if (type === "directory" && !stat.isDirectory()) {
    fail(`${label}: expected a directory at ${rel}`);
    return false;
  }
  pass(label);
  return true;
}

function requireText(rel, needle, label) {
  if (!requirePath(rel, `${label} source`)) return;
  if (!read(rel).includes(needle)) fail(`${label}: expected contract text not found`);
  else pass(label);
}

const agents = read("AGENTS.md");
const claude = read("CLAUDE.md");
const tsconfig = JSON.parse(read("tsconfig.json"));
const sharedBody = (text) => {
  const normalized = normalizeText(text);
  const marker = "\n---\n";
  const at = normalized.indexOf(marker);
  return at === -1 ? normalized : normalized.slice(at + marker.length);
};
const normalizeAgentSpecificNames = (text) => text
  .replaceAll("Codex Remote", "<AGENT_REMOTE>")
  .replaceAll("Claude Code Remote", "<AGENT_REMOTE>")
  .replaceAll("AGENTS.md", "<AGENT_MANUAL>")
  .replaceAll("CLAUDE.md", "<AGENT_MANUAL>");

if (normalizeAgentSpecificNames(sharedBody(agents)) !== normalizeAgentSpecificNames(sharedBody(claude))) {
  fail("Agent policy parity: AGENTS.md and CLAUDE.md differ beyond the explicit runtime-specific allowlist");
} else {
  pass("Agent policy parity");
}

const maxAgentManualBytes = 6500;
for (const [rel, text] of [["AGENTS.md", agents], ["CLAUDE.md", claude]]) {
  const bytes = Buffer.byteLength(normalizeText(text), "utf8");
  if (bytes > maxAgentManualBytes) fail(`Agent context budget: ${rel} is ${bytes} bytes; max is ${maxAgentManualBytes}`);
  else pass(`Agent context budget: ${rel}`);
}

const retiredRoutingDoc = ["docs", "reference", "skill-routing.md"].join("/");
if (fs.existsSync(file(retiredRoutingDoc))) fail(`Routing authority duplication: ${retiredRoutingDoc} must stay deleted; scripts/skill-routing.mjs + tests own routing`);
else pass("Routing authority duplication");

for (const rel of [
  "README.md",
  "PRODUCT.md",
  "docs/README.md",
  "docs/handoff.md",
  "docs/reference/repo-map.md",
  "docs/reference/pipeline.md",
  "docs/pipeline v2/DECISIONS.md",
  "docs/pipeline v2/IMPLEMENTATION_STATE.md",
  "docs/pipeline v2/SEPTEMBER_TRACKER.md",
]) requirePath(rel, `Current authority: ${rel}`);

if (!Array.isArray(tsconfig.exclude) || !tsconfig.exclude.includes("dist/**")) fail("Typecheck boundary: tsconfig.json must exclude generated dist/** artifacts");
else pass("Typecheck boundary excludes generated dist artifacts");

requirePath(".github/workflows/research-pass.yml", "Pipeline V1 workflow");
requirePath(".github/workflows/research-pass-v2.yml", "Pipeline V2 workflow");
requirePath("scripts/pipeline.mjs", "Pipeline V1 orchestrator");
requirePath("scripts/pipeline-v2.mjs", "Pipeline V2 orchestrator");
requireText(".github/workflows/new-guide.yml", "if: vars.WAYPOINT_RESEARCH_ENGINE == 'v2'", "Explicit V2 selector gate");
requireText(".github/workflows/new-guide.yml", "gh workflow run research-pass.yml", "V1 fallback remains available");
requireText(".github/workflows/new-guide.yml", "model: claude-sonnet-5", "V2 product evidence model is pinned");
requireText(".github/workflows/new-guide.yml", "effort: medium", "V2 product research effort is pinned");
requireText(".github/workflows/new-guide.yml", "critic_model: claude-opus-5", "V2 product judgment model is pinned");
requireText(".github/workflows/new-guide.yml", "critic_effort: medium", "V2 product judgment effort is pinned");

// Release governance: mutation testing is diagnostic-only and `/new` must remain compatible with
// protected main. Neither path may regain a direct-main push as an invisible convenience.
const mutationWorkflow = normalizeText(read(".github/workflows/mutation.yml"));
if (!mutationWorkflow.includes("permissions:\n  contents: read")) fail("Release governance: mutation workflow must remain contents: read");
else if (/git\s+push[^\n]*\bmain\b/.test(mutationWorkflow)) fail("Release governance: mutation workflow must not push directly to main");
else pass("Release governance: mutation workflow is read-only to repository contents");

const newGuideWorkflow = read(".github/workflows/new-guide.yml");
const scaffoldLanding = read("scripts/pipeline/scaffold.mjs");
const protectedPrGate = read("scripts/protected-pr-gate.mjs");
if (!newGuideWorkflow.includes("pull-requests: write")) fail("Release governance: /new scaffold needs pull-requests: write for protected landing");
else pass("Release governance: /new has bounded PR write authority");
if (/HEAD:main|refs\/heads\/main/.test(scaffoldLanding)) fail("Release governance: scaffold landing must not push directly to main");
else pass("Release governance: scaffold landing has no direct-main push");
if (!scaffoldLanding.includes("gateProtectedPr")) fail("Release governance: scaffold landing must delegate to the shared protected PR gate");
else pass("Release governance: scaffold landing delegates to the shared protected PR gate");
for (const required of ["required-gate", "freeze-policy", "Analyze (actions)", "Analyze (javascript-typescript)"]) {
  if (!protectedPrGate.includes(required)) fail(`Release governance: protected PR gate must require ${required}`);
  else pass(`Release governance scaffold check: ${required}`);
}
requireText(".github/workflows/required-gate.yml", "git merge --no-commit --no-ff", "Required gate prospective-merge proof");
requireText(".github/workflows/september-freeze.yml", "pr_number:", "Freeze policy automated-PR dispatch");

for (const rel of [
  ".github/workflows/claude-codex-watcher.yml",
  ".github/workflows/claude-codex-signal.yml",
  "scripts/codex-watcher.mjs",
  "scripts/__tests__/codex-watcher.test.mjs",
  "scripts/__tests__/codex-watcher-workflow.test.mjs",
  "prompts/codex-work-order.md",
]) requirePath(rel, `Reciprocal review control plane: ${rel}`);
requireText(".github/workflows/claude-codex-signal.yml", "pull_request:", "Reciprocal review unprivileged signal");
requireText(".github/workflows/claude-codex-watcher.yml", "validate:", "Reciprocal review read-only validate job");
requireText(".github/workflows/claude-codex-watcher.yml", "contents: read", "Reciprocal review read-only permissions");
requireText(".github/workflows/claude-codex-watcher.yml", "publish:", "Reciprocal review separate publish job");
requireText(".github/workflows/claude-codex-watcher.yml", "contents: write", "Reciprocal review publish permissions");

requirePath("src/features/trip-split/index.ts", "Trip Split feature");
requireText("src/features/trip-split/index.ts", "computeSplits", "Trip Split deterministic split engine");
requireText("src/features/trip-split/index.ts", "settle", "Trip Split settlement engine");
requirePath("src/features/itinerary", "Day-to-day itinerary feature", "directory");
requirePath("src/features/maps", "Maps feature", "directory");
requirePath("src/features/sos", "SOS feature", "directory");
requirePath("public/sw.js", "Offline service worker");

requireText("AGENTS.md", "Sights and Food are REPOSITORIES", "Sights/Food breadth doctrine");
requireText("AGENTS.md", "pipeline critic findings", "Traveler/process learnings separation");
requirePath("docs/reference/design-system.md", "Waypoint design authority");
requireText("docs/reference/design-system.md", "## 18. Motion", "Waypoint motion doctrine");
// 2026-09-04 constitution: motion.md is the subordinate doctrine the authority itself binds.
requireText("docs/reference/design-system.md", "docs/reference/motion.md", "Waypoint authority binds the subordinate motion doctrine");
requirePath("docs/reference/motion.md", "Waypoint motion doctrine (subordinate spec)");
requirePath("docs/reference/design-system-assets/canonical-mockups.svg", "Waypoint canonical visual board");
requireText("docs/reference/design-system.md", "docs/mockups/", "Waypoint authority binds visual reference evidence as subordinate");
requireText("docs/reference/design-system-assets/canonical-mockups.svg", "SUPPORTING FIGURE ONLY", "Waypoint visual board is subordinate to sole authority");
requirePath("docs/reference/design-system-assets/mockup-manifest.json", "Waypoint visual reference manifest");
requireText("docs/reference/design-system-assets/mockup-manifest.json", "recovered_d6_composition", "Waypoint recovered D6 visuals retain authority class");
for (const rel of [
  "docs/reference/design-system-assets/d6-itinerary-mobile-composition.svg",
  "docs/reference/design-system-assets/d6-map-responsive-composition.svg",
  "docs/reference/design-system-assets/d6-guide-place-detail-composition.svg",
  "docs/reference/design-system-assets/d6-split-responsive-composition.svg",
  "docs/reference/design-system-assets/d6-search-responsive-final.svg",
]) requirePath(rel, `Recovered D6 visual: ${rel}`);
requirePath("docs/reference/component-registry.json", "Waypoint component registry");

// Design authority is intentionally singular. Historical design bodies live in Git history,
// not as alternate live-tree references agents can accidentally consult. docs/mockups and
// docs/reference/motion.md are NOT in this list: the 2026-09-04 constitution binds them as
// reference evidence and subordinate doctrine respectively (checked above).
for (const rel of [
  "docs/design-handoff",
  ["docs", "reference", "motion-anchors.md"].join("/"),
  ["docs", "reference", "search-ui-final.md"].join("/"),
  ["docs", "reference", "sos-ui-final.md"].join("/"),
  ["docs", "reference", "visual-redesign.md"].join("/"),
  ["docs", "archive", "visual-redesign-history.md"].join("/"),
]) {
  if (fs.existsSync(file(rel))) fail(`Design authority duplication: ${rel} must stay deleted; docs/reference/design-system.md is sole authority`);
  else pass(`Design authority singularity: ${rel}`);
}

/* Uruguay Canary #4 is EVIDENCE, not content: the draft guide and its intake state left main on
   2026-09-05 at the owner's direction (the four pipeline research drafts were tests), and the
   accepted proof lives in the evidence record. That record must stay. */
for (const rel of [
  ["docs", "pipeline v2", "IMPLEMENTATION_STATE.md"].join("/"),
  ["docs", "pipeline v2", "R03_LIVE_FAILURE_SEAMS_EVIDENCE.md"].join("/"),
  ["docs", "pipeline v2", "FINAL_V2_ACCEPTANCE_FUKUOKA_EVIDENCE.md"].join("/"),
]) requirePath(rel, "Pipeline V2 evidence record");
for (const rel of ["luxembourg", "malta", "portugal", "uruguay"]) {
  if (fs.existsSync(file(`src/content/guides/${rel}`))) fail(`Retired research draft resurfaced: src/content/guides/${rel} (removed 2026-09-05; evidence lives in docs/pipeline v2)`);
  else pass(`Retired research draft stays out of main: ${rel}`);
}

if (failures.length) {
  console.error("\nWaypoint invariant check FAILED:\n");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${failures.length} invariant(s) failed; this change must not ship.\n`);
  process.exit(1);
}

console.log(`Waypoint invariant check PASS — ${new Set(passes).size} protected contracts confirmed.`);