import React from "react";

/* R5. Replaces the tab-pill rail. Every group is a station on one 2px line, the
   current one filled oxide with a halo ring. Pills carried no ordinal position;
   stations do — you can see how far through the journey you are.

   Horizontal on desktop and tablet, vertical inside the phone's journey sheet.
   Same component, one prop. */
export function SpineRail({ stations = [], value, onChange, orientation = "horizontal", style, ...rest }) {
  const vertical = orientation === "vertical";
  return (
    <nav {...rest} aria-label="Journey" style={{ position: "relative", display: "flex", flexDirection: vertical ? "column" : "row", alignItems: vertical ? "stretch" : "flex-start", justifyContent: "space-between", paddingTop: vertical ? 0 : 15, paddingLeft: vertical ? 15 : 0, ...style }}>
      <span aria-hidden="true" style={vertical
        ? { position: "absolute", top: 0, bottom: 0, left: 5, width: 2, background: "var(--rule2)" }
        : { position: "absolute", left: 0, right: 0, top: 5, height: 2, background: "var(--rule2)" }} />
      {stations.map((s) => {
        const name = typeof s === "string" ? s : s.name;
        const on = name === value;
        return (
          <button key={name} type="button" onClick={() => onChange && onChange(name)}
            aria-current={on ? "true" : undefined}
            style={{
              position: "relative", flex: vertical ? "none" : 1, minWidth: 0,
              display: "flex", flexDirection: vertical ? "row" : "column",
              alignItems: "center", gap: vertical ? 13 : 8,
              minHeight: vertical ? "var(--tap,44px)" : undefined,
              padding: vertical ? "0 0 0 14px" : "5px 3px 0",
              border: 0, background: "transparent", cursor: "pointer", textAlign: vertical ? "left" : "center"
            }}>
            <span aria-hidden="true" style={{
              position: "absolute",
              ...(vertical ? { left: -15 + 6 - (on ? 6.5 : 4.5), top: "50%", transform: "translateY(-50%)" } : { top: -15, left: "50%", transform: "translateX(-50%)" }),
              width: on ? 13 : 9, height: on ? 13 : 9, borderRadius: "var(--r-pill,999px)",
              background: on ? "var(--accent)" : "var(--bg)",
              border: "2px solid " + (on ? "var(--accent)" : "var(--rule2)"),
              boxShadow: on ? "0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent)" : "none"
            }} />
            <span style={{
              font: (on ? "700" : "400") + " 11px/1.25 var(--fs)",
              color: on ? "var(--ink)" : "var(--muted)", padding: vertical ? 0 : "0 3px"
            }}>{name}</span>
          </button>
        );
      })}
    </nav>
  );
}
