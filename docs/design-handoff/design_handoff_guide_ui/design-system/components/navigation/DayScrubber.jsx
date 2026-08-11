import React from "react";

/* All days fit without scrolling: the active day expands to keep its date, the
   rest are numerals. A day rail you have to scroll is a day rail you cannot read
   at a glance. */
export function DayScrubber({ days = [], value, onChange, style, ...rest }) {
  return (
    <div {...rest} role="tablist" aria-label="Day" style={{ display: "flex", alignItems: "stretch", borderBottom: "var(--rw,1px) solid var(--rule)", ...style }}>
      {days.map((d) => {
        const n = typeof d === "number" ? d : d.n;
        const on = n === value;
        const label = typeof d === "number" ? null : d.label;
        const state = typeof d === "object" ? d.state : null;
        return (
          <button key={n} type="button" role="tab" aria-selected={on} onClick={() => onChange && onChange(n)}
            style={{
              flex: on ? "2 1 0" : "1 1 0", minWidth: 0,
              display: "flex", alignItems: "baseline", justifyContent: "center", gap: 5,
              minHeight: "var(--tap,44px)", padding: "0 3px", border: 0,
              borderBottom: "2px solid " + (on ? "var(--accent)" : "transparent"),
              background: "transparent", cursor: "pointer", overflow: "hidden"
            }}>
            <span style={{ font: "700 12px/1 var(--fs)", fontVariantNumeric: "tabular-nums", color: on ? "var(--ink)" : state === "done" ? "var(--muted)" : "var(--muted)" }}>{n}</span>
            {on && label && <span style={{ font: "600 12px/1 var(--fd)", color: "var(--ink)", whiteSpace: "nowrap" }}>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
