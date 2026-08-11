import React from "react";

/* COMPLETE — green outline · IN PROGRESS — oxide fill · UPCOMING — oxide outline.
   Never a coloured dot without the word; the word is the accessible carrier. */
export function StatusStamp({ status = "upcoming", children, style, ...rest }) {
  const skin = {
    complete: { color: "var(--green)", background: "transparent" },
    progress: { color: "var(--on-aink)", background: "var(--accent)" },
    upcoming: { color: "var(--aink)", background: "transparent" }
  }[status];
  const word = { complete: "Complete", progress: "In progress", upcoming: "Upcoming" }[status];
  return (
    <span {...rest} style={{
      display: "inline-flex", alignItems: "center", padding: "6px 10px",
      border: `1px solid ${status === "progress" ? "var(--accent)" : "currentColor"}`,
      borderRadius: "var(--r-none,0px)",
      font: "var(--t-stamp-weight,640) var(--t-stamp-size,.82rem)/1 var(--fs)",
      letterSpacing: "var(--t-stamp-ls,.08em)", textTransform: "uppercase", ...skin, ...style
    }}>{children || word}</span>
  );
}
