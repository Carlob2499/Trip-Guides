/* Section-type sets shared by the renderer and the schema — one home, so the two
   can't drift (Atlas Phase 2). */

/** Types that render inside a shared card container (Block.astro's `carded` — the set
    a Panel can host). days/sights/venues render their own per-item cards and stay
    outside Panels until their own phase. */
export const CARDED_TYPES = new Set([
  "panel", "prose", "list", "routes", "map", "budget", "raids", "habitats", "infogrid", "tierlist",
]);

/** Types a Panel can host: the carded set plus the two data-driven blocks that render
    their own hide-on-empty wrapper (weather's client fetch, holidays' build-time file).
    They are NOT carded — in the legacy path they own their title and vanish whole when
    empty — so hosting them relies on the Panel-side contract instead: the block keeps
    its hidden wrapper and the panel silo's CSS hides the entire Panel around it
    (.pnl:has(.wx-wrap[hidden]) etc.), title included — no orphaned heading either way. */
export const PANEL_HOSTABLE_TYPES = new Set([...CARDED_TYPES, "weather", "holidays"]);

/** Panel `fullWidth` is a property of a section's TYPE, never inferred from how much
    content happens to be inside (Panel.astro's contract). budget is the one tabular
    type in play — a cost table needs the row, a prose column does not. */
export const FULL_WIDTH_PANEL_TYPES = new Set(["budget"]);
