# WayPoint D6 Implementation Acceptance Matrix

Use this as the implementation finish line. A surface is not complete because it resembles a screenshot.

| Surface | Must achieve | Must not regress |
|---|---|---|
| Global shell | Stable `Trip · Itinerary · Map · Guide · Split`; Atlas one obvious action away; Search + SOS global; responsive sibling compositions | No adaptive nav reorder; no Tools/More destination; no sixth Search/SOS/Learnings tab |
| Atlas | Minimal immersive world entry; flat-first cartographic globe; progressive pin disclosure; controls recede while zooming | No photoreal/satellite globe, dashboard sidebar dominance, fake destinations/statuses |
| Trip — pre | Strong hero + short unresolved priority/readiness stack + light timeline/countdown cues | No heavy planning dashboard, no synthetic “on track” score |
| Trip — active/arrival | Now/Next/Leave-by/Get-there hierarchy; dense operational detail as large structured atoms | No mini-dashboard widgets; no prose wall |
| Trip — post | Editorial recap, few meaningful outcome atoms, major Plan-vs-Actual, then Learnings | No analytics dashboard |
| Trip Feedback | 3 steps only: Overall/Pace/Food ratings; Plan-vs-Actual; private reflection; prefill from itinerary where safe; save progress | No extra rating categories; no public freeform; no long administrative flow |
| Itinerary — mobile | One day primary; large timeline atoms; contextual imagery; clear Plan-vs-Actual; thumb-zone day rail/scrub | No tiny top arrows as primary switch; no shrunk desktop workbench |
| Itinerary — desktop | Resizable timeline-left/map-right workbench; synchronized selection/route context; panes collapsible | No hard 50/50 lock; no decorative map |
| Map | Google Maps normal connected state; OSM resilient fallback; contextual mobile sheet / desktop inspector; real place coordinates | No faux map; no fake live traffic/ETA; do not remove OSM before Google is ready |
| Guide | Large destination imagery; geography/time first; city map context; structured facts; deeper detail on demand; contextual knowledge modules linked to itinerary | No generic wiki/blog feed; no duplicated truth; no review-feed clutter |
| Split | Recent expenses + Add Expense dominate; per-row split method; fast four-question add flow; current math/state preserved | No Decisions tab, no collaboration creep, no photo decoration without canonical source |
| Search | Desktop persistent search; mobile top field + compact sticky affordance + overlay; grouped canonical results; return to previous context | No dedicated Search page/tab; no command-palette feel; no AI-generated answers |
| SOS | Quiet always-available control; verified numbers/links; large targets when opened; offline core | No proactive triage, categories dashboard, service orchestration |
| Provenance | Quiet dot; source/date/freshness on demand; stale/uncertain escalates | No citation wall or synthetic trust score |
| Offline/degraded | Written route/address/emergency/core guide facts remain useful; OSM/no-key path works; missing image/map does not blank the surface | No silent failure, blank mount, fake “live” state |
| Motion | Fast, interruptible, orientation-preserving; meaningful Atlas/Itinerary transitions; complete reduced-motion path | No scroll hijack, animation-only information, spectacle that delays action |
| Accessibility | WCAG 2.2 AA floor; ~44px key targets; glare/text-zoom/keyboard/touch/safe-area handling | No width-based capability loss |
| Generalization | Korea fixture passes; Denmark supports flexible windows, branched days, accessibility caveats | Do not force exact times, one linear party route, or unsupported step-free claims |

## Final adversarial checks

Before declaring complete:
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
