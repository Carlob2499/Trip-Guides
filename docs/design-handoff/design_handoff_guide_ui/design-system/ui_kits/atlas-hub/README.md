# UI kit — the atlas hub

The product's front door. Recreated from `src/pages/index.astro`, the handoff's §1–§3, and
`prototype/atlas-map.js`.

**Three surfaces, one vocabulary**

1. **Cover** — benchmark mark, wordmark at .24em, sub-line, "Enter the atlas", scroll cue.
   Auto-opens after 4200ms; any click, scroll or wheel opens it now. Once per session.
2. **World** — the globe with the trips pinned, surrounded by sheet furniture. The globe is
   the real `<atlas-map>` canvas element in the product; it is a labelled placeholder here
   because faking an orthographic projection in CSS would be worse than admitting it.
3. **Table** — the same record with the instrument removed. Search, sticky chips, quick card,
   sheet list, tools row. **No entrance animation anywhere on this path** — this is the
   surface someone opens standing in a train station with one bar of signal.

**The Two Doors Rule** is why both faces exist and why the switch stays visible.

**Not in the kit:** the globe's pin-card collision solver (eight seats, compacted re-pass,
grid-search fallback, running in `requestIdleCallback`), the day/night terminator, and the
wordmark FLIP into the header.
