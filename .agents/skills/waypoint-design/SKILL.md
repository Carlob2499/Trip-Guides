---
name: waypoint-design
description: Design or implement Waypoint UI, visual assets, and prototypes while preserving its field-use, truth, responsive, and design-system contracts.
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
  `docs/mockups/GRAND_REFERENCE_README.md`, `docs/mockups/grand-reference.html`, then affected code.
- Read `docs/research/waypoint-design-reference-packet.md` only when external benchmark evidence is
  useful for a concrete implementation question.
- Historical `docs/design-handoff/`, prototypes, screenshots, and archived redesigns are
  consult-only implementation history. Do not load them unless current authority/code leaves a
  specific historical implementation question unanswered.

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

## D7 rule

D6 reconciliation is complete.

For the authorized whole-site redesign:

- execute `docs/work-orders/waypoint-grand-redesign.md`;
- do not ask Carlo to re-decide settled visual direction;
- do not average incompatible mockup generations;
- remove superseded visual/navigation/motion/map implementations as the new system lands;
- update registry/tokens/gates with the implementation rather than preserving old laws;
- do not call the redesign complete until all canonical surfaces are migrated and old conflicting
  systems are retired.

When the full work order is complete, report the exact remaining deviations. If none remain, state:

**D7 GRAND REDESIGN COMPLETE — OLD VISUAL SYSTEM RETIRED.**
