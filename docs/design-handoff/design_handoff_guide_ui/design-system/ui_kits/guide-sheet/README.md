# UI kit — the guide sheet

The full reading experience, rendered from a guide's own JSON. Recreated from
`src/layouts/GuideLayout.astro`, `src/styles/guide.css`, `src/styles/masthead.css`, and
`src/content/guides/korea/`.

**Composition, top to bottom:** header → masthead (plate + text column) → plate line →
spine rail (sticky at `--hdr-h`) → day scrubber → the group's lead → panel grid.

**What the kit demonstrates**

- The plate mounted with corner ticks and its credit, never a backdrop.
- The plate line carrying the cities at Reading scale and the next leg — R5 replaced R4's
  coordinate pair here, and retired guide numbering entirely.
- The spine rail: thirteen stations, Tools last, Field log after Sources.
- Panels in the grid with one collapsed (sorting last) and one full-span.
- The notation layer in prose: a provenance dot mid-sentence and an `≈ approx.` flag.
- The gap block at full width, never styled down.

**Not in the kit** (they belong to the running app, not the design): section reveals on
intersect, GSAP collapse with mid-tween grid re-measurement, drag-reorder persistence, and
the hub → masthead FLIP.
