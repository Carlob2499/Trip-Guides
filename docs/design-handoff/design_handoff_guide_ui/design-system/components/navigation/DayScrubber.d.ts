import * as React from "react";
/** The trip's days, fitted to the width. The active day expands to keep its date. */
export interface DayScrubberProps extends React.HTMLAttributes<HTMLDivElement> {
  days?: Array<number | { n: number; label?: string; state?: "done" | "now" | "next" | "planned" }>;
  value?: number;
  onChange?: (n: number) => void;
}
export declare function DayScrubber(props: DayScrubberProps): React.JSX.Element;
