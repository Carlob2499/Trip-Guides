/* Pure ordering for the Panel grid.

   The grid never leaves dead space: when a reader collapses a Panel, the page closes up
   around it instead of holding an empty hole next to an open Panel. That is an ORDERING
   problem before it is a layout one — collapsed Panels sink below open ones, so the holes
   they would leave never sit inside the live part of the grid.

   The rules, in precedence order:
     1. full-width before column-width — a Panel's span is a property of its TYPE, declared
        in markup, never inferred from how much content happens to be inside it;
     2. open before collapsed — the two rules compose, so a collapsed full-width Panel still
        sits in the full-width band, after the open full-width ones;
     3. ties break by the scope's own declared order (`order`, the markup index today; the
        reorder ticket substitutes the reader's saved position here without touching this file).

   The sort is STABLE by construction — the comparator falls through to `order`, which the
   caller guarantees unique — so two calls over the same input always agree, and the DOM
   moves the ui layer derives from it are deterministic. */

/** One Panel as the sort sees it. `order` is the tie-break rank, unique per Panel. */
export interface PanelOrderItem {
  id: string;
  /** Declared by the Panel's type in markup — never derived from content size. */
  fullWidth: boolean;
  collapsed: boolean;
  /** The scope's declared order (markup index), or the reader's saved position. */
  order: number;
}

/** The precedence band a Panel sorts into. Exported so tests can assert the bands directly. */
export function panelRank(item: Pick<PanelOrderItem, "fullWidth" | "collapsed">): number {
  if (item.fullWidth) return item.collapsed ? 1 : 0;
  return item.collapsed ? 3 : 2;
}

/** A new sorted array — the input is never mutated. */
export function sortPanels<T extends PanelOrderItem>(items: readonly T[]): T[] {
  return items
    .slice()
    .sort((a, b) => panelRank(a) - panelRank(b) || a.order - b.order);
}
