import React from "react";
import { Reading } from "./Reading.jsx";

/* Honest absence. Never styled down to look less alarming than it is, and never
   collapsed by default. The product's entire claim rests on this being as loud
   as a fact. */
export function GapBlock({ heading = "⚠ NOT CONFIRMED", body, whatToDo, style, ...rest }) {
  return (
    <div {...rest} style={{ border: "2px solid var(--ochre)", borderRadius: "var(--r-none,0px)", background: "var(--card)", padding: "14px 16px 16px", ...style }}>
      <Reading tone="ochre">{heading}</Reading>
      <div aria-hidden="true" style={{ height: 1, background: "var(--rule)", margin: "10px 0" }} />
      {body && <p style={{ margin: 0, font: "var(--t-body-weight,400) var(--t-body-size,1.02rem)/1.6 var(--fd)", color: "var(--muted)", textWrap: "pretty" }}>{body}</p>}
      {whatToDo && (
        <p style={{ margin: "11px 0 0", font: "var(--t-stamp-weight,640) var(--t-stamp-size,.82rem)/1.35 var(--fs)", letterSpacing: "var(--t-stamp-ls,.08em)", textTransform: "uppercase", color: "var(--ochre)" }}>{whatToDo}</p>
      )}
    </div>
  );
}
