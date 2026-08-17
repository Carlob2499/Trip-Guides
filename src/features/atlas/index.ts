/* The Atlas feature's public surface (sealed-silo contract, ARCHITECTURE.md) — the only door
   another module may import through. Stage B (docs/archive/INDEX.md → PLAN_ATLAS_MIGRATION) ships model/ only;
   Stage C adds ui/ (the globe element, table view, overlays) behind this same door. */
export {
  deriveGuideRecord,
  firstMapCenter,
  anchorLabelFromKicker,
  statusFor,
  originFor,
  coverImgFor,
  firstDayDateOf,
  lastDayDateOf,
} from "./model/guide-record";
export type {
  GuideAtlasRecord,
  GuideRecordInput,
  GuideOrigin,
  TripStatus,
  CoverLike,
  SectionLike,
  FactLike,
} from "./model/guide-record";
export { buildSectionRecord, buildGuideSearchIndex } from "./model/search-index";
export type { SearchableSection, SearchRecord } from "./model/search-index";
export { solvePlacement } from "./model/solver";
export type { SolverCard, SeatPlacement, SolveResult, Obstacle } from "./model/solver";
export { relevanceOrder, quickCardKicker } from "./model/relevance";
export type { RelevanceInput } from "./model/relevance";
export { isGuideBuilding, deriveBuildingGuides } from "./model/building";
export type { BuildingGuide, BuildingGuideInput, RunStateLike, RunStateV2Like } from "./model/building";
export { localClockLabel } from "./model/local-time";
export { initAtlasSearch } from "./ui/search.js";
export { initAtlasWorld } from "./ui/world-view.js";
export { startLocalClocks } from "./ui/local-clock.js";
export { initCover } from "./ui/cover.js";
