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

function requireFile(rel, label = rel) {
  if (!fs.existsSync(file(rel))) failures.push(`${label}: missing ${rel}`);
  else passes.push(label);
}

function requireText(rel, needle, label) {
  requireFile(rel, label);
  if (!fs.existsSync(file(rel))) return;
  if (!read(rel).includes(needle)) failures.push(`${label}: expected contract text not found`);
  else passes.push(`${label} contract`);
}

// Runtime agent instructions must stay behaviorally in sync. Their short preambles are
// intentionally tool-specific; everything after the first horizontal rule is shared policy.
const agents = read("AGENTS.md");
const claude = read("CLAUDE.md");
const sharedBody = (text) => {
  const marker = "\n---\n";
  const at = text.indexOf(marker);
  return at === -1 ? text : text.slice(at + marker.length);
};
if (sharedBody(agents) !== sharedBody(claude)) {
  failures.push("Agent policy parity: AGENTS.md and CLAUDE.md shared bodies differ");
} else {
  passes.push("Agent policy parity");
}

// Pipeline V1 and V2 coexist until an explicitly approved cutover.
requireFile(".github/workflows/research-pass.yml", "Pipeline V1 workflow");
requireFile(".github/workflows/research-pass-v2.yml", "Pipeline V2 workflow");
requireFile("scripts/pipeline.mjs", "Pipeline V1 orchestrator");
requireFile("scripts/pipeline-v2.mjs", "Pipeline V2 orchestrator");
requireText(
  ".github/workflows/new-guide.yml",
  "vars.WAYPOINT_RESEARCH_ENGINE == 'v2'",
  "Explicit V2 selector gate",
);
requireText(
  ".github/workflows/new-guide.yml",
  "gh workflow run research-pass.yml",
  "V1 fallback remains available",
);

// The reciprocal review worker must keep a real job-level privilege boundary.
const watcher = read(".github/workflows/claude-codex-watcher.yml");
if (!/\n  validate:\n[\s\S]*?permissions:\n\s+contents: read\n\s+pull-requests: read/.test(watcher)) {
  failures.push("Claude↔Codex watcher: validate job is not structurally read-only");
} else {
  passes.push("Claude↔Codex validate job read-only");
}
if (!/\n  publish:\n[\s\S]*?permissions:\n\s+contents: write\n\s+pull-requests: write/.test(watcher)) {
  failures.push("Claude↔Codex watcher: publish job write boundary missing");
} else {
  passes.push("Claude↔Codex publish boundary");
}

// Protected traveler-facing architecture.
requireFile("src/features/trip-split/index.ts", "Trip Split feature");
requireText("src/features/trip-split/index.ts", "computeSplits", "Trip Split deterministic split engine");
requireText("src/features/trip-split/index.ts", "settle", "Trip Split settlement engine");
requireFile("src/features/itinerary", "Day-to-day itinerary feature");
requireFile("src/features/maps", "Maps feature");
requireFile("src/features/sos", "SOS feature");
requireFile("public/sw.js", "Offline service worker");

// Product doctrine that must not be lost during cleanup.
requireText("AGENTS.md", "Sights and Food are REPOSITORIES", "Sights/Food breadth doctrine");
requireText("AGENTS.md", "pipeline critic findings", "Traveler/process learnings separation");

// Future Atlas redesign authority is intentionally preserved during backend cleanup.
requireFile("docs/design-handoff/DESIGN.md", "Atlas written design authority");
requireFile("docs/design-handoff/enforcement/ACCEPTANCE.md", "Atlas acceptance contract");
requireFile("docs/design-handoff/enforcement/check-drift.mjs", "Atlas drift checker");

// Canary #4 was accepted only as draft content. Cleanup must not silently publish it.
const uruguayMetaPath = "src/content/guides/uruguay/_guide.json";
requireFile(uruguayMetaPath, "Uruguay Canary #4 guide");
if (fs.existsSync(file(uruguayMetaPath))) {
  try {
    const meta = JSON.parse(read(uruguayMetaPath));
    if (meta.draft !== true) failures.push("Uruguay Canary #4: draft must remain true");
    else passes.push("Uruguay Canary #4 remains draft");
  } catch (error) {
    failures.push(`Uruguay Canary #4 metadata: invalid JSON (${error.message})`);
  }
}

if (failures.length) {
  console.error("\nWaypoint invariant check FAILED:\n");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  console.error(`\n${failures.length} invariant(s) failed; cleanup must not ship.\n`);
  process.exit(1);
}

console.log(`Waypoint invariant check PASS — ${new Set(passes).size} protected contracts confirmed.`);
