import { EphemeralGeolocation, type LocationContext, type LocationResult } from "./model/geolocation";

export { EphemeralGeolocation } from "./model/geolocation";
export type { EphemeralLocation, LocationContext, LocationResult, LocationStatus } from "./model/geolocation";

let browserService: EphemeralGeolocation | null = null;

function service(): EphemeralGeolocation {
  if (!browserService) {
    const nav = typeof navigator === "undefined" ? null : navigator;
    browserService = new EphemeralGeolocation(nav?.geolocation ?? null, nav?.permissions ?? null);
  }
  return browserService;
}

export function requestWaypointLocation(context: LocationContext): Promise<LocationResult> {
  return service().request(context);
}

export function currentWaypointLocation() { return service().peek(); }

/**
 * Neutral browser seam for Trip, Map, Search and SOS. Merely importing this module never asks
 * for permission. A surface opts in from a user action by dispatching `waypoint:request-location`
 * with `{context}`, then listens for `waypoint:location`.
 */
export function initLocationBridge(doc: Document = document): void {
  doc.addEventListener("waypoint:request-location", ((event: CustomEvent<{ context?: LocationContext }>) => {
    const context = event.detail?.context;
    if (!context || !(["trip", "map", "search", "sos"] as string[]).includes(context)) return;
    requestWaypointLocation(context).then((result) => {
      doc.dispatchEvent(new CustomEvent("waypoint:location", { detail: result }));
    });
  }) as EventListener);
  addEventListener("pagehide", () => service().clear(), { once: true });
}
