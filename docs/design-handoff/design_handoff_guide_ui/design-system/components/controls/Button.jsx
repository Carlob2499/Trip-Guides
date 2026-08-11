import React from "react";

/* Anything you press is a pill. Press deepens the fill and flips the ink — no
   shrink, no bounce, and it survives reduced motion because press is state. */
export function Button({ variant = "primary", size = "md", children, style, ...rest }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    minHeight: size === "lg" ? "var(--tap-lg,52px)" : size === "sm" ? 36 : "var(--tap,44px)",
    padding: size === "lg" ? "0 26px" : size === "sm" ? "0 15px" : "0 20px",
    borderRadius: "var(--r-pill,999px)", cursor: "pointer",
    font: "var(--t-control-weight,640) var(--t-control-size,.75rem)/1 var(--fs)",
    letterSpacing: "var(--t-control-ls,.08em)", textTransform: "uppercase"
  };
  const skin = {
    primary: { background: "var(--accent)", color: "var(--on-aink)", border: 0 },
    secondary: { background: "transparent", color: "var(--ink)", border: "1px solid var(--rule2)" },
    quiet: { background: "transparent", color: "var(--muted)", border: 0 },
    critical: { background: "transparent", color: "var(--crit)", border: "1px solid var(--crit)" }
  }[variant];
  return <button {...rest} type={rest.type || "button"} style={{ ...base, ...skin, ...style }}>{children}</button>;
}
