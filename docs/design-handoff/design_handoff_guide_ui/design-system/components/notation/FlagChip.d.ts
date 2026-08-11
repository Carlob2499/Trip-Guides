import * as React from "react";
/** A tappable hedge — ≈ approximate, ⚠ unconfirmed, ✓ checked. Never below Control size. */
export interface FlagChipProps extends React.HTMLAttributes<HTMLElement> {
  kind?: "approx" | "unconfirmed" | "checked";
  /** Overrides the default word. The glyph stays. */
  label?: string;
  /** Makes it a button — opens the provenance popover. */
  onClick?: () => void;
}
export declare function FlagChip(props: FlagChipProps): React.JSX.Element;
