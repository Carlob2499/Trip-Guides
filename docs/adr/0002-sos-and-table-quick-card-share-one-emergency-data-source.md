# SOS sheet and the Table-view quick card share one Emergency data component

The existing `src/features/sos/` feature (topbar button → full sheet) already renders a
guide's verified emergency numbers from `emergencyFor()`. The Waypoint Atlas redesign's
Table view adds a "quick card" that also shows a trip's emergency numbers, as tappable
`tel:` chips — the design handoff doesn't mention the existing SOS feature at all, so
building the quick card from scratch would have produced two independent
implementations of the same claim.

Decided: both surfaces read from the same Emergency data source and rendering path — the
quick card is a compact projection of the existing SOS feature, not a second bespoke
renderer. Emergency contact numbers are safety data; two independently-maintained copies
is how one goes stale without anyone noticing.
