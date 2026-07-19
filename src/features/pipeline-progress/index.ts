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
