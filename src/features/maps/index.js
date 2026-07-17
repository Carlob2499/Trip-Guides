/** maps — the map rendering + interaction layer for every guide.
    Two concerns, both self-booting on import:
    · fullscreen.js — always on. Wires a ⤢ button onto every default OSM iframe.
    · gmaps-render.js — config-gated (PUBLIC_GMAPS_KEY): without a key this half is
      inert and the OSM iframe stands as the map. When it upgrades a mount, it also
      strips fullscreen.js's now-stale button (Google's own map ships its own). */
import "./ui/fullscreen.js";
import "./ui/gmaps-render.js";
