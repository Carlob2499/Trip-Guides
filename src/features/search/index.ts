/* search — Waypoint's ONE global search (design-system.md D6-24, docs/reference/search-ui-final.md).

   Model: the canonical-object index (built at build time) and the deterministic ranking that
   puts the current trip first and groups results by traveler object type. UI: one overlay
   opened from the global chrome on every surface — the desktop field, the mobile top field
   and the compact scrolled control all land here. Dismissal restores the exact prior context;
   selection deep-links to the object's own anchor. There is no Search page and no tab. */
export { buildSectionRecord, buildItemRecords, buildGuideSearchIndex } from "./model/search-index";
export type { SearchableSection, SearchRecord, SearchKind } from "./model/search-index";
export { rankSearch, normalizeQuery, MIN_CHARS } from "./model/rank";
export type { SearchGroup, SearchGroupKey } from "./model/rank";
export { initSearch } from "./ui/search.js";
