import * as React from "react";

/**
 * The one repeated container unit. Every card in the product is a Panel.
 *
 * @startingPoint section="Waypoint" subtitle="The repeated container every card is built from" viewport="700x260"
 */
export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  /** Names the KIND of thing inside — FIELD NOTE, LEDGER, SETTLE UP. The only thing visible when collapsed. */
  kicker?: string;
  /** The panel's own title, in Literata at a fixed 1.45rem. */
  title?: string;
  /** Collapsed panels show kicker + toggle only, and must sort AFTER open ones in the grid. */
  collapsed?: boolean;
  /** Span the full grid row. True for sights, venues, days, budget, maps, and lists over five items. */
  span?: boolean;
  /** Show the ⠿ drag handle. Order persists per scope (guide slug + section group). */
  draggable?: boolean;
  /** Collapse toggle. Omit for a panel that cannot collapse. */
  onToggle?: () => void;
  /** A boxed check stamp at the panel's foot, e.g. "✓ checked 18 jul 2026". */
  stamp?: string;
  children?: React.ReactNode;
}

export declare function Panel(props: PanelProps): React.JSX.Element;
