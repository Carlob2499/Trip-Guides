/**
 * Public surface for the pipeline-progress feature. Never deep-import ui/ or model/ from
 * outside this file — see CLAUDE.md's sealed-silo rule.
 *
 * Started as a READ-ONLY progress view over state scripts/pipeline.mjs already writes
 * (guides-intake/<slug>/state.json, git-tracked) plus one derived signal (whether the guide's
 * own JSON on `main` still has `draft: true`).
 *
 * Batch 3 made the page the place decisions get MADE, not just watched: answers to intake
 * questions, choices on blocking forks, and approvals of feedback-driven revision proposals all
 * go out from here through the site's backend Worker. Those three controls are owner-gated (the
 * Worker's `X-Owner-Key` replaced the deleted approval labels) and stay hidden until a key is
 * stored in this browser — the read-only progress view is unchanged for everyone else.
 */
export {
  deriveProgress,
  formatElapsed,
  predictSlug,
  normalizeSlug,
  STAGE_ORDER,
  STAGE_LABEL,
  STAGE_SHORT,
  STUCK_THRESHOLD_MS,
  derivePageState,
  deriveStatusPill,
  deriveProgressLine,
  derivePhases,
  deriveNotePanel,
  PHASE_STATUS_LABEL,
  adaptV2Snapshot,
  EMPTY_SNAPSHOT,
} from "./model/progress";
export type {
  PipelineState, ProgressView, StageView, Stage, PipelineStage, RunSnapshot,
  PageState, Tone, StatusPill, PhaseView, PhaseStatus, NoteState, NotePanelView,
} from "./model/progress";
export {
  parseRunEvents, pushBounded, fetchTone, fetchHost, probeEventsThisTick,
  EMPTY_RUN_EVENTS, FETCH_BUFFER, DECISION_BUFFER, EVENT_PROBES, EVENT_RECHECK_EVERY,
} from "./model/run-events";
export type {
  RunEvents, FetchEvent, DecisionEvent, Nugget, RunCounters, FetchTone,
} from "./model/run-events";
export { toProposals, proposalMatchesSlug, REVISION_LABEL } from "./model/proposals";
export type { RevisionProposal, RawIssue } from "./model/proposals";
export { createGithubGateway, createWorkerGateway } from "./gateway";
export type { ProgressGateway, GithubGatewayOptions, WorkerGateway, WorkerGatewayOptions } from "./gateway";

// A1: re-exported so the progress PAGE can boot the UI through this silo's own public
// surface instead of a deep import into ui/ (progress/index.astro used to import
// "../../features/pipeline-progress/ui/progress.js" directly).
export { initProgress } from "./ui/progress.js";
