/* Section-type sets shared by the renderer and the schema — one home, so the two
   can't drift (Atlas Phase 2). */

/** Types that render inside a shared card container (Block.astro's `carded` — the set
    a Panel can host). days/sights/venues render their own per-item cards and stay
    outside Panels until their own phase. */
export const CARDED_TYPES = new Set([
  "panel", "prose", "list", "routes", "map", "budget", "raids", "habitats", "infogrid", "tierlist",
]);

/** Panel `fullWidth` is a property of a section's TYPE, never inferred from how much
    content happens to be inside (Panel.astro's contract). budget is the one tabular
    type in play — a cost table needs the row, a prose column does not. */
export const FULL_WIDTH_PANEL_TYPES = new Set(["budget"]);
