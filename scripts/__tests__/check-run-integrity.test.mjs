// Tests for the run-integrity gate (scripts/check-run-integrity.mjs) — the harness half of the
// checkpoint contract. Pure core only: git adapters are exercised for real in the workflow and by
// the forced-failure runs recorded in docs/PLAN_FACTORY_V2.md P1.
//
// The load-bearing fixture is JAPAN_BURST: the exact timestamp shape of the first real end-to-end
// run (QA finding F1). Three DISTINCT commits — so a naive "one commit per stage" check passes —
// but every stage recorded within one burst, which is the thing that actually destroys
// resumability. If this test ever goes green with an empty findings list, the gate has stopped
// catching the defect it was built for.

import { describe, it, expect } from "vitest";
import {
  MIN_GAP_SECONDS, countCleared, stageIntroducingCommits, disciplineFindings, voidVerdict,
  formatReport, stateRelPath,
} from "../check-run-integrity.mjs";

const ts = (iso) => Math.floor(Date.parse(iso) / 1000);

// A healthy run: each stage checkpointed and committed minutes apart.
const HEALTHY = [
  { sha: "aaa1", committedAt: ts("2026-07-29T09:12:03Z"), stages: { scaffold: "2026-07-29T09:12:03.000Z" } },
  { sha: "bbb2", committedAt: ts("2026-07-29T09:40:00Z"), stages: { scaffold: "2026-07-29T09:12:03.000Z", passA: "2026-07-29T09:39:50.000Z" } },
  { sha: "ccc3", committedAt: ts("2026-07-29T10:10:00Z"), stages: { scaffold: "2026-07-29T09:12:03.000Z", passA: "2026-07-29T09:39:50.000Z", passB: "2026-07-29T10:09:40.000Z" } },
  { sha: "ddd4", committedAt: ts("2026-07-29T10:32:00Z"), stages: { scaffold: "2026-07-29T09:12:03.000Z", passA: "2026-07-29T09:39:50.000Z", passB: "2026-07-29T10:09:40.000Z", reconcile: "2026-07-29T10:31:40.000Z" } },
];

// JAPAN_ACTUAL — the LITERAL history of the first end-to-end run, read back off the repo
// (`git show <sha>:guides-intake/japan.state.json` for d68524e/a3bc3a7/12c6939). It is worse than
// the modelled burst below: the commit MESSAGED "Pass A" already carried passA, passB AND
// reconcile, so the two commits after it introduced no stage state at all. The commit log narrated
// a staged run that the data proves never happened (QA finding F1a).
const JAPAN_ACTUAL = (() => {
  const stages = {
    scaffold: "2026-07-29T09:12:03.464Z",
    passA: "2026-07-29T10:32:26.640Z",
    passB: "2026-07-29T10:32:26.675Z",
    reconcile: "2026-07-29T10:32:26.711Z",
  };
  return [
    { sha: "scaf00", committedAt: ts("2026-07-29T09:12:03Z"), stages: { scaffold: stages.scaffold } },
    { sha: "d68524e", committedAt: ts("2026-07-29T10:32:33Z"), stages: { ...stages } },
    { sha: "a3bc3a7", committedAt: ts("2026-07-29T10:32:33Z"), stages: { ...stages } },
    { sha: "12c6939", committedAt: ts("2026-07-29T10:32:33Z"), stages: { ...stages } },
  ];
})();

// The Japan defect, to the millisecond: distinct commits, all at 10:32:33; checkpoints 35ms apart.
const JAPAN_BURST = [
  { sha: "scaf00", committedAt: ts("2026-07-29T09:12:03Z"), stages: { scaffold: "2026-07-29T09:12:03.464Z" } },
  { sha: "d68524e", committedAt: ts("2026-07-29T10:32:33Z"), stages: { scaffold: "2026-07-29T09:12:03.464Z", passA: "2026-07-29T10:32:26.640Z" } },
  { sha: "a3bc3a7", committedAt: ts("2026-07-29T10:32:33Z"), stages: { scaffold: "2026-07-29T09:12:03.464Z", passA: "2026-07-29T10:32:26.640Z", passB: "2026-07-29T10:32:26.675Z" } },
  { sha: "12c6939", committedAt: ts("2026-07-29T10:32:33Z"), stages: { scaffold: "2026-07-29T09:12:03.464Z", passA: "2026-07-29T10:32:26.640Z", passB: "2026-07-29T10:32:26.675Z", reconcile: "2026-07-29T10:32:26.711Z" } },
];

const runShasOf = (history, from = 1) => new Set(history.slice(from).map((c) => c.sha));

describe("countCleared", () => {
  it("counts only truthy stages", () => {
    expect(countCleared({ stages: { scaffold: "t", passA: "t", passB: null, reconcile: null, verified: null } })).toBe(2);
  });
  it("no state / no stages → 0", () => {
    expect(countCleared(null)).toBe(0);
    expect(countCleared({})).toBe(0);
  });
});

describe("stageIntroducingCommits", () => {
  it("attributes each stage to the FIRST commit that recorded it, not the latest", () => {
    const intro = stageIntroducingCommits(HEALTHY);
    expect(intro.scaffold.sha).toBe("aaa1");
    expect(intro.passA.sha).toBe("bbb2");
    expect(intro.passB.sha).toBe("ccc3");
    expect(intro.reconcile.sha).toBe("ddd4");
  });
  it("carries the stage's own checkpoint timestamp", () => {
    expect(stageIntroducingCommits(HEALTHY).passA.stageTs).toBe("2026-07-29T09:39:50.000Z");
  });
  it("un-cleared stages are absent", () => {
    expect(stageIntroducingCommits(HEALTHY).verified).toBeUndefined();
  });
});

describe("disciplineFindings", () => {
  it("a healthy run produces no findings", () => {
    expect(disciplineFindings({ history: HEALTHY, runShas: runShasOf(HEALTHY) })).toEqual([]);
  });

  it("REGRESSION (F1a · Japan, literal history): the commit labelled Pass A already carried every stage", () => {
    const findings = disciplineFindings({ history: JAPAN_ACTUAL, runShas: runShasOf(JAPAN_ACTUAL) });
    // Both consecutive pairs resolve to the same introducing commit — the "Pass B" and
    // "reconcile" commits introduced nothing, so the log's staging was fiction.
    const batched = findings.filter((f) => f.kind === "BATCHED_COMMIT");
    expect(batched).toHaveLength(2);
    expect(batched.every((f) => f.detail.includes("d68524e"))).toBe(true);
  });

  it("REGRESSION (F1 · Japan): a burst of distinct commits is still caught", () => {
    const findings = disciplineFindings({ history: JAPAN_BURST, runShas: runShasOf(JAPAN_BURST) });
    expect(findings.length).toBeGreaterThan(0);
    // Distinct shas, so this must NOT be caught as batching — it's the timing that damns it.
    expect(findings.some((f) => f.kind === "BATCHED_COMMIT")).toBe(false);
    expect(findings.some((f) => f.kind === "BURST_COMMIT")).toBe(true);
    expect(findings.some((f) => f.kind === "BURST_CHECKPOINT")).toBe(true);
    // Both consecutive pairs it created are flagged: passA→passB and passB→reconcile.
    const pairs = findings.filter((f) => f.kind === "BURST_CHECKPOINT").map((f) => f.stages.join("→"));
    expect(pairs).toContain("passA→passB");
    expect(pairs).toContain("passB→reconcile");
  });

  it("two stages sharing one commit are caught as BATCHED_COMMIT", () => {
    const history = [
      { sha: "s0", committedAt: ts("2026-07-29T09:00:00Z"), stages: { scaffold: "2026-07-29T09:00:00.000Z" } },
      { sha: "one", committedAt: ts("2026-07-29T10:00:00Z"), stages: { scaffold: "2026-07-29T09:00:00.000Z", passA: "2026-07-29T09:30:00.000Z", passB: "2026-07-29T09:58:00.000Z" } },
    ];
    const findings = disciplineFindings({ history, runShas: runShasOf(history) });
    expect(findings.some((f) => f.kind === "BATCHED_COMMIT" && f.stages.join() === "passA,passB")).toBe(true);
  });

  it("a stage inherited from a PRIOR run is never blamed on this one", () => {
    // This run created only the reconcile commit; passA/passB came from an earlier, cut-off run
    // that itself burst — not this run's fault, and not this run's finding.
    const runShas = new Set(["12c6939"]);
    expect(disciplineFindings({ history: JAPAN_BURST, runShas })).toEqual([]);
  });

  it("a run that clears a single stage has nothing to violate", () => {
    expect(disciplineFindings({ history: HEALTHY, runShas: new Set(["bbb2"]) })).toEqual([]);
  });

  it("the gap floor is configurable — a stricter floor condemns a run the default clears", () => {
    // HEALTHY's stages sit ~30 min apart, comfortably clear at the default. Raise the floor above
    // that and the same history must fail: proof the threshold is really applied, not hardcoded.
    expect(disciplineFindings({ history: HEALTHY, runShas: runShasOf(HEALTHY) })).toEqual([]);
    const strict = disciplineFindings({ history: HEALTHY, runShas: runShasOf(HEALTHY), minGapSeconds: 3600 });
    expect(strict.some((f) => f.kind === "BURST_COMMIT")).toBe(true);
    expect(strict.some((f) => f.kind === "BURST_CHECKPOINT")).toBe(true);
  });

  it("the default floor sits far below any real stage duration", () => {
    expect(MIN_GAP_SECONDS).toBeGreaterThanOrEqual(60);
    expect(MIN_GAP_SECONDS).toBeLessThan(600);
  });
});

describe("voidVerdict (F2 — the silent-success run)", () => {
  it("no new commit and no stage advanced → VOID", () => {
    expect(voidVerdict({ preHead: "abc", postHead: "abc", preStages: 1, postStages: 1 }).void).toBe(true);
  });
  it("a new commit → not void", () => {
    expect(voidVerdict({ preHead: "abc", postHead: "def", preStages: 1, postStages: 1 }).void).toBe(false);
  });
  it("a stage advanced → not void even if HEAD somehow matches", () => {
    expect(voidVerdict({ preHead: "abc", postHead: "abc", preStages: 1, postStages: 2 }).void).toBe(false);
  });
  it("a REGRESSED stage count is not treated as progress", () => {
    expect(voidVerdict({ preHead: "abc", postHead: "abc", preStages: 3, postStages: 2 }).void).toBe(true);
  });
});

describe("formatReport", () => {
  it("a void run says so unmistakably and names the green-status trap", () => {
    const out = formatReport({ slug: "japan", verdict: { void: true, movedHead: false, advancedStage: false }, findings: [] });
    expect(out).toMatch(/VOID RUN/);
    expect(out).toMatch(/left nothing behind/);
  });
  it("a clean run reports both gates green", () => {
    const out = formatReport({ slug: "japan", verdict: { void: false, movedHead: true, advancedStage: true }, findings: [] });
    expect(out).toMatch(/durable output present/);
    expect(out).toMatch(/checkpoint discipline held/);
  });
  it("findings are listed with their kind", () => {
    const out = formatReport({
      slug: "japan",
      verdict: { void: false, movedHead: true, advancedStage: true },
      findings: [{ kind: "BURST_CHECKPOINT", stages: ["passA", "passB"], detail: "35ms apart" }],
    });
    expect(out).toMatch(/CHECKPOINT DISCIPLINE VIOLATED/);
    expect(out).toMatch(/\[BURST_CHECKPOINT\] 35ms apart/);
  });
});

describe("stateRelPath", () => {
  it("points at the committed intake state file", () => {
    expect(stateRelPath("japan")).toBe("guides-intake/japan.state.json");
  });
});
