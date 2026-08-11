import React from "react";

/* The phone's command layer: two promoted content groups, then JOURNEY, then TOOLS.
   Slots come from THIS DEVICE's own open counts in localStorage — never telemetry,
   which is a write-only cross-visitor aggregate; a stranger's average is not this
   traveller's habit.

   Two rules make it honest: the CURRENT group always holds a slot, so the bar can
   never show a set that excludes where the reader is; and an unopened group has no
   count at all, so ranking falls back to the guide's own order rather than
   inventing a preference. */
export function ThumbBar({ slots = [], value, onSelect, style, ...rest }) {
  return (
    <nav {...rest} aria-label="Quick navigation" style={{
      position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 50,
      display: "grid", gridTemplateColumns: `repeat(${slots.length || 4}, 1fr)`,
      background: "var(--card)", borderTop: "var(--rw,1px) solid var(--rule2)",
      paddingBottom: "max(10px, var(--safe-bottom))", ...style
    }}>
      {slots.map((s) => {
        const name = typeof s === "string" ? s : s.name;
        const label = typeof s === "string" ? s : (s.label || s.name);
        const on = name === value;
        return (
          <button key={name} type="button" onClick={() => onSelect && onSelect(name)}
            aria-current={on ? "true" : undefined} aria-label={name}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
              minHeight: "var(--tap-lg,52px)", border: 0, background: "transparent", cursor: "pointer"
            }}>
            <span aria-hidden="true" style={{ display: "block", width: on ? 9 : 7, height: on ? 9 : 7, borderRadius: "var(--r-pill,999px)", background: on ? "var(--accent)" : "var(--rule2)" }} />
            <span style={{ font: (on ? "700" : "600") + " 10px/1 var(--fs)", letterSpacing: ".08em", textTransform: "uppercase", color: on ? "var(--ink)" : "var(--muted)" }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
