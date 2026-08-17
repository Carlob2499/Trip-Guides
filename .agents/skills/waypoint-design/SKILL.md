---
name: waypoint-design
description: Use this skill to generate well-branded interfaces and assets for Waypoint, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read `docs/design-handoff/design_handoff_guide_ui/design-system/readme.md`, and explore the
other available files in that folder — including the working prototypes one level up at
`docs/design-handoff/design_handoff_guide_ui/prototypes/`.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and
create static HTML files for the user to view. If working on production code, you can copy
assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or
design, ask some questions, and act as an expert designer who outputs HTML artifacts *or*
production code, depending on the need.

## Before you draw anything

Waypoint is a field instrument, not a brochure. Two rules govern every decision and you should
be able to state them back:

1. **Quiet paper, loud marks.** Grounds, cards and containers stay flat, sage and
   hairline-separated. Notation — a coordinate, a check date, a source stamp, an `≈`, a
   `⚠`, a stated absence — may take pigment and reach display scale.
2. **The product's claim is that every perishable fact traces to a source and a date.** If you
   render a number you cannot point to a source for, you have broken the product. State the
   absence instead: `⚠ NOT CONFIRMED`, plus a line saying what to do instead.

## The five things most likely to go wrong

- **Rounding a card.** Radius is binary: `0` on anything holding content, `999px` on anything
  you press. A rounded card is the fastest way to make this design stop looking like itself.
- **Inventing a colour.** Reach for a CSS variable. The accent has three jobs and they are three
  different tokens; never hand-blend a fourth at a call site.
- **Shrinking notation to fit.** Notation relocates, it never shrinks. Desktop margins carry
  marginalia; mobile folds them inline at unchanged scale.
- **Corner ticks on a UI panel.** Ticks mean evidence. A panel with them is lying about what it
  contains.
- **Padding a surface with prose.** An empty-feeling panel is a layout problem or an honest gap.
  Never write filler to make a screen look finished.

## Starting a build

Link `docs/design-handoff/design_handoff_guide_ui/design-system/styles.css`, set
`data-field="day"` (or `night`) on a wrapper, and compose from
`docs/design-handoff/design_handoff_guide_ui/design-system/components/`.
`docs/design-handoff/design_handoff_guide_ui/design-system/ui_kits/` shows the three real
surfaces assembled. `docs/design-handoff/design_handoff_guide_ui/design-system/guidelines/`
holds the specimen cards if you need to check a value.
