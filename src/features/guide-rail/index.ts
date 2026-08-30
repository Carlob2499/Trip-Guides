/* guide-rail — the spine rail, the phone's pill row, and the context line beneath both.

   R5's replacement for the tab-pill strip. One DOM serves all three container models; which one
   paints is decided entirely by @container queries in styles.css, so there is no device check
   and adding a device requires no code (TOKENS.md §7).

   The silo owns DERIVATION and PRESENTATION. It does not own routing: guide-ui.js remains the
   only thing that switches a station, and ui/rail.js watches the result. That split is what
   keeps scroll memory, the session key, telemetry and the thumb bar on one code path.

   Public surface — the only sanctioned imports from outside this silo. */
export { buildStations, progressGeometry, FIELD_LOG_LABEL, TOOLS_LABEL } from "./model/stations";
export type { Station, StationKind, StationInput, Geometry } from "./model/stations";
export {
  canonicalHome,
  legacyRouteAnchors,
  projectTravelerDestinations,
  routeForHome,
  TRAVELER_DESTINATION_ORDER,
} from "./model/destinations";
export type {
  CanonicalSectionHome,
  GuideRoute,
  LegacyRouteAnchor,
  ProjectedSection,
  SectionLike,
  TravelerDestination,
  TravelerDestinationName,
  TravelerProjection,
} from "./model/destinations";
export { initGuideRail } from "./ui/rail.js";
