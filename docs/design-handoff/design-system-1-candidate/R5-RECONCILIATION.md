# R5 reconciliation matrix

> This matrix is the bounded answer to “is this old R5 sentence still law?” It classifies
> design rules, not current implementation status. R5 remains production authority until DS1
> is approved.

Classifications are exclusive:

- `KEEP` — remains a non-negotiable DS1 floor.
- `MODIFY` — principle survives with revised scope.
- `PRODUCT-SPECIFIC` — belongs to product/surface behavior, not timeless visual grammar.
- `SUPERSEDE` — retired by completed creator direction.
- `VISUAL-TEST-REQUIRED` — no prose choice; resolve in the named calibration gate.

| R5 rule | Current source | Class | DS1 disposition |
| --- | --- | --- | --- |
| “Field instrument, not brochure” as dominant identity | `docs/design-handoff/DESIGN.md` frontmatter/Overview; both waypoint-design skill mirrors | `MODIFY` | Instrument rigor survives, but the identity becomes a spatial travel operating system with editorial depth; cartographic instrument is a minority register. |
| Quiet paper, loud marks | `docs/design-handoff/DESIGN.md` Overview/Named Rules | `MODIFY` | Keep calm hierarchy and meaningful notation; retire the blanket requirement that every ground/container be flat, sage, and hairlined. |
| Truth/provenance stays visible | `.agents/skills/waypoint-design/SKILL.md`; `docs/design-handoff/DESIGN.md` notation/gap rules | `KEEP` | Presentation never hides uncertainty or invents evidence. Selective visibility and on-demand depth are allowed. |
| Literata + Source Sans 3 fixed | `docs/design-handoff/DESIGN.md` Typography; `docs/design-handoff/design_handoff_guide_ui/design-system/readme.md` “Type” | `VISUAL-TEST-REQUIRED` | Current pair is the control in Gate 1; no replacement is approved yet. |
| Binary radius `0 / 999px` | `docs/design-handoff/DESIGN.md` Shapes; `docs/design-handoff/enforcement/SPEC-COMPONENTS.md` rule 1 | `SUPERSEDE` | Retire the binary law. Gate 2 determines one coherent restrained scale; evidence may remain square and controls may remain pills. |
| Exact future geometry/radius scale | Not present in R5 | `VISUAL-TEST-REQUIRED` | Gate 2 must compare coherent systems; this package does not choose values. |
| Photography only as mounted square evidence plate | `docs/design-handoff/DESIGN.md` Overview/Plate; `docs/design-handoff/design_handoff_guide_ui/design-system/readme.md` “Backgrounds and imagery” | `SUPERSEDE` | Photography becomes expressive information architecture with varied crops, galleries, width, and transitions; evidence plates remain a subtype. |
| Existing colors only / no contextual place color | `.agents/skills/waypoint-design/SKILL.md`; `docs/design-handoff/DESIGN.md` Colors | `MODIFY` | Keep sage/paper, ink, oxide, and semantic status foundation. Allow contextual place/content color under contrast and semantic constraints. |
| Flat/no-depth posture | `docs/design-handoff/DESIGN.md` Elevation & Depth; kit readme transparency/blur | `SUPERSEDE` | Controlled depth, blur, gradients, transparency, and elevation are allowed when useful and performant. |
| No icon library / Unicode and CSS primitives only | `docs/design-handoff/design_handoff_guide_ui/design-system/readme.md` “Iconography” | `SUPERSEDE` | A coherent curated icon system is allowed; five primary destinations keep recognizable silhouettes and text labels. |
| Exact R5 motion timing/easing table | `docs/design-handoff/DESIGN.md` Motion; `docs/design-handoff/enforcement/SPEC-COMPONENTS.md` §9 | `VISUAL-TEST-REQUIRED` | Gate 5 tests routine versus flagship motion. Old values are reference, not law. |
| Reduced-motion is complete, not a softened afterthought | `docs/design-handoff/DESIGN.md` Motion; `docs/reference/motion.md` | `KEEP` | Every flagship/routine motion needs a complete reduced-motion alternative; core state remains legible. |
| Evidence corner ticks mean evidence | `docs/design-handoff/DESIGN.md` Shapes; `docs/design-handoff/enforcement/ANTIPATTERNS.md` | `KEEP` | If ticks are used, they retain this semantic and never decorate ordinary UI. Evidence need not always use ticks in DS1. |
| Notation relocates instead of shrinking unreadably | `docs/design-handoff/DESIGN.md` Layout/Typography | `KEEP` | Preserve readable information size; responsive composition moves or recomposes it. |
| No filler prose / honest gap | `.agents/skills/waypoint-design/SKILL.md`; `docs/design-handoff/design_handoff_guide_ui/design-system/readme.md` Content fundamentals | `KEEP` | Layout problems are not repaired with invented copy; absence remains explicit. |
| Old adaptive/four-slot mobile navigation and local ranking | `docs/design-handoff/design_handoff_guide_ui/design-system/readme.md` `ThumbBar`; `src/features/mobile-nav/` | `PRODUCT-SPECIFIC` | Historical production implementation only. DS1 prototypes the fixed five-destination product IA and must not reinstate adaptive ranking. |
| Navigation/chrome choreography and sibling mobile/desktop composition | `docs/design-handoff/DESIGN.md` rail; kit prototypes | `VISUAL-TEST-REQUIRED` | Gate 4 decides movement, docking, compression, and composition while destination order stays fixed. |
| Chrome must be still | `docs/reference/visual-redesign.md` Move B | `MODIFY` | Routine chrome may move/recompose when fast, spatially coherent, and context-preserving; it must not compete with traveler state. |
| Guide tabs / R5 spine behavior | `docs/design-handoff/DESIGN.md` “The rail”; `src/layouts/GuideLayout.astro` | `PRODUCT-SPECIFIC` | These are current guide-surface implementations, not timeless DS grammar or substitutes for Today/Itinerary/Map/Split/Guide. |
| Today / Itinerary / Map / Split / Guide behavior | `PRODUCT.md`; candidate `PRODUCT-UI-CONTRACT.md` | `PRODUCT-SPECIFIC` | Fixed product IA. Style gates may not change its meaning or order. |
| Surface-specific composition rules | `docs/design-handoff/design_handoff_guide_ui/design-system/ui_kits/` | `PRODUCT-SPECIFIC` | Preserve only where the relevant surface still requires them; do not globalize them as DS law. |
| Provenance claim/date/source/staleness semantics | `docs/design-handoff/DESIGN.md` notation family; `docs/design-handoff/enforcement/SPEC-COMPONENTS.md` §2 | `KEEP` | The evidence meaning remains. Gate 3 may redesign visibility, marks, containers, and interaction. |
| Exact provenance visual treatment | `docs/design-handoff/DESIGN.md` notation family and gap | `VISUAL-TEST-REQUIRED` | Gate 3 compares selective verification, uncertainty, and evidence-depth systems. |
| 320px reflow safety floor | `tests/visual/resilience.spec.ts` | `KEEP` | Core geometry must fit at 320px without lost tasks or page-level clipping. |
| Hostile/unbroken and multilingual content resilience | `tests/visual/resilience.spec.ts`; owning component styles | `KEEP` | Variable content cannot dictate viewport width; solve overflow at its component owner. |
| Safe-area behavior | `docs/design-handoff/DESIGN.md` Layout; `docs/design-handoff/enforcement/SPEC-COMPONENTS.md` rule 5 | `KEEP` | `viewport-fit=cover`; define inset tokens once; fixed/sticky edges reserve space even when reported inset is zero. |
| Accessibility core-task floor | `PRODUCT.md` Accessibility; R5 acceptance gates | `KEEP` | Readability, operability, focus/touch targets, non-color meaning, assistive semantics, and reduced motion remain binding. |
| Presentation-versus-travel-fact boundary | `.agents/skills/waypoint-design/SKILL.md` Scope boundary | `KEEP` | Visual work preserves supplied facts verbatim and never expands research scope. |
| Panels/cards as the one universal unit | `docs/design-handoff/DESIGN.md` panel/One Unit Rule | `MODIFY` | Bounded containers remain right for tools, operational data, and editable state; editorial composition may be freer. |
| Contextual density through one panel grid | `docs/design-handoff/DESIGN.md` Layout | `MODIFY` | Keep governed, gap-free relationships where useful; density becomes context-adaptive rather than one universal grid. |
| Exact red-ink frequency limits | `docs/design-handoff/DESIGN.md` Red Ink Rule | `MODIFY` | Preserve semantic restraint and status clarity, but calibrate emphasis within the richer system instead of constitutional viewport counts. |
| Native-first/composited performance discipline | `docs/reference/motion.md`; `docs/design-handoff/DESIGN.md` Composited Motion Rule | `KEEP` | Prefer transform/opacity, lazy motion dependencies, and no layout work on per-frame paths. |

## Practical use

If a rule is `KEEP`, prototypes must demonstrate it. If it is `MODIFY`, preserve the stated
intent without copying R5's absolute form. If it is `PRODUCT-SPECIFIC`, look to the Product UI
Contract and the affected surface. If it is `SUPERSEDE`, do not revive it as a default. If it
is `VISUAL-TEST-REQUIRED`, show alternatives and wait for creator judgment.
