/* The Atlas feature's public surface (sealed-silo contract, ARCHITECTURE.md) — the only door
   another module may import through. Stage B (PLAN_ATLAS_MIGRATION.md) ships model/ only;
   Stage C adds ui/ (the globe element, table view, overlays) behind this same door. */
export {
  deriveGuideRecord,
  firstMapCenter,
  anchorLabelFromKicker,
  statusFor,
  originFor,
  coverImgFor,
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
