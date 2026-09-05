import type { JsonTransport } from "../../runtime-overlay";
import type { PlaceLiveValue, PlaceProvider, WaypointPlaceIdentity } from "../model/places";

export class GooglePlacesAdapter implements PlaceProvider {
  readonly #post: JsonTransport;
  constructor(post: JsonTransport) { this.#post = post; }

  async resolve(identity: WaypointPlaceIdentity, _signal?: AbortSignal): Promise<{ waypointId: string; googlePlaceId: string } | null> {
    if (identity.googlePlaceId) return { waypointId: identity.waypointId, googlePlaceId: identity.googlePlaceId };
    // Provider search always returns a best guess. Runtime never promotes that guess into
    // identity; IDs are resolved and reviewed by the existing research/tooling pipeline.
    return null;
  }

  async live(identities: WaypointPlaceIdentity[], signal?: AbortSignal): Promise<PlaceLiveValue[]> {
    const places = identities.filter((identity) => identity.googlePlaceId).map(({ waypointId, googlePlaceId }) => ({ waypointId, googlePlaceId }));
    if (!places.length) return [];
    return await this.#post("runtime/places", { places }, signal) as PlaceLiveValue[];
  }
}
