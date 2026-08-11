import React from "react";

/* The single repeated container. Every card in the product — guide sections, hub
   overlays, tools — is this component. A Panel is a container, never a content
   type: it holds whatever is put in it.

   Kicker before title: the kicker is the only thing visible when the panel is
   collapsed, so it must name the KIND of thing inside, not repeat the title. */
export function Panel({
  kicker,
  title,
  collapsed = false,
  span = false,
  draggable = true,
  onToggle,
  stamp,
  children,
  style,
  ...rest
}) {
  return (
    <section
      {...rest}
      style={{
        background: "var(--card)",
        border: "var(--rw,1px) solid var(--rule)",
        borderRadius: "var(--r-none, 0px)",
        padding: collapsed ? "var(--panel-pad-collapsed, 12px 16px)" : "var(--panel-pad, 16px 20px 18px)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gridColumn: span ? "1 / -1" : undefined,
        ...style
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {draggable && (
          <span data-noprint aria-hidden="true"
            style={{ minHeight: 32, display: "flex", alignItems: "center", color: "var(--muted)", cursor: "grab", font: "400 13px/1 var(--fs)" }}>⠿</span>
        )}
        {kicker && (
          <span style={{ font: "var(--t-kicker-weight,640) var(--t-kicker-size,.625rem)/1 var(--fs)", letterSpacing: "var(--t-kicker-ls,.22em)", textTransform: "uppercase", color: "var(--accent)" }}>{kicker}</span>
        )}
        {onToggle && (
          <button data-noprint type="button" onClick={onToggle}
            aria-expanded={!collapsed}
            style={{ marginLeft: "auto", minHeight: 32, minWidth: 32, border: 0, background: "transparent", color: "var(--muted)", font: "400 15px/1 var(--fs)", cursor: "pointer" }}>
            {collapsed ? "+" : "−"}
          </button>
        )}
      </header>

      {!collapsed && (
        <>
          {title && (
            <h3 style={{ margin: "4px 0 0", font: "var(--t-title-weight,500) var(--t-title-size,1.45rem)/var(--t-title-lh,1.15) var(--fd)", color: "var(--ink)" }}>{title}</h3>
          )}
          <div aria-hidden="true" style={{ height: 1, background: "var(--rule)", margin: "10px 0 12px" }} />
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
          {stamp && (
            <span style={{ marginTop: 12, width: "fit-content", maxWidth: "100%", font: "var(--t-stamp-weight,640) var(--t-stamp-size,.82rem)/1.35 var(--fs)", letterSpacing: "var(--t-stamp-ls,.08em)", textTransform: "uppercase", color: "var(--aink)", border: "1px solid currentColor", padding: "3px 8px" }}>{stamp}</span>
          )}
        </>
      )}
    </section>
  );
}
