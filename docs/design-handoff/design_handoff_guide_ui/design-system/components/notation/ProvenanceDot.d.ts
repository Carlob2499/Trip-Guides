import * as React from "react";
/** The inline mark after a perishable fact. Opens the popover on click — never on hover. */
export interface ProvenanceDotProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name. Default "Show where this came from". */
  label?: string;
}
export declare function ProvenanceDot(props: ProvenanceDotProps): React.JSX.Element;
