/* Section-type sets shared by the renderer and the schema — one home, so the two
   can't drift (Atlas Phase 2). */

/** Types that render inside a shared card container (Block.astro's `carded` — the set
    a Panel can host). */
export const CARDED_TYPES = new Set([
  "panel", "prose", "list", "routes", "map", "budget", "raids", "habitats", "infogrid", "tierlist",
]);

/** Types that emit their own per-item `.card` siblings instead of one shared card.
    The design settles what this means for Panels: wide types "are internally gridded
    already" (docs/design-handoff/DESIGN.md, Wide types claim the full row) — so the SECTION is the Panel
    and its items are plain cards in the body, never Panels themselves. They are not
    carded and they render no title of their own, so the Panel supplies it with no
    `bare` prop needed. The item grid lives on `.pnl-body-in`, not on the Panel: a
    hosting Panel also carries `.block`, so a `.block:has(.sight)` grid rule would
    make `pnl-head`/`pnl-body` its grid items and break the chrome. */
export const OWN_CARDS_TYPES = new Set(["sights", "venues", "days", "divergences"]);

/** Types a Panel can host: the carded set, the own-cards set, plus the two data-driven
    blocks that render their own hide-on-empty wrapper (weather's client fetch,
    holidays' build-time file). Those two are NOT carded — in the legacy path they own
    their title and vanish whole when empty — so hosting them relies on the Panel-side
    contract instead: the block keeps its hidden wrapper and the panel silo's CSS hides
    the entire Panel around it (.pnl:has(.wx-wrap[hidden]) etc.), title included — no
    orphaned heading either way. */
export const PANEL_HOSTABLE_TYPES = new Set([
  ...CARDED_TYPES, ...OWN_CARDS_TYPES, "weather", "holidays",
]);

/** Panel `fullWidth` is a property of a section's TYPE, never inferred from how much
    content happens to be inside (Panel.astro's contract) — with ONE design-sanctioned
    exception, applied at Block.astro's call site because item count is data a type set
    cannot see: a `list` over five items spans full width too.

    This is docs/design-handoff/DESIGN.md's wide set exactly ("Wide types claim the full row … they are
    internally gridded already"): the tabular and internally-gridded types — a ledger,
    a sights grid, a day rail, an infogrid — need the row; a prose column does not.
    Squeezing one into a single panel-grid column nests a grid inside a column already
    too narrow for its own minmax floor. */
export const FULL_WIDTH_PANEL_TYPES = new Set([
  "budget", "map", "infogrid", "habitats", "raids", "tierlist", ...OWN_CARDS_TYPES,
]);

/** The type kicker every hosted Panel leads with — the KIND of thing inside, and the
    only body-level label still visible once a Panel is collapsed, so it must never
    just restate the title. Rendered in var(--aink), never raw var(--accent): docs/design-handoff/DESIGN.md
    flagged "the 10px oxide panel kicker on --card" as an unverified pairing, and --aink
    is the >=4.5:1-by-construction answer to it (src/lib/accent-tokens.ts). */
/* A knowledge module's kind, as the Panel kicker names it (design-system.md §10): the module's
   own kind outranks its section type on the label, so "How to" reads as How to, not FIELD NOTE. */
export const MODULE_KIND_LABELS: Record<string, string> = {
  howto: "HOW TO", transit: "TRANSIT", etiquette: "ETIQUETTE", arrival: "ARRIVAL", culture: "CULTURE", food: "FOOD", practical: "PRACTICAL",
};
export const KICKER_LABELS: Record<string, string> = {
  panel: "FIELD NOTE",
  prose: "FIELD NOTE",
  list: "CHECKLIST",
  routes: "ROUTES",
  map: "MAP",
  budget: "LEDGER",
  days: "ITINERARY",
  sights: "SIGHTS",
  venues: "VENUES",
  raids: "RAIDS",
  habitats: "HABITATS",
  infogrid: "AT A GLANCE",
  tierlist: "PRIORITIES",
  divergences: "WHAT WE FOUND",
  weather: "WEATHER",
  holidays: "HOLIDAYS",
};
