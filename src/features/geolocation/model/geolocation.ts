export type LocationContext = "trip" | "map" | "search" | "sos";
export type LocationStatus = "idle" | "available" | "denied" | "unavailable" | "timeout" | "unsupported";

export interface EphemeralLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyMeters: number;
  readonly capturedAt: string;
}

export interface LocationResult {
  readonly status: LocationStatus;
  readonly context: LocationContext;
  readonly location: EphemeralLocation | null;
}

interface PositionLike {
  coords: { latitude: number; longitude: number; accuracy: number };
  timestamp?: number;
}

interface GeolocationPort {
  getCurrentPosition(
    success: (position: PositionLike) => void,
    failure: (error: { code?: number }) => void,
    options: { enableHighAccuracy: boolean; timeout: number; maximumAge: number },
  ): void;
}

interface PermissionPort {
  query(input: { name: "geolocation" }): Promise<{ state: "granted" | "prompt" | "denied" }>;
}

const validCoordinate = (latitude: number, longitude: number, accuracy: number) =>
  Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
  Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 &&
  Number.isFinite(accuracy) && accuracy >= 0;

export class EphemeralGeolocation {
  readonly #geo: GeolocationPort | null;
  readonly #permissions: PermissionPort | null;
  readonly #now: () => number;
  #last: EphemeralLocation | null = null;
  #pending: Promise<LocationResult> | null = null;

  constructor(geo: GeolocationPort | null, permissions?: PermissionPort | null, now: () => number = Date.now) {
    this.#geo = geo;
    this.#permissions = permissions ?? null;
    this.#now = now;
  }

  /** Read permission state without triggering a browser prompt. */
  async permission(): Promise<"granted" | "prompt" | "denied" | "unsupported"> {
    if (!this.#geo) return "unsupported";
    if (!this.#permissions) return "prompt";
    try { return (await this.#permissions.query({ name: "geolocation" })).state; }
    catch { return "prompt"; }
  }

  /** Returns only the page-memory value. Coordinates are never persisted. */
  peek(): EphemeralLocation | null { return this.#last; }

  clear(): void { this.#last = null; }

  /** Call only from an explicit, contextual traveler action. */
  request(context: LocationContext): Promise<LocationResult> {
    if (!this.#geo) return Promise.resolve(Object.freeze({ status: "unsupported", context, location: null }));
    if (this.#pending) return this.#pending.then((result) => Object.freeze({ ...result, context }));

    const pending = new Promise<LocationResult>((resolve) => {
      this.#geo!.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (!validCoordinate(latitude, longitude, accuracy)) {
            resolve(Object.freeze({ status: "unavailable", context, location: null }));
            return;
          }
          this.#last = Object.freeze({
            latitude,
            longitude,
            accuracyMeters: accuracy,
            capturedAt: new Date(position.timestamp ?? this.#now()).toISOString(),
          });
          resolve(Object.freeze({ status: "available", context, location: this.#last }));
        },
        (error) => {
          const status: LocationStatus = error?.code === 1 ? "denied" : error?.code === 3 ? "timeout" : "unavailable";
          resolve(Object.freeze({ status, context, location: null }));
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
      );
    }).finally(() => { this.#pending = null; });
    this.#pending = pending;
    return pending;
  }
}
