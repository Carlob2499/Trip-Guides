# WayPoint Mockup Library — Codex Handoff

This archive contains **all 81 WayPoint mockup images currently present in the working image library**, packaged as high-quality WebP files for a much smaller upload.

## Critical interpretation rule

These images are **visual references, not implementation authority**.

Generated mockups include exploratory and superseded concepts, and some contain invented UI, fake data, extra controls, or navigation that WayPoint explicitly rejected. **Do not implement a feature merely because it appears in an image.**

When an image conflicts with the repository, the repository wins. Use this authority order:

1. `PRODUCT.md`
2. `docs/reference/design-system.md`
3. `docs/reference/motion.md`
4. `docs/reference/component-registry.json`
5. executable tokens / breakpoints / tests

## Current WayPoint product guardrails

- Stable primary destinations: **Trip · Itinerary · Map · Guide · Split**
- **Search** and **SOS** are global actions, not tabs/destinations.
- Atlas/Home is separate from the five trip destinations.
- Atlas: globe/map is the visual hero; supporting UI should not overpower it.
- Trip: lifecycle-aware “what matters now,” not a generic dashboard.
- Itinerary: day-first on mobile; temporal-spatial workspace on desktop.
- Map: Google Maps is the preferred connected substrate; OSM remains fallback.
- Guide: editorial, location-first, image-forward, map-assisted reference.
- Split: budgeting/bill splitting only; **Recent Expenses + Add Expense are primary**; settlement is secondary.
- Search: context-first universal search that expands when needed and recedes when not; no sixth Search tab/FAB.
- SOS: global, stress-first, immediate emergency hierarchy, offline core.
- Desktop may be immersive at entry/transition surfaces, but operational content must remain on distinct readable surfaces.
- Do not add AI answer feeds, popularity/review systems, fake metrics, synthetic trip-health status, extra top-level destinations, or generic “Tools/More” surfaces unless repo authority explicitly requires them.

## How to use this archive

1. Inspect `CONTACT_SHEET.jpg` first.
2. Open individual files from `mockups/` only when working on the relevant surface.
3. Files beginning with `waypoint_mockup_` are the latest narrow visual-sanity artifacts and are generally more useful than broad early boards, but they are still subordinate to repo authority.
4. Treat older collage/board images as inspiration for composition, typography, density, imagery, and responsive relationships — **not** as feature manifests.
5. Before implementing a visual element, verify that the underlying product behavior exists in the repo or is explicitly locked in D6.

## Packaging notes

- 81 unique mockups included.
- Images were converted from PNG to WebP at high quality (92) for upload efficiency.
- One exact duplicate (`imagegen.png`) was removed in favor of its named duplicate, `south_korea_atlas_travel_dashboard.png`.
- CI/gallery regression screenshots and review crops are intentionally excluded because they are rendered-build diagnostics, not mockup-library design artifacts.
- `MANIFEST.csv` maps every packaged file back to its original filename and SHA-256.
