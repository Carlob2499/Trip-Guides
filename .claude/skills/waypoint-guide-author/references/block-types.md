# Block Types — when to use each of the 14 section kinds

Extracted from the schema comments in `src/content.config.ts` (the source of truth —
every field you write must validate against it; when in doubt, read it). Every section
carries `type`, `group` (the nav-tab category label), and usually `title`.

**Top-of-guide label rules (dedup + information density):**
- `kicker` must carry information the title does not — the established pattern
  is the route + dates: `"Seoul · Daejeon · Busan — Jul 8–15, 2026"`. Never a
  vague season label, and never text that repeats `title` or `country`.
- When `title` equals `country` (the common case), the layout suppresses the
  country eyebrow to avoid rendering the same word twice — so a missing kicker
  means NO eyebrow at all. Always set a kicker on a researched guide.
- Same principle everywhere: no surface may present the same datum twice
  side-by-side (see CLAUDE.md "Uniform application across surfaces").

**Group (tab) budget — ENFORCED, not advisory.** `_guide.json`'s `tabBudget`
(default 10) caps distinct content `group`s; the build fails past it and lists
the groups. Don't raise it to make a build pass — that inverts the point. Raise
it only when the guide has genuinely earned the tab (Korea's 11 exist because
two anchor events and a solo fork demand them), and prefer merging two thin
groups first. The reader also sees 4 tool tabs on top of whatever you declare.
Merge before adding: `Essentials` holds money/health/etiquette-type sections;
same-audience event content shares one group. A group name is a nav label
(short, no " & " chains where avoidable); the section `title` carries the
identity. New guides start from: Plan · Essentials · Transit · Days ·
Sights · Food & shopping · Sources, adding at most 3 trip-specific groups.

**Cite evidence, not just doctrine.** `docs/telemetry/summary.md` (auto-generated
weekly from anonymous tab-open counts, PII-free) ranks which tabs travelers
actually opened on past guides. Consult it when deciding a new guide's groups and
their order: a tab nobody opened is a merge candidate; a consistently top-ranked
one earns prominence. Absent or thin data means no signal yet — fall back to the
ranking rules, don't invent one.

**Budget `est` values power plan-vs-logged.** The Budget calculator compares
its logged spend against the guide's own `budget` section (USD sections
only; `est × dayCount` for `basis:"day"` items). Generated drafts emit
`est: 0` (line hidden) — filling real researched estimates during
graduation turns the comparison on automatically.

**Day `tldr` (required on researched guides).** Every day item carries a
one-sentence `tldr` — the glanceable summary rendered huge in Focus Today
and as the day card's lead line. Derive it from the day's own researched
content (title/pace/body); it may never introduce a fact the day doesn't
already contain.

**Write bodies lead-first.** Panel/prose cards render only the FIRST `<p>`
by default; everything after folds behind a "More detail" toggle (density
pass — content deferred, never dropped). So the first paragraph must stand
alone as the card's summary: the one thing the traveler needs, in one or
two sentences. Depth, caveats, and reference detail go in later paragraphs.

**The governing rule:** prose bodies allow only `<p> <b> <i> <a> <ul> <li> <ol>`.
The moment content wants a table, a grid, cards, collapsibles, or any richer
structure, that is the signal to reach for a **typed section** below — never richer
HTML in prose. Dense comma-lists and wall-of-text paragraphs in prose are the same
signal (that's why `habitats`/`infogrid`/`tierlist` exist).

**Collapse fields:** `panel`, `prose`, `list`, `habitats`, `infogrid`, `tierlist`,
and `raids` accept optional `collapsible: true` (renders the card as a native
`<details>` — tap the title to fold) and `defaultOpen` (default true). Use
`defaultOpen: false` for deep-reference material the reader only sometimes needs
(e.g. counter charts), keep primary content open.

**The "More detail" fold (`panel`/`prose` only).** A body whose remainder after the first
`</p>` runs ≥260 characters folds automatically behind a toggle. Two fields steer it:

- **`moreLabel`** — name what is behind the tap. Without it the toggle falls back to a
  computed count ("More detail · 3 more paragraphs"), which measures *volume, not value* and
  reads as a chore. "Tax-free shopping — the Nov 1 system change" earns a tap; "8 more
  paragraphs" warns the reader off. **Write one for every fold.** It is only read on `panel`
  and `prose` — the section union is strict, so putting it on any other type now fails the
  build rather than being silently dropped (it was silently dropped for five japan venues
  sections until 2026-08-02).
- **`fold: false`** — veto the fold entirely. The splitter already refuses to hide a `⚠` flag
  or a `<ul>/<ol>` procedure, but it cannot see content that is operational only in context.
  Set this when the remainder holds **emergency contacts** (embassy lines, 24-hour pharmacy
  addresses, night-bell instructions), a **penalty** (a fine, an enforced closure), or
  **arrival-critical steps** the reader acts on in the first hour. Burying those one tap deep
  contradicts the site's own surfacing doctrine. There is no `fold: true` — folding stays
  automatic and length-gated, so a short section can never be pushed behind a tap.

Deciding between them: ask *"if the reader never taps this, have they lost something they
needed?"* Yes → `fold: false`. No → keep the fold and give it a real `moreLabel`.

## Quick decision table

| You have… | Use | Why |
|---|---|---|
| Reference info + a to-do list (bookings, packing, when-you-land steps) | `panel` | body + `checklist[]` — checklist items render as persisted checkboxes |
| Narrative/explanatory writing (etiquette, neighborhood character, cultural context) | `prose` | plain body, allowlist tags only |
| A pure check-off list, no narrative (caught-tracker, to-confirm list) | `list` | `items[]` of strings, each a persisted checkbox |
| Step-by-step transit/route directions | `routes` | ordered `steps[]`, numbered, each checkable |
| A location to show on a map (+ named points for taxis) | `map` | OSM embed from `center`/`span`; `points[]` for named places |
| Live weather for the trip | `weather` | no config — reads coords from the guide's FIRST `map` section at runtime; hides if none |
| Public holidays / closure risk | `holidays` | build-time Nager.Date data by country + trip year; hides if no data file |
| The day-by-day itinerary | `days` | one item per day: date, title, pace, body, checklist, energy |
| Food, shopping, or activity venue picks | `venues` | structured cards: name/area/hours/price/why/book + provenance per item |
| Photo-worthy attractions | `sights` | photo cards — `img.file` MUST be a Commons-confirmed filename |
| Cost estimates / a budget calculator | `budget` | typed line items with basis day/trip, low/high, per person/group |
| A time-windowed rotation (event habitats, raid hours) | `habitats` | one card per window: day, time, name, type chips, target chips, tip |
| Many small facts that would be a bullet-wall in prose | `infogrid` | icon + label + one-clause body per tile; scannable |
| A ranked/tiered set of picks (S/A/B, skip-vs-do) | `tierlist` | chip rows per tier, `hot[]` highlights must-dos |
| Raid-boss counter tables (Pokémon GO) | `raids` | typed per-boss collapsible cards with counter tables |

## Per-type notes

**Field shapes live in `src/content.config.ts` — read it for the exact fields of
any type you're writing.** These notes carry only what the schema can't tell you:
conventions, render behavior, and the verification rules attached to a field.

- **`panel`** — the workhorse for Plan-tab reference cards ("When you land",
  "Booking checklist", "Local essentials"). **Standard for any guide with a flight:**
  the Booking checklist (or a flight panel) must state the **booked airline's baggage
  allowance** — carry-on + checked, per fare, since hybrid/low-cost carriers (e.g. Air
  Premia) don't bundle bags the way legacy carriers do; flag `⚠ confirm your fare` and
  link the carrier's current baggage + flight-specific notices. For a redeye/early
  arrival, "When you land" should note where to shower/refresh airside.
- **`prose`** — if you're tempted to put `<table>`, `<details>`, or layout `<br/>` in
  a body, stop: pick a typed section instead.
- **`list`** — items may contain inline allowlist HTML.
- **`routes`** — steps are HTML strings; use single-quoted `href='…'` attributes
  (repo JSON convention), name the specific service (`<b>M2</b>`, bus `<b>707</b>`),
  give `≈` times/fares.
- **`map`** — `points[]` now RENDER (not dormant schema): with a Google Maps key each
  point is a pin whose info window shows its name, its `local_script_name` in native
  script (the "show a taxi driver" line), and a Directions deep-link. So populate
  `points` during research on any guide where a language barrier matters — it's the
  answer to a traveler who can't read the local script. `local_script_name` must be an
  AUTHORITATIVELY verified native name (Nominatim `namedetails` name:ko/name:xx, or the
  place's official site) — never transliterated from memory; omit it rather than guess,
  the pin still ships with its coords + Directions. `place_id` is verified-or-flagged,
  never guessed: an unverified value is the literal `__VERIFICATION_REQUIRED__`; a real
  one is the OSM id `scripts/lookup-place.mjs` returns (it's provenance for the coords —
  the Directions link is built from lat/lng, so it works with or without a place_id).
  Coords come from `lookup-place.mjs`, not memory. Korea's Seoul orientation map is the
  worked example.
- **`weather`** — needs a `map` section somewhere in the guide to source coords;
  otherwise it stays hidden. Don't invent coords for it.
- **`holidays`** — country comes from the guide's `country` via the ISO map; dates
  from the `days` section. `year` defaults to the derived trip year.
- **`days`** — `date` is a label like `"Wed Jul 8"`; `pace` is a free-text schedule
  narrative (NOT a strenuousness rating); `energy` (`packed | balanced | slow`,
  default `balanced`) drives the Low-Energy toggle — only tag `packed` when the day
  genuinely is. `env` (`outdoor | indoor | mixed`) drives the weather day-swap
  advisory (rain on an `outdoor` day + a dry `indoor` day nearby suggests the swap).
  Explicit tags only — both features stay silent on untagged days rather than
  guessing from prose. `constraints` are strings like "Closed Mondays".

  **`plan_b` — the inclement-day alternate (research owes this, 2026-08-02).**
  `{ trigger: "rain"|"closure", body, source_url, verified_on }` — a researched
  answer to "this day just broke": a verified refuge for a rain-window day, or the
  fallback when the day's anchor venue can close. Provenance is schema-REQUIRED —
  an alternate names a venue, which makes it perishable like any other claim.
  The obligation: **any day inside a known weather window** (monsoon/jangma/rainy
  season — the Holidays & weather research already establishes these) **or anchored
  on a closable venue owes either a `plan_b` or an explicit "no good alternate"
  note in the intake doc.** The best alternates do double duty — the pattern that
  created this field was a jjimjilbang on a jangma arrival day, refuge AND
  post-flight recovery in one stop (see `docs/TRAVELER_PATTERNS.md`). Distinct
  from `env`/day-swap: the swap reorders whole days and goes silent when no dry
  day exists — `plan_b` is the answer for exactly that case. Never invent one:
  a weather-window day with no researched alternate gets the honest note, not a
  guessed venue.
- **`venues`** — scannable cards for food, shopping, and activity picks. Each item
  has structured fields (name, area, address, phone, hours, closed, book, price,
  crowd_tip, why, how, map) — `why` is ONE compelling line, not a paragraph.
  `book` is one of `"url"` / `"walk-in"` / `"call"` (with `book_url` for the URL
  case). Section-level `intro` holds editorial context that isn't about a single
  venue (area overviews, disproved claims, comparisons). Each item carries its own
  provenance fields. Use this instead of `prose` for any section that's essentially
  a list of named places with details.
- **`sights`** — `img.file` is an exact Wikimedia Commons `File:` page filename
  confirmed to exist (use `scripts/search-commons.mjs`); if unsure, omit the image
  entirely.
- **`budget`** — `party` must be a positive integer (the per-person view divides by
  it). `est` is a number in the guide's currency — never a string, never a sentinel.
- **`habitats`** — `targets` render highlighted (the must-dos); `tip` is a short
  tactical footnote (weakness, pass budget); prefix a chip with `✨` for
  shiny-eligible.
- **`infogrid`** — one emoji/glyph icon, a short heading, one clause of detail
  (inline `<b>`, `<a>` allowed in body).
- **`tierlist`** — `hot` lists chip texts to render highlighted; `✨` prefix marks
  shiny-eligible; `body` is a 1–2 line elaboration.
- **`raids`** — `strategy` allows inline `<b>`, `<a>` only.

## Guide-level typed features (research these like any fact)

- **Phrase cards** (guide-level `phrases: {lang, items[]}`, docs/FEATURES.md #6) —
  optional; when the trip warrants it, research 15–20 situational phrases
  (allergy, taxi, help, directions) with the SAME rigor as any other fact: a
  native-script phrase is safety-adjacent (a traveler may show it to a stranger
  mid-crisis), so ship/flag/omit applies per-phrase — verify against a reliable
  bilingual source, never transliterate from memory. `lang` is the BCP-47 tag
  (e.g. `"ko-KR"`) that drives the Trip kit tab's speak button.
- **Entry requirements** (guide-level `entry: [{homeCountry, visa, ...}]`,
  docs/FEATURES.md #7) — one row per traveler home country (a party can mix
  passports; ask during intake if unclear, never assume). `source_url` +
  `verified_on` are SCHEMA-REQUIRED here (not optional like most provenance) —
  research from each destination country's OFFICIAL immigration/entry page only,
  never a paid visa API or an aggregator. A wrong visa claim can mean a denied
  boarding, so omit the whole guide's entry card before shipping an unverified
  one. Recert re-checks this on its normal shelf-life cadence like any other fact.
- **Travel advisory** (guide-level `advisory: {level, title, summary?, source_url,
  verified_on}`, docs/FEATURES.md #9) — the destination's CURRENT US State
  Department advisory (`travel.state.gov/.../ <country-slug>-travel-advisory.html`),
  `source_url` + `verified_on` SCHEMA-REQUIRED. **The page is Cloudflare-gated
  against plain `fetch()`/`curl`/WebFetch (403)** — it only resolves through an
  actual browser tool (navigate, wait out the challenge, read the "Level N:
  <title>" line near the top); never a build-time fetch. Record the level ALWAYS,
  even a normal Level 1 — an omitted field reads as "never checked," a worse claim
  than "checked, nothing elevated." The pill only renders at level ≥ 2
  (honest-blank); Level 1 stays silent by design, not by omission.

## Placement conventions

- `group` values become the guide's nav tabs — reuse the established ones where they
  fit (Plan · Money & budget · Health & safety · Etiquette & language · Transit
  · Days · Sights · Food & shopping · Sources) plus trip-specific
  groups (e.g. an event tab). Keep a new group only if the content genuinely doesn't
  belong in an existing tab.
- The canonical closing section is a `prose` titled "Sources & further reading" in
  group `Sources`.
- Leave `map` / `weather` / `holidays` sections intact when editing — they're wired
  to live data, and the weather block depends on the first `map`'s coords.


## Group labels & the voice standard (Quiet Edition, decided 2026-07-28)

The label a traveler navigates by is LITERAL, always — one plain word that names the
bucket at a glance: `Plan · Essentials · Transit · Days · Sights · Food · Sources`
(plus trip-specific anchors like `Daejeon & MSI`). Never re-spend wayfinding on
cleverness ("Pocket", "Receipts" were tried and withdrawn).

**Descriptors are RARE and informational-only (creator's ruling, 2026-07-28 — this
supersedes the original "warmth lives one level down" doctrine).** The first shipped
set (Korea, eleven lines) was rejected by the creator as AI-sounding, and the autopsy
is worth keeping: eight of eleven shared one machine rhythm — a short list, an em-dash
pivot, a quip tail ("cash, data, etiquette — and 112/119 one tap away" · "every fact,
traced and dated — the receipts") — and the quips praised the guide instead of
informing the reader. The root cause was structural: a slot whose only job is
personality produces fake personality, on schedule. So the slot's job changed:

- **Write a descriptor ONLY where the literal label cannot carry the meaning** — in
  practice, trip-specific groups a stranger wouldn't parse ("Daejeon & MSI" → "The MSI
  weekend in Daejeon"). Standard groups (Plan, Transit, Days, Sights, Food, Sources,
  Essentials) get NONE: without a descriptor the chapter opener derives its subtitle
  from the group's real section titles — actual data, no invented copy, and already
  the register real travel sites use.
- **Flat statement of fact, in words a stranger would use.** The test: *would
  Wikivoyage write this sentence?* Banned by name: the em-dash quip pivot, the
  triplet-list-plus-tail rhythm, self-referential praise ("the receipts", "kept in
  sync", "without friction"), and any line that would work as ad copy.
- **If the derived subtitle already says it, write nothing.** An absent descriptor is
  the honest-blank rule working, not a gap.

**Mechanics (R5, shipped 2026-07-28):** descriptors live in `_guide.json` as a
`descriptors` record keyed by EXACT group name — the schema rejects a key no section
uses, so renaming a group without moving its descriptor fails the build instead of
silently dropping the line. And a descriptor may only assert what the guide actually
contains — grep the group file for every claim word BEFORE writing it. Two real
catches prove the rule earns its keep: "the rain plan" was cut because no rain plan
existed in that group, and a drafted "GO Fest Seoul" was corrected to the "GO Fest
Global" the content actually names.

### Voice gate — banned in traveler-facing prose (P6, shipped 2026-07-29)

Provenance belongs in `verified_on`, `source_url`, `⚠` flags, and the
`intro` field — never narrated into the prose a traveler reads. The verify
grep gate (`scripts/verify-guide.mjs`) fails on any of these in a `body`,
`why`, `crowd_tip`, or `intro` field:

- **Process language**: "this pass", "this research", "this review",
  "our research", "our pass", "during research"
- **Self-referential framing**: "honest note", "honest call-out",
  "worth flagging", "worth noting that", "disproved claim"
- **Quality claims**: "a generic guide couldn't", "a generic AI",
  "no generic guide", "only a local would know"

These phrases are the research log leaking into the product. The fix is
always the same: delete the frame, keep the fact, let `⚠` / `verified_on`
carry the provenance silently. Example:

  ✗ "Honest note: Ichiran is overpriced by local reckoning."
  ✓ "Ichiran is overpriced by local reckoning."

  ✗ "This research confirmed Daruma is the top pick."
  ✓ (just state the recommendation; verified_on carries the date)

## Composer facets (R6, shipped 2026-07-28)

Research passes may tag any section with three optional facets — they feed
`scripts/compose-guide.mjs` (which assembles tabs deterministically) and are read by
NO renderer:

- `theme` — the content theme this unit belongs to (defaults to its current group, so
  untagged content composes to itself). Tag it when a unit's true theme differs from
  the group it happens to sit in.
- `phase` — `before | arrival | daily | leaving`: when the traveler needs it. This is
  what routes a unit when its group folds (before/arrival/leaving → Plan, daily → Days),
  so tagging phase on thin groups is how you steer a future fold honestly.
- `rank` — the theme's position in the intake's ranked priorities (1 = top). A top-2
  theme with real weight earns an anchor tab and budget immunity.

Weight is never written — it is derived from item counts + prose length, so it cannot
drift from the content. Composition auto-applies to a draft exactly ONCE per pass — after
the networked verify PASS, before graduation (the done gate's `compose-guide.mjs --write`
moment); LIVE guides only ever receive a printed proposal for the creator to sign
(`--write --creator-signed`). Tag facets during research; never retro-tag a live guide
just to force a recomposition without the creator asking.

## Cover art (R4, shipped 2026-07-28) — photo is earned, footage is signed

Every guide is born covered: the **Painted Atlas** (seeded terrain in the guide's accent
under a destination-local-time sky) renders automatically whenever no photo is set. It is
the honest default, not a failure state — never force a mediocre or wrong-place photo
just to replace it.

- **Photo** (`cover.file` + credit + license + focal): set it when a signature Commons
  shot of the destination exists — filename validated via `search-commons.mjs`, never
  recalled. Direct royalty-free `cover.src` URLs are allowed (schema-enforced credit +
  license). A real photo also feeds `extract-palette` (the guide's identity accent).
- **Honesty rule (R18):** a cover photo must honestly represent what the traveler
  will see — right destination, right season, right visual identity. A cherry-blossom
  cover on an autumn trip, a summer beach on a winter itinerary, or a landmark the
  trip doesn't visit is dishonest framing, even if it's a beautiful shot. When no
  seasonally-honest Commons photo exists, the Painted Atlas is the right cover —
  it's abstract, not misleading.
- **Footage** (`cover.video`) — research NEVER sets this field. The rule is geography:
  a clip must be frame-verified to show the actual place (the Korea clip was frame-checked
  as the same Gyeongbokgung complex as its photo cover), and a research agent cannot watch
  video. Research runs the **footage scout** instead: 0–2 candidates recorded in the
  intake doc's `## Cover art — footage candidates` table — stable-URL libraries only
  (Mixkit `assets.mixkit.co/videos/{id}/{id}-720.mp4` hot-links cleanly; Coverr exposes
  only ephemeral temp-URLs, forbidden), each with license, what it claims to show, and
  whether that matches the cover photo's location. The creator frame-verifies and signs
  before `cover.video` ever lands. An empty table is a fine outcome.
