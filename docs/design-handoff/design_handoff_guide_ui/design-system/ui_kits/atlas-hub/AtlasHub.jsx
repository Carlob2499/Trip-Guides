/* Cover → world → table. The globe itself is the real <atlas-map> canvas in the
   product (d3 + topojson, orthographic, drawn on canvas because SVG could not hold
   frame rate at this node count); here it is a labelled placeholder. */
const SHEETS = [
  ["01","DK","Denmark","Copenhagen · Aarhus","12–22 may 2026","complete"],
  ["02","KR","South Korea","Seoul · Daejeon · Busan","8–15 jul 2026","progress"],
  ["03","US","Sedona","Sedona · Flagstaff","3–9 oct 2026","upcoming"],
  ["04","JP","Japan","Tokyo · Kyoto","spring 2027","upcoming"]
];

function AtlasHub() {
  const { Button, Segmented, StatusStamp, Reading, Stamp } = window.Waypoint;
  const [screen, setScreen] = React.useState("cover");
  const [mode, setMode] = React.useState("Table");

  if (screen === "cover") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "0 max(20px, var(--safe-left))" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <span style={{ position: "relative", width: 26, height: 23, borderLeft: "13px solid transparent", borderRight: "13px solid transparent", borderBottom: "22px solid var(--accent)" }}>
            <span style={{ position: "absolute", left: -3, top: 13, width: 6, height: 6, background: "var(--bg)" }} />
          </span>
          <span style={{ font: "700 clamp(2rem,7vw,4.4rem)/1 var(--fs)", letterSpacing: ".24em", paddingLeft: ".24em" }}>WAYPOINT</span>
          <span className="wp-label" style={{ letterSpacing: ".3em" }}>Verified field guides</span>
          <Button size="lg" onClick={() => setScreen("hub")} style={{ marginTop: 6 }}>Enter the atlas</Button>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 14 }}>
            <span style={{ width: 1, height: 34, background: "linear-gradient(var(--rule2), var(--aink))" }} />
            <span style={{ width: 9, height: 9, borderRadius: "var(--r-pill,999px)", border: "2px solid var(--accent)" }} />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", gap: 18, padding: "0 22px", height: "var(--hdr-h,58px)", borderBottom: "var(--rw,1px) solid var(--rule)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "13px solid var(--accent)" }} />
          <span style={{ font: "700 13px/1 var(--fs)", letterSpacing: ".24em" }}>WAYPOINT</span>
        </span>
        <Segmented options={["World","Table"]} value={mode} onChange={setMode} />
        <span style={{ marginLeft: "auto", display: "flex", gap: 9 }}>
          <Button variant="secondary" size="sm">Tools</Button>
          <Button variant="secondary" size="sm">＋ new guide</Button>
        </span>
      </header>

      {mode === "World" ? (
        <div style={{ position: "relative", height: "calc(100vh - var(--hdr-h,58px))", background: "var(--sunken)", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 430, height: 430, borderRadius: "50%", border: "var(--rw,1px) solid var(--rule2)", display: "grid", placeItems: "center", textAlign: "center", padding: 30 }}>
            <span className="wp-label" style={{ lineHeight: 1.7 }}>&lt;atlas-map&gt; canvas<br />orthographic · d3 + topojson<br />graticule · terminator · dashed traverses</span>
          </div>
          <div style={{ position: "absolute", left: 20, top: 18, width: 262, background: "var(--card)", border: "var(--rw,1px) solid var(--rule)", padding: "13px 15px 14px" }}>
            <span className="wp-kicker">Sheet centre</span>
            <Reading style={{ display: "block", fontSize: "1.5rem", marginTop: 3 }}>37.57°N 126.98°E</Reading>
            <div style={{ height: 1, background: "var(--rule)", margin: "11px 0 9px" }} />
            <span className="wp-kicker">Index of sheets</span>
            {SHEETS.map(([num,, title,, dates]) => (
              <button key={num} type="button" onClick={() => setScreen("guide")} style={{ display: "flex", alignItems: "baseline", gap: 9, width: "100%", minHeight: 36, border: 0, borderTop: "1px dashed var(--rule)", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                <span style={{ font: "700 10px/1 var(--fs)", letterSpacing: ".1em", color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{num}</span>
                <span style={{ flex: 1, font: "500 13px/1.2 var(--fd)", color: "var(--ink)" }}>{title}</span>
                <span style={{ font: "400 10px/1 var(--fs)", color: "var(--muted)" }}>{dates.split(" ").slice(-2).join(" ")}</span>
              </button>
            ))}
          </div>
          <div style={{ position: "absolute", right: 20, bottom: 18, width: 250, background: "var(--card)", border: "var(--rw,1px) solid var(--rule)", padding: "12px 15px 13px" }}>
            <span className="wp-kicker">The north star</span>
            <p className="wp-body" style={{ margin: "5px 0 0", fontSize: ".82rem", lineHeight: 1.5 }}>Every perishable fact traces to a primary source and the date it was checked.</p>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 24px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", minHeight: 44, padding: "0 15px", background: "var(--card)", border: "var(--rw,1px) solid var(--rule2)" }}>
            <span style={{ font: "400 14px/1 var(--fs)", color: "var(--muted)" }}>Search every sheet — a place, a price, 119…</span>
          </div>

          <div style={{ marginTop: 18, background: "var(--card)", border: "2px solid var(--accent)", padding: "18px 20px 20px" }}>
            <span className="wp-kicker">On this trip now</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginTop: 6 }}>
              <span style={{ font: "500 2.1rem/1.05 var(--fd)", letterSpacing: "-.015em" }}>South Korea</span>
              <Reading style={{ fontSize: "1.5rem" }}>14:12 KST</Reading>
              <span style={{ marginLeft: "auto", font: "400 12px/1.4 var(--fs)", color: "var(--muted)" }}>Day 4 of 8 · 8–15 jul 2026</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 13 }}>
              {[["Police 112","var(--crit)"],["Fire & ambulance 119","var(--crit)"],["Tourist 1330","var(--crit)"],["₩1,461 / $1","var(--muted)"],["Heat + monsoon rain","var(--ochre)"]].map(([l, ink]) => (
                <span key={l} style={{ minHeight: 36, display: "flex", alignItems: "center", padding: "0 14px", border: "1px solid " + ink, borderRadius: "var(--r-pill,999px)", color: ink, font: "600 12px/1 var(--fs)", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{l}</span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 15, paddingTop: 13, borderTop: "1px solid var(--rule)" }}>
              <span style={{ font: "400 12px/1.45 var(--fs)", color: "var(--muted)" }}>Next: KTX 08:30 → Daejeon · 21/37 stops · 4 to book</span>
              <Button style={{ marginLeft: "auto" }}>Open this sheet →</Button>
            </div>
          </div>

          <span className="wp-kicker" style={{ display: "block", margin: "22px 0 9px", color: "var(--aink)" }}>Every sheet</span>
          {SHEETS.map(([num,, title, cities, dates, status]) => (
            <button key={num} type="button" style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", minHeight: 64, padding: "12px 16px", border: 0, borderTop: "1px solid var(--rule)", background: "transparent", cursor: "pointer", textAlign: "left" }}>
              <span style={{ font: "600 1.5rem/1 var(--fs)", fontVariantNumeric: "tabular-nums", color: "var(--rule2)" }}>{num}</span>
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ font: "500 1.15rem/1.15 var(--fd)" }}>{title}</span>
                <span style={{ font: "400 12px/1.3 var(--fs)", color: "var(--muted)" }}>{cities} · {dates}</span>
              </span>
              <StatusStamp status={status} />
            </button>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22, padding: "14px 16px", background: "var(--card)", border: "var(--rw,1px) solid var(--rule)" }}>
            <span style={{ font: "500 1rem/1.2 var(--fd)" }}>Split, closures, reminders, route</span>
            <Button variant="secondary" style={{ marginLeft: "auto" }}>Tools →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
window.AtlasHub = AtlasHub;
