import React from "react";

/* ≈ approx. / ⚠ unconfirmed. Control size or larger, ALWAYS — a tappable flag
   below control size is unusable on the device this is read on. */
export function FlagChip({ kind = "approx", label, onClick, style, ...rest }) {
  const map = { approx: { glyph: "≈", text: "approx.", ink: "var(--ochre)" }, unconfirmed: { glyph: "⚠", text: "unconfirmed", ink: "var(--ochre)" }, checked: { glyph: "✓", text: "checked", ink: "var(--green)" } };
  const m = map[kind] || map.approx;
  const Tag = onClick ? "button" : "span";
  return (
    <Tag {...rest} type={onClick ? "button" : undefined} onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, minHeight: 32, padding: "0 12px",
      border: "1px solid currentColor", borderRadius: "var(--r-pill,999px)", background: "transparent",
      color: m.ink, cursor: onClick ? "pointer" : "default",
      font: "var(--t-control-weight,640) var(--t-control-size,.75rem)/1 var(--fs)",
      letterSpacing: "var(--t-control-ls,.08em)", textTransform: "uppercase", ...style
    }}>
      <span aria-hidden="true">{m.glyph}</span>{label || m.text}
    </Tag>
  );
}
