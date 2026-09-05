export interface WaypointPlaceIdentity {
  waypointId: string;
  googlePlaceId?: string | null;
  lookupText?: string | null;
}

export type BusinessStatus = "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY" | "FUTURE_OPENING";
export interface PlaceLiveValue {
  waypointId: string;
  googlePlaceId: string;
  businessStatus: BusinessStatus | null;
  openNow: boolean | null;
  nextOpenTime: string | null;
  nextCloseTime: string | null;
}

export interface PlaceScope {
  currentId?: string | null;
  todayIds?: string[];
  selectedIds?: string[];
}

export interface PlaceProvider {
  resolve(identity: WaypointPlaceIdentity, signal?: AbortSignal): Promise<{ waypointId: string; googlePlaceId: string } | null>;
  live(identities: WaypointPlaceIdentity[], signal?: AbortSignal): Promise<PlaceLiveValue[]>;
}

/** Restricts paid live lookups to the current, today's, or explicitly selected canonical objects. */
export function relevantPlaces(places: WaypointPlaceIdentity[], scope: PlaceScope, limit = 8): WaypointPlaceIdentity[] {
  const wanted = new Set([scope.currentId, ...(scope.todayIds ?? []), ...(scope.selectedIds ?? [])].filter(Boolean));
  const seen = new Set<string>();
  const result: WaypointPlaceIdentity[] = [];
  for (const place of places) {
    if (!wanted.has(place.waypointId) || seen.has(place.waypointId)) continue;
    seen.add(place.waypointId);
    result.push({ ...place });
    if (result.length >= Math.max(0, limit)) break;
  }
  return result;
}

export function attachExternalPlaceId(identity: WaypointPlaceIdentity, googlePlaceId: string): WaypointPlaceIdentity {
  return Object.freeze({ ...identity, googlePlaceId });
}

export function closedStatus(value: PlaceLiveValue): "temporary" | "permanent" | null {
  if (value.businessStatus === "CLOSED_TEMPORARILY") return "temporary";
  if (value.businessStatus === "CLOSED_PERMANENTLY") return "permanent";
  return null;
}

export function validPlaceValues(value: unknown): value is PlaceLiveValue[] {
  if (!Array.isArray(value)) return false;
  return value.every((place) => {
    const p = place as PlaceLiveValue;
    return !!p && typeof p.waypointId === "string" && typeof p.googlePlaceId === "string" &&
      (p.businessStatus === null || ["OPERATIONAL", "CLOSED_TEMPORARILY", "CLOSED_PERMANENTLY", "FUTURE_OPENING"].includes(p.businessStatus)) &&
      (p.openNow === null || typeof p.openNow === "boolean") &&
      (p.nextOpenTime === null || typeof p.nextOpenTime === "string") &&
      (p.nextCloseTime === null || typeof p.nextCloseTime === "string");
  });
}
