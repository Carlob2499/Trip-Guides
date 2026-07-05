# Block Types — when to use each of the 14 section kinds

Extracted from the schema comments in `src/content.config.ts` (the source of truth —
every field you write must validate against it; when in doubt, read it). A guide is
`{ kicker?, title, dek?, footer?, country, theme?, verified?, draft?, intro?, sections[] }`
and every section carries `type`, `group` (the nav-tab category label), and usually
`title`.

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

## Per-type notes (fields beyond the obvious)

- **`panel`** — `{ group, title?, body?, checklist?[] }`. The workhorse for Plan-tab
  reference cards ("When you land", "Booking checklist", "Local essentials").
- **`prose`** — `{ group, title?, body? }`. If you're tempted to put `<table>`,
  `<details>`, or layout `<br/>` in a body, stop: pick a typed section instead.
- **`list`** — `{ group, title?, items[] }`. Items may contain inline allowlist HTML.
- **`routes`** — `{ group, title?, steps[] }`. Steps are HTML strings; use
  single-quoted `href='…'` attributes (repo JSON convention), name the specific
  service (`<b>M2</b>`, bus `<b>707</b>`), give `≈` times/fares.
- **`map`** — `{ center:{lat,lng}, span?, points?[] }`. Each point:
  `{ name, lat, lng, place_id?, local_script_name? }`. `place_id` is
  verified-or-flagged, never guessed — an unverified value is the literal string
  `__VERIFICATION_REQUIRED__`. `local_script_name` carries the native-script name
  for taxi/local display. Coords come from `scripts/lookup-place.mjs`, not memory.
- **`weather`** — `{ group, title?, note? }` only. Needs a `map` section somewhere in
  the guide to source coords; otherwise it stays hidden. Don't invent coords for it.
- **`holidays`** — `{ group, title?, note?, year? }`. Country comes from the guide's
  `country` via the ISO map; dates from the `days` section. `year` optional
  (defaults to the derived trip year).
- **`days`** — items `{ date, title, pace?, note?, body?, fit?, checklist?[],
  constraints?[], energy }`. `date` is a label like `"Wed Jul 8"`; `pace` is a
  free-text schedule narrative (NOT a strenuousness rating); `energy` is the enum
  `packed | balanced | slow` (defaults to `balanced`) that drives the Low-Energy
  toggle — only tag `packed` when the day genuinely is. `body` is HTML;
  `constraints` are strings like "Closed Mondays".
- **`sights`** — items `{ name, kicker?, body?, img?:{file, alt?}, map?:{lat,lng} }`.
  `img.file` is an exact Wikimedia Commons `File:` page filename confirmed to exist
  (use `scripts/search-commons.mjs`); if unsure, omit the image entirely.
- **`budget`** — `{ intro?, currency?, days?, party?, items[] }`. `party` must be a
  positive integer (the per-person view divides by it). Items:
  `{ label, basis: "day"|"trip", est, low?, high?, category?, per?: "person"|"group",
  note?, split_type?, payment_preference? }`. `est` is a number in the guide's
  currency — never a string, never a sentinel.
- **`habitats`** — `windows[]`: `{ day, time, name, types?[], raids?[], targets?[],
  mega?, tip? }`. `targets` render highlighted (the must-dos); `tip` is a short
  tactical footnote (weakness, pass budget); prefix a chip with `✨` for
  shiny-eligible.
- **`infogrid`** — `cards[]`: `{ icon?, label, body? }`. One emoji/glyph icon, a
  short heading, one clause of detail (inline `<b>`, `<a>` allowed in body).
- **`tierlist`** — `tiers[]`: `{ tier, icon?, chips[], hot?[], body? }`. `hot` lists
  chip texts to render highlighted; `✨` prefix marks shiny-eligible; `body` is a 1–2
  line elaboration.
- **`raids`** — `bosses[]`: `{ name, tier: "3-star"|"5-star"|"primal"|"shadow"|
  "super-mega", typing[], shiny_odds, shiny_note?, trainers, note?, strategy,
  counters[] (1–10 of { pokemon, fast, charged, typing }) }`. `strategy` allows
  inline `<b>`, `<a>` only.

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
