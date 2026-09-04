# WayPoint Final Mockup Package for Claude

## Purpose
This package is the **uploadable design-reference bundle** for Claude / Fable.

It combines:
1. the original 81-image WayPoint mockup library (visual lineage),
2. a complete set of feature-page mockups using **South Korea** as the content example,
3. a lightweight implementation brief explaining how these references should be used.

## Visual authority order
Use the references in this order:

1. **Original mockup library** (`source-lineage/ORIGINAL_MOCKUP_LIBRARY.zip`)  
   This is the visual lineage for composition, tone, density, imagery, device character, and premium finish.

2. **Feature-page mockups in `mockups/`**  
   These are the page-by-page target references that map the whole product.

3. **Grand design contract / product architecture**  
   Use it for structure, IA, behavior, and deliberate UX decisions when there is a conflict.

## Important interpretation rule
These mockups are **design references**, not rigid pixel specs.

Claude / Fable should:
- preserve the same overall design language,
- preserve the premium South Korea visual character,
- preserve hierarchy, density, responsive intent, and spatial relationships,
- preserve the cream / deep-green / rust palette family and the serif + sans tone,
- keep the globe / map / imagery-led identity,
- keep the UI cohesive across all pages.

Claude / Fable should **not**:
- treat every pixel as locked,
- flatten the design into generic cards,
- replace photography with abstract placeholders,
- reintroduce the old purple / flat-sidebar / generic-dashboard system,
- add noisy filler quotes, decorative fluff, or random marketing marks.

## Noise reduction note
Compared with some earlier explorations, reduce:
- random decorative quotes,
- excessive taglines,
- AI-sloppy filler text,
- visual clutter that does not improve clarity.

Keep the richness. Remove the fluff.

## Feature-page mapping

- **01. Atlas** → `mockups/01_atlas_experience.webp` — Global/home surface with globe-led entry and South Korea context.
- **02. Trip** → `mockups/02_trip_page.webp` — Active-trip cockpit / what-matters-now surface.
- **03. Itinerary** → `mockups/03_itinerary_page.webp` — Desktop itinerary workbench with chronology + map + detail pane.
- **04. Map** → `mockups/04_map_experience.webp` — Spatial workspace / Google Maps-led exploration surface.
- **05. Guide** → `mockups/05_guide_experience.webp` — Editorial destination guide with real imagery and topic drawers.
- **06. Search** → `mockups/06_search_experience.webp` — Context-aware universal search with mixed results and preview.
- **07. Guide Builder** → `mockups/07_guide_builder.webp` — Question-led guide creation flow; use as reference, not literal copy.
- **08. Split** → `mockups/08_split_expenses.webp` — Shared expenses and balances.
- **09. SOS / Safety** → `mockups/09_sos_safety.webp` — Safety utility with SOS, help, health, and location sharing.
- **10. Trip Learnings** → `mockups/10_trip_learnings.webp` — Post-trip recap / reflection / memory surface.
## Suggested repo placement
If you are updating the repository manually, place files like this:

- `docs/mockups/final-package/README.md`
- `docs/mockups/final-package/mockups/*.webp`
- `docs/mockups/final-package/source-lineage/*`
- `docs/mockups/final-package/FINAL_MOCKUP_CONTACT_SHEET.webp`

## Contract mapping note
The grand contract should reference this package as:
- the current **whole-site feature reference pack**,
- derived from the original WayPoint mockup lineage,
- used as **reference**, not as a hard implementation lock.

## Best way to use with Claude / Fable
Upload this whole package and say:
“Use these as the visual reference for the whole-site redesign. Preserve the design language and quality. Use judgment and flexibility in implementation. Do not drift from the mockup lineage.”