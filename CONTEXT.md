# Waypoint

Verified, personalized travel guides — a field instrument, not a brochure. Every
perishable fact traces to a primary source and a verification date; where research came
up short, the guide says so instead of filling the hole.

> **What this file is.** The durable-memory file, auto-loaded at session start beside
> `docs/handoff.md`. Two things live here and nothing else: **Language** (what a word means
> in this repo) and **Decisions** (a choice already made, and why the obvious alternative
> was rejected). It carries no doctrine — how to work is `CLAUDE.md`'s job, and duplicating
> it here would create the second source of truth this file exists to prevent. Add a
> Decision when a fork is settled in a way a future session could plausibly re-open.

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

Deliberately shares the word "Panel" with the container above — a Panel section renders
*inside* a Panel, so the two nest rather than compete (see Decisions). Always qualify when
the surrounding text could mean either: "Panel section" for the content type, plain "Panel"
for the container.

**Guide base**:
The trip's own city or location shown in a guide's masthead chip (e.g. "Seoul" for the
Korea guide). A fact about the destination.
_Avoid_: home base (a different concept — see Traveler origin)

**Traveler origin**:
The departure airport for one specific trip's globe route traverse. Recorded once in
that guide's own content as its departure-airport fact (with a confirmed/unconfirmed
state), never in a separate registry and never as a shared site-wide default — every
surface that needs the origin derives it from that one record. An absent or unconfirmed
origin draws no traverse. This repo's guides originate from whichever airport that
traveler actually used for that trip, and the product's longer-term goal is portability
to other travelers' own trips, so no single "home base" constant is assumed to hold
across all guides.
_Avoid_: home base (implies one fixed value shared by every trip, which this explicitly
is not)

**Sheet**:
A guide as the atlas hub indexes it — one numbered entry in the survey ("SHEET 02 ·
KR"). The word for a guide spoken of from the hub's surveyor frame; the guide page
itself is still "the guide".
_Avoid_: card, page

**Sheet number**:
The single ordinal a guide carries on every surface that numbers it — the hub's index
rail, table rows, the mobile ping sheet, and the masthead's plate line ("PLATE 02 —
KR"). Assigned chronologically by trip start, derived in one place so the hub and the
plate can never disagree.
_Avoid_: plate number (same datum, not a second concept)

**Cover**:
The hub's full-viewport arrival moment — benchmark mark, wordmark, and the iris that
opens onto the globe. Shown once per session; reduced motion replaces the whole
sequence with a cut. Distinct from a guide's `cover` image (the masthead photograph).
_Avoid_: splash screen, overture (the retired pre-Atlas hub intro)

**Quick card**:
Table view's focus-trip card — the current, next, or most recent trip's local time,
dates, and sourced fact chips, shown whenever no search query is active. Its emergency
chips project Emergency data (above); nothing on it is authored for the card itself.

**The gap**:
The signature honest-absence state — "⚠ NOT CONFIRMED" rendered at reading scale where
a fact would otherwise go, with a what-to-do-instead line. A gap is produced by
research coming up short and saying so; it is never generated to fill a surface, and
filling one requires a sourced fact, not prose.
_Avoid_: placeholder, empty state

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

## Decisions

Each entry states what was decided, and the alternative that was rejected — the rejection is
the load-bearing half. Contradicting one of these is allowed; doing it silently is not.

**Globe traverses use a per-guide Traveler origin, not a shared home-base constant**
(2026-08-06). The design handoff's `atlas-map.js` prototype took a single global
`home-base="lon,lat,LABEL"` — one departure point for every pin, guessed as LAX. Rejected:
this repo has no recorded home base (the only concrete signal is Korea's EWR note, and most
but not all trips start from NYC-area airports), and the product's stated goal is portability
to other travelers' trips. A global constant would have to be undone the moment the repo
serves a second traveler. Each guide draws its traverse from its own origin; no default.

**Traveler origin derives from the guide's own departure fact, never a hand-filled meta
field** (creator ruling, 2026-08-07). Follows from the decision above. Rejected: a new
`_guide.json` meta field — Korea already stated its departure airport in prose ("confirmed:
Newark Liberty EWR — not JFK"), so a meta field beside it would have been a second source of
truth on day one. The airport is one reserved row in the guide's fact registry (IATA value,
confirmed/unconfirmed state, booking record as source); every surface derives from that row
through a shared IATA→coordinates gazetteer. No row, or an unconfirmed one, draws no
traverse — an honest blank until the booking confirms it.

**The SOS sheet and Table view's quick card share one Emergency data source** (2026-08-06).
The handoff spec for the quick card's `tel:` chips never mentions the existing
`src/features/sos/`, so building it from the spec alone would have produced a second
implementation of the same claim. Rejected: a bespoke quick-card renderer. Emergency numbers
are safety data, and two independently-maintained copies is exactly how one goes stale
without anyone noticing. The quick card is a compact projection of the SOS feature.

**"Panel" deliberately names two nested things** (2026-08-06). The container component and
the `"type": "panel"` content type share the word. Rejected: renaming the section type —
it would mean editing `"type"` values in every guide's JSON, and the Atlas redesign was
design-only with zero guide-data edits. From Phase 2 onward a Panel section renders *inside*
a Panel, so the two nest rather than compete. Qualify in writing whenever the surrounding
text could mean either.

**Guide numbering is dead on guide surfaces; the hub index is not** (2026-08-11, R5
SUPERSEDES §3). `SHEET 02` / `PLATE 02 — KR` / `GUIDE 02` are gone from every guide surface —
they carried nothing a traveller uses. `src/lib/sheet-order.ts` and `sheetOrdinal` **stay
alive and are not dead code**: the atlas hub indexes trips by number and an index is the one
legitimate use of one. If a future session finds sheet-order.ts with no guide-side caller, that
is the intended state, not a leftover to delete. The plate line carries the trip's cities and
its next leg instead (`src/lib/plate-line.ts`).

**Coordinates belong to the globe, not the guide** (2026-08-11). The atlas hub's live
sheet-centre readout, compass rose and scale bar are unchanged and stay — there, coordinates
*are* the map. A decimal pair on the guide masthead was a different thing wearing the same
clothes: notation a reader standing in Seoul cannot act on. Do not re-add it to a guide surface.

**A kicker is two facts and each is rendered once** (2026-08-11). Guides write
`Seoul · Daejeon · Busan — Jul 8–15, 2026`. The dates go to the masthead eyebrow, the cities to
the plate line, split by `cityLine`/`dateLine` — one seam, so the two can never disagree. The
split is deliberately STRICT: it requires a `·` list, so a single-city kicker (Sedona) gets no
cities row and keeps its whole kicker in the eyebrow. Being cautious costs one shorter plate
line; being wrong would put a fabricated place name on the masthead's loudest row.

**"Absent" means not in the DOM, not present-and-empty** (2026-08-11). The rail's resume line
shipped as an empty `<p class="grail-resume" hidden>` that nothing filled. A fabricated "start
here" is the loud version of that failure; an element reserving space for a memory nobody has is
the quiet one, and ACCEPTANCE forbids both. Client-filled honest blanks are created and REMOVED
by whoever owns the datum — never rendered empty and left for later.

**A removal must not leave stale pointers, even into guide content** (2026-08-11). R5's
FALLBACKS §4 lists `src/content/guides/` as a scope guard for design work, and one guide file
was edited anyway: `japan/01-plan.json` sent readers to "the Entry card in your Trip kit" — a
feature R5 deleted — from inside the Entry card. The guard exists to stop a design pass
rewriting content; it does not license shipping a pointer to something that no longer exists.
The rule: when a change deletes a feature, the continuity sweep runs into guide content too,
and the edit is recorded rather than hidden. This is the ONLY guide-content edit of the R5 arc.

**A target under 44px is a control the reader misses; a mark under 44px is notation**
(2026-08-11). ACCEPTANCE §6.4's floor applies to anything the reader is meant to AIM at — a
button, chip, pill, tab, station or emergency number. It does NOT apply to the notation family:
the provenance dot, the ≈/⚠ flag chips, the stale pill, a photo credit. Those are sized to the
type they annotate, and a 44px dot beside a 13px figure dominates the fact it is meant to
footnote. Two real controls stay under the line on purpose, with counts that may only shrink
(`TARGET_BASELINE` in a11y.spec.ts): `.transit-link` and `.dchip`. Both are density decisions
across all four guides, and both are open questions rather than settled ones.

**A hidden surface must leave the tab order, not just the screen** (2026-08-11). The journey
sheet slid away on `translateY(100%)` and kept all ~90 of its links focusable and in the
accessibility tree. `display:none` fixes the tab order and kills the animation; `inert` does
both, and is the tool for any surface that must animate out. axe cannot see this class of
defect — every one of those links is perfectly accessible, just somewhere nobody can look.

**Guide code may read a viewport number for GEOMETRY, never for layout** (2026-08-11). The R5
contract is that the guide body switches on container width alone. Popover placement, gesture
distance, and a `userAgent` string in an error beacon are not layout branches and are allowed —
each named with its reason in `scripts/__tests__/no-device-checks.test.mjs`, which fails on any
unlisted one and additionally requires the four files defining the guide body to contain none
at all. Do not "fix" the allowed five; do not add a sixth without adding its reason.

**Tools are per-guide, and the hub carries no door to them** (creator ruling, 2026-08-11). R5
made the tools a station of each guide's own rail, and the hub's two surviving doors — a TRIP
TOOLS row in table view, a link in the phone's ☰ menu — were both aimed at whichever guide the
hub happened to feature. Rejected: keeping one as a convenience shortcut. A hub-level door can
only ever point at ONE trip's tools while reading as a door to tools in general, so it promises
the cross-trip screen R5 deleted. The design prototype draws a TOOLS button in the hub header
and it is deliberately not built. From the hub the route is: fly to a sheet, then that guide's
own rail.

**A clock prints its zone as a derived offset, never a letter abbreviation** (2026-08-11).
`localClockLabel` renders `21:05 GMT+9`; the design shows `KST`. Rejected: the abbreviation.
`Intl` has no en-US abbreviation for most zones — it returns `GMT+9` for Seoul and Tokyo alike —
so printing letters would mean shipping a hand-written table, which is invented data and wrong
twice over: abbreviations collide across countries, and half of them move under DST. Where Intl
does know one it is already printed (`us` is `America/Phoenix`, which shows `MST`). A test pins
Copenhagen at `GMT+1` in January and `GMT+2` in July.

**An image credit is derived from the URL or absent — never guessed** (2026-08-11). `imgCredit()`
(`src/lib/img-width.ts`) returns "Wikimedia Commons" for a Commons FilePath URL and null for
everything else. Rejected: crediting the host the photo is served from. A CDN hostname says where
the bytes are cached, not who took the picture, and printing one would be a fabricated
attribution wearing a real one's clothes. An uncredited photo carries no chip at all — the same
honest blank the rest of the product uses when research comes up short.
