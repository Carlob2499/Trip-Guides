/** maps — the map rendering + interaction layer for every map-bearing surface.
    · fullscreen.js   — always on: a ⤢ button on every OSM iframe fallback.
    · gmaps-render.js — config-gated (PUBLIC_GMAPS_KEY): upgrades every [data-itin-map] mount
                        to Google Maps, keeping the OSM iframe until the Google map has
                        actually initialised (D6-51/F7). Lenses: all / days / chapter.
    · map-dest.js     — the Map destination's contextual sheet/inspector, in sync with pins. */
import "./ui/fullscreen.js";
import "./ui/gmaps-render.js";
import "./ui/map-dest.js";
export { initMapDestination } from "./ui/map-dest.js";
