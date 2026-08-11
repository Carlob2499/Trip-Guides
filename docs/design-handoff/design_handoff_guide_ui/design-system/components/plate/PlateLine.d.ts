import * as React from "react";
/** The masthead's plate line. Coordinates are structure, not decoration — never shrink them to a caption. */
export interface PlateLineProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The largest non-title type on the screen — coordinates, or the trip's cities. */
  reading?: string;
  /** The one actionable thing you would want off this line mid-trip, e.g. "Next: KTX 08:30 → Daejeon". */
  note?: string;
  /** A boxed check stamp. */
  stamp?: string;
  /** Counts and controls, pushed right. */
  meta?: string;
}
export declare function PlateLine(props: PlateLineProps): React.JSX.Element;
