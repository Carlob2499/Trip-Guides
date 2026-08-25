---
name: waypoint-design
description: Design or implement Waypoint UI, visual assets, and prototypes while preserving its field-use, truth, and design-system contracts.
user-invocable: true
---

## Read only what the task needs

Do **not** explore the whole design folder by default.

- **Narrow production UI/CSS fix:** read this skill and the affected production component/style files. Load design references only when a visual rule is actually in question.
- **One component or pattern:** additionally read the matching file under `docs/design-handoff/design_handoff_guide_ui/design-system/components/` and only the token/guideline files it uses.
- **Whole surface or `/design` pass:** read `docs/design-handoff/design_handoff_guide_ui/design-system/readme.md`, the matching `ui_kits/` surface, and a relevant prototype only when it answers a composition question. Do not sweep every prototype.
- **Mock/asset work:** read only the tokens/assets needed for that artifact.
- Accessibility and responsive geometry are machine-gated. Read their tests only when a gate fails or the task changes those contracts.

## Scope boundary

This skill owns **presentation**, not destination truth.

- For **presentation-only** work, keep factual guide data exactly as supplied. **Preserve every fact value verbatim**; do not load `waypoint-guide-author` merely because UI renders travel content.
- If the task requires **creating, correcting, or verifying destination facts** (prices, hours, venues, transit, events, itineraries, recommendations), route that factual work to `waypoint-guide-author`.
- For mixed work, settle factual changes first, then render the verified result. Presentation changes must not widen research scope.

## Non-negotiable design contract

Waypoint is a field instrument, not a brochure.

1. **Quiet paper, loud marks.** Content surfaces stay flat, sage, and hairline-separated; notation may take pigment and scale.
2. **Truth stays visible.** Perishable facts trace to a source/date; missing evidence is shown as an honest gap, never invented filler.
3. **Radius is binary.** `0` for content/evidence containers, `999px` for pressable pills.
4. **Use existing tokens.** Do not invent colours or hand-blend new semantic shades.
5. **Notation relocates; it does not shrink to fit.** Responsive informational graphics recompose when shrinking would make them unreadable.
6. **Ticks mean evidence.** Never put evidence corner ticks on ordinary UI panels.
7. **Do not pad empty layouts with prose.** Fix composition or show the gap.

For new visual composition, build from `design-system/styles.css`, the relevant component(s), and the matching UI kit rather than inventing a parallel system.

## Design System 1.0 calibration

For a task explicitly named **DS1 calibration** or **Design System 1.0 calibration**, start at
`docs/design-handoff/design-system-1-candidate/README.md` and follow its bounded reading order.
That package is a candidate for visual testing only. For ordinary production UI work, the R5
contract above remains authoritative until the creator explicitly approves DS1.
