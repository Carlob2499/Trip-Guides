# Final Mockup Drift Guard

This is the final reconciliation pass before Claude Fable 5 implementation.

## What drifted during visual exploration

Generated mockups repeatedly introduced attractive but unauthorized material. None of the following becomes a feature merely because it appears in an image:

- fake trip dates, fake travelers/avatars, fake balances, fake ratings/review counts;
- generic `Invite`, travel-party, voting, shared-readiness, Trip Kit, Decisions, Notes dashboards, or broad collaboration modules;
- generic `On track` / trip-health scoring;
- `Add to itinerary` on objects already scheduled;
- fake live traffic labels or minute-perfect ETAs;
- generic map layers, satellite/terrain controls, or map styling not backed by the actual Google Maps/OSM implementation;
- a standalone Search destination;
- a standalone SOS destination or proactive emergency assistant;
- SOS categories, triage questionnaires, “help request sent,” group-location workflows, or emergency-service orchestration;
- photo-heavy Split expense rows when the expense has no canonical place image;
- new Split analytics/categories/decision tools not supported by the current expense engine;
- Story Mode or cinematic playback;
- extra Trip Feedback rating categories beyond **Overall / Pace / Food**;
- public rendering of private freeform Trip Feedback;
- photoreal/cinematic globe styling, space/cosmos effects, neon, glossy AI-dashboard treatments;
- generic white SaaS/card-grid styling, purple/blue AI gradients, or pill soup.

## Frozen visual interpretation

### Palette and type
For implementation, executable tokens and D6-23 control visual color decisions. Do not reinterpret high-level palette prose into a new navy/amber theme.

Use:
- `--bg: #e3e7dc`
- `--bg2: #ced5c4`
- `--card: #fbfcf6`
- `--ink: #0f141a`
- `--accent: #9c4421`
- dark mode: warm charcoal/chart-room family already defined in the token system
- Literata Variable for editorial/display/reading voice
- Atkinson Hyperlegible Next for operational/data/control voice

### Navigation
- Primary traveler destinations: `Trip · Itinerary · Map · Guide · Split`.
- Atlas is the home/world entry surface, not a sixth traveler destination.
- Search and SOS are global utilities, not tabs.
- Learnings lives inside Trip.
- Stable order; no adaptive reordering.
- Mobile global navigation is explicit/tap-driven; no swipe between top-level destinations.

### Desktop immersion
Destination photography/cartographic atmosphere may fill the desktop background or opening region when appropriate. The working UI must remain on a distinct readable surface. Do not place dense operational text directly over busy photography.

### Mobile
Mobile is designed independently, not a shrunken desktop. Primary actions stay thumb-reachable; information atoms get physically larger before more widgets are added.

## Surface-specific drift fences

### Atlas
- restrained immersive, minimal;
- flat-first illustrated/cartographic globe, not photoreal Earth;
- sparse contextual controls, no permanent dashboard/sidebar dominance;
- UI recedes as zoom deepens;
- actual trip/destination content only.

### Trip
- lifecycle-aware “what matters now,” not a dashboard;
- active: Now → Next → Leave by → Get there → problem → fallback → remainder;
- post-trip: editorial recap → major Plan-vs-Actual → Learnings;
- no travel-party or synthetic progress/health widgets.

### Itinerary
- mobile: day-first, large operational timeline, thumb-zone day scrubber/rail; no tiny top arrow dependence;
- desktop: resizable temporal-spatial workbench, timeline left + real map right by default;
- no fake exact times where source only has flexible windows;
- Denmark may branch into parallel groups.

### Map
- connected normal state uses real Google Maps;
- OSM remains fallback and must survive Google initialization failure;
- live navigation hands off to Google Maps/native provider;
- research ETA stays coarse, e.g. `≈30 min · check live`.

### Guide
- location/time spine; strong editorial imagery; map-assisted/map-forward geography;
- compact decision facts before deeper prose;
- contextual How-To/transit/etiquette modules are canonical knowledge objects linked deterministically to relevant days/places/events;
- no SEO article farm, anonymous review feed, or generic recommendation sludge.

### Split
- preserve the repo’s expense-splitting engine;
- Recent Expenses + Add Expense are most prominent;
- every row makes split method legible: Even / Exact / Shares / %;
- participants are per-expense;
- balance/settlement is secondary utility;
- icon-first rows; photos only when a linked canonical place already owns an image.

### Search
- global infrastructure, not a destination;
- desktop: prominent persistent global search field;
- mobile: full field at top → compact sticky affordance while scrolled → focused overlay;
- return to the exact prior page/scroll state on dismiss;
- current-trip results first;
- no invented AI answer engine.

### SOS
- low-key but always available;
- opens a compact sheet/modal;
- mostly verified numbers and useful links;
- offline emergency numbers;
- no proactive triage/service workflow.

### Provenance
- quiet source dot by default;
- expand for source, checked date, freshness/shelf-life, uncertainty;
- stale/conflicting/high-consequence facts escalate visually;
- no trust score or citation wall.
