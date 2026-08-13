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
across all four guides, and both were open questions until the design-reconciliation arc
settled them (below) — do not re-litigate.

**The 44px density fork splits by row-count ceiling, not by treating both controls alike**
(2026-08-12, design-reconciliation arc, `docs/PLAN_DESIGN_RECONCILIATION.md` §H1). `.transit-link`
(guide.css:324, `gap:.35rem`, wraps freely, 2-3 per day card) and `.scrub-fit .dchip`
(mobile-nav.css:175, `flex:1 1 0;min-width:0`, up to 8-10 in one fixed 375px row) look like the
same violation but are not: one has no row-count ceiling and the other's ceiling IS the design —
the compact rail exists specifically to fit a whole trip's days in one glance. `.transit-link`:
**raise** — implement a touch-target expansion toward 44px in C2; it is free to grow because
nothing else shares its row. `.scrub-fit .dchip`: **keep baselined** — rejected raising it,
because 44px-wide chips at 8-10 per row guarantee overflow past 375px and the drag/scrub gesture
model (`src/features/mobile-nav/model/gesture.ts`) already makes inactive chips a secondary
target during a continuous drag, not a discrete tap goal, which is a real mitigating factor axe
cannot see. Note for implementers: `planner.css`'s separate `.dchip` (desktop day list,
`min-height:44px` already) is a same-named, unrelated, already-compliant selector — do not
"fix" it by mistake for the mobile-nav one.

**Resolved (2026-08-13, C2a/C2b implementation):** the pill→underline shape fix shipped
(`planner.css`'s `.dchip`) and the re-measurement this note asked for is done — real
`getBoundingClientRect()` numbers, both target pages, all nine devices. The underline shape does
NOT fit 8-10 chips at 44px: the shape change touches border/fill/radius only, not the
`flex:1 1 0;min-width:0` math on `.scrub-fit .dchip` that narrows these chips, so the width miss
is unchanged. `TARGET_BASELINE.dchip.max` shrunk 12→8 (the real observed ceiling, was a looser
bound) but the baseline-with-reason stands; the row-count-ceiling and gesture-model rulings above
are confirmed, not reopened. `.transit-link` (the other §H1 control) fully resolved instead: its
width already cleared 44px everywhere, so a height-only padding increase reached the floor with
no wrap-point change — its `TARGET_BASELINE` exception is removed, not shrunk.

**Day chips (`.dchip`) are a pill in shipped CSS; SPEC rule 1 and three independent P3 sources
say they should not be** (2026-08-12, design-reconciliation arc, §H2). SPEC rule 1
(`enforcement/SPEC-COMPONENTS.md:14`): "Radius is binary — `0` on anything that holds content or
evidence, `999px` on anything you press." A day chip is evidence (which day you're on), not a
button. `prototypes/Waypoint Guide Mobile.dc.html`, `COMPONENTS.md` §4, and `DayScrubber.jsx`
independently agree: no border, no radius, no fill — a `border-bottom:2px solid` underline
instead (transparent when inactive, `--accent` when active), active ground `--sunken` not
`--accent`. Shipped `planner.css` (`.dchip`/`.dchip-active`, both `.dchip` implementations
inherit from here) is a filled, bordered, `999px` pill — REVISE. Rejected leaving it as-is: SPEC
rule 1 is not ambiguous here and three sources agree independently, which is stronger evidence
than the single ambiguous kit reading this fork opened to resolve. The bottom-bar slots (a
separate, actually-pressed control) DO stay `999px` pills — shipped `.botslot` already matches
the prototype property-for-property; that half of the original A2 row is **No gap**, closed.
Implementing the day-chip fix also invalidates the measured-contrast comment at
`planner.css:14-16` (`--accent-ink` at 3.58:1/2.56:1 assumed an `--accent` ground) — whoever
implements this must re-derive and re-measure `.dchip-active .dchip-num`'s color against the new
`--sunken` ground, not carry the old value over. Also: `TOKENS.md` lines 124-126 claim a 14px
radius exception for the thumb bar that contradicts both the prototype and its own line 119 —
the prototype outranks it per CONTEXT.md's authority order; treat the exception paragraph as
stale when C4 syncs tokens back to the projects.

**A staged demonstration of a design state is a test fixture, never a live guide edit**
(2026-08-12, design-reconciliation arc, §H3). `GapBlock.astro` and the no-cover plate have never
rendered on any real guide, so their only proof-of-life would be staging one on a real guide and
reverting — but "never invent a gap" (Plan §D row 8) is written to mean no *reader* ever sees an
invented one, and a staged-then-reverted commit still ships that state to production for however
long it's live. Rejected: staging on a draft guide. The screenshot/demonstration for A2's FIX row
comes from an isolated test fixture (a Playwright/vitest spec rendering the component directly
with mock unconfirmed-fact data) — real guide JSON is never touched to manufacture a demo.

**Drift-baseline tightening happens every commit that improves a category, not at milestones**
(2026-08-12, design-reconciliation arc, §H5). `scripts/drift-baseline.json` already documents
"improvement can't regress" as its intent (Plan §C1). Rejected: milestone-only re-baselining —
it lets a category regress back up between checkpoints and nobody notices until the milestone
audit, silently spending the paydown work. Every commit that drops a category's count re-runs
`npm run drift -- --update` in the same commit, so the baseline only ever moves down.

**Hub trip list orders current-trip-first, not alphabetical** (2026-08-12, design-reconciliation
arc, A3 chunk 1). Shipped `dist/` renders the sheet/chip list alphabetically with the upcoming
trip last; P1's reference and the page's own header copy ("up next first") both call for the
current/upcoming trip first. Decided: reorder to current-trip-first. Rejected: keeping
alphabetical and rewriting the header copy instead — no reason surfaced anywhere for alphabetical
being the intended order, so the copy is correct and the sort is the bug.

**Panel titles stay at `--text-h4` (20.8px), not SPEC's 1.45rem/23.2px**
(2026-08-12, design-reconciliation arc, A3 chunk 3). `SPEC-COMPONENTS.md` §1 specifies
`1.45rem/1.2` for `.pnl-title`; shipped uses the shared `--text-h4` token (20.8px), which is used
elsewhere in the governed type scale. Decided: keep shipped. SPEC's guide-page prose has already
proven stale twice over in this same audit (masthead coordinates and the plate-stamp number are
both correctly-removed per earlier CONTEXT.md rulings that SPEC's prose doesn't reflect), so a
third literal disagreement isn't strong enough evidence on its own to fork a shared token off its
scale. Rejected: raising panel titles to a one-off 23.2px literal (introduces a size the type
scale doesn't otherwise have) and re-deriving `--text-h4` globally (unbounded blast radius, no
evidence the shared scale itself is wrong elsewhere it's used).

**The route-order interactive picker's home is an open investigation, not settled**
(2026-08-12, design-reconciliation arc, A3 chunk 5). P1 designed an interactive stop-picker +
"shortest order" solver for the ROUTE ORDER tool station; shipped, that station is read-only
analysis, and the interactive component (`features/route-opt/`, `route-opt.js:14`) is mounted on
the itinerary (`.planner-days .day[data-day]`) instead. Rejected (for now): wiring it into the
Tools station as the first move, even though the component already exists and the change would be
small — moving or duplicating an existing interactive surface has real product implications
(what happens to the itinerary mount?) beyond a mounting change, and the creator wants both
surfaces reviewed together before choosing either direction. Not a FIX row until that review
happens.

**The tablet layout's dead `@container` self-reference is fixed alongside a full breakpoint
centralization, not scoped narrowly** (2026-08-12, design-reconciliation arc, A3 chunk 7). Two
compounding bugs, both real: (a) `.shell` declares `container-name:guide` on itself
(`guide.css:146`) and then `@container guide (min-width:744px){.shell{…}}` tries to style `.shell`
through that same query — an element can never match its own container, proven by injecting a
probe rule where a child received the query's value and `.shell` did not — so the tablet
two-column grid never applies at any width. (b) Separately, `.grail{position:sticky}` loses to
`flight.css:51`'s `[data-hint-anchor]{position:relative}` at equal specificity (0,1,0), source
order deciding the tie — the rail never sticks at ANY width, desktop included, which is why an
earlier same-day audit chunk (guide-desktop) could only log this as an unverified ASK before the
tablet chunk's independent probe confirmed the mechanism. (c) Even after fixing (a), the intended
744px container threshold is high enough that a real iPad's ~732.8px container (768px viewport
minus scrollbar) still falls under it — the single most common physical tablet size still
wouldn't get the tablet model. Decided: fix all three together. Introduce one shared breakpoint
source — both the tablet threshold and the mobile 899px cutoff are currently hardcoded literals
scattered across 10 files (`guide.css`, `guide-rail/styles.css` for tablet; `guide.css`,
`mobile-nav.css`, `flight.css`, `trip-split.css`, `SightsBlock.astro`, `mobile-nav/index.js`,
`day-scrub.js`, `swipe-tabs.js` for mobile) — migrate all 10 to reference it, then fix the
container self-reference and lower the tablet threshold (~720px) to land real iPads in the tablet
model, in the same pass. Rejected: scoping just the container-query bug plus a literal threshold
change first and centralizing later — the creator chose the larger pass explicitly, reasoning that
the literal-scatter pattern is itself a contributor to "three disagreeing chrome regimes" (both
the guide-desktop and tablet chunks independently found navigation-model files disagreeing about
which body model applied at the same width) and letting it stand a second time just relocates the
next version of the same bug.

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

**Auto-graduation stays; the 2026-07-30 ruling is REAFFIRMED, not reversed** (creator ruling,
2026-08-13). `PLAN_EVIDENCE_FIRST.md`'s §10 mandate text called for removing autonomous
publication (its Phase G / packet G1) so a verify PASS would land `draft: true` and wait for a
human `graduate-approved` label. The creator was walked through G1's exact mechanics — it touches
only who pulls the trigger, not the verify gates — and rejected it: **packet G1 is dropped from
the program entirely.** research-pass.yml's critic step keeps calling `graduate-guide.mjs --slug`
on verify PASS. Rejected alongside it: building a review/approval surface on the website, which
would need auth and a repo write-back path a static Astro + Pages site does not have — that is a
separate future feature, not pipeline scope. Definition-of-done #3 ("cannot publish without a
human label") is struck. The evidence gate is the bar; a human label is not. If a later session
finds the plan's §10 prose calling for G1, **this entry supersedes it** — the plan doc is
annotated in place, but prose is easy to miss.

**The Japan guide is regression evidence, permanently — it is never repaired** (creator ruling,
2026-08-13). `PLAN_EVIDENCE_FIRST.md` assumed Japan would get a `revise-guide` cleanup pass once
Phase H proved the new checks detect its 12 defect classes. Rejected: the creator ruled Japan
stays as-is *indefinitely*, not "until the checks are proven." It is the corpus's only live
specimen of every defect the evidence-first program exists to catch — a cleaned Japan would leave
the regression suite testing a fixture nothing real corresponds to any more. Consequence for
future sessions: `src/content/guides/japan/` failing new hygiene gates is the EXPECTED state, not
a bug queue. Never "fix" its `$19,` values, its six duplicate domestic-flight rows, or its
section-path claims. Gates that must stay green corpus-wide are the ones that need a japan
exemption — not the other way round.
