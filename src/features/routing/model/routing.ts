import { haversineKm } from "../../../lib/route-optimize";

export type TravelMode = "WALK" | "DRIVE" | "BICYCLE" | "TRANSIT";
export interface RoutePoint { latitude: number; longitude: number; }
export interface RouteRequest { origin: RoutePoint; destination: RoutePoint; travelMode: TravelMode; departureTime?: string; }
export interface RouteValue { durationSeconds: number; distanceMeters: number; encodedPolyline?: string; attribution: string; }
export interface MatrixCell { originIndex: number; destinationIndex: number; durationSeconds: number; distanceMeters: number; }
export interface RouteMatrixValue { cells: MatrixCell[]; attribution: string; }
export interface ItineraryStop extends RoutePoint { id: string; }

export interface RouteProvider {
  route(request: RouteRequest, signal?: AbortSignal): Promise<RouteValue>;
  matrix(stops: ItineraryStop[], travelMode: TravelMode, signal?: AbortSignal): Promise<RouteMatrixValue>;
}

export interface TransitionAdvisory {
  fromId: string;
  toId: string;
  durationSeconds: number | null;
  distanceMeters: number;
  source: "provider" | "haversine";
}

export interface DayRouteAdvisory {
  authoredOrder: string[];
  transitions: TransitionAdvisory[];
  suggestedOrder: string[] | null;
  estimatedSavingsSeconds: number;
  applied: false;
}

function fallbackTransition(a: ItineraryStop, b: ItineraryStop): TransitionAdvisory {
  const km = haversineKm({ lat: a.latitude, lng: a.longitude }, { lat: b.latitude, lng: b.longitude });
  return {
    fromId: a.id,
    toId: b.id,
    distanceMeters: Math.round(km * 1000),
    // Straight-line distance can orient the fallback map, but it is not a truthful travel ETA.
    durationSeconds: null,
    source: "haversine",
  };
}

function cellMap(cells: MatrixCell[]): Map<string, MatrixCell> {
  return new Map(cells.map((cell) => [`${cell.originIndex}:${cell.destinationIndex}`, cell]));
}

function durationFor(order: number[], cells: Map<string, MatrixCell>): number {
  let seconds = 0;
  for (let i = 0; i < order.length - 1; i++) {
    const cell = cells.get(`${order[i]}:${order[i + 1]}`);
    if (!cell) return Number.POSITIVE_INFINITY;
    seconds += cell.durationSeconds;
  }
  return seconds;
}

function matrixSuggestion(count: number, cells: Map<string, MatrixCell>): number[] | null {
  if (count < 3) return null;
  const order = [0];
  const unused = new Set(Array.from({ length: count - 1 }, (_, i) => i + 1));
  while (unused.size) {
    const from = order[order.length - 1];
    let best = -1, bestDuration = Number.POSITIVE_INFINITY;
    for (const candidate of unused) {
      const duration = cells.get(`${from}:${candidate}`)?.durationSeconds ?? Number.POSITIVE_INFINITY;
      if (duration < bestDuration) { best = candidate; bestDuration = duration; }
    }
    if (best < 0) return null;
    unused.delete(best);
    order.push(best);
  }
  return order;
}

/**
 * Projects live matrix data over authored itinerary truth. It never mutates or applies an order;
 * any alternate is returned as an explicit advisory with `applied: false`.
 */
export function buildDayRouteAdvisory(stops: ItineraryStop[], matrix: RouteMatrixValue | null, _mode: TravelMode): DayRouteAdvisory {
  const authoredOrder = stops.map((stop) => stop.id);
  const cells = matrix ? cellMap(matrix.cells) : new Map<string, MatrixCell>();
  const transitions = stops.slice(0, -1).map((stop, index) => {
    const next = stops[index + 1];
    const cell = cells.get(`${index}:${index + 1}`);
    return cell ? {
      fromId: stop.id,
      toId: next.id,
      durationSeconds: cell.durationSeconds,
      distanceMeters: cell.distanceMeters,
      source: "provider" as const,
    } : fallbackTransition(stop, next);
  });

  const suggested = matrixSuggestion(stops.length, cells);
  const authoredIndices = stops.map((_, index) => index);
  const authoredSeconds = durationFor(authoredIndices, cells);
  const suggestedSeconds = suggested ? durationFor(suggested, cells) : Number.POSITIVE_INFINITY;
  const savings = Math.max(0, authoredSeconds - suggestedSeconds);
  const material = Number.isFinite(savings) && savings >= Math.max(300, authoredSeconds * 0.1);

  return {
    authoredOrder,
    transitions,
    suggestedOrder: material && suggested ? suggested.map((index) => stops[index].id) : null,
    estimatedSavingsSeconds: material ? Math.round(savings) : 0,
    applied: false,
  };
}

export function leaveBy(arrivalTime: string, durationSeconds: number, bufferSeconds = 0): string | null {
  const arrival = Date.parse(arrivalTime);
  if (!Number.isFinite(arrival) || durationSeconds < 0 || bufferSeconds < 0) return null;
  return new Date(arrival - (durationSeconds + bufferSeconds) * 1000).toISOString();
}

export function validRouteValue(value: unknown): value is RouteValue {
  const route = value as RouteValue;
  return !!route && Number.isFinite(route.durationSeconds) && route.durationSeconds >= 0 &&
    Number.isFinite(route.distanceMeters) && route.distanceMeters >= 0 && typeof route.attribution === "string";
}

export function validMatrixValue(value: unknown): value is RouteMatrixValue {
  const matrix = value as RouteMatrixValue;
  return !!matrix && typeof matrix.attribution === "string" && Array.isArray(matrix.cells) && matrix.cells.every((cell) =>
    Number.isInteger(cell.originIndex) && Number.isInteger(cell.destinationIndex) &&
    Number.isFinite(cell.durationSeconds) && cell.durationSeconds >= 0 &&
    Number.isFinite(cell.distanceMeters) && cell.distanceMeters >= 0);
}
