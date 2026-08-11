/* The guide, desktop. Masthead plate → plate line → spine rail → day scrubber →
   panel grid. Every string is Korea's own content. */
const GROUPS = ["Plan","Essentials","Transit","Days","Sights","Daejeon & MSI","Food & shopping","Pokémon GO","Gaming & anime","Tokyo","Sources","Field log","Tools"];

const DAYS = [
  { n:1, label:"Wed 8",  state:"done" }, { n:2, label:"Thu 9", state:"done" },
  { n:3, label:"Fri 10", state:"done" }, { n:4, label:"Sat 11", state:"now" },
  { n:5, label:"Sun 12", state:"next" }, { n:6, label:"Mon 13", state:"planned" },
  { n:7, label:"Tue 14", state:"planned" }, { n:8, label:"Wed 15", state:"planned" }
];

function GuideSheet() {
  const { Plate, PlateLine, SpineRail, DayScrubber, Panel, Stamp, FlagChip, ProvenanceDot, GapBlock, Button } = window.Waypoint;
  const [group, setGroup] = React.useState("Days");
  const [day, setDay] = React.useState(4);
  const [collapsed, setCollapsed] = React.useState({});
  const toggle = (k) => setCollapsed((c) => ({ ...c, [k]: !c[k] }));

  const chips = [
    ["Police 112","tel:112","var(--crit)"],
    ["Fire & ambulance 119","tel:119","var(--crit)"],
    ["Tourist 1330","tel:1330","var(--crit)"],
    ["₩1,461 / $1","#","var(--muted)"],
    ["Base · Jongno, Seoul","#","var(--muted)"]
  ];

  return (
    <div style={{ maxWidth: "var(--shell,1400px)", margin: "0 auto", padding: "0 30px 40px" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 18, height: "var(--hdr-h,58px)", borderBottom: "var(--rw,1px) solid var(--rule)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "13px solid var(--accent)" }} />
          <span style={{ font: "700 13px/1 var(--fs)", letterSpacing: ".24em" }}>WAYPOINT</span>
        </span>
        <Button variant="secondary" size="sm">← the atlas</Button>
        <span style={{ marginLeft: "auto", font: "600 10px/1 var(--fs)", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)" }}>Seoul 14:12</span>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 26, padding: "26px 0 0" }}>
        <Plate caption="plate · gyeongbokgung, commons" style={{ flex: "1 1 560px" }} minHeight="clamp(300px, 42vh, 460px)" />
        <div style={{ flex: "1 1 360px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 11 }}>
          <span className="wp-kicker">Verified field guide</span>
          <h1 className="wp-display" style={{ margin: 0 }}>South Korea</h1>
          <p className="wp-body" style={{ margin: 0, maxWidth: "44ch" }}>Eight days across Seoul, Daejeon and Busan — built around MSI, and checked against what was actually open.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {chips.map(([label, href, ink]) => (
              <a key={label} href={href} style={{ minHeight: 36, display: "flex", alignItems: "center", padding: "0 14px", border: "1px solid " + ink, borderRadius: "var(--r-pill,999px)", color: ink, font: "600 12px/1 var(--fs)", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{label}</a>
            ))}
          </div>
        </div>
      </div>

      <PlateLine style={{ marginTop: 22 }} reading="Seoul · Daejeon · Busan" note="Next: KTX 08:30 → Daejeon" stamp="✓ 30 jul" meta="21/37 stops · 4 to book · print sheet" />

      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--bg)", paddingBottom: 14, borderBottom: "var(--rw,1px) solid var(--rule)" }}>
        <SpineRail stations={GROUPS} value={group} onChange={setGroup} />
      </div>

      <DayScrubber days={DAYS} value={day} onChange={setDay} style={{ marginTop: 14 }} />

      <div style={{ padding: "22px 0 0" }}>
        <span className="wp-kicker">Days · you are on day {day}</span>
        <h2 className="wp-headline" style={{ margin: "6px 0 0" }}>Daejeon — MSI, and the KTX down</h2>
        <p className="wp-body" style={{ margin: "9px 0 0", maxWidth: "var(--read,42rem)" }}>
          Both of you head south — GO Fest in the morning, then into the arena at 17:00. Line 1 from Jonggak, two stops to Seoul Station; the central base puts you one short hop from the KTX
          <ProvenanceDot /> at ≈₩23,700 <FlagChip kind="approx" onClick={() => {}} />.
        </p>
      </div>

      <div className="wp-panel-grid" style={{ marginTop: 20 }}>
        <Panel kicker="TODAY'S CHECKS" title="Four before you leave" onToggle={() => toggle("checks")} collapsed={!!collapsed.checks} stamp="✓ checked 18 jul 2026">
          <ul style={{ margin: 0, paddingLeft: 18, font: "var(--t-body-weight,400) .95rem/1.7 var(--fd)", color: "var(--muted)" }}>
            <li>Leave the base by 08:00 — Jonggak → Seoul Station, ≈₩1,400</li>
            <li>KTX ≈08:30 Seoul Station → Daejeon — check platform day-of</li>
            <li>Kakao T to I-Hotel, ~20 min, ≈₩5,500 each</li>
            <li>Drop bags; walk to EXPO Science Park by 10:00</li>
          </ul>
        </Panel>

        <Panel kicker="EMERGENCY" title="One source, two doors" onToggle={() => toggle("sos")} collapsed={!!collapsed.sos} stamp="✓ checked 18 jul 2026">
          <p className="wp-body" style={{ margin: 0 }}>112 police · 119 fire &amp; ambulance · 1330 tourist hotline. The same record feeds this panel and the SOS sheet — never re-entered per surface.</p>
        </Panel>

        <Panel kicker="TOKYO" onToggle={() => toggle("tokyo")} collapsed />

        <Panel span kicker="THE GAP" title="Post-match dinner" onToggle={() => toggle("gap")} collapsed={!!collapsed.gap}>
          <GapBlock
            body="A Bo5 can end anywhere from 20:00 to 22:00, and several Daejeon kitchens close by 23:00. Post-match dinner times could not be pinned."
            whatToDo="What to do instead — call Gobang, 042-863-2104, before you go in"
          />
        </Panel>
      </div>
    </div>
  );
}
window.GuideSheet = GuideSheet;
