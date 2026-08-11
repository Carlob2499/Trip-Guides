import React from "react";

/* Two to four mutually exclusive choices in one pill. The permanent WORLD | TABLE
   switch is this component — the plain surface is always one tap away. */
export function Segmented({ options = [], value, onChange, style, ...rest }) {
  return (
    <div {...rest} role="tablist" style={{ display: "inline-flex", border: "1px solid var(--rule2)", borderRadius: "var(--r-pill,999px)", overflow: "hidden", ...style }}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        const on = v === value;
        return (
          <button key={v} type="button" role="tab" aria-selected={on} onClick={() => onChange && onChange(v)}
            style={{
              minHeight: "var(--tap,44px)", padding: "0 17px", border: 0, cursor: "pointer",
              background: on ? "var(--accent)" : "transparent",
              color: on ? "var(--on-aink)" : "var(--muted)",
              font: "var(--t-control-weight,640) var(--t-control-size,.75rem)/1 var(--fs)",
              letterSpacing: "var(--t-control-ls,.08em)", textTransform: "uppercase"
            }}>{label}</button>
        );
      })}
    </div>
  );
}
