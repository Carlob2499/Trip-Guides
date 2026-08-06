# Globe route traverses use a per-guide Traveler origin, not a shared home-base constant

The Waypoint Atlas redesign's globe draws a route traverse from a departure point to
each trip's destination. The design handoff's reference prototype (`atlas-map.js`) took
a single global `home-base="lon,lat,LABEL"` attribute — one departure point for every
pin on the globe, guessed as LAX in the prototype.

This repo has no recorded "home base": the only concrete signal is a departure-airport
note on the Korea guide alone (EWR, not JFK), and most trips originate from NYC-area
airports but that isn't guaranteed — it's trip-reliant, and the product's stated
longer-term goal is portability to other travelers running their own trips through this
same repo.

Decided: each guide carries its own optional Traveler origin field; the globe draws that
guide's traverse from its own origin, with no shared default across guides. This departs
from the handoff's prototype API on purpose — adopting a single global constant now
would have to be undone the moment this repo serves more than one traveler's trips.
