// M6 of Pipeline V2 — connected lifecycle correctness: attempts scoped to a run, answers
// routed to the run that asked, and the recert/pretrip loops detecting what is actually in
// flight instead of a branch namespace that no longer exists.

// @protects-file A guide's lifetime is never consumed by successful runs; an answer never lands nowhere.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bumpChangeAttempt, attemptsOf } from "../pipeline/gate.mjs";
import { routeAnswers, applyAnswers } from "../pipeline/questions.mjs";
import { answeredQuestions } from "../pipeline/plan.mjs";
import { inFlightBranchPattern, hasInFlightFromRefs } from "../pretrip-check.ts";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

// ── attempts scoped to a RUN, not the guide's lifetime ───────────────────────

describe("change attempts — run-scoped (M6)", () => {
  let dir;
  beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), "waypoint-attempts-")); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it("retries of the SAME run key count up toward the cap", async () => {
    await bumpChangeAttempt("korea", { intakeDir: dir, runKey: "417" });
    await bumpChangeAttempt("korea", { intakeDir: dir, runKey: "417" });
    const state = await bumpChangeAttempt("korea", { intakeDir: dir, runKey: "417" });
    expect(attemptsOf(state, "change")).toBe(3);
  });

  it("a NEW run key resets to attempt 1 — successful runs never consume the lifetime allowance", async () => {
    // Three completed change runs (three different issues)…
    await bumpChangeAttempt("korea", { intakeDir: dir, runKey: "410" });
    await bumpChangeAttempt("korea", { intakeDir: dir, runKey: "415" });
    await bumpChangeAttempt("korea", { intakeDir: dir, runKey: "417" });
    // …and the FOURTH request still starts at attempt 1 instead of tripping the cap of 3.
    const state = await bumpChangeAttempt("korea", { intakeDir: dir, runKey: "422" });
    expect(attemptsOf(state, "change")).toBe(1);
    expect(state.change.runKey).toBe("422");
  });

  it("no run key behaves like V1 (monotonic) — legacy callers keep their semantics", async () => {
    await bumpChangeAttempt("korea", { intakeDir: dir });
    const state = await bumpChangeAttempt("korea", { intakeDir: dir });
    expect(attemptsOf(state, "change")).toBe(2);
  });
});

// ── answers routed to the run that asked ─────────────────────────────────────

describe("routeAnswers — active research owns its answers (M6)", () => {
  it("active research + a research branch → the answers go to that run", () => {
    const d = routeAnswers({ hasAnswers: true, researchActive: true, researchBranch: "research/korea", published: false });
    expect(d.target).toBe("research");
    expect(d.branch).toBe("research/korea");
  });

  it("an ACTIVE research run owns the answer even when the slug is already published — Run A live on main never steals Run B's answer (Codex blocker 1)", () => {
    const d = routeAnswers({ hasAnswers: true, researchActive: true, researchBranch: "research/korea", published: true });
    expect(d.target).toBe("research");
    expect(d.branch).toBe("research/korea");
  });

  it("a published guide with NO active research keeps the change-run behavior", () => {
    expect(routeAnswers({ hasAnswers: true, researchActive: false, researchBranch: null, published: true }).target).toBe("change");
  });

  it("active research with NO branch on origin falls back to change, saying why", () => {
    const d = routeAnswers({ hasAnswers: true, researchActive: true, researchBranch: null, published: false });
    expect(d.target).toBe("change");
    expect(d.reason).toMatch(/no research branch/);
  });

  it("a ledger-driven answers run (no dispatched answers) is always a change run", () => {
    expect(routeAnswers({ hasAnswers: false, researchActive: true, researchBranch: "research/korea", published: false }).target).toBe("change");
  });
});

describe("applyAnswers — deterministic ledger recording", () => {
  const ledger = [
    "# Ledger",
    "",
    "## Questions for the traveler",
    "",
    "### q-korea-1",
    "- **Q:** Rail pass or single tickets?",
    "- **Assumed:** single tickets",
    "- **Context:** Transit, Budget",
    "- **Status:** open",
    "",
    "### q-korea-2",
    "- **Q:** Two travellers or three?",
    "- **Assumed:** two",
    "- **Status:** open",
    "",
    "## Amendments",
    "",
    "(none)",
    "",
  ].join("\n");

  it("records the answer and flips the card to answered, in the shape planFromAnswers reads back", () => {
    const { text, applied, missing } = applyAnswers(ledger, [{ id: "q-korea-1", answer: "Rail pass — we booked it" }]);
    expect(missing).toEqual([]);
    expect(applied).toEqual([{ id: "q-korea-1", already: false }]);
    expect(text).toContain("- **A:** Rail pass — we booked it");
    // The exact contract: plan.mjs's answeredQuestions() must see this card as answered.
    const absorbed = answeredQuestions(text);
    expect(absorbed.map((q) => q.id)).toEqual(["q-korea-1"]);
    expect(absorbed[0].answer).toBe("Rail pass — we booked it");
    // The other card is untouched.
    expect(text).toContain("### q-korea-2\n- **Q:** Two travellers or three?\n- **Assumed:** two\n- **Status:** open");
  });

  it("is idempotent — an already-answered card is left alone", () => {
    const once = applyAnswers(ledger, [{ id: "q-korea-1", answer: "Rail pass" }]).text;
    const twice = applyAnswers(once, [{ id: "q-korea-1", answer: "DIFFERENT answer" }]);
    expect(twice.text).toBe(once);
    expect(twice.applied).toEqual([{ id: "q-korea-1", already: true }]);
  });

  it("a missing card id is reported, never silently dropped", () => {
    const { applied, missing } = applyAnswers(ledger, [{ id: "q-korea-99", answer: "?" }, { id: "q-korea-2", answer: "Three" }]);
    expect(missing).toEqual(["q-korea-99"]);
    expect(applied).toEqual([{ id: "q-korea-2", already: false }]);
  });

  it("multi-line answers are flattened — a card is a line-oriented record", () => {
    const { text } = applyAnswers(ledger, [{ id: "q-korea-2", answer: "Three now.\nMy brother joined." }]);
    expect(text).toContain("- **A:** Three now. My brother joined.");
  });
});

// ── pretrip in-flight detection + recert partial failure ─────────────────────

describe("pretrip in-flight detection (M6 fix)", () => {
  it("watches the CHANGE branch namespace — recert's acting half lives there now", () => {
    expect(inFlightBranchPattern("korea")).toBe("change/korea-*");
  });

  it("hasInFlightFromRefs: any listed ref = in flight; empty = clear", () => {
    expect(hasInFlightFromRefs("abc123\trefs/heads/change/korea-417\n")).toBe(true);
    expect(hasInFlightFromRefs("")).toBe(false);
    expect(hasInFlightFromRefs("  \n")).toBe(false);
  });

  it("the dead recert/<slug> namespace is gone from the source", () => {
    const src = readFileSync(path.join(ROOT, "scripts", "pretrip-check.ts"), "utf8");
    expect(src).not.toMatch(/["`']recert\/\$\{slug\}/);
  });
});

describe("recert --dispatch partial failure (M6 fix)", () => {
  it("any failed dispatch exits nonzero — a sweep that skipped guides must not read green", () => {
    const src = readFileSync(path.join(ROOT, "scripts", "recert.mjs"), "utf8");
    expect(src).toContain("process.exit(1)");
    expect(src).toMatch(/FAILED — the sweep is incomplete/);
    expect(src).not.toContain("failed === targets.length ? 1 : 0");
  });
});

// ── the workflow wiring ──────────────────────────────────────────────────────

describe("change.yml — M6 wiring", () => {
  const text = readFileSync(path.join(ROOT, ".github", "workflows", "change.yml"), "utf8");

  it("routes answers BEFORE branching/budget, and the research path skips the change machinery", () => {
    const route = text.indexOf("Route answers (active research vs change)");
    const record = text.indexOf("Record answers on the active research run");
    const branch = text.indexOf("Start or resume the change branch");
    const budget = text.indexOf("Attempt budget");
    expect(route).toBeGreaterThan(0);
    expect(record).toBeGreaterThan(route);
    expect(branch).toBeGreaterThan(record);
    expect(budget).toBeGreaterThan(branch);
    expect(text).toContain("steps.answers_route.outputs.target != 'research'");
    expect(text).toContain("answers-apply");
  });

  it("the budget is run-key scoped", () => {
    expect(text).toContain('--run-key "$RUN_KEY"');
    expect(text).toContain("RUN_KEY: ${{ needs.resolve.outputs.issue || github.run_id }}");
  });
});
