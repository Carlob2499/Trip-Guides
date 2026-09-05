import type { ItineraryStop, RouteMatrixValue, RouteProvider, RouteRequest, RouteValue, TravelMode } from "../model/routing";
import type { JsonTransport } from "../../runtime-overlay/model/transport";

export class GoogleRoutesAdapter implements RouteProvider {
  readonly #post: JsonTransport;
  constructor(post: JsonTransport) { this.#post = post; }

  async route(request: RouteRequest, signal?: AbortSignal): Promise<RouteValue> {
    return await this.#post("runtime/routes", request, signal) as RouteValue;
  }

  async matrix(stops: ItineraryStop[], travelMode: TravelMode, signal?: AbortSignal): Promise<RouteMatrixValue> {
    return await this.#post("runtime/route-matrix", { stops, travelMode }, signal) as RouteMatrixValue;
  }
}
