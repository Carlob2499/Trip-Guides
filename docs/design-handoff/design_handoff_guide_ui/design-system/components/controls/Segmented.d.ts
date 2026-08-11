import * as React from "react";
/** Mutually exclusive choices in one pill. Two to four; more than four is a rail. */
export interface SegmentedProps extends React.HTMLAttributes<HTMLDivElement> {
  options?: Array<string | { value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
}
export declare function Segmented(props: SegmentedProps): React.JSX.Element;
