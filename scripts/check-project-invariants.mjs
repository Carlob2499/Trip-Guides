#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const passes = [];

function file(rel) {
  return path.join(root, rel);
}

function read(rel) {
  return fs.readFileSync(file(rel), "utf8");
}

function pass(label) {
  passes.push(label);
}

function fail(message) {
  failures.push(message);
}

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

function forbidPath(rel, label = rel) {
  if (fs.existsSync(file(rel))) fail(`${label}: retired path must stay absent (${rel})`);
  else pass(label);
}

function requireText(rel, needle, label) {
  if (!requirePath(rel, `${label} source`)) return;
  if (!read(rel).includes(needle)) fail(`${label}: expected contract text not found`);
  else pass(label);
}

// Runtime agent instructions must stay behaviorally in sync. The preamble and a tiny set of
// runtime-specific names are intentionally different; normalize ONLY those explicit aliases.
const agents = read("AGENTS.md");
const claude = read("CLAUDE.md");
const sharedBody = (text) => {
  const marker = "\n---\n";
  const at = text.indexOf(marker);
  return at === -1 ? text : text.slice(at + marker.length);
};
const normalizeAgentSpecificNames = (text) => text
  .replaceAll("Codex Remote", "<AGENT_REMOTE>")
  .replaceAll("Claude Code Remote", "<AGENT_REMOTE>")
  .replaceAll("AGENTS.md", "<AGENT_MANUAL>")
  .replaceAll("CLAUDE.md", "<AGENT_MANUAL>");

const normalizedAgents = normalizeAgentSpecificNames(sharedBody(agents));
const normalizedClaude = normalizeAgentSpecificNames(sharedBody(claude));
if (normalizedAgents !== normalizedClaude) {
  fail("Agent policy parity: AGENTS.md and CLAUDE.md differ beyond the explicit runtime-specific allowlist");
} else {
  pass("Agent policy parity");
}

// Permanent orientation/authority surfaces must exist. Historical plans and cleanup ledgers are
// intentionally not authorities; current behavior should be discoverable from this compact set.
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
]) {
  requirePath(rel, `Current authority: ${rel}`);
}

// Pipeline V1 and V2 coexist until an explicitly approved cutover.
requirePath(".github/workflows/research-pass.yml", "Pipeline V1 workflow");
requirePath(".github/workflows/research-pass-v2.yml", "Pipeline V2 workflow");
requirePath("scripts/pipeline.mjs", "Pipeline V1 orchestrator");
requirePath("scripts/pipeline-v2.mjs", "Pipeline V2 orchestrator");
requireText(".github/workflows/new-guide.yml", "if: vars.WAYPOINT_RESEARCH_ENGINE == 'v2'", "Explicit V2 selector gate");
requireText(".github/workflows/new-guide.yml", "gh workflow run research-pass.yml", "V1 fallback remains available");

// The reciprocal Claude↔Codex reviewer was temporary integration scaffolding. It is deliberately
// retired: reintroducing it would restore a privileged automation surface outside Waypoint's two
// product lifecycles and requires a new architecture decision.
for (const retired of [
  ".github/workflows/claude-codex-watcher.yml",
  ".github/workflows/claude-codex-signal.yml",
  "scripts/codex-watcher.mjs",
  "scripts/__tests__/codex-watcher.test.mjs",
  "scripts/__tests__/codex-watcher-workflow.test.mjs",
  "prompts/codex-work-order.md",
]) {
  forbidPath(retired, `Retired reciprocal reviewer: ${retired}`);
}

// Protected traveler-facing architecture.
requirePath("src/features/trip-split/index.ts", "Trip Split feature");
requireText("src/features/trip-split/index.ts", "computeSplits", "Trip Split deterministic split engine");
requireText("src/features/trip-split/index.ts", "settle", "Trip Split settlement engine");
requirePath("src/features/itinerary", "Day-to-day itinerary feature", "directory");
requirePath("src/features/maps", "Maps feature", "directory");
requirePath("src/features/sos", "SOS feature", "directory");
requirePath("public/sw.js", "Offline service worker");

// Product doctrine that must not be lost during cleanup.
requireText("AGENTS.md", "Sights and Food are REPOSITORIES", "Sights/Food breadth doctrine");
requireText("AGENTS.md", "pipeline critic findings", "Traveler/process learnings separation");

// Future Atlas redesign authority is intentionally preserved until that redesign is implemented.
requirePath("docs/design-handoff/DESIGN.md", "Atlas written design authority");
requirePath("docs/design-handoff/enforcement/ACCEPTANCE.md", "Atlas acceptance contract");
requirePath("docs/design-handoff/enforcement/check-drift.mjs", "Atlas drift checker");

// Canary #4 was accepted only as draft content. Cleanup must not silently publish it.
const uruguayMetaPath = "src/content/guides/uruguay/_guide.json";
if (requirePath(uruguayMetaPath, "Uruguay Canary #4 guide")) {
  try {
    const meta = JSON.parse(read(uruguayMetaPath));
    if (meta.draft !== true) fail("Uruguay Canary #4: draft must remain true");
    else pass("Uruguay Canary #4 remains draft");
  } catch (error) {
    fail(`Uruguay Canary #4 metadata: invalid JSON (${error.message})`);
  }
}

if (failures.length) {
  console.error("\nWaypoint invariant check FAILED:\n");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${failures.length} invariant(s) failed; this change must not ship.\n`);
  process.exit(1);
}

console.log(`Waypoint invariant check PASS — ${new Set(passes).size} protected contracts confirmed.`);
