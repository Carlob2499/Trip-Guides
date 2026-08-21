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
totals and a guide's own Budget panel, on every guide.
_Avoid_: sourced rate, verified rate

**Sourced rate**:
A guide's own dated, source-cited currency fact recorded in that guide's `facts.json`
(claim, value, `source_url`, `verified_on`), subject to the Verified pillar's citation
requirement. Distinct from a Live rate — a different claim with a different shelf life,
never conflated with it in the same line of UI.
_Avoid_: live rate

**Risk tier (R0–R4)**:
How much verification rigor a `facts.json` row earns, carried in its optional `risk` field
(`src/content.config.ts`, packet B1 — `docs/archive/INDEX.md → PLAN_EVIDENCE_FIRST`). Replaces the flat
"same 2-search cap for everything" the evidence-first program's D6 defect named. R0 = no
research needed; R1 = a light check; R2 = a normal sourced fact; R3 = plan-critical (an anchor
event, a booked venue) — a wrong R3 fact reroutes a day; R4 = mandatory-surfaced (a travel
advisory, a visa rule) — an R4 fact that's wrong or silently dropped is a safety failure, not
an inconvenience. Packet E1 enforces tier/evidence requirements that scale with this number;
nothing populates `risk` yet as of B1 — that is D2's (research protocol) and the intake
parser's (scaffold-time seeding) job.
_Avoid_: priority, severity (different axes — risk tier is about verification rigor, not
importance to the itinerary or how bad an error would read)

**Entity (fact registry)**:
The kebab-case id (`facts.json` row's optional `entity` field) grouping every fact row that
describes ONE researched thing — a venue, a transit route, a booked event — so one research
act yields all its facts instead of each prose mention re-discovering it independently. Named
for the defect it fixes: Japan's regression fixture (`tests/fixtures/japan-regression/`,
case 9) froze six rows for one domestic-flight leg, two different values disagreeing about
which source they came from, because nothing grouped them as the same thing.
_Avoid_: fact group, cluster (this repo's specific term is "entity," matching the plan's D1
defect and D2 packet — don't drift to a synonym)

**Emergency data**:
A guide's verified emergency phone numbers, sourced from `emergencyFor()`
(`src/data/countries.mjs`). One data source and one rendering component, exposed at two
entry points — the guide's own SOS sheet, and the atlas hub's Table-view quick card.
Never re-implemented per surface.

**Research pass**:
The lifecycle that BUILDS a guide that does not exist yet — `research-pass.yml`, four agents,
five stages (`scaffold → passA → passB → reconcile → verified`) checkpointed in
`guides-intake/<slug>/state.json`, on branch `research/<slug>`. Resumable by design: a
re-dispatch continues at the first unfinished stage instead of restarting.
_Avoid_: generation run (nothing is generated — the pass researches)

**Change run**:
The lifecycle that EDITS a guide that already exists — `change.yml`, one editor agent plus a
critic on the diff, on branch `change/<slug>-<issue-or-run-id>`. ONE workflow for every reason a guide changes
(a request, traveler answers, a date lock, staleness, trip feedback); the weight of the edit is
carried by the plan `scripts/pipeline/plan.mjs` builds, never by picking a different workflow.
Unstaged and not resumable — a failed change run is re-dispatched from the top.
_Avoid_: revision, modify run, recert run (all name workflows that no longer exist; recert.yml
survives as detection only and dispatches a change run)

**Intake**:
One traveler's stated intent for one guide — `guides-intake/<slug>/intake.md`, written at
scaffold from the intake form and FROZEN afterwards. What was asked for. Never the place to
record what research later found.
_Avoid_: brief, spec

**Ledger**:
Everything a pipeline run learned about one guide — `guides-intake/<slug>/ledger.md`: the Pass A
/ Pass B reconciliation table, amendments, candidates, traveler questions, critic findings and
sweep records, appended across runs. Tracked in git because git is the durable store. Intake is
intent, ledger is findings; a run that writes one where the other belongs corrupts both.
_Avoid_: run report (`append-run-report.mjs` is deleted — the ledger absorbed it), notes

**Publish**:
Removing a guide's `draft` key so it enters the hub grid and the search index — the automatic
consequence of a passing evidence gate inside `pipeline land --gate`, not an event anyone
triggers separately. `node scripts/pipeline.mjs publish --slug <slug>` runs the same gate by
hand; `land-branch.sh` files a "🚀 Auto-published" issue so the flip is visible and reversible.
_Avoid_: graduate, graduation (the retired `graduate-guide.yml` mechanism — the ruling behind it
survives, its vocabulary does not)

**Front door**:
The Cloudflare Worker (`worker/`) the product's own surfaces talk to, so GitHub never appears in
the creator's UX: it files intake and change issues and dispatches change runs. Public endpoints
are rate-limited; `/change`, `/answer` and `/approve` require the `X-Owner-Key` header and 503
when `OWNER_KEY` is unset.
_Avoid_: intake proxy (it stopped being intake-only when the owner endpoints landed)

## Decisions

Each entry states what was decided, and the alternative that was rejected — the rejection is
the load-bearing half. Contradicting one of these is allowed; doing it silently is not.

**Pipeline V2 lives BESIDE V1 with its own prompt set** (implementation ruling, 2026-08-17,
`codex/pipeline-v2`; authority `docs/pipeline v2/DECISIONS.md`). The four `research-*-v2.md`
prompts are V2's stage contracts, composed only by the manual, draft-only
`research-pass-v2.yml`; the unsuffixed four stay V1's, still dispatched by `/new`. Rejected:
updating the four existing prompts in place to the V2 artifacts — that would have silently
converted every `/new` dispatch into an unproven V1-orchestration/V2-contract hybrid while
"V2 stays manual/draft-only" was the rule. When V1 retires, its prompts are deleted whole,
never merged.

**Fixed research floors are GONE repo-wide, replaced by the earned saturation stop**
(2026-08-17, from DECISIONS.md "Research breadth"). `DEFAULT_FLOORS` 16/8·10/5·6/3, the
`researchFloors` schema field, and Pass B's ≥8/≥3/≥2 quotas are deleted; the replacement
protections are the V2 saturation record (a stop must record duplicates/weaker trend AND that
unresolved evidence can't change the recommendation) plus every structural anti-padding check
(shipped ⊆ shortlist, shipped-name cross-check, empty-table failure, non-empty full Pass B).
Rejected: keeping the floors for V1 only — one doctrine with two numbers is how the skill and
the gates drift.

**Attempt counters are run-scoped, and research+change share one `guide-<slug>` concurrency
group** (2026-08-17). A change run's budget keys on its branch suffix (issue/run-id): retries
of the same work still cap at 3, but successful runs never consume a guide's lifetime
allowance (the 4th request used to trip the breaker). Rejected: resetting the counter on
successful landing — a reset commit after a merge would push to a deleted branch. The old
separate `research-<slug>` group let a research and a change run interleave on one guide;
they now queue.

**Evidence-gate detection is DECOUPLED from `risk`/`evidence`/`tier`** (creator ruling,
2026-08-13). PLAN_EVIDENCE_FIRST specified E1, E2 and E3 as risk-keyed: R2+ must be a fact row,
R3/R4 need `tier: primary` plus an `evidence` snippet, R4 must be surfaced. An audit found ZERO
rows in the corpus carry any of those fields (korea 83 · denmark 27 · us 10 · japan 25 · fixture
25), and the A1 fixture is frozen evidence that can never be re-annotated. Rejected: shipping the
gates as specified, which would have produced three checkers that fire on nothing at all until
every guide is regenerated — a gate that cannot fire is indistinguishable from no gate. Each
defect class therefore has a RISK-INDEPENDENT detector that works on the artifacts as they exist;
`risk` only ESCALATES where a research pass has supplied it. The risk-keyed code is written and
tested but dormant. When D2-generated guides start carrying the fields, the gates sharpen without
a rewrite.

**Evidence gates are warn-first: they BLOCK on drafts, ADVISE on published guides**
(creator ruling, 2026-08-13). Rejected: blocking everywhere immediately, which would have turned
korea, denmark and us red over pre-existing debt and blocked all further work behind content
repair; and grandfathering the debt permanently, which never collects it. The split is not
timidity — the publish path gates on a draft's verify (`pipeline land --gate`), so blocking there means a defective
guide can never be PUBLISHED, while published guides accumulate visible advisories that name what
will block once enforced. This is how E1 delivers the publication safety that struck packet G was
for, without a human approval step.

**`tier` is backfilled PRIMARY-ONLY; a non-match stays blank, never `secondary`**
(2026-08-13, corrected against real data). The mechanical backfill was approved as "official
domain → primary, else secondary". Running it showed the else-branch is wrong:
`verification-rules.md` §3 counts "the venue's own site" as T0, which no destination-level
`t0Domains` list can enumerate — Korea Telecom's own eSIM page, the COEX aquarium's own ticket
page and the US Federal Reserve's H.10 release all came back `secondary`. Since E1(b) goes on to
gate on `tier: primary`, a wrong `secondary` would fail facts that deserve to pass. Rejected:
completeness over correctness. The script asserts only what a declared domain proves, and a blank
tier keeps meaning "not yet judged" — the honest blank.

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

**Guide numbering is dead on guide surfaces; the hub index is not** (2026-08-11, R5 §3 — now
`docs/design-handoff/DESIGN.md` → "The plate"). `SHEET 02` / `PLATE 02 — KR` / `GUIDE 02` are
gone from every guide surface —
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
FALLBACKS §4 (retired with the bundle's process docs — git path in
`docs/design-handoff/design_handoff_guide_ui/README.md`) lists `src/content/guides/` as a scope
guard for design work, and one guide file was edited anyway: `japan/01-plan.json` sent readers
to "the Entry card in your Trip kit" — a
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
(2026-08-12, design-reconciliation arc, `docs/archive/INDEX.md → PLAN_DESIGN_RECONCILIATION` §H1). `.transit-link`
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
on verify PASS. (**Mechanism update 2026-08-15:** `graduate-guide.mjs` and its workflow are
deleted; the same flip now happens inside `pipeline land --gate` — see "Publishing is what a
passing verify DOES" below. The ruling is untouched; only the trigger's address moved.) Rejected alongside it: building a review/approval surface on the website, which
would need auth and a repo write-back path a static Astro + Pages site does not have — that is a
separate future feature, not pipeline scope. Definition-of-done #3 ("cannot publish without a
human label") is struck. The evidence gate is the bar; a human label is not. If a later session
finds the plan's §10 prose calling for G1, **this entry supersedes it** — the plan doc is
annotated in place, but prose is easy to miss.

**Japan's defects are frozen in the FIXTURE; the live guide was DELETED for a fresh redo**
(creator ruling, 2026-08-13 — REFINED later the same day, then settled 2026-08-15 by the deletion
described below; each version supersedes the one before it). The original ruling said Japan "is
never repaired, permanently." That was recorded before two facts surfaced: the trip is **real and
upcoming** (Oct 15–Nov 10, 2026), and the creator intends to redo it with the fuller research and
confirmed bookings they already hold. So:

- **The fixture is the permanent evidence.** `tests/fixtures/japan-regression/` holds
  byte-identical copies of all 12 defect classes plus a MANIFEST citing file+line. That is what
  the regression suite tests, and it is immutable regardless of what any live guide does. It was
  built deliberately independent of the live guide, which is why the deletion below cost it
  nothing: `japan-regression*.test.mjs` pass unmodified with no japan guide in the repo at all.
- **The live guide is GONE, not hidden** (2026-08-15). It had been `draft: true` — off the public
  grid, still in the repo — because it carried known defects (`$19,` values, ¥11,410 attributed to
  both a railway and an airline, an unconfirmed travel advisory). The earlier plan was to
  regenerate it in place through the rebuilt pipeline. The creator instead deleted
  `src/content/guides/japan/`, `guides-intake/japan/` and `src/data/palettes/japan.json`: the redo
  will be a **fresh guide built from much more information**, not a re-run of the old intake, and
  keeping the old intake and ledger would only anchor the new brief to the weaker one. Not
  scheduled or scoped as of this ruling.
- **Kept on purpose, both verified independent of the deleted guide**: the fixture above, and
  `src/data/destinations/japan.json` (country-level reusable research — t0 domains, advisory URL —
  which the redo needs again). Deleting a guide never means deleting the country.
- **Hand-patching stays forbidden**: repairing defects to make a gate go green destroys the
  specimen without fixing the process that produced it. Moot for Japan now — there is no live
  guide to patch — and the rule survives for whichever guide is next.

Consequence: no japan gate exemption is needed, and no test asserts the fixture against a live
guide — the fixture protects its own line citations instead. The tests that DID read the live
japan guide were re-pointed at the remaining guides in the deletion commit (the rail counts in
`stations.test.ts`, the never-fewer guide-count floors in `guide-stats.test.ts` and
`compose-guide.test.mjs`); `fact-usage.test.mjs`'s japan ACCEPTANCE block was dropped because its
behaviour is already covered synthetically. Note the side effect: **every shipped guide now
carries a `learnings` record**, so the rail's no-learnings branch is exercised by deriving that
input rather than by any real guide. The fresh redo, once scoped, is still the program's natural
end-to-end acceptance test.

**A scheduled day's `waypoints` are the routing substrate — leg verification is not blocked on a
new schema** (2026-08-14). Case 11's live half sat unbuilt for a release behind the belief that
transit durations "live in prose with no machine-readable origin→destination pair to query", so
closing it meant designing a new `legs` structure. That was wrong twice over: PLAN_EVIDENCE_FIRST
§4 had already named the substrate ("verify inter-stop transit durations for scheduled day legs"),
and `days[].waypoints[]` already carried `{name, lat, lng, time}` — consecutive waypoints ARE the
pairs, in 27 Korea legs across 7 days. Rejected: adding a parallel `legs[]` array to the `routes`
section type, which would have restated already-verified prose as a second copy of the same claim
and created a continuity liability the moment either drifted. The general lesson is the one this
program keeps re-teaching: **before declaring work blocked on structure that does not exist, grep
for the structure that does.** A blocker asserted from a module's own header comment is an
assumption, not a finding.

**A schedule gap is measured origin-END to destination-START, and only an OVERRUN is a finding**
(2026-08-14). Waypoint `time` is a display label, so a windowed stop ("10:00–16:30") has two
times. Taking its start would inflate every travel window — 420 minutes where the traveller has
30 — and the check could never fail. Taking its end is the real window. The verdict is then
deliberately asymmetric: a gap LARGER than the live duration is dwell time and proves nothing,
so only a gap smaller than the leg is reported. Rejected: comparing gap to duration
symmetrically, which would flag every stop a traveller lingers at — i.e. all of them.

**The cleanup rulings — what got cut and what "keep" means** (2026-08-14, codebase-audit
session; each was an explicit creator answer, so a later session must not silently re-add them).
Cut, do not resurrect without a new ruling: the telemetry feature end-to-end (counting was
statistically worthless for this audience, and its weekly commit path had been silently broken —
the deleted disclosure line in the guide footer goes back ONLY if counting ever returns); the
test-index meta-gate (test descriptions + generated catalog taxed every test change and
hard-coded suite-size floors); the 24 local-only Playwright specs (nothing ran them — a11y.spec
is the one gate; git history holds the rest if a redesign wants them); the panel/progress-preview
study trees; model-smoke.yml; the mutation and skill-retro CRONS (both workflows stay,
dispatch-only). CHANGELOG is frozen at 2026-07-16 and lives in docs/archive/ — the structural
story's ongoing home is THIS file plus the archive plans, not a second ledger. Kept by ruling:
the /new intake wizard and its worker ("the HUMAN way to interact with the website" — its bot
challenge was later dropped, see the 2026-08-15 entry below); docs/archive and
HANDOFF_ARCHIVE (git history was squash-rooted 2026-08-08, so the archive IS the pre-August
record); deploy.yml's `npm test` (test.yml is a non-required check, so deploy's run is the real
gate — the audit's "duplicate" finding was withdrawn on evidence). Also settled: PLAN_EVIDENCE_
FIRST.md keeps its SCREAMING_CASE name as docs/README's one recorded exception, and the
route-optimizer's pure math lives in src/lib/route-optimize.ts — a silo whose index must stay a
side-effect import cannot also be a build-time export door.

**The public intake endpoint ships with no bot check** (creator ruling, 2026-08-15). Turnstile was
wired end to end — client widget, config key, Worker verify branch — and waiting only on the
creator's keys; the ruling is that it is not wanted, so all three were deleted. Rejected: leaving
the code in place behind an unset secret, which is dead code that reads as a live guard to every
later audit (the 2026-08-14 audit and HANDOFF both carried it as a pending creator task). What
protects the endpoint is what already did the work: the shared zod schema + FIELDS mapping (a
malformed body is a 400 that files nothing), the per-IP weekly cap with its owner-approval tier,
and the fixed `ALLOWED_ORIGIN`. `/health` now reports one guard, not two. Re-adding a challenge is
a new decision, not a restoration.

**The /new page asks the whole intake schema — no field collected into nothing** (2026-08-15).
The composed intake shipped without `departure-airport` or the three certainty dropdowns, so every
hub-filed guide reached research with its dates/anchor/budget certainty silently defaulted to
"assumed" and no departure airport — which is the fact the Atlas globe draws its route line from,
so hub-filed guides drew none. Rejected: a separate certainty step (a quiz about answers the
traveler hasn't given yet). Each certainty is a RIDER on the step of the field it qualifies —
dates with dates, anchor with anchor, budget on the ranked board where budget lives — rendered as
the flow's pill row, never as a raw dropdown, and never counted when deciding whether that step
still needs asking ("assumed" is a real answer, not a blank). `intake-contract.test.ts` names all
four so the drop cannot recur silently.

**Two lifecycles, and nothing else** (creator-approved architecture refactor, 2026-08-15). A guide
is either being BUILT (research pass) or being EDITED (change run); there is no third thing.
`modify-guide.yml`, `revise-guide.yml` and recert's execution half are deleted and `change.yml`
carries all of it, with the weight of an edit decided by the plan `scripts/pipeline/plan.mjs`
builds (≤5 groups, past which it is a re-research) rather than by which workflow was picked.
Rejected: a workflow per reason-for-editing, which is what existed — three pipelines that were the
same run at different weights, each copy drifting from the others. Consequence: recert.yml is a
DETECTOR that dispatches change runs, and feedback-export files inert proposals a human dispatches.

**The pipeline's business logic lives in `scripts/pipeline/`; a workflow is wiring** (2026-08-15).
Every gate, plan, route, prompt and publish decision moved out of `run: |` heredocs into tested
modules behind one CLI (`node scripts/pipeline.mjs <subcommand>`), leaving research-pass.yml at 334
lines, change.yml at 271 and recert.yml at 70 — trigger, setup, agent step(s), one subcommand.
Rejected: keeping the logic in YAML, where no linter reads it, no suite can execute it, and each
workflow owns a copy. The two seams this creates are themselves gated: `prompt-contract.test.mjs`
holds `prompts/` ↔ workflows together, `pipeline-orchestration.test.mjs` pins what the modules
decide.

**One run-state directory per guide, and intent is never findings** (2026-08-15).
`guides-intake/<slug>/` replaces the flat sibling files (`<slug>.md`, `<slug>.state.json`,
`<slug>.passB.json`, `<slug>.coverage.json`): `intake.md` is the traveler's intent, frozen at
scaffold; `ledger.md` is everything the runs learned, appended; `state.json`, `coverage.json` and
`passB.json` are machine-written. Rejected: the single growing intake file, where a research
finding written next to the traveler's own words silently becomes something the traveler said.
Git stays the store — no database, so the PR diff IS the audit trail.

**Publishing is what a passing verify DOES** (2026-08-15). `pipeline land --gate` runs
`npm run build` + `npm run verify --network`, and on a pass deletes the guide's `draft` key in the
same step that merges; `graduate-guide.yml`, its issue template, `graduate-guide.mjs` and the
graduation vocabulary are deleted. This is a MECHANISM change only — the 2026-08-13 auto-graduation
ruling stands, and so do the veto (`land-branch.sh`'s "🚀 Auto-published" issue with a one-line
rollback), the manual override (`pipeline publish --slug`), and the human-only retire path.
Rejected: keeping graduation as a separate workflow that re-runs the same gate — a second copy of
one verdict is a place for the two to disagree, and nothing between them can arbitrate.

**The front door is the Worker; GitHub stays invisible** (2026-08-15). The product's own surfaces
file issues and start runs through `worker/`: public `/` and `/intake` are rate-limited, while
`/change`, `/answer` and `/approve` require the `X-Owner-Key` header and 503 when `OWNER_KEY` is
unset (fail CLOSED). Because the issue templates are public, `change.yml`'s resolve job ALSO
requires `author_association` ∈ OWNER/MEMBER/COLLABORATOR — the label a stranger can apply must not
be able to start an agent run. Rejected: trusting the label alone (the owner key is bypassed by
filing the identical issue by hand), and sending the creator to GitHub to do it themselves.

**Resumability is research-only** (2026-08-15). A research pass checkpoints five stages in
`state.json` and gets 5 attempts; a change run has no stages, gets 3, and re-runs from the top
(`CAPS` in `scripts/pipeline/gate.mjs`). Rejected: giving change runs the same checkpoint spine —
a change is one editor agent plus a critic, minutes rather than hours, so the state machine would
cost a second thing that can disagree with the branch and buy back nothing.

**The meta-workflows are deleted** (2026-08-15). Gone: `skill-evals.yml` (a live-agent regression
gate on `.claude/skills/**` PRs) with its `evals.json` corpus, `skill-retro.yml` (the monthly
skill-improvement proposer, whose input ledger `append-run-report.mjs` maintained no longer
exists — run history is `guides-intake/<slug>/ledger.md` now), and `token-canary.yml` (the weekly
call that alarmed on `CLAUDE_CODE_OAUTH_TOKEN` expiry). Each gated the harness rather than the
product. **This supersedes the 2026-08-14 "kept by ruling" line for skill-retro**; mutation.yml
survives, dispatch-only, as the one meta-gate left. Rejected: leaving them wired but dispatch-only
— the Turnstile mistake in another costume, since an unrun workflow reads as a live gate to the
next audit. Two consequences to know: a skill edit is now reviewed by a human with no eval behind
it, and an expired agent token surfaces as the first failed pipeline run instead of a weekly alarm.

**`us` and `japan-2` are deleted from the corpus** (creator ruling, 2026-08-15). `us` was the
published Sedona guide; `japan-2` was a second guide for the SAME Oct 15–Nov 10, 2026 Japan trip as
`japan`. Rejected: keeping either as corpus — two live guides for one trip make every index lie
about how many trips exist, and japan's regeneration through the rebuilt pipeline has no room for a
rival draft of itself. Deleting a guide takes all FOUR of its homes: `src/content/guides/<slug>/`,
`guides-intake/<slug>/`, `src/data/destinations/<slug>.json` and `src/data/palettes/<slug>.json`.
Nothing is lost that the evidence needed: Japan's defects live in the frozen fixture
(`tests/fixtures/japan-regression/`, 2026-08-13 ruling), and the critic findings from both runs are
already distilled in `docs/evidence/pipeline-patterns.md`.

**Triage buttons start a change through the Worker front door, not through a label** (creator
decision, 2026-08-15). The retired design bundle mapped Quick fix → `modify-approved` and Full
re-check → `revision-approved`; both labels were deleted the same morning by the two-lifecycles
refactor. Quick fix and Full re-check now POST the owner-keyed `/change` (or `/approve` for a
feedback proposal) and carry the owner's suggested weight as a line of TEXT in the request body —
`pipeline plan` still decides the real scope, so the button is a suggestion and never names the
outcome. Rejected: re-creating the labels so the design could ship as drawn, which would have
restored the exact bypass the owner key was introduced to close (anyone can apply a label to a
public issue). Consequence: the dead label strings must never be RENDERED anywhere; naming them in
a comment as history is fine and deliberate.

**Feedback proposals live in triage, not on `/progress/`** (creator decision, 2026-08-15). The
proposals panel moved off the traveller-facing progress page into `/progress/triage/`, the
owner-key-gated queue reachable from the hub TOOLS menu only. `fetchProposals` + `toProposals` are
reused through the pipeline-progress silo's public index — not copied. Rejected: leaving proposals
on `/progress/`, which put an owner decision on a page whose reader is the person waiting for a
guide, and made the same panel answer to two audiences. Consequence: `/progress/` has no owner
queue at all, and the triage cards state plainly that nothing happens until the owner decides.

**The live-event panels ship empty until the pipeline emits** (creator decision, 2026-08-15). The
cockpit's "Sources we're reading", "Decisions made", "Worth knowing" and the Pages-visited /
Facts-verified counters have a typed, mocked, tested gateway and a full layout — and today that
gateway always resolves to empty, because nothing in the pipeline writes per-event data. Each panel
carries one line saying so. Rejected: replaying a scripted demo run (the bundle's "Watch a demo run"
button, which does not ship) and inferring counts from the artifacts, both of which put invented
activity on the one surface whose entire job is reporting what is actually happening. The
"Cost to research" row is omitted for the same reason — no data, so no row. Emission is a drop-in:
`docs/reference/pipeline.md` + issue #56 carry the contract.

**V2 run context is durable state, never re-threaded inputs** (integration week, 2026-08-20;
publication clause CORRECTED by the release-candidate pass the same week). The intake `issue`
is recorded ONCE in `run.v2.json` at init, inherited by every resume/retry/answer-redispatch,
heals only from null, never rewires. Rejected: threading context through every dispatch's
inputs (V1's shape) — four void-retry sites plus the answers redispatch would each re-thread
it, and any one omission misroutes a run. Supersedes the "today that gateway always resolves
to empty" clause of the Progress-honesty entry above: V2's `events.mjs` emits real, RUN-SCOPED
stage/landing events (runId-stamped; Progress refuses a stream naming another run) and the
honesty rule is unchanged — what the emitter cannot prove still renders empty or null.

**Landing authority is infrastructure; publication is a two-phase transaction** (release-
candidate correction pass, 2026-08-20; derivation hardened same day). `landMode` is DERIVED at
init by `deriveLandIntent()` — auto ⇔ TRUSTED PROVENANCE (the run was invoked through
new-guide.yml's workflow_call, so its event is the caller's "issues", never
"workflow_dispatch") AND the default branch AND `WAYPOINT_RESEARCH_ENGINE=v2` — recorded once,
immutable (resume requests are ignored, not honored), and re-checked as landing-time
authority. The hardening amendment closed the ref+selector-only gap: a maintainer's manual
dispatch on main with the selector live now still creates a draft-only run — only the /new
product flow can mint auto, and no workflow input, manual dispatch, or feature-ref run can
reach auto publication. Publication
itself: the gate verdict is a pre-merge fact and rides the branch; `publication.published` is
written ONLY by `finalizeMergedLanding` after gh confirms the merge, on the default branch,
idempotently retryable — and the schema refuses `published` without a confirmed merged
landing outcome. Rejected: the integration week's first design (`recordProductLanding`),
which wrote published BEFORE `landBranch` ran so the fact could "ride the merge commit" —
state claiming an event before reality is exactly what the honest-progress doctrine forbids,
and a merge conflict would have left a branch asserting a publication that never happened.
Also rejected: a `land` workflow input ("set only by /new" was prose, not enforcement — any
manual dispatch could type it).

**Numeric research floors are dead EVERYWHERE, including V1 context** (release-candidate
correction pass, 2026-08-20, closing the recorded CONFLICTING_SPEC). The 2026-08-17 decision
above said floors were gone repo-wide and explicitly rejected a V1-only exception — yet
`check-candidates.mjs` shipped an env-gated remnant (`DEFAULT_FLOORS` active whenever
`WAYPOINT_PIPELINE_V2 != 1`) that failed honest small consideration sets (Andorra: "5
considered, floor is 16") in every V1-context verify. The remnant, the `researchFloors`
schema field, and their tests are now removed; the structural anti-fabrication checks
(shipped-name cross-check, shipped ⊆ shortlist, empty-table failure) and the saturation
record remain the thinness protection. Rejected: re-recording the conflict for a third time —
three authorities already agreed, so the code moved.

**Every integration/hardening pass ends with a per-requirement acceptance matrix** (creator
ruling, 2026-08-20, on the PR #68 final hardening pass). The closing report — and the PR body
it updates — carries one table row PER requirement: verdict (PASS or BLOCKED, nothing
softer), files changed, a one-line implementation summary, the EXACT test(s) proving the
behavior, the test result, and remaining uncertainty (an honest "none" is a claim, not a
default). Two hard rules ride with it: a requirement is never marked PASS on inspection alone
where a behavioral test was required, and a required behavioral test that is absent or
failing makes the row BLOCKED — the matrix is where "tests passed" and "the requested
behavior was proven" are forced to be the same statement. Rejected: prose summaries of "what
was fixed" without per-requirement proof lines — that shape is how the correction pass's
"zero known code blockers" claim shipped over twelve live defects; the matrix exists so a
claim of readiness decomposes into rows a reviewer can falsify one at a time.

**A landing is proven by its RUN, and a non-merged auto landing is quarantined ON ORIGIN**
(Codex re-review corrections, 2026-08-20, PR #68). Four amendments to the two-phase
transaction above. (1) Merge confirmation includes RUN IDENTITY: `verifyMergedPr` reads
`run.v2.json` out of the merge commit's own tree and refuses any runId other than the one
being finalized — `research-v2/<slug>` is REUSED across generations, so base+head alone would
let Run A's old merged PR finalize Run B; `expectedRunId` is mandatory, no caller may skip
the proof. (2) Every non-merged AUTO landing must leave `origin/<branch>` carrying
`draft:true` again (the flip was pushed pre-merge); the restore is committed AND pushed
(`quarantineRemoteBranch`), and a restore that cannot reach origin is a BLOCKED landing —
recorded failed, exit 1, never reported as a safe draft fallback. The whole transaction lives
in `scripts/pipeline/landing.mjs` (`executeLanding`, injectable seams) so the invariant is
behaviorally tested against real git remotes. (3) Recovery announcement truth FAILS CLOSED:
`finalize-landing` without `--announced` refuses when the durable state carries no announce
fact (`ok|failed|skipped`; skipped = no announce URL was configured) — a crash between the
merge and main must not silently turn a known real-world outcome into null; the land path's
printed retry command now always carries the flag. (4) Answers routing resolves ACTIVE
research ownership BEFORE historical slug publication (`resolveAnswerRouting`,
questions.mjs): a published Run A on main never steals Run B's answer into the change
lifecycle; only when no run owns the answer does publication route it to a change run.
Rejected: branch-name identity as landing proof (aliases generations); logging a failed
draft-restore and continuing (claims a safety the remote cannot show); routing by
publication-first (the exact Run-A-steals-Run-B mis-route).
