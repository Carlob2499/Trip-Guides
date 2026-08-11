import React from "react";
import { Reading } from "../notation/Reading.jsx";
import { Stamp } from "../notation/Stamp.jsx";

/* The line beneath a masthead: 2px oxide top border, the trip's cities at Reading
   scale and its next leg (R5 — R4 spent this on coordinates and a plate number),
   the plate stamp, the fact and source counts, and PRINT SHEET. Anything the guide
   does not carry renders nothing — an unresearched guide's plate line can be
   shorter, never padded. */
export function PlateLine({ reading, note, stamp, meta, style, ...rest }) {
  return (
    <div {...rest} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderTop: "2px solid var(--accent)", padding: "11px 0 12px", ...style }}>
      {reading && <Reading style={{ font: "600 clamp(1.3rem,3vw,2.2rem)/1 var(--fd)", letterSpacing: "-.02em" }}>{reading}</Reading>}
      {note && <span style={{ font: "700 11px/1 var(--fs)", letterSpacing: ".14em", color: "var(--aink)", whiteSpace: "nowrap" }}>{note}</span>}
      {stamp && <Stamp tone="muted">{stamp}</Stamp>}
      {meta && <span style={{ marginLeft: "auto", font: "400 11px/1 var(--fs)", color: "var(--muted)" }}>{meta}</span>}
    </div>
  );
}
