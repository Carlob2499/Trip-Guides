import * as React from "react";
/** A dated or sourced mark, boxed in 1px of its own ink. Square, uppercase, Source Sans 3. */
export interface StampProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Which ink the stamp and its box take. Default "accent". */
  tone?: "accent" | "muted" | "green" | "ochre" | "crit";
  children?: React.ReactNode;
}
export declare function Stamp(props: StampProps): React.JSX.Element;
