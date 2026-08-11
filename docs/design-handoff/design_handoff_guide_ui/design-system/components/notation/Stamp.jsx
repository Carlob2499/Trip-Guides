import React from "react";

/* The workhorse of the notation layer: check dates, source links, plate captions,
   datum labels. Boxed in 1px of its OWN ink, square, uppercase. */
export function Stamp({ tone = "accent", children, style, ...rest }) {
  const ink = { accent: "var(--aink)", muted: "var(--muted)", green: "var(--green)", ochre: "var(--ochre)", crit: "var(--crit)" }[tone] || "var(--aink)";
  return (
    <span {...rest} style={{
      display: "inline-flex", alignItems: "center", width: "fit-content", maxWidth: "100%",
      font: "var(--t-stamp-weight,640) var(--t-stamp-size,.82rem)/1.35 var(--fs)",
      letterSpacing: "var(--t-stamp-ls,.08em)", textTransform: "uppercase",
      color: ink, border: "1px solid currentColor", borderRadius: "var(--r-none,0px)",
      padding: "3px 8px", ...style
    }}>{children}</span>
  );
}
