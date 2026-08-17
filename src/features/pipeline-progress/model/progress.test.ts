// @protects-file The research progress page reports the real state of a run, including when it fails.

import { describe, it, expect } from "vitest";
import {
  deriveProgress, formatElapsed, normalizeSlug, predictSlug, STAGE_ORDER, STUCK_THRESHOLD_MS,
  derivePageState, deriveStatusPill, deriveProgressLine, derivePhases, deriveNotePanel, PHASE_STATUS_LABEL,
} from "./progress";
import { FRESH_SCAFFOLD, MID_RESEARCH, STALLED, VERIFIED } from "../mocks/seeds";

describe("deriveProgress", () => {
  it("returns an all-not-done view with zero elapsed when no state exists yet", () => {
    const v = deriveProgress(null, { now: new Date("2026-07-19T10:00:00Z"), published: false });
    expect(v.stages.every((s) => !s.done)).toBe(true);
    expect(v.currentIndex).toBe(0);
    expect(v.percent).toBe(0);
    expect(v.elapsedMs).toBe(0);
    expect(v.isDone).toBe(false);
    expect(v.isStuck).toBe(false);
  });

  it("marks only scaffold done right after scaffolding, current index at passA", () => {
    const v = deriveProgress(FRESH_SCAFFOLD, { now: new Date("2026-07-19T10:05:00Z"), published: false });
    expect(v.stages[0]).toMatchObject({ key: "scaffold", done: true });
    expect(v.stages[1]).toMatchObject({ key: "passA", done: false });
    expect(v.currentIndex).toBe(1);
    expect(v.percent).toBe(Math.round((1 / 6) * 100));
    expect(v.elapsedMs).toBe(5 * 60 * 1000);
  });

  it("reflects mid-research progress (passA + passB done, reconcile next)", () => {
    const v = deriveProgress(MID_RESEARCH, { now: new Date("2026-07-19T10:40:00Z"), published: false });
    expect(v.stages.filter((s) => s.done).map((s) => s.key)).toEqual(["scaffold", "passA", "passB"]);
    expect(v.currentIndex).toBe(3); // reconcile
    expect(v.percent).toBe(Math.round((3 / 6) * 100));
  });

  it("is NOT done when verified but not yet published", () => {
    const v = deriveProgress(VERIFIED, { now: new Date("2026-07-19T11:15:00Z"), published: false });
    expect(v.stages.find((s) => s.key === "verified")?.done).toBe(true);
    expect(v.stages.find((s) => s.key === "published")?.done).toBe(false);
    expect(v.isDone).toBe(false);
    expect(v.currentIndex).toBe(5); // published
  });

  it("is fully done once verified AND published", () => {
    const v = deriveProgress(VERIFIED, { now: new Date("2026-07-19T11:15:00Z"), published: true });
    expect(v.isDone).toBe(true);
    expect(v.percent).toBe(100);
    expect(v.currentIndex).toBe(STAGE_ORDER.length);
  });

  it("flags isStuck when updatedAt is stale and the pipeline isn't done", () => {
    const staleNow = new Date(new Date(MID_RESEARCH.updatedAt).getTime() + STUCK_THRESHOLD_MS + 1000);
    const v = deriveProgress(MID_RESEARCH, { now: staleNow, published: false });
    expect(v.isStuck).toBe(true);
  });

  it("never flags isStuck once the pipeline is fully done, no matter how old", () => {
    const farFuture = new Date(new Date(VERIFIED.updatedAt).getTime() + STUCK_THRESHOLD_MS * 10);
    const v = deriveProgress(VERIFIED, { now: farFuture, published: true });
    expect(v.isStuck).toBe(false);
  });

  it("does not flag isStuck while genuinely still progressing (recent update)", () => {
    const recentNow = new Date(new Date(MID_RESEARCH.updatedAt).getTime() + 60 * 1000);
    const v = deriveProgress(MID_RESEARCH, { now: recentNow, published: false });
    expect(v.isStuck).toBe(false);
  });

  it("clamps elapsed to zero rather than going negative for a clock skew edge case", () => {
    const v = deriveProgress(FRESH_SCAFFOLD, { now: new Date("2026-07-19T09:00:00Z"), published: false });
    expect(v.elapsedMs).toBe(0);
  });
});

describe("formatElapsed", () => {
  it("renders seconds only under a minute", () => {
    expect(formatElapsed(45_000)).toBe("45s");
  });

  it("renders minutes + seconds under an hour", () => {
    expect(formatElapsed(3 * 60_000 + 12_000)).toBe("3m 12s");
  });

  it("pads single-digit seconds", () => {
    expect(formatElapsed(3 * 60_000 + 5_000)).toBe("3m 05s");
  });

  it("rolls into days past 24 hours, so a stalled run does not read as '412h 06m'", () => {
    expect(formatElapsed(24 * 3600_000)).toBe("1d 0h");
    expect(formatElapsed(412 * 3600_000 + 6 * 60_000)).toBe("17d 4h");
  });

  it("renders hours + padded minutes at/over an hour", () => {
    expect(formatElapsed(60 * 60_000 + 4 * 60_000)).toBe("1h 04m");
  });

  it("floors fractional seconds", () => {
    expect(formatElapsed(1999)).toBe("1s");
  });
});

describe("predictSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(predictSlug("South Korea")).toBe("south-korea");
  });

  it("strips accents", () => {
    expect(predictSlug("Île-de-France")).toBe("ile-de-france");
  });

  it("collapses punctuation runs into one hyphen", () => {
    expect(predictSlug("Trinidad & Tobago!!")).toBe("trinidad-tobago");
  });

  it("falls back to \"guide\" for empty input", () => {
    expect(predictSlug("")).toBe("guide");
  });
});

describe("normalizeSlug (the ONE gate on both slug entrances)", () => {
  // A slug reaches this page two ways — ?slug= in the URL, and the manual-correction input the
  // page offers when the guess never resolves. Both then build the same fetch paths and the same
  // "view the guide" href, so both need the same check; only one of them used to have it.

  it("accepts the shape scaffold-guide.mjs actually emits", () => {
    for (const ok of ["south-korea", "korea", "guide-2", "a", "trinidad-tobago", "ile-de-france"]) {
      expect(normalizeSlug(ok)).toBe(ok);
    }
  });

  it("normalizes what a human types into an input — surrounding space, capitals", () => {
    expect(normalizeSlug("  South-Korea  ")).toBe("south-korea");
    expect(normalizeSlug("KOREA")).toBe("korea");
    expect(normalizeSlug("korea\n")).toBe("korea");
  });

  it("rejects path traversal rather than building a URL out of it", () => {
    for (const bad of ["../../x", "../korea", "korea/../../etc", "/korea", "korea/"]) {
      expect(normalizeSlug(bad)).toBe("");
    }
  });

  it("rejects anything that would leave the path — schemes, protocol-relative hosts, queries", () => {
    for (const bad of ["javascript:alert(1)", "//evil.test/x", "https://evil.test", "korea?x=1", "korea#f"]) {
      expect(normalizeSlug(bad)).toBe("");
    }
  });

  it("rejects the near-misses a real typo produces", () => {
    // Inner space, underscore, doubled or edge hyphens, an un-stripped accent: all shapes
    // scaffold-guide.mjs never produces, so a fetch for them can only 404.
    for (const bad of ["Korea Trip", "a_b", "korea--2", "-korea", "korea-", "koreá"]) {
      expect(normalizeSlug(bad)).toBe("");
    }
  });

  it("treats absent input as no slug, never as the string \"null\"", () => {
    expect(normalizeSlug(null)).toBe("");
    expect(normalizeSlug(undefined)).toBe("");
    expect(normalizeSlug("")).toBe("");
    expect(normalizeSlug("   ")).toBe("");
  });
});

/* ── The cockpit's derived views ─────────────────────────────────────────────────────────── */

const NOW_MID = new Date("2026-07-19T10:40:00Z");
const midView = () => deriveProgress(MID_RESEARCH, { now: NOW_MID, published: false });
const emptyView = () => deriveProgress(null, { now: NOW_MID, published: false });
const stalledView = () => deriveProgress(STALLED, { now: new Date("2026-07-19T11:00:00Z"), published: false });
const doneView = () => deriveProgress(VERIFIED, { now: new Date("2026-07-19T11:30:00Z"), published: true });

describe("derivePageState", () => {
  it("is empty until a real state has actually been read", () => {
    // deriveProgress(null, …) is a valid view, so the view alone can't tell these apart.
    expect(derivePageState({ view: emptyView(), hasRun: false, blockingForks: 0, openQuestions: 0 })).toBe("empty");
    expect(derivePageState({ view: emptyView(), hasRun: true, blockingForks: 0, openQuestions: 0 })).toBe("running");
  });

  it("ranks done over everything, and a BLOCKING fork over the stall it caused", () => {
    expect(derivePageState({ view: doneView(), hasRun: true, blockingForks: 3, openQuestions: 3 })).toBe("done");
    expect(derivePageState({ view: stalledView(), hasRun: true, blockingForks: 1, openQuestions: 1 })).toBe("awaiting");
    expect(derivePageState({ view: stalledView(), hasRun: true, blockingForks: 0, openQuestions: 0 })).toBe("stalled");
    expect(derivePageState({ view: midView(), hasRun: true, blockingForks: 0, openQuestions: 0 })).toBe("running");
  });

  it("CHANGE (M7): a non-blocking open question never pauses the page — research proceeds on its assumption", () => {
    // The old contract put ANY open question in "awaiting" ("Waiting on you", "Paused at
    // stage…") — a false claim: V1 research never blocks on a question. Only a fork does.
    expect(derivePageState({ view: midView(), hasRun: true, blockingForks: 0, openQuestions: 2 })).toBe("running");
    expect(derivePageState({ view: midView(), hasRun: true, blockingForks: 1, openQuestions: 2 })).toBe("awaiting");
  });

  it("a MALFORMED run state surfaces as stalled — never as 'no run'", () => {
    expect(derivePageState({ view: emptyView(), hasRun: true, blockingForks: 0, openQuestions: 0, malformed: true })).toBe("stalled");
  });
});

describe("deriveStatusPill", () => {
  it("names the live stage while running and never invents one when there isn't one", () => {
    expect(deriveStatusPill("running", midView())).toEqual({ text: "Researching · Reconcile", tone: "accent" });
    expect(deriveStatusPill("running", doneView())).toEqual({ text: "Researching", tone: "accent" });
  });

  it("carries a warning tone for both states that need a human", () => {
    expect(deriveStatusPill("awaiting", midView())).toEqual({ text: "Waiting on you", tone: "warn" });
    expect(deriveStatusPill("stalled", stalledView())).toEqual({ text: "Stalled", tone: "warn" });
  });

  it("is muted before a run and green after one", () => {
    expect(deriveStatusPill("empty", emptyView())).toEqual({ text: "No run yet", tone: "muted" });
    expect(deriveStatusPill("done", doneView())).toEqual({ text: "Complete", tone: "green" });
  });
});

describe("deriveProgressLine", () => {
  it("says which stage of how many, in traveller language", () => {
    expect(deriveProgressLine("running", midView()))
      .toBe("Stage 4 of 6 — resolving where the two passes disagree.");
  });

  it("never estimates a time remaining", () => {
    // Stage durations are wildly uneven, so elapsed÷percent would be a confident wrong number —
    // exactly the plausible-but-invented claim the accuracy rules forbid.
    const all = (["empty", "running", "awaiting", "stalled", "done"] as const)
      .map((p) => deriveProgressLine(p, midView()));
    all.forEach((line) => {
      expect(line).not.toMatch(/remaining|left|eta|estimat/i);
    });
  });

  it("reports real clocks for the stalled and finished cases — and never calls a merge 'live'", () => {
    expect(deriveProgressLine("stalled", stalledView()))
      .toBe("No checkpoint for 38m 00s — stage 3 of 6 never finished.");
    // deployedLive unknown/false → the merge is stated as a merge, with the deploy unconfirmed.
    expect(deriveProgressLine("done", doneView()))
      .toBe("All 6 stages cleared in 1h 30m. Merged — the site deploy that carries it hasn't been confirmed yet.");
    // Only a CONFIRMED deploy earns the word "live".
    const live = deriveProgress(VERIFIED, { now: new Date("2026-07-19T11:30:00Z"), published: true, deployedLive: true });
    expect(deriveProgressLine("done", live)).toBe("All 6 stages cleared in 1h 30m. Live on the site.");
  });

  it("degrades to a stageless sentence rather than reading past the end of the list", () => {
    expect(deriveProgressLine("running", doneView())).toBe("Stage 7 of 6.");
    expect(deriveProgressLine("awaiting", doneView())).toBe("Paused — the run needs an answer before it goes on.");
    expect(deriveProgressLine("empty", emptyView())).toBe("No research run is attached to this page yet.");
  });
});

describe("derivePhases", () => {
  it("fills only what has actually cleared, and marks the one under way in words", () => {
    const phases = derivePhases("running", midView());
    expect(phases.map((p) => p.key)).toEqual(["passA", "passB", "critic"]);
    expect(phases[0]).toMatchObject({ fill: 1, status: "cleared" });
    expect(phases[1]).toMatchObject({ fill: 1, status: "cleared" });
    // reconcile is current, verified is not — a half-full bar, not an interpolated one.
    expect(phases[2]).toMatchObject({ fill: 0, status: "active" });
    expect(PHASE_STATUS_LABEL[phases[2].status]).toBe("under way");
  });

  it("is all-queued before anything runs and all-cleared at the end", () => {
    expect(derivePhases("empty", emptyView()).every((p) => p.fill === 0)).toBe(true);
    // Nothing is "under way" on a page with no run — scaffold being currentIndex 0 is an
    // artefact of rendering a view of nothing, not a claim that scaffolding started.
    expect(derivePhases("empty", emptyView()).every((p) => p.status === "queued")).toBe(true);
    // The same view under a real run DOES mark the phase holding the current stage.
    expect(derivePhases("running", emptyView())[0].status).toBe("active");
    expect(derivePhases("done", doneView()).every((p) => p.fill === 1 && p.status === "cleared")).toBe(true);
  });

  it("gives a partly-cleared phase a fractional fill", () => {
    const v = deriveProgress(VERIFIED, { now: new Date("2026-07-19T11:30:00Z"), published: false });
    // reconcile + verified both cleared, published pending — the critic phase is whole.
    expect(derivePhases("running", v)[2]).toMatchObject({ fill: 1, status: "cleared" });
    const mid = derivePhases("running", midView());
    expect(mid.every((p) => p.fill >= 0 && p.fill <= 1)).toBe(true);
  });
});

describe("deriveNotePanel", () => {
  it("offers a control ONLY where a real endpoint exists", () => {
    // POST /answer exists and resumes the run; mid-run notes have no endpoint anywhere.
    expect(deriveNotePanel("awaiting", "awaiting")).toMatchObject({ acceptsInput: true, placeholder: null });
    for (const page of ["running", "stalled", "done", "empty"] as const) {
      const panel = deriveNotePanel(page, "monitoring");
      expect(panel.acceptsInput).toBe(false);
      expect(typeof panel.placeholder).toBe("string");
      expect(panel.placeholder).not.toBe("");
    }
  });

  it("says out loud that mid-run notes do not exist yet", () => {
    expect(deriveNotePanel("running", "monitoring").placeholder)
      .toBe("Mid-run notes are on the way — for now the run pauses and asks whenever it needs you.");
  });

  it("lets the send/resume states override the page state", () => {
    expect(deriveNotePanel("running", "processing")).toMatchObject({ heading: "Sending your answer…", acceptsInput: true });
    expect(deriveNotePanel("awaiting", "resumed")).toMatchObject({ tone: "green", acceptsInput: false });
  });

  it("carries a warning tone exactly where a person is blocking or the run is stuck", () => {
    expect(deriveNotePanel("awaiting", "awaiting").tone).toBe("warn");
    expect(deriveNotePanel("stalled", "monitoring").tone).toBe("warn");
    expect(deriveNotePanel("running", "monitoring").tone).toBe("muted");
    expect(deriveNotePanel("done", "monitoring").tone).toBe("green");
  });
});

/* ── M7: the V2 adapter and the truths V1 could not tell ──────────────────────────────────── */

import { adaptV2Snapshot } from "./progress";

const v2Run = (over: Record<string, unknown> = {}) => ({
  schemaVersion: "wp-run/2.0",
  slug: "testland",
  runId: "r-1",
  lifecycle: "research",
  status: "running",
  createdAt: "2026-08-17T10:00:00Z",
  updatedAt: "2026-08-17T10:05:00Z",
  stages: {
    scaffold: { status: "complete", endedAt: "2026-08-17T10:01:00Z" },
    passA: { status: "running", startedAt: "2026-08-17T10:02:00Z" },
    passB: { status: "queued" }, reconcile: { status: "queued" }, critic: { status: "queued" },
  },
  attempts: { total: 1, cap: 5 },
  publication: { published: false, deployedLive: null },
  failure: null,
  ...over,
});

describe("adaptV2Snapshot (M7)", () => {
  it("maps V2 stages onto the stations (critic → the verify station) and keeps the real status", () => {
    const snap = adaptV2Snapshot(v2Run({
      status: "complete",
      stages: {
        scaffold: { status: "complete", endedAt: "a" }, passA: { status: "complete", endedAt: "b" },
        passB: { status: "complete", endedAt: "c" }, reconcile: { status: "complete", endedAt: "d" },
        critic: { status: "complete", endedAt: "e" },
      },
    }));
    expect(snap.version).toBe(2);
    expect(snap.malformed).toBe(false);
    expect(snap.state?.stages).toEqual({ scaffold: "a", passA: "b", passB: "c", reconcile: "d", verified: "e" });
    expect(snap.runStatus).toBe("complete");
  });

  it("a failed run carries its failure class; deployed-live carries only when recorded", () => {
    const snap = adaptV2Snapshot(v2Run({ status: "failed", failure: { class: "void-run", detail: "x" } }));
    expect(snap.runStatus).toBe("failed");
    expect(snap.failureClass).toBe("void-run");
    expect(snap.deployedLive).toBe(null);
    const live = adaptV2Snapshot(v2Run({ publication: { published: true, deployedLive: true } }));
    expect(live.deployedLive).toBe(true);
  });

  it("fails CLOSED on a document that is not a compatible V2 run", () => {
    expect(adaptV2Snapshot(null).malformed).toBe(true);
    expect(adaptV2Snapshot({ schemaVersion: "wp-run/3.0" }).malformed).toBe(true);
    expect(adaptV2Snapshot("garbage").malformed).toBe(true);
  });
});

describe("deriveProgress with a V2 run status (M7) — no more 20-minute guess", () => {
  it("a LONG HEALTHY STAGE stays running: the recorded status wins over the stale clock", () => {
    // 3 hours since the last checkpoint — V1's clock would scream "Stalled"; the V2 run says
    // running, and the run's own word is the truth.
    const snap = adaptV2Snapshot(v2Run());
    const v = deriveProgress(snap.state, {
      now: new Date("2026-08-17T13:05:00Z"), published: false, runStatus: snap.runStatus,
    });
    expect(v.isStuck).toBe(false);
    expect(v.runFailed).toBe(false);
  });

  it("a RECORDED failure is stuck immediately — no clock needed, and the pill says Failed", () => {
    const snap = adaptV2Snapshot(v2Run({ status: "failed", failure: { class: "agent-failure", detail: "x" } }));
    const v = deriveProgress(snap.state, {
      now: new Date("2026-08-17T10:06:00Z"), published: false, runStatus: snap.runStatus,
    });
    expect(v.isStuck).toBe(true);
    expect(v.runFailed).toBe(true);
    expect(deriveStatusPill("stalled", v)).toEqual({ text: "Failed", tone: "warn" });
    expect(deriveProgressLine("stalled", v)).toMatch(/recorded a failure/);
  });

  it("V1 (no run status) keeps its labeled clock heuristic — nothing better exists there", () => {
    const staleNow = new Date(new Date(MID_RESEARCH.updatedAt).getTime() + STUCK_THRESHOLD_MS + 1000);
    const v = deriveProgress(MID_RESEARCH, { now: staleNow, published: false });
    expect(v.isStuck).toBe(true);
    expect(v.runFailed).toBe(false);
    expect(deriveStatusPill("stalled", v).text).toBe("Stalled");
  });
});

describe("deriveNotePanel with open non-blocking questions (M7)", () => {
  it("offers the REAL answer control while research continues — the endpoint exists now", () => {
    const panel = deriveNotePanel("running", "monitoring", { openQuestions: 2 });
    expect(panel.acceptsInput).toBe(true);
    expect(panel.placeholder).toBe(null);
    expect(panel.heading).toMatch(/research continues/);
  });

  it("stays the admitted gap with no questions open", () => {
    const panel = deriveNotePanel("running", "monitoring", { openQuestions: 0 });
    expect(panel.acceptsInput).toBe(false);
    expect(panel.placeholder).not.toBe(null);
  });
});
