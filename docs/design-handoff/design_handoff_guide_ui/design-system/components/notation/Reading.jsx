import React from "react";

/* Coordinates, totals, dates and measurements at heading scale. Tabular, floors
   at 24px. Coordinates are structure, not decoration — they are the largest
   non-title type on a masthead. */
export function Reading({ tone = "accent", children, style, ...rest }) {
  const ink = { accent: "var(--aink)", ink: "var(--ink)", ochre: "var(--ochre)", green: "var(--green)", crit: "var(--crit)" }[tone] || "var(--aink)";
  return (
    <span {...rest} style={{
      font: "var(--t-reading-weight,640) var(--t-reading-size,clamp(1.5rem,1.2rem + 2.4vw,2.6rem))/1.1 var(--fs)",
      letterSpacing: "var(--t-reading-ls,.01em)", fontVariantNumeric: "tabular-nums", color: ink, ...style
    }}>{children}</span>
  );
}
