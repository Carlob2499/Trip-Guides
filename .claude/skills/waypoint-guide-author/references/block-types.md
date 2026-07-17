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

**Group (tab) budget — ≤10 groups per guide.** Merge before adding:
`Essentials` holds money/health/etiquette-type sections; same-audience
event content shares one group. A group name is a nav label (short, no
" & " chains where avoidable); the section `title` carries the identity.
New guides start from: Plan · Essentials · Getting around · Itinerary ·
Sights · Food & shopping · References, adding at most 3 trip-specific
groups.

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

## Quick decision table

| You have… | Use | Why |
|---|---|---|
| Reference info + a to-do list (bookings, packing, when-you-land steps) | `panel` | body + `checklist[]` — checklist items render as persisted checkboxes |
| Narrative/explanatory writing (what to eat, etiquette, neighborhood character) | `prose` | plain body, allowlist tags only |
| A pure check-off list, no narrative (caught-tracker, to-confirm list) | `list` | `items[]` of strings, each a persisted checkbox |
| Step-by-step transit/route directions | `routes` | ordered `steps[]`, numbered, each checkable |
| A location to show on a map (+ named points for taxis) | `map` | OSM embed from `center`/`span`; `points[]` for named places |
| Live weather for the trip | `weather` | no config — reads coords from the guide's FIRST `map` section at runtime; hides if none |
| Public holidays / closure risk | `holidays` | build-time Nager.Date data by country + trip year; hides if no data file |
| The day-by-day itinerary | `days` | one item per day: date, title, pace, body, checklist, energy |
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
  genuinely is. `constraints` are strings like "Closed Mondays".
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

## Placement conventions

- `group` values become the guide's nav tabs — reuse the established ones where they
  fit (Plan · Money & budget · Health & safety · Etiquette & language · Getting
  around · Itinerary · Sights · Food & shopping · References) plus trip-specific
  groups (e.g. an event tab). Keep a new group only if the content genuinely doesn't
  belong in an existing tab.
- The canonical closing section is a `prose` titled "Sources & further reading" in
  group `References`.
- Leave `map` / `weather` / `holidays` sections intact when editing — they're wired
  to live data, and the weather block depends on the first `map`'s coords.
