/* Four tools, all panel grids — no tool invents its own layout language.
   Jetlag was the fifth; R5 moved it into Plan, where its one useful output is
   read once before departure. */
const TOOLS = ["Split","Closures","Reminders","Route"];

const LEDGER = [
  ["Seoul Airbnb — Jongno, 7 nights","Accommodation","You","shared 3","$2,007.90"],
  ["Daejeon I-Hotel — 2 nights","Accommodation","T2","shared 3","$160.16"],
  ["Airport Limousine 6002 — 3 inbound fares","Transport","T3","shared 3","$34.91"],
  ["KTX Seoul → Daejeon, 2 tickets","Transport","You","shared 2","$33.95"],
  ["SPAREX Dongdaemun — 3 entries","Activities","You","shared 3","$24.64"],
  ["Mido Galbi — dinner","Food & drinks","T2","shared 3","$45.17"]
];

function Tools() {
  const { Panel, Button, Stamp, Reading, GapBlock } = window.Waypoint;
  const [tool, setTool] = React.useState("Split");

  return (
    <div style={{ maxWidth: "var(--shell,1400px)", margin: "0 auto", padding: "22px 30px 40px" }}>
      <span className="wp-kicker">Tools · the last station on the rail</span>
      <h1 className="wp-headline" style={{ margin: "6px 0 4px" }}>Split, closures, reminders, route</h1>
      <p className="wp-body" style={{ margin: "0 0 16px" }}>Running on South Korea — switch trips from the tool rail.</p>

      <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
        {TOOLS.map((t) => (
          <Button key={t} variant={t === tool ? "primary" : "secondary"} onClick={() => setTool(t)}>{t}</Button>
        ))}
      </div>

      {tool === "Split" && (
        <div className="wp-panel-grid">
          <Panel kicker="TRIP SPLIT · WHAT HAS ACTUALLY BEEN PAID" title="Where the money went" stamp="nothing recorded yet — add what you paid">
            {[["Paid so far","$0.00"],["Per person, party 3","$0.00"],["Expenses recorded","0"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "baseline", gap: 11, padding: "10px 0", borderTop: "1px dashed var(--rule)" }}>
                <span style={{ flex: 1, font: "400 .95rem/1.3 var(--fd)", color: "var(--ink)" }}>{k}</span>
                <span style={{ font: "600 1.1rem/1.2 var(--fs)", fontVariantNumeric: "tabular-nums", color: "var(--aink)" }}>{v}</span>
              </div>
            ))}
            <p className="wp-body" style={{ margin: "12px 0 0", fontSize: ".85rem" }}>Nothing here is seeded from the guide's budget. An estimate is not a debt — settling one produces transfers nobody owes.</p>
          </Panel>

          <Panel kicker="TRAVELLERS · RUNNING NET" title="Who is up, who is down">
            {[["You","+$1,291.92","var(--green)"],["Traveller 2","−$569.24","var(--ochre)"],["Traveller 3","−$722.68","var(--ochre)"]].map(([n, net, ink]) => (
              <div key={n} style={{ display: "flex", alignItems: "baseline", gap: 11, padding: "10px 0", borderTop: "1px dashed var(--rule)" }}>
                <span style={{ flex: 1, font: "400 .95rem/1.3 var(--fd)" }}>{n}</span>
                <span style={{ font: "600 1rem/1.2 var(--fs)", fontVariantNumeric: "tabular-nums", color: ink }}>{net}</span>
              </div>
            ))}
            <div style={{ marginTop: 13, paddingTop: 12, borderTop: "1px solid var(--rule)" }}>
              <span className="wp-kicker" style={{ color: "var(--aink)" }}>Settle up · 2 transfers</span>
              <p className="wp-body" style={{ margin: "6px 0 0", fontSize: ".9rem" }}>Traveller 2 → You $569.24 · Traveller 3 → You $722.68</p>
            </div>
          </Panel>

          <Panel span kicker="THE LEDGER" title="Every line is money that changed hands">
            {LEDGER.map(([item, group, payer, share, usd]) => (
              <div key={item} style={{ display: "flex", alignItems: "baseline", gap: 11, padding: "10px 0", borderTop: "1px dashed var(--rule)" }}>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ font: "400 .95rem/1.3 var(--fd)" }}>{item}</span>
                  <span className="wp-label" style={{ letterSpacing: ".06em", textTransform: "none" }}>{group} · paid by {payer} · {share}</span>
                </span>
                <span style={{ font: "600 1rem/1.2 var(--fs)", fontVariantNumeric: "tabular-nums", color: "var(--aink)" }}>{usd}</span>
              </div>
            ))}
          </Panel>
        </div>
      )}

      {tool === "Closures" && (
        <div className="wp-panel-grid">
          <Panel kicker="CLOSURES · KR-2026 HOLIDAY RECORD" title="What is shut, and when" stamp="✓ from src/data/holidays/KR-2026.json">
            <p className="wp-body" style={{ margin: 0 }}>No public holidays fall during Jul 8–15, and none in the three-day shoulder either side.</p>
          </Panel>
          <Panel kicker="RECURRING" title="Scanned from the guide's own sights">
            <p className="wp-body" style={{ margin: 0 }}>Gyeongbokgung closed Tuesdays · Changdeokgung closed Mondays · Huwon by 10:30 tour only.</p>
          </Panel>
          <Panel span kicker="JAPAN" title="No holiday record">
            <GapBlock heading="⚠ NOT CONFIRMED" body="Japan has no holiday file in the repository, so this tool cannot partition its trip." whatToDo="What to do instead — fetch JP-2026, or the tool keeps saying so" />
          </Panel>
        </div>
      )}

      {tool === "Reminders" && (
        <div className="wp-panel-grid">
          <Panel span kicker="REMINDERS · THE GUIDE'S OWN CHECKLISTS" title="Book ahead first" stamp="✓ nothing here is authored by the interface">
            {[["Huwon 10:30 tour — book ahead", true],["A Flower Blossom — confirmed", false],["NOL World ticket open and tested", false],["Battery packs charged; arena layer packed", false]].map(([l, book]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: "1px dashed var(--rule)" }}>
                <span aria-hidden="true" style={{ width: 18, height: 18, border: "1px solid var(--rule2)" }} />
                <span style={{ flex: 1, font: "400 .95rem/1.4 var(--fd)" }}>{l}</span>
                {book && <Stamp tone="ochre">Book ahead</Stamp>}
              </div>
            ))}
          </Panel>
        </div>
      )}

      {tool === "Route" && (
        <div className="wp-panel-grid">
          <Panel span kicker="ROUTE ORDER · EVERY LEG HANDS OFF" title="Day 4, five mapped points" stamp="⚠ straight-line, not transit time">
            {[["Jonggak → Seoul Station","1.4 km"],["Seoul Station → Daejeon Station","139.2 km"],["Daejeon Station → I-Hotel","3.1 km"],["I-Hotel → EXPO Science Park","1.9 km"],["EXPO → DCC II","0.13 km"]].map(([leg, d]) => (
              <div key={leg} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: "1px dashed var(--rule)" }}>
                <span style={{ flex: 1, font: "400 .95rem/1.4 var(--fd)" }}>{leg}</span>
                <span style={{ font: "600 .9rem/1 var(--fs)", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>{d}</span>
                <a href="#" className="wp-control" style={{ color: "var(--aink)" }}>Open in maps ↗</a>
              </div>
            ))}
            <Button style={{ marginTop: 14 }}>The whole day in maps ↗</Button>
          </Panel>
        </div>
      )}
    </div>
  );
}
window.Tools = Tools;
