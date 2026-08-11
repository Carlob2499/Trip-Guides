import * as React from "react";
/**
 * A photograph mounted as a survey plate — the ONLY way imagery enters the product.
 * This is also the shared element that morphs from hub card to guide masthead (850ms FLIP).
 *
 * @startingPoint section="Waypoint" subtitle="Photography mounted, corner-ticked, captioned" viewport="700x320"
 */
export interface PlateProps extends React.HTMLAttributes<HTMLElement> {
  /** Omit to render the striped placeholder — better than a bad attempt at the real thing. */
  src?: string;
  alt?: string;
  /** The credit line, at Label size on a --card ground. Never set on the photograph itself. */
  caption?: string;
  minHeight?: string;
  children?: React.ReactNode;
}
export declare function Plate(props: PlateProps): React.JSX.Element;
