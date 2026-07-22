/**
 * Public surface for the pipeline-progress feature. Never deep-import ui/ or model/ from
 * outside this file — see CLAUDE.md's sealed-silo rule.
 *
 * This is a READ-ONLY progress view over state scripts/pipeline.mjs already writes
 * (guides-intake/<slug>.state.json, git-tracked) plus one derived signal (whether the guide's
 * own JSON on `main` still has `draft: true`) — nothing new to keep in sync, nothing to write.
 */
export {
  deriveProgress,
  formatElapsed,
  predictSlug,
  STAGE_ORDER,
  STAGE_LABEL,
  STUCK_THRESHOLD_MS,
} from "./model/progress";
export type { PipelineState, ProgressView, StageView, Stage, PipelineStage } from "./model/progress";
export { createGithubGateway } from "./gateway";
export type { ProgressGateway, GithubGatewayOptions } from "./gateway";

// A1: re-exported so the progress PAGE can boot the UI through this silo's own public
// surface instead of a deep import into ui/ (progress/index.astro used to import
// "../../features/pipeline-progress/ui/progress.js" directly).
export { initProgress } from "./ui/progress.js";
