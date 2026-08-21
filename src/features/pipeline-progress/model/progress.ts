/**
 * Pure progress-derivation logic for the New Guide pipeline tracker. Mirrors
 * scripts/pipeline.mjs's STAGE_ORDER/state shape exactly (that file is the durable,
 * git-tracked source of truth — guides-intake/<slug>/state.json) plus one client-only
 * stage, `published`, which pipeline.mjs never tracks: it's derived by the caller
 * probing whether the live guide page actually resolves (see index.ts's gateway).
 *
 * No network, no DOM — the ui/ layer fetches the raw state and calls deriveProgress().
 */

export const PIPELINE_STAGE_ORDER = ["scaffold", "passA", "passB", "reconcile", "verified"] as const;
export type PipelineStage = (typeof PIPELINE_STAGE_ORDER)[number];

export const STAGE_ORDER = [...PIPELINE_STAGE_ORDER, "published"] as const;
export type Stage = (typeof STAGE_ORDER)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  scaffold: "Scaffold created",
  passA: "Pass A — canonical & verified",
  passB: "Pass B — local, authentic, crowd-aware",
  reconcile: "Reconcile A + B → one guide",
  verified: "Verify PASS + build clean",
  // "merged", deliberately not "live": publication is the merge to main; the Pages deploy is a
  // separate later fact (ProgressView.deployedLive) and this page must not conflate the two.
  published: "Published — merged to the site",
};

/** Mirrors scripts/pipeline.mjs's on-disk guides-intake/<slug>/state.json shape exactly. */
export interface PipelineState {
  slug: string;
  createdAt: string;
  updatedAt: string;
  stages: Record<PipelineStage, string | null>;
  attempts: number;
  notes: { stage: string; note: string; at: string }[];
}

/* ── V2 run-state adapter ──────────────────────────────────────────────────────────────────
   Pipeline V2 records a run in guides-intake/<slug>/run.v2.json (scripts/pipeline/v2/) with
   per-stage status, a run-level status, failure classification, and publication vs
   deployed-live as DISTINCT facts. This adapts that richer record into the view this page
   already paints — plus the facts V1 never had, which is what makes the page stop guessing. */

/** The four landing outcomes a V2 run records (contracts.mjs `landing.outcome`). */
export type LandingOutcome = "pending" | "merged" | "draft" | "failed";

/** What one poll learned about the run, whichever pipeline generation produced it. */
export interface RunSnapshot {
  /** 0 = no run found · 1 = V1 state.json · 2 = V2 run.v2.json. */
  version: 0 | 1 | 2;
  /** V2 only — the run's identity, the join key for run-scoped telemetry (eventsForRun). Null
   *  for V1 and no-run snapshots: V1 emits no events, so null correctly renders honest-empty
   *  telemetry rather than another run's stream. */
  runId: string | null;
  state: PipelineState | null;
  /** V2 only — the run's own recorded status. Null for V1 (it never records one). */
  runStatus: "pending" | "running" | "paused" | "complete" | "failed" | "stuck" | null;
  /** V2 only — the recorded failure classification, when the run failed. */
  failureClass: string | null;
  /** V2 only — THIS RUN's own publication fact (run.v2.json `publication.published`), which is
   *  what the page must key "Published" on: a re-research (Run B) of an already-live guide must
   *  never inherit Run A's publication just because the slug exists on main. Null for V1/no-run
   *  snapshots — those fall back to the main-branch draft-flag probe. */
  published: boolean | null;
  /** V2 only — the run's recorded landing outcome. "failed" = research may have PASSED its gate
   *  while the merge/publish step failed; the page must say exactly that, never "researching"
   *  or "complete". Null for V1 (it records no landing). */
  landingOutcome: LandingOutcome | null;
  /** V2 only — the run's own deployed-live fact (null = not yet known, which is honest). */
  deployedLive: boolean | null;
  /** True when a V2 file EXISTS but cannot be read as a run — never silently "no run". */
  malformed: boolean;
  /** True when BOTH generations are genuinely active for this slug — an invalid state that gets
   *  an explicit diagnostic, never an arbitrary precedence pick (run-generation.mjs). */
  conflict: boolean;
}

export const EMPTY_SNAPSHOT: RunSnapshot = {
  version: 0, runId: null, state: null, runStatus: null, failureClass: null,
  published: null, landingOutcome: null, deployedLive: null, malformed: false, conflict: false,
};

/** V2 stage keys → this page's stations. The critic IS the verify station: it runs the verify
    loop and is the last research stage before landing. */
const V2_STAGE_TO_STATION: Record<string, PipelineStage> = {
  scaffold: "scaffold", passA: "passA", passB: "passB", reconcile: "reconcile",
};

/**
 * Adapt a raw run.v2.json document. A document that is not a compatible V2 run state comes back
 * `malformed: true` — the caller must surface that, never treat it as "no run" (the fail-closed
 * rule the V2 contracts carry, applied at the reading edge too).
 */
export function adaptV2Snapshot(raw: unknown): RunSnapshot {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_SNAPSHOT, version: 2, malformed: true };
  }
  const r = raw as Record<string, unknown>;
  const validStatuses = ["pending", "running", "paused", "complete", "failed", "stuck"] as const;
  const iso = (value: unknown) => typeof value === "string" && !Number.isNaN(Date.parse(value));
  const attemptsDoc = r.attempts as Record<string, unknown> | null;
  const publicationDoc = r.publication as Record<string, unknown> | null;
  if (!/^wp-run\/2\./.test(String(r.schemaVersion ?? "")) || !r.stages || typeof r.stages !== "object" ||
      typeof r.slug !== "string" || !r.slug || typeof r.runId !== "string" || !String(r.runId).startsWith(`${r.slug}-`) ||
      !iso(r.createdAt) || !iso(r.updatedAt) || !validStatuses.includes(r.status as typeof validStatuses[number]) ||
      !attemptsDoc || !Number.isInteger(attemptsDoc.total) || !publicationDoc || typeof publicationDoc.published !== "boolean") {
    return { ...EMPTY_SNAPSHOT, version: 2, malformed: true };
  }
  const v2Stages = r.stages as Record<string, { status?: string; endedAt?: string | null } | undefined>;
  const canonicalStages = ["scaffold", "passA", "passB", "reconcile", "critic"];
  if (canonicalStages.some((key) => {
    const stage = v2Stages[key];
    return !stage || !["queued", "running", "complete", "failed"].includes(String(stage.status)) ||
      ((stage.status === "complete" || stage.status === "failed") && !iso(stage.endedAt));
  })) return { ...EMPTY_SNAPSHOT, version: 2, malformed: true };
  const stages = {} as Record<PipelineStage, string | null>;
  for (const key of PIPELINE_STAGE_ORDER) stages[key] = null;
  for (const [v2Key, station] of Object.entries(V2_STAGE_TO_STATION)) {
    const st = v2Stages[v2Key];
    if (st?.status === "complete") stages[station] = st.endedAt ?? "";
  }
  const landingGate = r.landingGate as { status?: string; checkedAt?: string | null; failure?: string | null } | null;
  if (!landingGate || !["pending", "passed", "failed"].includes(String(landingGate.status)) ||
      (landingGate.status !== "pending" && !iso(landingGate.checkedAt)) ||
      (landingGate.status === "failed" && typeof landingGate.failure !== "string")) {
    return { ...EMPTY_SNAPSHOT, version: 2, malformed: true };
  }
  if (landingGate?.status === "passed") stages.verified = String(r.updatedAt);
  const publication = (r.publication ?? {}) as { published?: boolean; deployedLive?: boolean | null };
  const status = landingGate.status === "failed" ? "failed" : String(r.status);
  const failure = r.failure as { class?: string } | null | undefined;
  // The landing record is newer than the earliest V2 documents — optional-tolerant like every
  // other read here, defaulting to "pending" exactly as the server schema does. The server
  // schema is what refuses published:true without a merged outcome; this adapter just carries
  // the recorded facts through so the page can say them.
  const landingDoc = r.landing as { outcome?: unknown } | null | undefined;
  const outcomes: LandingOutcome[] = ["pending", "merged", "draft", "failed"];
  const landingOutcome = outcomes.find((o) => o === String(landingDoc?.outcome)) ?? "pending";
  return {
    version: 2,
    runId: String(r.runId),
    state: {
      slug: String(r.slug ?? ""),
      createdAt: String(r.createdAt ?? ""),
      updatedAt: String(r.updatedAt ?? ""),
      stages,
      attempts: Number((r.attempts as { total?: number } | undefined)?.total ?? 0) || 0,
      notes: [],
    },
    runStatus: validStatuses.find((s) => s === status) ?? null,
    failureClass: landingGate.status === "failed" ? "gate-failure" : (failure?.class ?? null),
    published: publication.published === true,
    landingOutcome,
    deployedLive: typeof publication.deployedLive === "boolean" ? publication.deployedLive : null,
    malformed: false,
    conflict: false,
  };
}

export interface StageView {
  key: Stage;
  label: string;
  done: boolean;
  /** ISO timestamp the stage cleared, or null (never cleared, or the synthetic `published` stage). */
  at: string | null;
}

export interface ProgressView {
  stages: StageView[];
  /** Index into `stages` of the first not-done stage, or stages.length once everything is done. */
  currentIndex: number;
  percent: number;
  elapsedMs: number;
  /** Since the last checkpoint the pipeline wrote. 0 when no state has been read at all. */
  sinceUpdateMs: number;
  attempts: number;
  /** True once every stage (including `published`) is done. */
  isDone: boolean;
  /** No forward movement (V1's clock heuristic) or a RECORDED failure/stuck status (V2's real
   *  state) and not yet done — surfaced honestly, never hidden. */
  isStuck: boolean;
  /** True only when the run RECORDED a failure (V2). V1 has no failure record — false there. */
  runFailed: boolean;
  /** The run's recorded landing outcome (V2). "failed" means research may have PASSED while
   *  publishing did not — the page states that split, never one rewritten as the other. */
  landingOutcome: LandingOutcome | null;
  /** The Pages deploy actually carrying the published guide: true / false / null = unknown.
   *  Distinct from the `published` stage (the merge) on purpose — a merge is not "live". */
  deployedLive: boolean | null;
}

/** V1 ONLY: no checkpoint update in this long, with the guide still not fully done, reads as
 *  "stuck" rather than "still working". A guess by construction — V1 records nothing between
 *  stage boundaries, and a long healthy stage looks identical to a dead run from here. V2 runs
 *  never use this clock: their run.v2.json records running/failed/stuck for real, so a
 *  40-minute healthy Pass A stays "running" instead of false-positiving "Stalled". */
export const STUCK_THRESHOLD_MS = 20 * 60 * 1000;

function emptyStages(): StageView[] {
  return STAGE_ORDER.map((key) => ({ key, label: STAGE_LABEL[key], done: false, at: null }));
}

/**
 * Derive display state from a raw pipeline state (or null, before scaffold has even landed)
 * plus a separately-probed `published` boolean (pipeline.mjs has no notion of "published" —
 * that's this feature's own addition, resolved by checking the live guide page).
 */
export function deriveProgress(
  state: PipelineState | null,
  opts: {
    now: Date;
    published: boolean;
    /** V2's recorded run status; null/absent for V1 runs (they record none). */
    runStatus?: RunSnapshot["runStatus"];
    /** V2's recorded landing outcome; null/absent for V1 runs. */
    landingOutcome?: LandingOutcome | null;
    /** The deploy truth, when a caller has one (V2 record, or the site's own index probe). */
    deployedLive?: boolean | null;
  },
): ProgressView {
  const { now, published, runStatus = null, landingOutcome = null, deployedLive = null } = opts;

  if (!state) {
    return {
      stages: emptyStages(), currentIndex: 0, percent: 0, elapsedMs: 0, sinceUpdateMs: 0,
      attempts: 0, isDone: false, isStuck: false, runFailed: false, landingOutcome: null, deployedLive: null,
    };
  }

  const stages: StageView[] = STAGE_ORDER.map((key) => {
    if (key === "published") return { key, label: STAGE_LABEL.published, done: published, at: null };
    const at = state.stages?.[key] ?? null;
    return { key, label: STAGE_LABEL[key], done: !!at, at };
  });

  const firstNotDone = stages.findIndex((s) => !s.done);
  const isDone = firstNotDone === -1;
  const currentIndex = isDone ? stages.length : firstNotDone;
  const doneCount = stages.filter((s) => s.done).length;
  const percent = Math.round((doneCount / stages.length) * 100);
  const elapsedMs = Math.max(0, now.getTime() - new Date(state.createdAt).getTime());

  const sinceUpdateMs = Math.max(0, now.getTime() - new Date(state.updatedAt).getTime());
  const runFailed = runStatus === "failed" || runStatus === "stuck";
  // V2 runs report their REAL status, so the clock guess is not used at all: a long healthy
  // stage is "running" until the run itself records otherwise. V1 keeps the heuristic — it
  // records nothing between checkpoints, and a guess labeled as such beats silence.
  const isStuck = !isDone && (runStatus ? runFailed : sinceUpdateMs > STUCK_THRESHOLD_MS);

  return {
    stages, currentIndex, percent, elapsedMs, sinceUpdateMs,
    attempts: state.attempts || 0, isDone, isStuck, runFailed, landingOutcome, deployedLive,
  };
}

/** "5s" / "3m 12s" / "1h 04m" — no dependency on src/features/live-data's clock helpers (this
 *  measures a duration, not a time-of-day), so it's a small standalone formatter, not a reuse. */
export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  // A stalled or long-abandoned run can sit at hundreds of hours; "412h 06m" is unreadable,
  // so roll into days past a full day.
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/** The one shape a guide slug may have on this page, mirroring scripts/lib/slug.mjs's
 *  isValidSlug() (lowercase alphanumerics in single-hyphen-separated runs). */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Trim/lowercase a slug from an untrusted place — the `?slug=` query parameter OR the page's own
 * "paste the real slug" correction box — and return "" when it isn't one.
 *
 * Both entrances need this, which is why it is here rather than inline in the UI: the value ends
 * up in an href, in a raw.githubusercontent.com URL and in the body of a Worker POST, and the
 * typed one is no more trustworthy than the linked one — anyone who can get a visitor to click a
 * link can get them to paste a string. Returning "" (rather than throwing) is what lets the
 * caller fall back to the correction prompt, which is the honest answer either way: this page
 * never claims progress for a guide it cannot address.
 */
export function normalizeSlug(raw: string | null | undefined): string {
  const slug = String(raw ?? "").trim().toLowerCase();
  return SLUG_RE.test(slug) ? slug : "";
}

/** Client-side best-effort slug prediction — mirrors scaffold-guide.mjs's slugify() exactly (NFKD
 *  strip-accents, lowercase, non-alnum runs → single hyphen, trim leading/trailing hyphens). Only
 *  ever a GUESS: the real slug is whatever scripts/scaffold-guide.mjs's uniqueSlug() lands on
 *  (a rare same-name collision appends "-2"), so callers must treat a fetch-404 as "not there
 *  yet or the guess was wrong", never as a hard error. */
export function predictSlug(country: string): string {
  return (
    String(country || "")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "guide"
  );
}

/* ══ The cockpit's derived views ═══════════════════════════════════════════════════════════
   Everything below turns the one ProgressView above into the things the route-map dashboard
   actually paints: a station label, a status pill, a sentence, three phase bars, and the note
   panel's state. They are here rather than in ui/progress.js because each one is a claim about
   a run — and a claim that is wrong is this page lying, which is the failure mode the whole
   surface is built to avoid. Pure, so a test can hold each claim to the state that produced it. */

/** Station labels on the route map — short enough for 10.5px type under a 5px dot. */
export const STAGE_SHORT: Record<Stage, string> = {
  scaffold: "Scaffold",
  passA: "Pass A",
  passB: "Pass B",
  reconcile: "Reconcile",
  verified: "Verify",
  published: "Published",
};

/** What the run is doing during each stage, in a traveller's words rather than a pipeline's.
 *  These describe the PROCESS, which is fixed and documented (docs/reference/pipeline.md) —
 *  they never assert anything about this particular run's findings. */
const STAGE_ACTIVITY: Record<Stage, string> = {
  scaffold: "setting up the guide's structure",
  passA: "checking official and canonical sources",
  passB: "gathering local, on-the-ground knowledge",
  reconcile: "resolving where the two passes disagree",
  verified: "re-checking every perishable fact",
  // "landing", not "confirming the deploy": while this station is CURRENT nothing has merged
  // yet, and the old wording claimed a merge that hadn't happened (hardening pass).
  published: "landing and publishing the finished guide",
};

/** The five shapes the whole page takes. Everything else on it is derived from this one word. */
export type PageState = "empty" | "running" | "awaiting" | "stalled" | "done";

/** The pigment a piece of status carries — mapped to tokens in progress.css, never to a hex. */
export type Tone = "muted" | "accent" | "warn" | "green";

export interface PageStateInput {
  view: ProgressView;
  /** True only once a real state file has actually been read. `deriveProgress(null, …)` is a
   *  valid view, so the view alone cannot tell "not started" from "nothing found". */
  hasRun: boolean;
  /** BLOCKING forks — decisions the run is STOPPED on. Only these put the page in "awaiting":
   *  research proceeds past ordinary questions on its recorded assumption, so an open question
   *  alone must never claim the run is paused (that claim was this page lying about V1 runs). */
  blockingForks: number;
  /** Non-blocking open questions — surfaced as cards, never as a paused page. */
  openQuestions: number;
  /** A V2 state file exists but is unreadable — surfaced as stalled, never as "no run". */
  malformed?: boolean;
}

/**
 * Which of the five states the page is in. Order matters and is deliberate: a finished run is
 * finished whatever else is outstanding, and a blocking fork OUTRANKS the stall it caused —
 * "answer this" is the same fact as "nothing has moved", stated in the form the reader can act on.
 */
export function derivePageState({ view, hasRun, blockingForks, malformed = false }: PageStateInput): PageState {
  if (malformed) return "stalled"; // the state exists and cannot be read — a human problem, not an empty page
  if (!hasRun) return "empty";
  if (view.isDone) return "done";
  if (blockingForks > 0) return "awaiting";
  // A recorded terminal landing outcome that ISN'T a merge stops the run as surely as a stall:
  // "failed" = research done, publishing failed (a maintainer retries the landing); "draft" =
  // parked as a draft PR for human review. Both would otherwise render as "running… landing",
  // which is the page claiming activity nothing is performing (hardening pass).
  if (view.landingOutcome === "failed" || view.landingOutcome === "draft") return "stalled";
  if (view.isStuck) return "stalled";
  return "running";
}

export interface StatusPill {
  text: string;
  tone: Tone;
}

/** The pill beside the page title. */
export function deriveStatusPill(page: PageState, view: ProgressView): StatusPill {
  switch (page) {
    case "done":
      return { text: "Complete", tone: "green" };
    case "awaiting":
      return { text: "Waiting on you", tone: "warn" };
    case "stalled":
      // Order of truth: a recorded RESEARCH failure first (the run itself broke), then the
      // landing split — research passed but publishing failed, or parked for human review —
      // then the V1 clock's guess. Each is a different claim and gets its own words.
      if (view.runFailed) return { text: "Failed", tone: "warn" };
      if (view.landingOutcome === "failed") return { text: "Landing failed", tone: "warn" };
      if (view.landingOutcome === "draft") return { text: "Awaiting review", tone: "warn" };
      return { text: "Stalled", tone: "warn" };
    case "running": {
      const stage = view.stages[view.currentIndex];
      return { text: stage ? "Researching · " + STAGE_SHORT[stage.key] : "Researching", tone: "accent" };
    }
    default:
      return { text: "No run yet", tone: "muted" };
  }
}

/**
 * One sentence under the title saying what is true right now.
 *
 * Note what is NOT here: an estimated time remaining. Elapsed time over stage count would
 * extrapolate a figure the pipeline never produced — stage durations are wildly uneven — and a
 * confident wrong "about 20 minutes left" is precisely the plausible-but-invented claim this
 * project's accuracy rules forbid. The stage and the clock are both real; the guess is not.
 */
export function deriveProgressLine(page: PageState, view: ProgressView): string {
  const total = view.stages.length;
  const stage = view.stages[view.currentIndex];
  switch (page) {
    case "done": {
      // Merged and live are different facts, said differently: true = the deploy carrying the
      // guide is confirmed; false/null = merged, deploy not yet confirmed — never claimed.
      const tail = view.deployedLive === true
        ? "Live on the site."
        : "Merged — the site deploy that carries it hasn't been confirmed yet.";
      return `All ${total} stages cleared in ${formatElapsed(view.elapsedMs)}. ${tail}`;
    }
    case "awaiting":
      return stage
        ? `Paused at stage ${view.currentIndex + 1} of ${total} — the run needs an answer before it goes on.`
        : "Paused — the run needs an answer before it goes on.";
    case "stalled":
      if (view.runFailed) {
        return `The run recorded a failure at stage ${view.currentIndex + 1} of ${total} — it will not continue without a human.`;
      }
      // The landing split, stated as the split it is: gate truth and landing truth are separate
      // facts, and a landing failure must never read as a research failure (or as healthy).
      if (view.landingOutcome === "failed") {
        return "Research finished and passed its checks, but publishing the guide failed — nothing was published. A maintainer can retry the landing.";
      }
      if (view.landingOutcome === "draft") {
        return "Research is complete and waiting as a draft pull request for human review. Nothing publishes until it lands.";
      }
      return `No checkpoint for ${formatElapsed(view.sinceUpdateMs)} — stage ${view.currentIndex + 1} of ${total} never finished.`;
    case "running":
      return stage
        ? `Stage ${view.currentIndex + 1} of ${total} — ${STAGE_ACTIVITY[stage.key]}.`
        : `Stage ${view.currentIndex + 1} of ${total}.`;
    default:
      return "No research run is attached to this page yet.";
  }
}

/* ── Phases ─────────────────────────────────────────────────────────────────────────────── */

export type PhaseStatus = "cleared" | "active" | "queued";

export interface PhaseView {
  key: string;
  label: string;
  blurb: string;
  /** 0..1, driving a scaleX() fill. */
  fill: number;
  status: PhaseStatus;
}

/** The three groups the research actually runs in. `published` is deliberately absent: it is the
 *  arrival, not a research phase, and it already has its own station on the route map. */
const PHASES: { key: string; label: string; blurb: string; stages: Stage[] }[] = [
  { key: "passA", label: "Pass A", blurb: "Official and canonical sources", stages: ["scaffold", "passA"] },
  { key: "passB", label: "Pass B", blurb: "Local, on-the-ground knowledge", stages: ["passB"] },
  { key: "critic", label: "Critic", blurb: "Cross-checking both, then verifying", stages: ["reconcile", "verified"] },
];

/**
 * Fill per phase = the share of ITS stages that have cleared. Nothing interpolates within a
 * stage, because the pipeline checkpoints only at stage boundaries — a bar that crept forward
 * between checkpoints would be animating an estimate, and the one under way says so in words
 * instead ("under way") rather than in a fill nobody measured.
 *
 * `page` is taken for one reason: with no run attached, a view of nothing still reports a
 * currentIndex of 0, and marking the phase containing it "under way" would tell the reader
 * research is happening when nobody has asked for any. Empty means every phase is queued.
 */
export function derivePhases(page: PageState, view: ProgressView): PhaseView[] {
  const done = new Set(view.stages.filter((s) => s.done).map((s) => s.key));
  const current = page === "empty" ? undefined : view.stages[view.currentIndex]?.key;
  return PHASES.map((p) => {
    const cleared = p.stages.filter((s) => done.has(s)).length;
    const fill = cleared / p.stages.length;
    const status: PhaseStatus =
      fill === 1 ? "cleared" : current && p.stages.includes(current) ? "active" : "queued";
    return { key: p.key, label: p.label, blurb: p.blurb, fill, status };
  });
}

export const PHASE_STATUS_LABEL: Record<PhaseStatus, string> = {
  cleared: "cleared",
  active: "under way",
  queued: "queued",
};

/* ── The note panel ─────────────────────────────────────────────────────────────────────── */

/**
 * The panel that sits at the bottom of the cockpit. Four states, one of which is the only place
 * on this page a person can put something INTO a run.
 *
 * Only `awaiting` has a real endpoint behind it (the Worker's POST /answer, which already
 * exists and already resumes the run). Mid-run notes have no endpoint anywhere in the stack, so
 * the other states ship the same visual machine with one line of copy where the control would
 * be — a textarea that posts nowhere is a worse lie than an admitted gap.
 */
export type NoteState = "monitoring" | "awaiting" | "processing" | "resumed";

export interface NotePanelView {
  heading: string;
  tone: Tone;
  /** True only where a real endpoint exists behind the control. */
  acceptsInput: boolean;
  /** Shown INSTEAD of the control when there is no endpoint. Null when there is one. */
  placeholder: string | null;
}

const MONITORING_COPY =
  "Mid-run notes are on the way — for now the run pauses and asks whenever it needs you.";
const STALLED_COPY =
  "Nothing has checked in for a while. The run's own issue carries the last thing it recorded.";
const DONE_COPY = "This run has finished — there is nothing left for it to absorb.";
const EMPTY_COPY = "Start a run and this is where it asks you whatever it needs.";

export function deriveNotePanel(
  page: PageState,
  note: NoteState,
  { openQuestions = 0 }: { openQuestions?: number } = {},
): NotePanelView {
  if (note === "processing") {
    return { heading: "Sending your answer…", tone: "warn", acceptsInput: true, placeholder: null };
  }
  if (note === "resumed") {
    return { heading: "Answer sent — the run picks up from here", tone: "green", acceptsInput: false, placeholder: null };
  }
  switch (page) {
    case "awaiting":
      return { heading: "One answer needed", tone: "warn", acceptsInput: true, placeholder: null };
    case "stalled":
      return { heading: "The run is stuck", tone: "warn", acceptsInput: false, placeholder: STALLED_COPY };
    case "done":
      return { heading: "Research finished", tone: "green", acceptsInput: false, placeholder: DONE_COPY };
    case "empty":
      return { heading: "Nothing to add to yet", tone: "muted", acceptsInput: false, placeholder: EMPTY_COPY };
    default:
      // Non-blocking questions while the run keeps working: a REAL endpoint exists (POST
      // /answer routes mid-run answers onto the research branch's ledger), so the control is
      // honest input, not a textarea that posts nowhere. With no questions open the panel
      // stays the admitted gap it always was.
      if (openQuestions > 0) {
        return { heading: "Questions to answer whenever — research continues either way", tone: "accent", acceptsInput: true, placeholder: null };
      }
      return { heading: "Add to the research", tone: "muted", acceptsInput: false, placeholder: MONITORING_COPY };
  }
}
