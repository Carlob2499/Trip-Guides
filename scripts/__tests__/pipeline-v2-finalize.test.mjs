// PIPELINE V2 FINALIZATION — regression suite for the Core Proof blocker fixes.
//
//   1A  generated machine-contract capsule cannot drift from the validators
//   1B  validator findings persist per stage and feed ONLY that stage's retry
//   1C  the real verifier consumes coverage.v2.json fail-closed (V1 preserved)
//   1D  deterministic geocoding: order, credential isolation, unresolved honesty
//   P2  source-access classes + reader/mirror/proxy refusal
//   P3  retry-aware telemetry: per-attempt history survives, aggregates are truthful
//   P4  the default-branch dispatch guard exists in the workflow

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  EVIDENCE_SCHEMA, COVERAGE_SCHEMA, FEEDBACK_SCHEMA,
  evidenceDocSchema, coverageDocSchema,
  CANDIDATE_STATUSES, SOURCE_KINDS, DISPOSITIONS, SOURCE_ACCESS,
} from "../pipeline/v2/contracts.mjs";
import {
  generateContractCapsule, exampleEvidenceDoc, exampleCoverageDoc, fieldVocabulary, CAPSULE_STAGES,
} from "../pipeline/v2/contract-capsule.mjs";
import {
  recordStageFeedback, activeFeedback, retireFeedback, readFeedback, renderFeedbackBlock,
} from "../pipeline/v2/feedback.mjs";
import {
  initRunV2, stageStart, stageComplete, stageFail, readRunStateV2, stageAttemptStats,
} from "../pipeline/v2/run-state.mjs";
import { stageFacts, mergeTelemetry, emptyTelemetry } from "../pipeline/v2/telemetry.mjs";
import { sourceAccessProblems, PROXY_HOSTS, isProxyHost, OBJECTIVE_RECHECK_MAX_DAYS } from "../pipeline/v2/research-rules.mjs";
import { forbiddenForPassB, forbiddenForCritic } from "../pipeline/v2/workspace.mjs";
import { writeReport } from "../geocode-venues.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const WORKFLOW = readFileSync(path.join(ROOT, ".github", "workflows", "research-pass-v2.yml"), "utf8");

let dir;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), "wp-v2-final-")); });
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

const opts = () => ({ intakeDir: dir });

async function scaffoldRun(slug = "testland") {
  await mkdir(path.join(dir, slug), { recursive: true });
  return initRunV2(slug, { intakeDir: dir });
}

async function clearScaffold(slug = "testland", now = "2026-08-19T09:00:00.000Z") {
  await stageStart(slug, "scaffold", { now, intakeDir: dir });
  await stageComplete(slug, "scaffold", { now, intakeDir: dir });
}

// ── 1A: generated contract capsule ───────────────────────────────────────────

describe("1A — generated machine contract cannot drift from the validators", () => {
  it("the example evidence skeleton VALIDATES against the live schema (drift here fails the build)", () => {
    const doc = exampleEvidenceDoc({ slug: "korea", runId: "korea-20260819-aaaaaa" });
    expect(evidenceDocSchema.safeParse(doc).success).toBe(true);
  });

  it("the example coverage skeleton VALIDATES against the live schema", () => {
    const doc = exampleCoverageDoc({ slug: "korea", runId: "korea-20260819-aaaaaa" });
    expect(coverageDocSchema.safeParse(doc).success).toBe(true);
  });

  it("every enum value the validator accepts appears verbatim in the capsule", async () => {
    const cap = await generateContractCapsule("passA", { slug: "korea", runId: "r" });
    for (const v of [...CANDIDATE_STATUSES, ...SOURCE_KINDS, ...DISPOSITIONS, ...SOURCE_ACCESS]) {
      expect(cap).toContain(v);
    }
  });

  it("the capsule carries the freshness caps from the SAME map the validator enforces", async () => {
    const cap = await generateContractCapsule("passA", { slug: "korea", runId: "r" });
    for (const [k, v] of Object.entries(OBJECTIVE_RECHECK_MAX_DAYS)) {
      expect(cap).toContain(`\`${k}\`: ≤ ${v} days`);
    }
  });

  it("the capsule states the canonical candidate-id rule with COMPUTED examples", async () => {
    const cap = await generateContractCapsule("passB", { slug: "korea", runId: "r" });
    expect(cap).toContain("c-example-venue--riverside-branch");
    expect(cap).toContain("c-cafe-akersberga");
  });

  it("the reconcile capsule derives the guide's REAL group files and legacy ask ids", async () => {
    const slug = "capsuleland";
    const guides = path.join(dir, "guides");
    await mkdir(path.join(guides, slug), { recursive: true });
    await writeFile(path.join(guides, slug, "02-food.json"), JSON.stringify({ food: { type: "venues", title: "Where to eat", items: [{ name: "Noodle Bar" }] } }));
    await mkdir(path.join(dir, slug), { recursive: true });
    await writeFile(path.join(dir, slug, "coverage.json"), JSON.stringify({ slug, asks: [{ id: "priority-food", label: "Priority: food", value: "ranked #1" }] }));
    const cap = await generateContractCapsule("reconcile", { slug, runId: "r", intakeDir: dir, guidesDir: guides });
    expect(cap).toContain("`priority-food` — Priority: food");
    expect(cap).toContain("`02-food.json`");
    expect(cap).toContain("#noodle-bar");
  });

  it("field vocabulary is introspected from zod, not hand-listed (required + enums)", () => {
    const vocab = fieldVocabulary(evidenceDocSchema);
    const names = vocab.map((f) => f.name);
    for (const key of ["schemaVersion", "slug", "runId", "candidates", "evidence", "reconciliation"]) {
      expect(names).toContain(key);
    }
  });

  it("every capsule stage generates without touching the network or the real repo state", async () => {
    for (const stage of CAPSULE_STAGES.filter((s) => s !== "reconcile")) {
      const cap = await generateContractCapsule(stage, { slug: "anyslug", runId: "r" });
      expect(cap.length).toBeGreaterThan(400);
      expect(cap).toContain("GENERATED from the live validators");
    }
  });

  it("the workflow supplies the capsule to every stage prompt", () => {
    for (const stage of CAPSULE_STAGES) {
      expect(WORKFLOW).toContain(`contract --slug "$SLUG" --stage ${stage}`);
    }
    expect((WORKFLOW.match(/WP_CONTRACT:/g) || []).length).toBe(4);
  });
});

// ── 1B: durable stage feedback ───────────────────────────────────────────────

describe("1B — validator findings persist and feed only the owed stage's retry", () => {
  it("records findings keyed by runId/stage/attempt and reads them back for that stage only", async () => {
    const state = await scaffoldRun();
    await recordStageFeedback("testland", { runId: state.runId, stage: "passA", attempt: 1, findings: ["candidate id unstable", "missing saturation record"], intakeDir: dir });
    expect(await activeFeedback("testland", { runId: state.runId, stage: "passA", intakeDir: dir })).toEqual([
      "candidate id unstable", "missing saturation record",
    ]);
    // Cross-stage isolation: reconcile's retry sees NOTHING of passA's findings.
    expect(await activeFeedback("testland", { runId: state.runId, stage: "reconcile", intakeDir: dir })).toEqual([]);
    // Cross-run isolation: a different run's findings do not leak.
    expect(await activeFeedback("testland", { runId: "other-run", stage: "passA", intakeDir: dir })).toEqual([]);
  });

  it("a new failure supersedes the previous active entry; history is preserved", async () => {
    const state = await scaffoldRun();
    await recordStageFeedback("testland", { runId: state.runId, stage: "passB", attempt: 1, findings: ["first"], intakeDir: dir });
    await recordStageFeedback("testland", { runId: state.runId, stage: "passB", attempt: 2, findings: ["second"], intakeDir: dir });
    expect(await activeFeedback("testland", { runId: state.runId, stage: "passB", intakeDir: dir })).toEqual(["second"]);
    const doc = await readFeedback("testland", { intakeDir: dir });
    expect(doc.entries).toHaveLength(2);
    expect(doc.entries[0].status).toBe("retired");
    expect(doc.entries[0].findings).toEqual(["first"]);
  });

  it("success retires the active entry (audit history kept) — feedback then reads empty", async () => {
    const state = await scaffoldRun();
    await recordStageFeedback("testland", { runId: state.runId, stage: "critic", attempt: 1, findings: ["malformed patterns row"], intakeDir: dir });
    await retireFeedback("testland", { stage: "critic", intakeDir: dir });
    expect(await activeFeedback("testland", { runId: state.runId, stage: "critic", intakeDir: dir })).toEqual([]);
    const doc = await readFeedback("testland", { intakeDir: dir });
    expect(doc.entries[0].status).toBe("retired");
    expect(doc.entries[0].retiredAt).toBeTruthy();
  });

  it("the artifact is versioned and fail-closed: malformed JSON throws, never reads as empty", async () => {
    await mkdir(path.join(dir, "broken"), { recursive: true });
    await writeFile(path.join(dir, "broken", "feedback.v2.json"), "{");
    await expect(readFeedback("broken", { intakeDir: dir })).rejects.toThrow(/not valid JSON/);
  });

  it("rendered feedback is labeled VALIDATOR DATA, never instructions", () => {
    const block = renderFeedbackBlock(["ask \"x\" claims covered with no group refs"]);
    expect(block).toContain("VALIDATOR DATA");
    expect(block).toContain("not");
    expect(block).toContain("instructions");
    expect(block).toContain("```validator-findings");
    expect(renderFeedbackBlock([])).toContain("first attempt");
  });

  it("the schema version tag is the feedback family", async () => {
    const state = await scaffoldRun();
    await recordStageFeedback("testland", { runId: state.runId, stage: "passA", attempt: 1, findings: ["x"], intakeDir: dir });
    const raw = JSON.parse(await readFile(path.join(dir, "testland", "feedback.v2.json"), "utf8"));
    expect(raw.schemaVersion).toBe(FEEDBACK_SCHEMA);
  });

  it("the workflow feeds stage feedback into every stage prompt and forbids the file to Pass B and the critic", () => {
    for (const stage of ["passA", "passB", "reconcile", "critic"]) {
      expect(WORKFLOW).toContain(`stage-feedback --slug "$SLUG" --stage ${stage}`);
    }
    expect((WORKFLOW.match(/WP_FEEDBACK:/g) || []).length).toBe(4);
    expect(forbiddenForPassB("x")).toContain("guides-intake/x/feedback.v2.json");
    expect(forbiddenForCritic("x")).toContain("guides-intake/x/feedback.v2.json");
  });
});

// ── P3: retry-aware telemetry ────────────────────────────────────────────────

describe("P3 — per-attempt history makes retry cost visible", () => {
  it("first attempt: one history entry, opened running and closed complete", async () => {
    await scaffoldRun();
    await clearScaffold();
    await stageStart("testland", "passA", { now: "2026-08-19T10:00:00.000Z", intakeDir: dir });
    await stageComplete("testland", "passA", { now: "2026-08-19T10:30:00.000Z", intakeDir: dir });
    const st = (await readRunStateV2("testland", opts())).stages.passA;
    expect(st.history).toHaveLength(1);
    expect(st.history[0]).toMatchObject({ attempt: 1, status: "complete", durationSec: 1800 });
  });

  it("retry: the failed attempt's record survives; the cumulative cost is the SUM", async () => {
    await scaffoldRun();
    await clearScaffold();
    await stageStart("testland", "passA", { now: "2026-08-19T10:00:00.000Z", intakeDir: dir });
    await stageFail("testland", "passA", { failureClass: "agent-failure", detail: "invalid", now: "2026-08-19T11:00:00.000Z", intakeDir: dir });
    await stageStart("testland", "passA", { now: "2026-08-19T11:05:00.000Z", intakeDir: dir });
    await stageComplete("testland", "passA", { now: "2026-08-19T11:20:00.000Z", intakeDir: dir });
    const st = (await readRunStateV2("testland", opts())).stages.passA;
    expect(st.history).toHaveLength(2);
    expect(st.history[0]).toMatchObject({ attempt: 1, status: "failed", failureClass: "agent-failure", durationSec: 3600 });
    expect(st.history[1]).toMatchObject({ attempt: 2, status: "complete", durationSec: 900 });
    const stats = stageAttemptStats(st);
    expect(stats).toEqual({ successfulSec: 900, failedSec: 3600, cumulativeSec: 4500 });
    // The old single-window read (startedAt→endedAt) would have claimed 900s — the retry-blind lie.
    expect(stats.cumulativeSec).toBeGreaterThan(Date.parse(st.endedAt) / 1e12 ? 0 : 900);
  });

  it("interruption: a control-plane failure before begin-stage still records an honest attempt", async () => {
    await scaffoldRun();
    await stageFail("testland", "passA", { failureClass: "gate-failure", detail: "setup died", now: "2026-08-19T10:00:00.000Z", intakeDir: dir });
    const st = (await readRunStateV2("testland", opts())).stages.passA;
    expect(st.history).toHaveLength(1);
    expect(st.history[0].status).toBe("failed");
  });

  it("telemetry stage facts carry failed + cumulative durations without inventing unknowns", () => {
    const facts = stageFacts({ startedAt: "2026-08-19T10:00:00.000Z", endedAt: "2026-08-19T10:10:00.000Z", model: "m", effort: "high", retries: 1, failedDurationSec: 3600, cumulativeDurationSec: 4200 });
    expect(facts).toMatchObject({ durationSec: 600, failedDurationSec: 3600, cumulativeDurationSec: 4200, toolCalls: null, searches: null, fetches: null });
    const merged = mergeTelemetry(emptyTelemetry(), { stages: { passA: facts } });
    expect(merged.stages.passA.cumulativeDurationSec).toBe(4200);
    // A later unknown must not erase the known value.
    const again = mergeTelemetry(merged, { stages: { passA: stageFacts({}) } });
    expect(again.stages.passA.cumulativeDurationSec).toBe(4200);
  });

  it("old-reader compatibility: a wp-run/2.0 document without history parses (history defaults empty)", async () => {
    const state = await scaffoldRun("compat");
    const file = path.join(dir, "compat", "run.v2.json");
    const raw = JSON.parse(await readFile(file, "utf8"));
    raw.schemaVersion = "wp-run/2.0";
    for (const s of Object.values(raw.stages)) delete s.history;
    await writeFile(file, JSON.stringify(raw, null, 2));
    const reread = await readRunStateV2("compat", opts());
    expect(reread.runId).toBe(state.runId);
    expect(reread.stages.passA.history).toEqual([]);
    expect(stageAttemptStats(reread.stages.passA)).toEqual({ successfulSec: null, failedSec: null, cumulativeSec: null });
  });
});

// ── P2: source access + proxy refusal ────────────────────────────────────────

describe("P2 — fetched vs discovered vs blocked; a mirror is never the origin", () => {
  const base = (over = {}) => ({
    schemaVersion: EVIDENCE_SCHEMA, slug: "s", runId: "r",
    candidates: [], evidence: [], reservations: [], transport: [], disagreements: [],
    depth: null, saturation: null, passB: null, reconciliation: [], ...over,
  });
  const rec = (over = {}, src = {}) => ({
    id: "e-1", candidateId: null, claim: "Open 09:00", kind: "objective", origin: "passA",
    source: { url: "https://official.example/x", kind: "official", language: null, publishedAt: null, family: null, independent: null, access: "fetched", appliesToYears: [], ...src },
    verifiedOn: "2026-08-19", firsthand: null, freshness: null, ...over,
  });

  it("official citation from a search preview FAILS — discovery is not verification", () => {
    const problems = sourceAccessProblems(base({ evidence: [rec({}, { access: "search-preview" })] }));
    expect(problems.some((p) => p.includes("not a read of it"))).toBe(true);
  });

  it("official citation fetched or honestly blocked passes this rule", () => {
    expect(sourceAccessProblems(base({ evidence: [rec()] }))).toEqual([]);
    expect(sourceAccessProblems(base({ evidence: [rec({}, { access: "blocked" })] }))).toEqual([]);
  });

  it("an announced event date (appliesToYears) requires the announcement to have been READ", () => {
    const e = rec({ claim: "Festival runs Oct 10, 2027" }, { access: "blocked", publishedAt: "2027-01-01", appliesToYears: [2027] });
    const problems = sourceAccessProblems(base({ evidence: [e] }));
    expect(problems.some((p) => p.includes("actually read"))).toBe(true);
  });

  it("a proxy/mirror URL can never be cited as the source", () => {
    const e = rec({}, { url: "https://r.jina.ai/https://official.example/x" });
    const problems = sourceAccessProblems(base({ evidence: [e] }));
    expect(problems.some((p) => p.includes("mirror cannot count as the origin"))).toBe(true);
    expect(isProxyHost("https://webcache.googleusercontent.com/search?q=cache:x")).toBe(true);
    expect(isProxyHost("https://official.example/x")).toBe(false);
  });

  it("anchor/important reservation mechanics need a fetched origin or a recorded block", () => {
    const doc = base({
      candidates: [{ id: "c-x", name: "X", branch: null, priority: null, status: "shipped", shortlisted: true, reason: null, worth: null }],
      evidence: [rec({ candidateId: "c-x" }, { access: "search-preview" })],
      reservations: [{ candidateId: "c-x", importance: "anchor", bookingUrl: "https://book.example", releaseWindow: null, actionDate: null, partyRules: null, deposit: null, cancellation: null, foreignFriction: null, lastSeating: null, walkIn: null, leads: [], alternatives: null, fallback: null }],
    });
    const problems = sourceAccessProblems(doc);
    expect(problems.some((p) => p.includes("search-preview/unknown-access"))).toBe(true);
  });

  it("R3+ transport must cite evidence resting on at least one fetched source", () => {
    const t = { id: "t-1", route: "KIX → Kyoto", risk: 3, evidenceIds: [], doorToDoor: "x", transferReality: "x", groupLuggageMobility: "x", buffer: "x", missedConnection: "x", nextService: null, lastPracticalReturn: null, fallback: "x" };
    expect(sourceAccessProblems(base({ transport: [t] })).some((p) => p.includes("names no evidence"))).toBe(true);
    const cited = { ...t, evidenceIds: ["e-1"] };
    expect(sourceAccessProblems(base({ transport: [cited], evidence: [rec({}, { access: "search-preview" })] })).some((p) => p.includes("no evidence with a fetched origin"))).toBe(true);
    expect(sourceAccessProblems(base({ transport: [cited], evidence: [rec()] }))).toEqual([]);
    // Routine transit owes nothing.
    expect(sourceAccessProblems(base({ transport: [{ ...t, risk: 2 }] }))).toEqual([]);
  });

  it("the workflow denies the proxy domains to every research agent (config assertion)", () => {
    for (const host of PROXY_HOSTS) {
      // three research agents (passA, passB, reconcile) carry the denial; the critic is
      // allowlist-only and its allowlist filters proxies at the source.
      expect((WORKFLOW.match(new RegExp(`WebFetch\\(domain:${host.replace(/\./g, "\\.")}\\)`, "g")) || []).length).toBe(3);
    }
  });
});

// ── 1D: deterministic geocoding ──────────────────────────────────────────────

describe("1D — geocoding runs deterministically after reconcile, key never near an agent", () => {
  it("the geocode job sits between reconcile and the critic (order is workflow-enforced)", () => {
    expect(WORKFLOW).toMatch(/geocode:\s*\n\s*needs: \[setup, reconcile\]/);
    expect(WORKFLOW).toMatch(/critic:\s*\n\s*needs: \[setup, geocode\]/);
  });

  it("PLACES_API_KEY appears only in the geocode step and the landing gate — never in an agent step", () => {
    const agentBlocks = WORKFLOW.split(/- name: /).filter((b) => b.includes("docker run"));
    expect(agentBlocks.length).toBe(4);
    for (const block of agentBlocks) expect(block).not.toContain("PLACES_API_KEY");
    expect((WORKFLOW.match(/PLACES_API_KEY: \$\{\{ secrets\.PLACES_API_KEY \}\}/g) || []).length).toBe(2);
  });

  it("an unset key means geocoding is honestly NOT attempted (no report, no sentinel)", () => {
    expect(WORKFLOW).toContain('if [ -z "$PLACES_API_KEY" ]');
    expect(WORKFLOW).toContain("NOT attempted");
  });

  it("the attempt report distinguishes attempted-but-unresolved from never-attempted", async () => {
    const report = path.join(dir, "geo", "geocode.v2.json");
    writeReport(report, { slug: "x", attemptedAt: "2026-08-19T10:00:00.000Z", applied: true, pending: 2, resolved: [{ name: "A", file: "02-a.json" }], unresolved: [{ name: "B", file: "02-a.json", why: "name mismatch" }] });
    const doc = JSON.parse(await readFile(report, "utf8"));
    expect(doc.unresolved[0].why).toBe("name mismatch");
    expect(doc.resolved).toHaveLength(1);
    // never-attempted = the file simply does not exist; nothing fakes an attempt.
    expect(existsSync(path.join(dir, "geo", "other.json"))).toBe(false);
  });

  it("the critic's blind input excludes the geocode process report", () => {
    expect(forbiddenForCritic("x")).toContain("guides-intake/x/geocode.v2.json");
  });
});

// ── 1C: the real verifier consumes V2 coverage ───────────────────────────────

describe("1C — verify's coverage gate consumes coverage.v2.json fail-closed", () => {
  const SLUG = "v2cov-test-slug";
  const intake = path.join(ROOT, "guides-intake", SLUG);
  const guide = path.join(ROOT, "src", "content", "guides", SLUG);
  let checkCoverage;

  beforeEach(async () => {
    ({ checkCoverage } = await import("../verify-guide.mjs"));
    await mkdir(intake, { recursive: true });
    await mkdir(guide, { recursive: true });
    await writeFile(path.join(guide, "02-food.json"), JSON.stringify({ food: { type: "venues", title: "Food", items: [{ name: "Noodle Bar" }] } }));
    await writeFile(path.join(intake, "coverage.json"), JSON.stringify({ slug: SLUG, asks: [{ id: "ask-1", label: "Priority: food", value: "#1", coveredBy: null }] }));
  });
  afterEach(async () => {
    await rm(intake, { recursive: true, force: true });
    await rm(guide, { recursive: true, force: true });
  });

  const v2doc = (asks) => ({ schemaVersion: COVERAGE_SCHEMA, slug: SLUG, runId: "r-1", asks });

  it("a valid V2 coverage artifact is AUTHORITATIVE and passes (V1 uncovered rows ignored)", async () => {
    await writeFile(path.join(intake, "coverage.v2.json"), JSON.stringify(v2doc([
      { id: "ask-1", ask: "Priority: food", status: "covered", where: ["02-food.json#noodle-bar"], evidenceIds: [], reason: null },
    ])));
    const r = checkCoverage(SLUG);
    expect(r.version).toBe(2);
    expect(r.status).toBe("pass");
  });

  it("malformed required V2 coverage fails CLOSED — never read as covered or absent", async () => {
    await writeFile(path.join(intake, "coverage.v2.json"), "{ not json");
    const r = checkCoverage(SLUG);
    expect(r.status).toBe("fail");
    expect(r.problems[0]).toMatch(/not valid JSON/);
  });

  it("a missing material ask fails", async () => {
    await writeFile(path.join(intake, "coverage.v2.json"), JSON.stringify(v2doc([
      { id: "something-else", ask: "other", status: "covered", where: ["02-food.json#noodle-bar"], evidenceIds: [], reason: null },
    ])));
    const r = checkCoverage(SLUG);
    expect(r.status).toBe("fail");
    expect(r.problems.some((p) => p.includes('material intake ask "ask-1" is missing'))).toBe(true);
  });

  it("invalid refs/anchors fail — a claim of coverage is not proof of coverage", async () => {
    await writeFile(path.join(intake, "coverage.v2.json"), JSON.stringify(v2doc([
      { id: "ask-1", ask: "Priority: food", status: "covered", where: ["02-food.json#no-such-anchor"], evidenceIds: [], reason: null },
    ])));
    const r = checkCoverage(SLUG);
    expect(r.status).toBe("fail");
    expect(r.problems.some((p) => p.includes("does not identify any title/name/label"))).toBe(true);
  });

  it("V1 behavior is untouched when no V2 artifact exists (legacy coveredBy semantics)", () => {
    const r = checkCoverage(SLUG);
    expect(r.version).toBeUndefined();
    expect(r.status).toBe("fail");
    expect(r.uncovered).toHaveLength(1);
  });

  it("the wrong slug's artifact is refused, not read", async () => {
    await writeFile(path.join(intake, "coverage.v2.json"), JSON.stringify({ ...v2doc([]), slug: "other" }));
    const r = checkCoverage(SLUG);
    expect(r.status).toBe("fail");
    expect(r.problems[0]).toMatch(/belongs to "other"/);
  });
});

// ── P9: truthful Progress events ─────────────────────────────────────────────

describe("P9 — the event emitter tells only what the durable artifacts prove", () => {
  const stateFixture = () => ({
    stageOrder: ["scaffold", "passA"],
    attempts: { cap: 5 },
    updatedAt: "2026-08-19T12:00:00.000Z",
    stages: {
      scaffold: { history: [{ attempt: 1, startedAt: "2026-08-19T10:00:00.000Z", endedAt: "2026-08-19T10:00:05.000Z", status: "complete", failureClass: null, durationSec: 5 }] },
      passA: { history: [
        { attempt: 1, startedAt: "2026-08-19T10:01:00.000Z", endedAt: "2026-08-19T10:30:00.000Z", status: "failed", failureClass: "agent-failure", durationSec: 1740 },
        { attempt: 2, startedAt: "2026-08-19T10:35:00.000Z", endedAt: "2026-08-19T11:05:00.000Z", status: "complete", failureClass: null, durationSec: 1800 },
      ] },
    },
    landingGate: { status: "pending", checkedAt: null, failure: null },
    publication: { published: false, publishedAt: null, deployedLive: null, deployedAt: null },
  });

  it("stage transitions, retries and failures come from run-state history", async () => {
    const { buildRunEvents } = await import("../pipeline/v2/events.mjs");
    const events = buildRunEvents({ state: stateFixture() });
    const texts = events.decisions.map((d) => d.text);
    expect(texts.some((t) => t.includes("Pass A") && t.includes("attempt 1") && t.includes("failed"))).toBe(true);
    expect(texts.some((t) => t.includes("Pass A") && t.includes("complete") && t.includes("attempt 2"))).toBe(true);
  });

  it("candidate funnel, dispositions and saturation come from the validated evidence artifact", async () => {
    const { buildRunEvents } = await import("../pipeline/v2/events.mjs");
    const evidence = {
      candidates: [
        { id: "c-a", status: "shipped", shortlisted: true },
        { id: "c-b", status: "rejected", shortlisted: false },
      ],
      reconciliation: [
        { findingId: "e-1", disposition: "adopt", note: "n" },
        { findingId: "e-2", disposition: "reject", note: "n" },
      ],
      saturation: { stopped: true, trend: "duplicates", unresolvedCouldChange: false, note: "n" },
      disagreements: [{ id: "d-1", topic: "bus vs train", impact: "recommendation-changing", investigation: "x", resolution: "y" }],
    };
    const events = buildRunEvents({ state: stateFixture(), evidence });
    const texts = events.decisions.map((d) => d.text).join("\n");
    expect(texts).toContain("2 evaluated");
    expect(texts).toContain("1 adopt");
    expect(texts).toContain("1 reject");
    expect(texts).toContain("Adaptive search stopped");
    expect(texts).toContain("bus vs train");
  });

  it("never fabricates: fetches empty, nuggets empty, counters null", async () => {
    const { buildRunEvents } = await import("../pipeline/v2/events.mjs");
    const events = buildRunEvents({ state: stateFixture() });
    expect(events.fetches).toEqual([]);
    expect(events.nuggets).toEqual([]);
    expect(events.counters).toBeNull();
  });

  it("round-trips through the progress UI's own parser (old-reader compatibility)", async () => {
    const { buildRunEvents } = await import("../pipeline/v2/events.mjs");
    const { parseRunEvents } = await import("../../src/features/pipeline-progress/model/run-events.ts");
    const parsed = parseRunEvents(buildRunEvents({ state: stateFixture() }));
    expect(parsed.available).toBe(true);
    expect(parsed.decisions.length).toBeGreaterThan(0);
    expect(parsed.counters).toBeNull();
    // An empty emission parses back to the honest empty state, never a fake "alive" one.
    const empty = parseRunEvents(buildRunEvents({ state: { stageOrder: [], stages: {}, attempts: { cap: 5 } } }));
    expect(empty.available).toBe(false);
  });

  it("geocode outcomes and the landing gate appear once they are real", async () => {
    const { buildRunEvents } = await import("../pipeline/v2/events.mjs");
    const state = { ...stateFixture(), landingGate: { status: "failed", checkedAt: "2026-08-19T12:30:00.000Z", failure: "network gate failed" } };
    const events = buildRunEvents({ state, geocode: { attemptedAt: "2026-08-19T12:10:00.000Z", resolved: [{}, {}], unresolved: [{}] } });
    const texts = events.decisions.map((d) => d.text).join("\n");
    expect(texts).toContain("2 resolved");
    expect(texts).toContain("1 left as honest blanks");
    expect(texts).toContain("Landing evidence gate FAILED");
  });
});

// ── canary scar: CLI module-graph deadlock ───────────────────────────────────

describe("canary scar — pipeline.mjs gate cannot deadlock its own module graph", () => {
  // The first live canary died at `gate preflight` with Node exit 13 ("unsettled top-level
  // await"): pipeline.mjs's CLI used top-level await, gate.mjs statically imports pipeline.mjs
  // back, and the dynamic import of gate.mjs waited forever on the suspended evaluation. This
  // spawns the REAL CLI through the REAL cycle — an unknown gate kind exercises the import path
  // with zero side effects and must exit 1 (the dispatcher's refusal), never 13.
  it("`pipeline.mjs gate <unknown> --slug x` exits 1, not 13 (the deadlock exit)", async () => {
    const { execFile } = await import("node:child_process");
    const code = await new Promise((resolve) => {
      execFile(process.execPath, [path.join(ROOT, "scripts", "pipeline.mjs"), "gate", "definitely-not-a-gate", "--slug", "korea"], { cwd: ROOT }, (err) => resolve(err?.code ?? 0));
    });
    expect(code).toBe(1);
  }, 30_000);

  it("both CLI entries run through the non-TLA cliMain wrapper (the deadlock precondition removed)", () => {
    for (const file of ["scripts/pipeline.mjs", "scripts/pipeline-v2.mjs"]) {
      const text = readFileSync(path.join(ROOT, file), "utf8");
      expect(text, `${file} must invoke its CLI as a plain promise, never top-level await`).toContain("cliMain().catch");
    }
  });
});

// ── canary scar: permission-rule syntax ──────────────────────────────────────

describe("canary scar — agent permission rules use the syntax the CLI actually consults", () => {
  // The first canary's Pass A researched for 15 minutes and could not write ONE file: a
  // single-leading-slash rule path is settings-relative (never matches /workspace), and
  // Write()/Glob()/Grep() path rules are accepted but ignored. Verified against
  // code.claude.com/docs/en/permissions (2026-08-19): absolute = double slash; Edit(//…)
  // covers Write/MultiEdit/NotebookEdit.
  it("the workflow carries no single-slash /workspace rule and no ignored Write() rule", () => {
    expect(WORKFLOW).not.toMatch(/\((?:\/workspace|\/proc|\/sys|\/dev)\//);
    expect(WORKFLOW).not.toContain("Write(");
    expect(WORKFLOW).toContain("Edit(//workspace/**)");
    expect(WORKFLOW).toContain("Read(//proc/**)");
  });

  it("the critic's generated fetch policy uses the same corrected syntax", async () => {
    const text = readFileSync(path.join(ROOT, "scripts", "pipeline-v2.mjs"), "utf8");
    expect(text).toContain('"Read(//workspace/**)", "Edit(//workspace/**)"');
    expect(text).not.toContain('"Write(/workspace/**)"');
  });
});

// ── canary scar: composition strands coverage refs ───────────────────────────

describe("canary scar — coverage refs follow their anchors through composition renames", () => {
  const SLUG = "remapland";
  let guides;

  async function seed({ asks, files }) {
    guides = path.join(dir, "guides");
    await mkdir(path.join(guides, SLUG), { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      await writeFile(path.join(guides, SLUG, name), JSON.stringify(content));
    }
    await mkdir(path.join(dir, SLUG), { recursive: true });
    await writeFile(path.join(dir, SLUG, "coverage.v2.json"), JSON.stringify({
      schemaVersion: COVERAGE_SCHEMA, slug: SLUG, runId: "r-1", asks,
    }));
  }

  it("a same-suffix rename (06-days → 04-days) is followed; an untouched ref is left alone", async () => {
    const { remapCoverageRefs } = await import("../pipeline/v2/coverage.mjs");
    await seed({
      files: {
        "01-plan.json": { plan: { type: "prose", title: "Arrival day" } },
        "04-days.json": { days: { type: "days", title: "Day by day" } },
      },
      asks: [
        { id: "dates", ask: "dates", status: "covered", where: ["06-days.json#day-by-day"], evidenceIds: [], reason: null },
        { id: "plan", ask: "plan", status: "covered", where: ["01-plan.json#arrival-day"], evidenceIds: [], reason: null },
      ],
    });
    const { changed } = await remapCoverageRefs(SLUG, { intakeDir: dir, guidesDir: guides });
    expect(changed).toBe(true);
    const doc = JSON.parse(await readFile(path.join(dir, SLUG, "coverage.v2.json"), "utf8"));
    expect(doc.asks[0].where).toEqual(["04-days.json#day-by-day"]);
    expect(doc.asks[1].where).toEqual(["01-plan.json#arrival-day"]);
  });

  it("an anchor found in exactly one other group follows it; an unresolvable anchor fails closed", async () => {
    const { remapCoverageRefs } = await import("../pipeline/v2/coverage.mjs");
    await seed({
      files: { "02-food.json": { food: { type: "venues", title: "Food", items: [{ name: "Noodle Bar" }] } } },
      asks: [{ id: "p1", ask: "food", status: "covered", where: ["08-food-and-shopping.json#noodle-bar"], evidenceIds: [], reason: null }],
    });
    const { changed } = await remapCoverageRefs(SLUG, { intakeDir: dir, guidesDir: guides });
    expect(changed).toBe(true);
    const doc = JSON.parse(await readFile(path.join(dir, SLUG, "coverage.v2.json"), "utf8"));
    expect(doc.asks[0].where).toEqual(["02-food.json#noodle-bar"]);

    await seed({
      files: { "02-food.json": { food: { type: "venues", title: "Food" } } },
      asks: [{ id: "p1", ask: "food", status: "covered", where: ["08-nothing.json#vanished-anchor"], evidenceIds: [], reason: null }],
    });
    await expect(remapCoverageRefs(SLUG, { intakeDir: dir, guidesDir: guides })).rejects.toThrow(/could not be remapped/);
  });

  it("the critic job runs the remap between composition and verification", () => {
    const at = (s) => WORKFLOW.indexOf(s);
    expect(at("remap-coverage --slug")).toBeGreaterThan(at("compose-guide.mjs --slug \"$SLUG\" --write"));
    expect(at("remap-coverage --slug")).toBeLessThan(at("verify-failed --slug \"$SLUG\" --stage critic"));
  });
});

// ── P4: dispatch guard ───────────────────────────────────────────────────────

describe("P4 — an accidental default-branch dispatch cannot start research", () => {
  it("the setup job's FIRST step refuses default-branch runs before any spend", () => {
    expect(WORKFLOW).toContain("github.ref_name == github.event.repository.default_branch");
    expect(WORKFLOW).toContain("WAYPOINT_RESEARCH_ENGINE");
    const guardAt = WORKFLOW.indexOf("Guard — research never starts from the default branch");
    const firstCheckout = WORKFLOW.indexOf("uses: actions/checkout", WORKFLOW.indexOf("jobs:"));
    expect(guardAt).toBeGreaterThan(0);
    expect(guardAt).toBeLessThan(firstCheckout);
  });
});
