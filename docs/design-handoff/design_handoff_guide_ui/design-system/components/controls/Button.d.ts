import * as React from "react";
/** A pill. Primary is the oxide fill; critical is SOS and nothing else. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "quiet" | "critical";
  /** sm 36px · md 44px (the floor) · lg 52px for gloved or wet hands. */
  size?: "sm" | "md" | "lg";
}
export declare function Button(props: ButtonProps): React.JSX.Element;
