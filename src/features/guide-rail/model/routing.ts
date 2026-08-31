import type { GuideRoute, LegacyRouteAnchor } from "./destinations";

const GUIDE_ROUTES = new Set<GuideRoute>([
  "days",
  "food",
  "explore",
  "essentials",
  "sources",
  "recap",
  "tools",
]);

/** Accept only canonical traveler route names. Unknown/stale values fail closed. */
export function normalizeGuideRoute(value: unknown): GuideRoute | null {
  const route = String(value ?? "").trim().toLowerCase() as GuideRoute;
  return GUIDE_ROUTES.has(route) ? route : null;
}

/** Map a preserved legacy `#grp-N` hash onto its canonical traveler route. */
export function routeForLegacyHash(
  hash: string | null | undefined,
  anchors: readonly LegacyRouteAnchor[],
): GuideRoute | null {
  const id = String(hash ?? "").replace(/^#/, "");
  if (!/^grp-\d+$/.test(id)) return null;
  return anchors.find((anchor) => anchor.id === id)?.route ?? null;
}

/** Return the legacy anchors that must remain mounted inside one canonical route panel. */
export function legacyAnchorsFor(
  route: GuideRoute,
  anchors: readonly LegacyRouteAnchor[],
): readonly LegacyRouteAnchor[] {
  return anchors.filter((anchor) => anchor.route === route);
}
