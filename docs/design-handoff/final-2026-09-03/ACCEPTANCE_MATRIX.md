# WayPoint D6/D7 Implementation Acceptance Matrix

Use this as the implementation finish line together with `VISUAL_FIDELITY_GATE.md`.

A surface has **two independent acceptance states**:

- **Functional acceptance** — behavior, data truth, accessibility, resilience, responsiveness, performance, and architecture.
- **Visual acceptance** — fidelity to the creator-approved D6 composition and visual direction.

A surface is not complete merely because it functions, and it is not complete merely because it resembles a mockup. **D7 is complete only when both states pass.**

Current rule after PR #186 review: functional evidence may be PASS while visual status remains `BLOCKED — VISUAL_REFERENCE_MISSING` or `FAIL — FIDELITY`.

| Surface | Functional must achieve | Must not regress | Visual acceptance requirement |
|---|---|---|---|
| Global shell | Stable `Trip · Itinerary · Map · Guide · Split`; Atlas one obvious action away; Search + SOS global; responsive sibling compositions | No adaptive nav reorder; no Tools/More destination; no sixth Search/SOS/Learnings tab | Match approved desktop/mobile navigation character, chrome footprint, hierarchy and spatial integration; generic app-shell substitution is a fail |
| Atlas | Minimal immersive world entry; flat-first cartographic globe; progressive pin disclosure; controls recede while zooming | No photoreal/satellite globe, dashboard sidebar dominance, fake destinations/statuses | Must preserve approved Atlas identity where a final reference exists; do not invent a substitute from prose if reference is absent |
| Trip — pre | Strong hero + short unresolved priority/readiness stack + light timeline/countdown cues | No heavy planning dashboard, no synthetic “on track” score | Hero/media balance, density and lifecycle hierarchy must follow approved Trip direction |
| Trip — active/arrival | Now/Next/Leave-by/Get-there hierarchy; dense operational detail as large structured atoms | No mini-dashboard widgets; no prose wall | Active mobile Trip is a required visual-canary target; must clearly realize the approved composition rather than a generic stacked panel screen |
| Trip — post | Editorial recap, few meaningful outcome atoms, major Plan-vs-Actual, then Learnings | No analytics dashboard | Preserve approved editorial/operational balance and imagery role |
| Trip Feedback | 3 steps only: Overall/Pace/Food ratings; Plan-vs-Actual; private reflection; prefill from itinerary where safe; save progress | No extra rating categories; no public freeform; no long administrative flow | Functional continuity is sufficient unless a creator-approved visual reference specifically covers this flow |
| Itinerary — mobile | One day primary; large timeline atoms; contextual imagery; clear Plan-vs-Actual; thumb-zone day rail/scrub | No tiny top arrows as primary switch; no shrunk desktop workbench | Must preserve the SCRL-like one-day composition, image/text balance, readable stop atoms and thumb-zone economy from the approved mobile direction |
| Itinerary — desktop | Resizable timeline-left/map-right workbench; synchronized selection/route context; panes collapsible | No hard 50/50 lock; no decorative map | Required visual-canary target; desktop must read as a deliberate temporal-spatial workbench, not a larger mobile feed plus map |
| Map | Google Maps normal connected state; OSM resilient fallback; contextual mobile sheet / desktop inspector; real place coordinates | No faux map; no fake live traffic/ETA; do not remove OSM before Google is ready | Map must dominate the spatial composition as approved; inspector/sheet proportions and chrome must not turn it into a card dashboard |
| Guide | Large destination imagery; geography/time first; city map context; structured facts; deeper detail on demand; contextual knowledge modules linked to itinerary | No generic wiki/blog feed; no duplicated truth; no review-feed clutter | Required fidelity review for hero prominence, editorial identity, image crop/scale, density and desktop use of width |
| Split | Recent expenses + Add Expense dominate; per-row split method; fast four-question add flow; current math/state preserved | No Decisions tab, no collaboration creep, no photo decoration without canonical source | Preserve any final creator-approved Split hierarchy/composition while using real state and semantic icons |
| Search | Desktop persistent search; mobile top field + compact sticky affordance + overlay; grouped canonical results; return to previous context | No dedicated Search page/tab; no command-palette feel; no AI-generated answers | Must retain approved utility-chrome treatment; no visually dominant extra destination behavior |
| SOS | Quiet always-available control; verified numbers/links; large targets when opened; offline core | No proactive triage, categories dashboard, service orchestration | Intentionally quiet; functional clarity takes precedence unless an approved visual reference says otherwise |
| Provenance | Quiet dot; source/date/freshness on demand; stale/uncertain escalates | No citation wall or synthetic trust score | Must remain visually subordinate in routine state and legible in adverse state |
| Offline/degraded | Written route/address/emergency/core guide facts remain useful; OSM/no-key path works; missing image/map does not blank the surface | No silent failure, blank mount, fake “live” state | Degraded visuals must preserve the same hierarchy without pretending missing media/service exists |
| Motion | Fast, interruptible, orientation-preserving; meaningful Atlas/Itinerary transitions; complete reduced-motion path | No scroll hijack, animation-only information, spectacle that delays action | Motion may support the approved composition but may not compensate for a divergent static layout |
| Accessibility | WCAG 2.2 AA floor; ~44px key targets; glare/text-zoom/keyboard/touch/safe-area handling | No width-based capability loss | Accessibility fixes may alter details, but material visual deviation must be documented rather than silently accepted |
| Generalization | Korea fixture passes; Denmark supports flexible windows, branched days, accessibility caveats | Do not force exact times, one linear party route, or unsupported step-free claims | Korea is the primary fidelity fixture; Denmark proves the design generalizes without becoming a different product |

## Visual fidelity gate — mandatory order

1. Read `FINAL_DECISIONS.md` F8/F9 and `VISUAL_FIDELITY_GATE.md`.
2. Load the creator-approved D6 raster references. If required references are unavailable, record `VISUAL_REFERENCE_MISSING`; visual acceptance cannot PASS.
3. Run the **two-surface visual canary** first:
   - active Trip mobile;
   - Itinerary desktop workbench.
4. Render production screenshots with real South Korea content and compare against the approved references for hierarchy, proportions, density, imagery prominence, navigation treatment, typography relationships, desktop use of width, mobile chrome economy, and overall WayPoint identity.
5. If either canary is materially off-target, fix it before extending the visual language to the remaining surfaces.
6. After convergence, produce a compact paired reference/production review set at representative phone and desktop widths.
7. Visual PASS requires Carlo’s explicit acceptance unless Carlo explicitly delegates that authority.
8. Only after visual PASS may final gallery baselines be regenerated/approved.

## Final adversarial checks

Before declaring D7 complete:
1. Run Korea with real content and verify no mockup-generated names/dates/amounts leaked into production.
2. Run Denmark and inspect at least one flexible-time day and one branched-party day.
3. Disable Google Maps configuration and confirm OSM + written routing context remains usable.
4. Simulate map SDK failure after fallback render and confirm no blank map mount.
5. Test reduced motion.
6. Test 320px width, tablet/intermediate width, desktop, text enlargement, keyboard, touch.
7. Test offline SOS numbers and core trip/guide context.
8. Grep production UI for retired concepts: Story Mode, voting, Trip Kit, generic Tools/More, synthetic `On Track`.
9. Confirm Search/SOS are global utilities rather than destinations.
10. Confirm no generated mockup fact is treated as content truth.
11. Confirm required approved visual references were loaded; otherwise visual status is BLOCKED.
12. Confirm Trip-mobile and Itinerary-desktop canaries passed before a full visual sweep.
13. Confirm final production screenshots were reviewed against approved references.
14. Confirm screenshot baselines were not used as a substitute for design acceptance.
