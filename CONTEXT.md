# Waypoint

Verified, personalized travel guides — a field instrument, not a brochure. Every
perishable fact traces to a primary source and a verification date; where research came
up short, the guide says so instead of filling the hole.

## Language

**Panel**:
The single repeated container component — kicker, title, drag handle, collapse toggle,
body — that every card in the product (guide sections, hub overlays, tools) is built
from. Introduced by the Waypoint Atlas redesign (2026-08); replaces all bespoke
per-feature card markup. A Panel is a container, never a content type: it holds a
Panel section, a days list, a sights repository, a tool, whatever is put in it.
_Avoid_: card, widget (when referring to the redesigned UI unit — "card" still names the
old, pre-redesign pattern being replaced)

**Panel section**:
The guide content type `"type": "panel"` (schema in `src/content.config.ts`, rendered by
`PanelBlock.astro`) — one of the ~sixteen section types a guide's JSON can declare,
alongside `prose`, `list`, `days`, `sights`, `routes`. Carries a title, body, optional
checklist and its own lead/more-detail fold.

Deliberately shares the word "Panel" with the container above, decided 2026-08-06: from
the Atlas redesign's Phase 2 onward a Panel section is rendered *inside* a Panel, so the
two nest rather than compete, and "PanelBlock renders a Panel's body" is a true sentence.
Renaming the section type was rejected because it would require editing `"type"` values
in every guide's JSON, and the redesign is design-only with zero guide-data edits.
Always qualify in writing when the surrounding text could mean either: "Panel section"
for the content type, plain "Panel" for the container.

**Guide base**:
The trip's own city or location shown in a guide's masthead chip (e.g. "Seoul" for the
Korea guide). A fact about the destination.
_Avoid_: home base (a different concept — see Traveler origin)

**Traveler origin**:
The departure airport/city for one specific trip's globe route traverse. Recorded per
guide (optional field), never a shared site-wide default — this repo's guides
originate from whichever airport that traveler actually used for that trip, and the
product's longer-term goal is portability to other travelers' own trips, so no single
"home base" constant is assumed to hold across all guides.
_Avoid_: home base (implies one fixed value shared by every trip, which this explicitly
is not)

**Live rate**:
A currency conversion fetched at render time via `src/features/live-data/model/rate.ts`
(Frankfurter API + fallback table), labeled as today's/live rate. Used in Trip Split's
totals and a guide's own Budget panel, for all four guides.
_Avoid_: sourced rate, verified rate

**Sourced rate**:
A guide's own dated, source-cited currency fact recorded in that guide's `facts.json`
(claim, value, `source_url`, `verified_on`), subject to the Verified pillar's citation
requirement. Distinct from a Live rate — a different claim with a different shelf life,
never conflated with it in the same line of UI.
_Avoid_: live rate

**Emergency data**:
A guide's verified emergency phone numbers, sourced from `emergencyFor()`
(`src/data/countries.mjs`). One data source and one rendering component, exposed at two
entry points — the guide's own SOS sheet, and the atlas hub's Table-view quick card.
Never re-implemented per surface.
