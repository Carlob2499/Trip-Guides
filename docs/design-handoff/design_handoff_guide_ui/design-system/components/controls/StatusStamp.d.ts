import * as React from "react";
/** A trip's state, as a word inside a box. Never a bare coloured dot. */
export interface StatusStampProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: "complete" | "progress" | "upcoming";
  children?: React.ReactNode;
}
export declare function StatusStamp(props: StatusStampProps): React.JSX.Element;
