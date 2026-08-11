import * as React from "react";
/**
 * The phone's four-slot command layer. Wire it to mobile-nav/model/rank.ts — do not
 * re-derive the ranking, and never hard-code the slots.
 *
 * @startingPoint section="Waypoint" subtitle="Four thumb slots, ranked from this device's own habits" viewport="402x90"
 */
export interface ThumbBarProps extends React.HTMLAttributes<HTMLElement> {
  /** Output of rank.ts: two promoted groups, then JOURNEY, then TOOLS. */
  slots?: Array<string | { name: string; label?: string }>;
  value?: string;
  onSelect?: (name: string) => void;
}
export declare function ThumbBar(props: ThumbBarProps): React.JSX.Element;
