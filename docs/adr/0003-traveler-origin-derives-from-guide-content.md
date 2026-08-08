# Traveler origin derives from the guide's own departure fact, never a hand-filled meta field

ADR 0001 decided the globe's route traverses use a per-guide Traveler origin rather
than a shared home-base constant. This resolves the follow-on question of where that
origin lives.

The tempting shape was a new `_guide.json` meta field, filled by hand per guide. The
Korea guide showed why that drifts: its content already stated the departure airport
in prose ("Departure airport confirmed: Newark Liberty EWR — not JFK") while no
structured field existed anywhere — two sources of truth the moment a meta field
appeared beside it.

Decided (creator ruling 2026-08-07): the departure airport is recorded once, in the
guide's own fact registry, as a reserved row — value is the IATA code, state is
confirmed or unconfirmed, source is the traveler's booking record. Every surface that
needs the origin (the globe traverse, tools) derives from that row through a small
shared airport gazetteer that maps IATA codes to coordinates. There is no parallel
atlas registry, and nothing is filled per surface. A guide with no row, or an
unconfirmed one, draws no traverse — an honest blank until the booking confirms it.

Values at the time of the ruling: Korea EWR (confirmed, booking), Denmark JFK
(confirmed by creator), Sedona EWR-or-JFK (unconfirmed), Japan possibly JFK
(unconfirmed).
