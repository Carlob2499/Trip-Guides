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
- **Whole-surface or design reconciliation:** read `PRODUCT.md`,
  `docs/reference/design-system.md`, `docs/reference/motion.md`,
  `docs/reference/component-registry.json`, and—when external evidence is useful—
  `docs/research/waypoint-design-reference-packet.md`.
- Historical `docs/design-handoff/`, prototypes, screenshots, and archived redesigns are
  consult-only implementation history. Do not load them unless current authority/code leaves a
  specific historical implementation question unanswered.

## Scope boundary

This skill owns **presentation**, not destination truth.

- For **presentation-only** work: **Preserve every fact value verbatim.** Do not invoke factual
  research merely because UI renders travel content.
- **Creating, correcting, or verifying destination facts** — prices, hours, venues, transit,
  events, itineraries, or recommendations — belongs to `waypoint-guide-author`.
- Presentation work never invents travel facts merely to fill a visual state.

## Non-negotiable design contract

`docs/reference/design-system.md` is the single design authority.

1. **Field-first.** The traveler on the street wins tradeoffs.
2. **Truth stays visible.** Missing, stale, uncertain, conflicting, and offline states remain honest.
3. **Responsive sibling compositions.** Mobile is not compressed desktop; desktop is not enlarged
   mobile. Content prefers intrinsic/container-driven recomposition.
4. **Hierarchy before features.** Do not give a feature visual prominence merely because it exists.
5. **Composition, not card soup.** Use editorial, operational, spatial, and focused-action grammar.
6. **Merge before adding; retire before replacing.** Never preserve two generations of a pattern
   indefinitely.
7. **Use approved tokens/components.** New global primitives require registry-first approval.
8. **Motion explains change.** Follow `docs/reference/motion.md`; no scroll hijacking or ornamental
   spectacle that delays the task.
9. **Field resilience.** 320px reflow floor, safe areas, long/CJK content, dark mode, offline,
   reduced motion, keyboard/touch, and important ~44px field controls are part of acceptance.
10. **Historical handoffs are not authority.** Never resurrect R4/R5 rules because a prototype or
    old spec calls itself final.

## D6 / D7 rule

During D6, unresolved items in the constitution remain unresolved until Carlo decides them.
Do not infer approval from current shipped behavior or older creator decisions.

During D7, implement only decisions that survived D6, then remove superseded implementation and
documentation in the same convergence program where safe.
