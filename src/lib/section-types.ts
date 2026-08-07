/* Section-type sets shared by the renderer and the schema — one home, so the two
   can't drift (Atlas Phase 2). */

/** Types that render inside a shared card container (Block.astro's `carded` — the set
    a Panel can host). */
export const CARDED_TYPES = new Set([
  "panel", "prose", "list", "routes", "map", "budget", "raids", "habitats", "infogrid", "tierlist",
]);

/** Types that emit their own per-item `.card` siblings instead of one shared card.
    The design settles what this means for Panels: wide types "are internally gridded
    already" (DESIGN.md, Wide types claim the full row) — so the SECTION is the Panel
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
    content happens to be inside (Panel.astro's contract). budget is the one tabular
    type in play — a cost table needs the row, a prose column does not. The own-cards
    types join it because each is internally gridded: squeezing a sight grid or a day
    rail into one column of the panel grid would nest a grid inside a column that is
    already too narrow for its own minmax floor. */
export const FULL_WIDTH_PANEL_TYPES = new Set(["budget", ...OWN_CARDS_TYPES]);
