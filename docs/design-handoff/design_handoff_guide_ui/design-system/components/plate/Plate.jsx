import React from "react";

/* Photography enters the product in exactly one way: mounted as a plate. Square,
   seated on the sunken surface, 1px --rule2 frame, 2px oxide corner ticks at all
   four corners. Evidence goes DOWN into the sheet, never floats above it.

   No scrim, no graticule, and type never sits on the photograph. */
export function Plate({ src, alt = "", caption, minHeight = "clamp(300px, 50vh, 540px)", children, style, ...rest }) {
  const tick = (pos) => {
    const [v, h] = pos.split("-");
    return {
      position: "absolute", width: "var(--tick-arm,16px)", height: "var(--tick-arm,16px)",
      [v]: -1, [h]: -1,
      [`border${v === "top" ? "Top" : "Bottom"}`]: "var(--tick-weight,2px) solid var(--accent)",
      [`border${h === "left" ? "Left" : "Right"}`]: "var(--tick-weight,2px) solid var(--accent)"
    };
  };
  return (
    <figure {...rest} style={{ position: "relative", margin: 0, minHeight, background: "var(--sunken)", border: "var(--rw,1px) solid var(--rule2)", borderRadius: "var(--r-none,0px)", overflow: "hidden", ...style }}>
      {src
        ? <img src={src} alt={alt} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", opacity: "var(--photo,1)" }} />
        : <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(58deg,#b9bfae 0 3px,#c6ccbc 3px 7px)", opacity: "var(--photo,1)" }} />}
      {children}
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((p) => <span key={p} aria-hidden="true" style={tick(p)} />)}
      {caption && (
        <figcaption style={{ position: "absolute", left: 14, bottom: 13, background: "var(--card)", color: "var(--muted)", padding: "5px 8px", font: "var(--t-label-weight,640) var(--t-label-size,.66rem)/1 var(--fs)", letterSpacing: "var(--t-label-ls,.16em)", textTransform: "uppercase" }}>{caption}</figcaption>
      )}
    </figure>
  );
}
