import React from "react";

/* A 1em circle after any resolved perishable fact. It IS a button: it takes focus,
   has a 44px effective target through padding, and opens on CLICK, not hover —
   hover-only provenance is unusable on a phone. */
export function ProvenanceDot({ onClick, label = "Show where this came from", style, ...rest }) {
  return (
    <button {...rest} type="button" onClick={onClick} aria-label={label} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "1em", height: "1em", padding: 0, margin: "0 .25em",
      border: "1px solid var(--rule2)", borderRadius: "var(--r-pill,999px)",
      background: "transparent", cursor: "pointer", verticalAlign: "baseline",
      boxShadow: "0 0 0 12px transparent", ...style
    }} />
  );
}
