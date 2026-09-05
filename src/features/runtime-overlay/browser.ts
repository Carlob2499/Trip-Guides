import { initLocationBridge, requestWaypointLocation } from "../geolocation";
import { actionableEnvironment, GoogleWeatherAlertsAdapter, OpenMeteoEnvironmentAdapter, parseOpenMeteoEnvironment, validAlerts } from "../live-data/index.js";
import { GooglePlacesAdapter, relevantPlaces, validPlaceValues, type WaypointPlaceIdentity } from "../places";
import { buildDayRouteAdvisory, GoogleRoutesAdapter, validMatrixValue, validRouteValue, type ItineraryStop, type RouteRequest, type TravelMode } from "../routing";
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
    configured: enabled,
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

function statusLine(doc: Document, host: Element, key: string): HTMLElement {
  let line = host.querySelector<HTMLElement>(`[data-runtime-status="${key}"]`);
  if (!line) {
    line = doc.createElement("p");
    line.dataset.runtimeStatus = key;
    line.className = "mapdest-sel-meta";
    line.setAttribute("role", "status");
    line.setAttribute("aria-live", "polite");
    host.appendChild(line);
  }
  return line;
}

function describeFailure(status: RuntimeOverlay<unknown>["status"]): string {
  if (status === "offline") return "Live context is offline; the saved guide is unchanged.";
  if (status === "unconfigured") return "Live context is not configured; the saved guide is unchanged.";
  return "Live context is unavailable; the saved guide is unchanged.";
}

/** Minimal semantic hooks for the four approved surfaces; no request occurs until interaction. */
function installSurfaceHooks(doc: Document, runtime: RuntimeServices): void {
  doc.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    const focus = target?.closest<HTMLElement>("[data-map-focus]");
    if (!focus) return;
    queueMicrotask(async () => {
      const row = focus.closest<HTMLElement>("[data-map-row]");
      const panel = doc.querySelector<HTMLElement>("[data-map-selected]");
      if (!row || !panel) return;
      const waypointId = row.dataset.mapRow || "";
      const googlePlaceId = row.dataset.placeId || null;
      const latitude = Number(row.dataset.lat), longitude = Number(row.dataset.lng);
      if (runtime.configured && googlePlaceId) {
        const scoped = relevantPlaces([{ waypointId, googlePlaceId }], { selectedIds: [waypointId] });
        const overlay = await runtime.placeLive(scoped);
        const line = statusLine(doc, panel, "place");
        if (!overlay.value?.length) line.textContent = describeFailure(overlay.status);
        else {
          const place = overlay.value[0];
          line.textContent = place.businessStatus === "CLOSED_PERMANENTLY" ? "Reported permanently closed — use the guide’s researched alternatives."
            : place.businessStatus === "CLOSED_TEMPORARILY" ? "Reported temporarily closed — use the guide’s researched alternatives."
            : place.openNow === false ? "Closed now according to current opening hours."
            : place.openNow === true ? "Open now according to current opening hours." : "No current opening-hours state available.";
        }
      }
      if (runtime.configured && Number.isFinite(latitude) && Number.isFinite(longitude)) {
        const [environment, alerts] = await Promise.all([runtime.environment({ latitude, longitude }), runtime.weatherAlerts({ latitude, longitude })]);
        const actionable = actionableEnvironment(environment.value ?? null, alerts.value ?? []);
        if (actionable) {
          const parts = [
            actionable.alerts[0]?.title,
            actionable.aqi?.usAqi != null ? `Air quality index ${actionable.aqi.usAqi}` : null,
            actionable.uv?.uvIndex != null ? `UV index ${actionable.uv.uvIndex}` : null,
          ].filter(Boolean);
          statusLine(doc, panel, "environment").textContent = parts.join(" · ");
        }
      }
      const actions = panel.querySelector<HTMLElement>("[data-map-sel-actions]");
      if (runtime.configured && actions && !actions.querySelector("[data-runtime-route-from-me]")) {
        const button = doc.createElement("button");
        button.type = "button";
        button.className = "mapdest-sel-details";
        button.dataset.runtimeRouteFromMe = "";
        button.textContent = "Route from my location";
        button.addEventListener("click", async () => {
          const location = await runtime.location("map");
          const line = statusLine(doc, panel, "route");
          if (!location.location) { line.textContent = location.status === "denied" ? "Location permission was denied; existing directions still work." : "Current location is unavailable; existing directions still work."; return; }
          const route = await runtime.route({ origin: location.location, destination: { latitude, longitude }, travelMode: "WALK" });
          line.textContent = route.value ? `${Math.max(1, Math.round(route.value.durationSeconds / 60))} min · ${(route.value.distanceMeters / 1000).toFixed(1)} km walking · Powered by Google, ©${new Date().getFullYear()} Google`
            : describeFailure(route.status);
        });
        actions.appendChild(button);
      }
    });
  });

  const addContextButton = (selector: string, context: "trip" | "search", label: string) => {
    const host = doc.querySelector<HTMLElement>(selector);
    if (!host || host.querySelector(`[data-runtime-location="${context}"]`)) return;
    const button = doc.createElement("button");
    button.type = "button";
    button.className = context === "trip" ? "tn-map-open" : "srch-drawer";
    button.dataset.runtimeLocation = context;
    button.textContent = label;
    button.addEventListener("click", async () => {
      const result = await runtime.location(context);
      const line = statusLine(doc, host, `${context}-location`);
      if (!result.location) {
        line.textContent = result.status === "denied" ? "Location permission denied; existing results are unchanged." : "Current location unavailable; existing results are unchanged.";
        return;
      }
      if (context === "trip") {
        const mount = doc.querySelector<HTMLElement>("[data-trip-map] [data-itin-map]");
        let pins: Array<{ lat: number; lng: number; dayIdx?: number }> = [];
        try { pins = JSON.parse(mount?.querySelector("script[data-map-data]")?.textContent || "{}").pins || []; } catch { /* no route target */ }
        const day = Number(mount?.dataset.mapDay || 0);
        const next = pins.find((pin) => pin.dayIdx === day && Number.isFinite(pin.lat) && Number.isFinite(pin.lng));
        if (next) {
          const route = await runtime.route({ origin: result.location, destination: { latitude: next.lat, longitude: next.lng }, travelMode: "WALK" });
          line.textContent = route.value ? `${Math.max(1, Math.round(route.value.durationSeconds / 60))} min · ${(route.value.distanceMeters / 1000).toFixed(1)} km walking to the first located stop · Powered by Google, ©${new Date().getFullYear()} Google` : describeFailure(route.status);
          return;
        }
      }
      line.textContent = "Current location available for this page only.";
    });
    host.appendChild(button);
  };
  addContextButton("[data-trip-map] .tn-map-head", "trip", "Use my location");

  const itineraryHead = doc.querySelector<HTMLElement>(".itin-mappane-head");
  if (runtime.configured && itineraryHead && !itineraryHead.querySelector("[data-runtime-matrix]")) {
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "ro-chip";
    button.dataset.runtimeMatrix = "";
    button.setAttribute("aria-label", "Check live travel times for the selected day");
    button.textContent = "Live route";
    button.addEventListener("click", async () => {
      const mount = doc.querySelector<HTMLElement>('.itin-mappane [data-itin-map]');
      const visibleDay = doc.querySelector<HTMLElement>('[data-planner-days] .day[data-day]:not([hidden])');
      const day = Number(visibleDay?.dataset.day || 0);
      let pins: Array<{ id: string; lat: number; lng: number; dayIdx?: number }> = [];
      try { pins = JSON.parse(mount?.querySelector("script[data-map-data]")?.textContent || "{}").pins || []; } catch { /* honest blank */ }
      const stops = pins.filter((pin) => pin.dayIdx === day && Number.isFinite(pin.lat) && Number.isFinite(pin.lng)).slice(0, 8)
        .map((pin) => ({ id: pin.id, latitude: pin.lat, longitude: pin.lng }));
      const line = statusLine(doc, itineraryHead, "matrix");
      if (stops.length < 2) { line.textContent = "This day has fewer than two located stops; the authored order remains."; return; }
      const matrix = await runtime.routeMatrix(stops, "WALK");
      if (!matrix.value) { line.textContent = describeFailure(matrix.status); return; }
      const advisory = buildDayRouteAdvisory(stops, matrix.value, "WALK");
      const total = advisory.transitions.reduce((sum, leg) => sum + (leg.durationSeconds || 0), 0);
      line.textContent = advisory.suggestedOrder
        ? `${Math.round(total / 60)} min in authored order · an unapplied advisory could save ${Math.round(advisory.estimatedSavingsSeconds / 60)} min · Powered by Google, ©${new Date().getFullYear()} Google`
        : `${Math.round(total / 60)} min across the authored transitions · order unchanged · Powered by Google, ©${new Date().getFullYear()} Google`;
    });
    itineraryHead.insertBefore(button, itineraryHead.lastElementChild);
  }
  doc.addEventListener("click", (event) => {
    if ((event.target as Element | null)?.closest("[data-search-open], [data-search-field]")) setTimeout(() => addContextButton(".srch-drawers", "search", "Use my location"), 0);
  });
  addContextButton(".srch-drawers", "search", "Use my location");

  const observer = new MutationObserver(() => {
    // Search can open before this idle-loaded enhancement attaches. Observing the drawer makes
    // the opt-in hook order-independent without moving the integration bundle to first paint.
    addContextButton(".srch-drawers", "search", "Use my location");
    const layer = doc.querySelector<HTMLElement>('.sos-sheet [data-sos-layer="2"]');
    if (!layer || layer.querySelector("[data-runtime-location=\"sos\"]")) return;
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "sos-next";
    button.dataset.runtimeLocation = "sos";
    button.textContent = "Use my current location";
    button.addEventListener("click", async () => {
      const result = await runtime.location("sos");
      const list = layer.querySelector(".sos-ctx-list");
      if (!list || !result.location) return;
      list.querySelectorAll("[data-runtime-coordinate]").forEach((item) => item.remove());
      const term = doc.createElement("dt"); term.dataset.runtimeCoordinate = ""; term.textContent = "Current coordinates";
      const value = doc.createElement("dd"); value.dataset.runtimeCoordinate = ""; value.textContent = `${result.location.latitude.toFixed(6)}, ${result.location.longitude.toFixed(6)} (±${Math.round(result.location.accuracyMeters)} m)`;
      list.append(term, value);
    });
    layer.insertBefore(button, layer.querySelector("[data-sos-next]"));
  });
  observer.observe(doc.body, { childList: true, subtree: true });
}

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
  installSurfaceHooks(doc, runtime);

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
