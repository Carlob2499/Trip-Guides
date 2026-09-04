# D7 implementation — progress log

Branch: `claude/waypoint-design-routing-rex0vr` (started from frozen SHA `b37fe92`).

Authority order for resumed work: read `FABLE5_IMPLEMENTATION_PROMPT.md`, `FINAL_DECISIONS.md`, `VISUAL_FIDELITY_GATE.md`, and `ACCEPTANCE_MATRIX.md` in this folder before changing visuals. Then inspect `git log --oneline` and `git status`.

## Architecture decisions taken — preserve unless a real defect requires change

- Five destinations are regions of ONE guide page (`src/layouts/GuideLayout.astro`):
  `#dest-trip · #dest-itinerary · #dest-map · #dest-guide · #dest-split`. Router =
  `src/scripts/guide-ui.js` (`showDest`, `goToHash`, `data-dest-nav`, `data-dest-go`).
- Global chrome = `src/components/AppChrome.astro` + `src/styles/chrome.css`.
- Masthead (cover) lives inside Guide; Trip has its own restrained hero.
- `src/features/trip/` owns lifecycle/Now/Next projection from canonical `#tripData`.
- `src/features/search/` owns the index/ranking/overlay.
- Schema additions: Guide `module` relation facet and day `branches`.
- `src/lib/guide-view.ts` is the single derivation feeding GuideLayout and gallery.
- Map embeds are lazy and OSM remains until Google initializes.
- Search ranking is token-aware, strict-then-relaxed, deterministic.
- Retired concepts remain retired: Story Mode, old Guide rail, adaptive/promoted nav, Trip Kit, Tools/More lineage, command palette, panel reorder, swipe/day-scrub onboarding lineage where already removed.

## Status — 2026-09-04

**Engineering foundation: PASS / substantially complete.**  
**Visual redesign acceptance: BLOCKED / NOT ACCEPTED.**

PR #186 is **not** the final creator-approved D6 visual implementation in its current rendered form.

The earlier acceptance record over-weighted functional evidence and under-weighted fidelity to the creator-approved mockups. The 2026-09-04 review found that the implementation preserved many D6 structural decisions but materially diverged in visual composition, hierarchy, imagery treatment, navigation character, density, and desktop/mobile presentation.

Do not describe the program as complete until the new visual fidelity gate passes.

## Functional evidence already earned — keep it

The following engineering evidence remains useful and should not be thrown away:

- five-destination routing and global Search/SOS;
- single canonical `guide-view` derivation;
- Trip lifecycle and Now/Next projection;
- Itinerary day rail and resizable desktop workbench behavior;
- Denmark branch schema/rendering;
- Google/OSM fallback behavior;
- Search deterministic ranking and routing;
- Split fast-entry/ledger behavior and existing financial state;
- lazy map loading;
- retired obsolete systems;
- invariants/lint/typecheck/unit/coverage/build;
- accessibility/resilience/offline-sync test evidence;
- 320px/text-zoom/reduced-motion probes.

These facts justify **preserving PR #186 as the engineering base**, not accepting its current visual composition.

## Acceptance state by surface

| Surface | Functional state | Visual state |
|---|---|---|
| Global shell | PASS | FAIL / requires D6 fidelity convergence |
| Atlas | existing behavior preserved | NOT REVIEWED against final creator reference |
| Trip — pre/active/post | PASS | FAIL / current composition not creator-accepted |
| Trip Feedback | PASS / unchanged | no new visual acceptance required unless touched |
| Itinerary — mobile | PASS behavior | FAIL / requires approved mobile composition fidelity |
| Itinerary — desktop | PASS behavior | FAIL / required V1 visual canary |
| Map | PASS fallback/interaction architecture | FAIL / visual composition requires convergence |
| Guide | PASS structure | FAIL / hero/editorial hierarchy requires convergence |
| Split | PASS behavior | REVIEW REQUIRED against final approved visual direction |
| Search | PASS behavior | REVIEW REQUIRED with shell fidelity |
| SOS | PASS behavior | REVIEW REQUIRED only for integration/chrome consistency |
| Provenance | PASS | preserve unless visual convergence touches it |
| Offline/degraded | PASS | preserve |
| Motion | PASS functional/reduced-motion checks | visual motion quality remains subordinate to composition acceptance |
| Accessibility | PASS automated evidence | must remain PASS after visual correction |
| Generalization | PASS functional evidence | recheck after visual convergence |

## Current blocker

`MOCKUP_MANIFEST.json` now records `VISUAL_REFERENCE_MISSING`: the original creator-approved raster mockups are not durably stored in this repository.

That means the next visual run must first receive the approved references in its task/session or add them to the repo. It must not reconstruct the target from prose/SVGs and call that equivalent.

## Next execution sequence

1. **V0 — reference preflight:** load the approved D6 raster references and map them to surfaces.
2. **V1 — two-surface canary only:** active Trip mobile + Itinerary desktop workbench using South Korea content.
3. Compare those renders against the approved references under `VISUAL_FIDELITY_GATE.md`.
4. If either is materially off-target, keep correcting the canary; do not expand scope.
5. **V2 — full visual convergence:** only after the canary is credible, apply the approved visual language to remaining surfaces while preserving working D7 engineering.
6. **V3 — creator review:** paired reference/production screenshots at representative phone/desktop widths.
7. Only after explicit visual acceptance: regenerate final gallery baselines, rerun exact-head Required Gate, merge, deploy, and smoke-test production.

## Baselines

Current gallery-baseline differences are not a reason to accept or reject the design by themselves. Baselines are regression locks, not design approval.

Do not regenerate/approve the final visual baseline merely to make CI green before V3 creator acceptance.

## Remaining non-visual content follow-ups

These remain separate from the visual convergence pass:

- Denmark branched-day coordinates need a normal-machine geocoding pass where the external service is reachable.
- Guide knowledge-module pairings should receive a Guide Author/content-quality review.

Do not mix either follow-up into the visual canary unless it blocks rendering the reference state.
