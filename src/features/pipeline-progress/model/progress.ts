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
  published: "Published — live on the site",
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
  /** No forward movement in a long time and not yet done — surfaced honestly, never hidden. */
  isStuck: boolean;
}

/** No checkpoint update in this long, with the guide still not fully done, reads as "stuck"
 *  rather than "still working" — matches research-pass.yml's own circuit-breaker judgment call,
 *  just surfaced to the person waiting instead of only to a GitHub issue. */
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
  opts: { now: Date; published: boolean },
): ProgressView {
  const { now, published } = opts;

  if (!state) {
    return {
      stages: emptyStages(), currentIndex: 0, percent: 0, elapsedMs: 0, sinceUpdateMs: 0,
      attempts: 0, isDone: false, isStuck: false,
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
  const isStuck = !isDone && sinceUpdateMs > STUCK_THRESHOLD_MS;

  return {
    stages, currentIndex, percent, elapsedMs, sinceUpdateMs,
    attempts: state.attempts || 0, isDone, isStuck,
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
  published: "putting the finished guide live",
};

/** The five shapes the whole page takes. Everything else on it is derived from this one word. */
export type PageState = "empty" | "running" | "awaiting" | "stalled" | "done";

/** The pigment a piece of status carries — mapped to tokens in progress.css, never to a hex. */
export type Tone = "muted" | "accent" | "warn" | "green";

export interface PageStateInput {
  view: ProgressView;
  /** True only once a real state.json has actually been read. `deriveProgress(null, …)` is a
   *  valid view, so the view alone cannot tell "not started" from "nothing found". */
  hasRun: boolean;
  /** How many questions the run has emitted and nobody has answered. */
  openQuestions: number;
}

/**
 * Which of the five states the page is in. Order matters and is deliberate: a finished run is
 * finished whatever else is outstanding, and an open question OUTRANKS the stall it caused —
 * "answer this" is the same fact as "nothing has moved", stated in the form the reader can act on.
 */
export function derivePageState({ view, hasRun, openQuestions }: PageStateInput): PageState {
  if (!hasRun) return "empty";
  if (view.isDone) return "done";
  if (openQuestions > 0) return "awaiting";
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
    case "done":
      return `All ${total} stages cleared in ${formatElapsed(view.elapsedMs)}.`;
    case "awaiting":
      return stage
        ? `Paused at stage ${view.currentIndex + 1} of ${total} — the run needs an answer before it goes on.`
        : "Paused — the run needs an answer before it goes on.";
    case "stalled":
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

export function deriveNotePanel(page: PageState, note: NoteState): NotePanelView {
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
      return { heading: "Add to the research", tone: "muted", acceptsInput: false, placeholder: MONITORING_COPY };
  }
}
