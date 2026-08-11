import * as React from "react";
/**
 * The guide's navigation. Groups are stations on one line; the current station is
 * filled oxide with a halo. Replaces R4's tab-pill rail.
 *
 * @startingPoint section="Waypoint" subtitle="Groups as stations on one journey line" viewport="700x120"
 */
export interface SpineRailProps extends React.HTMLAttributes<HTMLElement> {
  /** Group names in the guide's own order. Tools is the last station. */
  stations?: Array<string | { name: string }>;
  value?: string;
  onChange?: (name: string) => void;
  /** "horizontal" on desktop and tablet; "vertical" inside the phone's journey sheet. */
  orientation?: "horizontal" | "vertical";
}
export declare function SpineRail(props: SpineRailProps): React.JSX.Element;
