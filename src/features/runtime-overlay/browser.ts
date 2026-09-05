import { initLocationBridge, requestWaypointLocation } from "../geolocation";
import { GoogleWeatherAlertsAdapter, OpenMeteoEnvironmentAdapter, parseOpenMeteoEnvironment, validAlerts } from "../live-data/index.js";
import { GooglePlacesAdapter, validPlaceValues, type WaypointPlaceIdentity } from "../places";
import { GoogleRoutesAdapter, validMatrixValue, validRouteValue, type ItineraryStop, type RouteRequest, type TravelMode } from "../routing";
import { RuntimeOverlayClient, type OverlayCache, type RuntimeOverlay } from "./model/runtime-overlay";
import { createWorkerTransport } from "./model/transport";

interface BrowserRuntimeConfig { runtimeBackendUrl?: string | null; runtimeEnabled?: boolean; }

function memoryCache(): OverlayCache {
  const values = new Map<string, string>();
  return { get: (key) => values.get(key) ?? null, set: (key, value) => { values.set(key, value); }, remove: (key) => { values.delete(key); } };
}

const stableKey = (value: unknown) => JSON.stringify(value);

export function createBrowserRuntime(config: BrowserRuntimeConfig, fetchPort: typeof fetch = fetch) {
  const enabled = !!config.runtimeEnabled && !!config.runtimeBackendUrl;
  // Memory-only by design: route keys may contain the traveler's exact opt-in location and
  // Places policy limits retention of live operational fields. Worker KV supplies cross-reload
  // cost caching without putting either payload in browser history/storage.
  const cache = memoryCache();
  const common = { enabled, cache, online: () => typeof navigator === "undefined" || navigator.onLine !== false };
  const routesState = new RuntimeOverlayClient({ source: "google-routes", ttlMs: 5 * 60_000, staleTtlMs: 30 * 60_000, ...common });
  const matrixState = new RuntimeOverlayClient({ source: "google-route-matrix", ttlMs: 10 * 60_000, staleTtlMs: 60 * 60_000, ...common });
  // Places operational content is never cached; in-flight deduplication still prevents a burst
  // of identical UI requests from multiplying paid calls.
  const placesState = new RuntimeOverlayClient({ source: "google-places", ttlMs: 1, enabled, cache: null, online: common.online });
  const alertsState = new RuntimeOverlayClient({ source: "google-weather-alerts", ttlMs: 5 * 60_000, staleTtlMs: 30 * 60_000, ...common });
  const environmentState = new RuntimeOverlayClient({ source: "open-meteo-air-quality", ttlMs: 30 * 60_000, staleTtlMs: 2 * 60 * 60_000, enabled: true, cache, online: common.online });
  const transport = createWorkerTransport(config.runtimeBackendUrl || "", fetchPort);
  const routes = new GoogleRoutesAdapter(transport);
  const places = new GooglePlacesAdapter(transport);
  const alerts = new GoogleWeatherAlertsAdapter(transport);
  const environment = new OpenMeteoEnvironmentAdapter(fetchPort);

  return Object.freeze({
    location: requestWaypointLocation,
    route: (request: RouteRequest) => routesState.load({ cacheKey: stableKey(request), load: (signal) => routes.route(request, signal), validate: validRouteValue }),
    routeMatrix: (stops: ItineraryStop[], travelMode: TravelMode) => matrixState.load({ cacheKey: stableKey({ stops, travelMode }), load: (signal) => routes.matrix(stops, travelMode, signal), validate: validMatrixValue }),
    placeLive: (identities: WaypointPlaceIdentity[]) => placesState.load({ cacheKey: stableKey(identities), load: (signal) => places.live(identities, signal), validate: validPlaceValues }),
    weatherAlerts: (point: { latitude: number; longitude: number }, languageCode?: string) => alertsState.load({ cacheKey: stableKey({ point, languageCode }), load: (signal) => alerts.alerts(point, languageCode, signal), validate: validAlerts }),
    environment: (point: { latitude: number; longitude: number }) => environmentState.load({
      cacheKey: stableKey(point),
      load: (signal) => environment.current(point, signal),
      validate: (value): value is NonNullable<ReturnType<typeof parseOpenMeteoEnvironment>> => parseOpenMeteoEnvironment({ current: {
        time: (value as { observedAt?: unknown })?.observedAt,
        us_aqi: (value as { usAqi?: unknown })?.usAqi,
        uv_index: (value as { uvIndex?: unknown })?.uvIndex,
      } }) !== null,
    }),
  });
}

type RuntimeServices = ReturnType<typeof createBrowserRuntime>;

function emitResult<T>(doc: Document, name: string, result: Promise<RuntimeOverlay<T>>) {
  result.then((detail) => doc.dispatchEvent(new CustomEvent(name, { detail })));
}

/** Installs neutral request/result events. It makes no network or permission request on startup. */
export function initRuntimeOverlayBrowser(doc: Document = document): RuntimeServices {
  initLocationBridge(doc);
  const cfgElement = doc.getElementById("tgConfig");
  let config: BrowserRuntimeConfig = {};
  try { config = JSON.parse(cfgElement?.textContent || "{}"); } catch { /* unconfigured */ }
  const runtime = createBrowserRuntime(config);

  doc.addEventListener("waypoint:route-request", ((event: CustomEvent<RouteRequest>) => emitResult(doc, "waypoint:route-overlay", runtime.route(event.detail))) as EventListener);
  doc.addEventListener("waypoint:route-matrix-request", ((event: CustomEvent<{ stops: ItineraryStop[]; travelMode: TravelMode }>) =>
    emitResult(doc, "waypoint:route-matrix-overlay", runtime.routeMatrix(event.detail.stops, event.detail.travelMode))) as EventListener);
  doc.addEventListener("waypoint:places-request", ((event: CustomEvent<{ places: WaypointPlaceIdentity[] }>) =>
    emitResult(doc, "waypoint:places-overlay", runtime.placeLive(event.detail.places))) as EventListener);
  doc.addEventListener("waypoint:environment-request", ((event: CustomEvent<{ point: { latitude: number; longitude: number }; languageCode?: string }>) => {
    emitResult(doc, "waypoint:environment-overlay", runtime.environment(event.detail.point));
    emitResult(doc, "waypoint:weather-alerts-overlay", runtime.weatherAlerts(event.detail.point, event.detail.languageCode));
  }) as EventListener);

  return runtime;
}

if (typeof document !== "undefined") initRuntimeOverlayBrowser(document);
