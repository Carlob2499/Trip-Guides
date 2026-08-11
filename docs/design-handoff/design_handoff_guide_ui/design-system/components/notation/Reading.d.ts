import * as React from "react";
/** Notation at heading scale — coordinates, totals, gaps. Tabular numerals, floors at 24px. */
export interface ReadingProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "accent" | "ink" | "ochre" | "green" | "crit";
  children?: React.ReactNode;
}
export declare function Reading(props: ReadingProps): React.JSX.Element;
