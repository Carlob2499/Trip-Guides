---
name: waypoint-design
description: Design or implement Waypoint UI, visual assets, and prototypes while preserving its field-use, truth, responsive, design-system, and approved mockup-lineage contracts.
user-invocable: true
---

## Read only what the task needs

- **Narrow production UI/CSS fix:** read this skill, `docs/reference/design-system.md`, and the
  affected production component/style files.
- **Motion change:** additionally read `docs/reference/motion.md`.
- **New/reworked component or pattern:** additionally read
  `docs/reference/component-registry.json` and the affected machine gates.
- **Whole-surface redesign / D7 grand redesign:** read `PRODUCT.md`,
  `docs/reference/design-system.md`, `docs/reference/motion.md`,
  `docs/reference/component-registry.json`, `docs/work-orders/waypoint-grand-redesign.md`,
  **`docs/mockups/VISUAL_LINEAGE.md`**, `docs/mockups/GRAND_REFERENCE_README.md`, then inspect the
  relevant boards from the supplied September mockup library before designing or coding the surface.
- **Do not use `docs/mockups/grand-reference.html` as a visual target. It is retired/rejected.**
- Read `docs/research/waypoint-design-reference-packet.md` only when external benchmark evidence is
  useful for a concrete implementation question.
- Historical `docs/design-handoff/` material is consult-only implementation history. Do not use it
  as visual authority merely because it is older or more detailed.

## Scope boundary

This skill owns **presentation**, not destination truth.

- For **presentation-only** work: **Preserve every fact value verbatim.**
- Creating, correcting, or verifying destination facts belongs to `waypoint-guide-author`.
- Presentation work never invents travel facts merely to fill a visual state.

## Non-negotiable design contract

`docs/reference/design-system.md` is the single design authority.

1. **Field-first.** The traveler on the street wins tradeoffs.
2. **Truth stays visible.** Missing, stale, uncertain, conflicting, and offline states remain honest.
3. **Responsive sibling compositions.** Mobile is not compressed desktop; desktop is not enlarged
   mobile.
4. **Hierarchy before features.** Do not give a feature prominence merely because it exists.
5. **Composition, not card soup.** Use editorial, operational, spatial, and focused-action grammar.
6. **Merge before adding; retire before replacing.** Never preserve two generations indefinitely.
7. **Use approved tokens/components.** New global primitives require registry-first landing.
8. **Motion explains change.** Follow `docs/reference/motion.md`; native scrolling remains native.
9. **Field resilience.** 320px reflow, safe areas, long/CJK content, dark mode, offline, reduced
   motion, keyboard/touch, and important ~44px field controls are acceptance criteria.
10. **Historical handoffs are not authority.**
11. **Google Maps Platform is the live map foundation.**
12. **AI is mostly invisible.** Search, recommendations, repair, and Guide intake may be intelligent
    without presenting a persistent chatbot.
13. **Approved mockup lineage is visually binding unless an explicit later constitution decision
    conflicts.** Do not redraw Waypoint from prose.

## Visual-lineage rule — critical

The September `Waypoint_Mockup_Library_for_Codex(1).zip` library is the visual ancestry of D7.
Read `docs/mockups/VISUAL_LINEAGE.md` before whole-surface work.

The correct method is:

> **strong approved mockup composition + only the later explicit UX/product changes = final surface**

Preserve visual DNA such as:
- destination photography used as structural UI rather than filler thumbnails;
- globe/map as major anchors where the relevant mockup does so;
- warm ivory/editorial surfaces paired with deep navy/forest spatial surfaces;
- rust/orange action and selected-state emphasis;
- subtle topographic/cartographic texture;
- Literata-like editorial hierarchy + Atkinson-like operational clarity;
- useful desktop density;
- deliberate overlap/layering/floating relationships;
- premium depth, borders, shadows, translucency, and image crops;
- device-specific mobile composition;
- strong country/Guide identity.

Do **not** replace those with:
- schematic CSS gradients;
- generic SaaS cards;
- placeholder map drawings;
- large dead areas;
- generic AI travel aesthetics;
- newly invented brand marks/taglines;
- an unrelated aesthetic that merely obeys the written token list.

When a new feature was decided after the library — e.g. branching Guide intake, shared-object card
choreography, pin-to-compare, or fluid panes — extend the existing mockup grammar. The new screen
should look as if it could have been another polished board in the supplied library.

## D7 rule

D6 reconciliation is complete.

For the authorized whole-site redesign:

- execute `docs/work-orders/waypoint-grand-redesign.md`;
- obey `docs/mockups/VISUAL_LINEAGE.md` for visual continuity;
- inspect relevant approved mockups before each flagship surface implementation;
- do not ask Carlo to re-decide settled visual direction;
- do not average incompatible mockup generations;
- change only the parts explicitly superseded by the final constitution;
- remove superseded visual/navigation/motion/map implementations as the new system lands;
- update registry/tokens/gates with the implementation rather than preserving old laws;
- compare final screenshots side-by-side with relevant approved mockups;
- do not call the redesign complete until all canonical surfaces are migrated, the old conflicting
  systems are retired, and the implementation looks recognizably descended from the approved
  Waypoint mockups.

When the full work order is complete, report the exact remaining deviations. If none remain, state:

**D7 GRAND REDESIGN COMPLETE — OLD VISUAL SYSTEM RETIRED.**
