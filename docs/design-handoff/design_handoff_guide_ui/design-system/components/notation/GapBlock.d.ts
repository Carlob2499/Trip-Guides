import * as React from "react";
/**
 * The signature honest-absence state. Produced by research coming up short and saying
 * so — never generated to fill a surface. Filling one requires a sourced fact, not prose.
 *
 * @startingPoint section="Waypoint" subtitle="Honest absence, at reading scale in ochre" viewport="700x220"
 */
export interface GapBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Default "⚠ NOT CONFIRMED". */
  heading?: string;
  /** What was looked for and what was found. */
  body?: string;
  /** The actionable line — "What to do instead — call …". */
  whatToDo?: string;
}
export declare function GapBlock(props: GapBlockProps): React.JSX.Element;
