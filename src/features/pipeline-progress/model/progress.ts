/**
 * Pure progress-derivation logic for the New Guide pipeline tracker. Mirrors
 * scripts/pipeline.mjs's STAGE_ORDER/state shape exactly (that file is the durable,
 * git-tracked source of truth — guides-intake/<slug>.state.json) plus one client-only
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

/** Mirrors scripts/pipeline.mjs's on-disk guides-intake/<slug>.state.json shape exactly. */
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
    return { stages: emptyStages(), currentIndex: 0, percent: 0, elapsedMs: 0, attempts: 0, isDone: false, isStuck: false };
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

  const sinceUpdateMs = now.getTime() - new Date(state.updatedAt).getTime();
  const isStuck = !isDone && sinceUpdateMs > STUCK_THRESHOLD_MS;

  return { stages, currentIndex, percent, elapsedMs, attempts: state.attempts || 0, isDone, isStuck };
}

/** "5s" / "3m 12s" / "1h 04m" — no dependency on src/features/live-data's clock helpers (this
 *  measures a duration, not a time-of-day), so it's a small standalone formatter, not a reuse. */
export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
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
