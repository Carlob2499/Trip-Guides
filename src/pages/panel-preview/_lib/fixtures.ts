/* Fixture content for the Panel design study (PREVIEW ONLY).
   Deliberately real-SHAPED — a kicker, a title, a body of the length a guide actually
   carries — so the chrome is judged against real proportions, not lorem. Nothing here is
   a travel FACT: no price, no address, no opening hour, so nothing can be mistaken for
   verified guide content or leak into one. */

export interface PanelFixture {
  id: string;
  kicker: string;
  title: string;
  /** Prose only, from the guide tag allowlist. */
  body: string;
  /** Ships collapsed before the reader has any saved state for it. */
  collapsed?: boolean;
  /** Spans the entire grid row — a property of the fixture's TYPE, mirroring how a
      dense guide section (sights list, day itinerary, budget table) would declare it. */
  fullWidth?: boolean;
}

export const PANELS: PanelFixture[] = [
  {
    id: "orientation",
    kicker: "Orientation",
    title: "How this guide is arranged",
    body:
      "<p>The first Panel a reader meets is the one they stop needing soonest — which is exactly " +
      "the case collapse exists for. Read it once, fold it away, and the rest of the page moves up " +
      "to meet the thumb.</p><p>Collapsed, a Panel keeps its kicker and its title, so it stays " +
      "identifiable without being opened.</p>",
  },
  {
    id: "long-body",
    kicker: "Repository",
    title: "A Panel with a long body",
    fullWidth: true,
    body:
      "<p>Height is animated as a grid row rather than a measured pixel value, so a body that " +
      "grows or shrinks between collapses still animates correctly and no script ever reads a " +
      "layout height.</p><ul><li>A list, to check the body's own rhythm inside the container.</li>" +
      "<li>A second item, because one never shows spacing.</li><li>A third, long enough to wrap " +
      "at a narrow viewport and prove the measure holds inside the Panel's padding.</li></ul>" +
      "<p>The last paragraph exists so the bottom padding is visible at the moment the row closes.</p>",
  },
  {
    id: "short-body",
    kicker: "Note",
    title: "A short one",
    body: "<p>Two lines, to check that a small Panel does not collapse into an awkward stub.</p>",
  },
  {
    id: "starts-collapsed",
    kicker: "Reference",
    title: "This one ships collapsed",
    collapsed: true,
    body:
      "<p>Markup can start a Panel collapsed. A reader's own saved state always wins over that " +
      "default — open this one, reload, and it stays open.</p>",
  },
  {
    id: "medium-body",
    kicker: "Companion",
    title: "A medium neighbour",
    body:
      "<p>This Panel exists to share a row. Collapse the one beside it and the grid closes up " +
      "immediately — no empty hole where the neighbour was, no row that looks broken.</p>" +
      "<p>Its bottom edge ends level with the rest of its row, however tall the row runs.</p>",
  },
  {
    id: "another-note",
    kicker: "Note",
    title: "Another short one",
    body:
      "<p>A second small Panel, so the grid always has an odd count to prove the last row " +
      "never strands a hole beside the final Panel.</p>",
  },
];

/** The scopes the study can key its store under, to prove they never bleed into each other. */
export const SCOPES = [
  { key: "study-a", label: "Scope A" },
  { key: "study-b", label: "Scope B" },
];
