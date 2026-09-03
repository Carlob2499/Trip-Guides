# Waypoint Search — Final Responsive UI Contract

Status: **LOCKED D6 IMPLEMENTATION ADDENDUM**  
Approved: 2026-09-03  
Parent authority: `docs/reference/design-system.md` D6-24 (context-first universal Search), D6-03 (Search is a global action, not a destination), D6-22 (responsive sibling compositions), D6-32 (large information atoms), D6-43 (mobile chrome yields but remains recoverable), and D6-50 (feature-fidelity gating).

This document does not create a sixth navigation destination and does not override the Design Constitution. It records the approved responsive presentation of the already-authorized global Search capability so implementation does not drift back into a dedicated Search page, command palette, or invented recommendation product.

## 1. Core model

Waypoint has **one global Search surface** with responsive presentations.

Search is infrastructure that overlays or expands from the current traveler context. It is not a tab and does not require navigating away from Trip, Itinerary, Map, Guide, Split, or Atlas before searching.

Search remains traveler-facing and deterministic. The existing build-time index remains the baseline implementation: title/group/body matching and deep links into canonical guide sections. As semantic travel objects mature, those same canonical objects may improve grouping and ranking without changing the interaction model.

## 2. Desktop

- Search is persistently prominent in the global utility chrome, preferably as a wide field across the upper workspace rather than buried at the bottom of a navigation rail.
- Primary destinations remain `Trip · Itinerary · Map · Guide · Split`; Search remains visually separate from that destination list.
- SOS may occupy the opposite end of the same utility layer.
- Activating Search opens an overlay/panel over the current surface rather than first navigating to a dedicated Search page.
- Current-trip scope is visually clear and ranked first when a trip is active; global Waypoint content follows when relevant.
- Search results use large readable rows and group only real traveler-facing Waypoint objects/canonical sections.
- Selecting a result preserves context when useful: a place can focus Map, an itinerary result can open the correct day/stop, and Guide content can deep-link to the exact section.

## 3. Mobile — top-of-page state

At the natural top of a major surface, show a real, easy-to-discover Search field such as:

`Search this trip, places, guides…`

The field is large enough for outdoor/glance use and remains visually part of the global utility layer rather than the content body.

## 4. Mobile — scrolled state

Search must remain reachable **anywhere on the page** without consuming a permanent large header.

- As the traveler scrolls, the expanded field smoothly compresses into a compact sticky Search control in the top chrome.
- The compact control remains at least field-safe/touch-safe in size and is never gesture-only.
- A short return toward the top may re-expand the field naturally with the surrounding chrome.
- Do not add a persistent bottom-right Search FAB; bottom space belongs to global navigation, contextual sheets, and surface-specific actions such as Split's Add Expense.
- Do not keep the full search field permanently sticky while deep in content; it wastes scarce mobile vertical space.

Optional enhancement: a deliberate pull-down from the true top may focus/reveal Search, but visible controls remain the reliable path.

## 5. Activated mobile Search

Tapping either the expanded or compact control opens one focused full-height search sheet/overlay:

- keyboard/search input focused immediately;
- current trip ranked first when applicable;
- large object-type results;
- dismiss returns the traveler to the **exact prior surface and scroll position**;
- no duplicate per-page search state.

The activation animation should preserve spatial continuity: compact control → focused search sheet. Reduced-motion mode performs the same state change without choreography.

## 6. Result content and actions

The final mockup is directional composition, not factual authority. Production Search must not inherit generated/mockup-only content.

Allowed baseline result sources/actions are those actually supported by Waypoint or explicitly approved in D6, including:

- current guide/site indexed sections;
- canonical places as the semantic-object layer lands;
- itinerary days/stops as the semantic-object layer lands;
- Guide/context knowledge modules as D6-53 is implemented;
- direct deep links into the exact canonical object/section;
- context-correct actions such as `Open day`, `Open guide`, `View on map`, `Navigate`, or equivalent when the underlying feature exists.

Do **not** infer from generated mockups that Waypoint has ratings/review counts, generic popularity rankings, AI answers, recommendation feeds, arbitrary Notes search, lodging/food engines, scan/add ingestion, Share/Save actions, or other features unless separately implemented and approved.

## 7. Visual language

- Preserve the current Waypoint visual system and approved destination-immersive desktop shell.
- Search results sit on a distinct high-contrast working surface above any immersive backdrop.
- Use Literata for editorial/display moments and Atkinson Hyperlegible Next for controls/results/data.
- Use larger information atoms rather than miniature filter/pill density.
- Filters/group selectors appear only where the underlying indexed object types justify them.
- No command-palette styling, developer terminology, generic AI-gradient treatment, or decorative pill soup.

## 8. Acceptance test

Search passes when all of the following are true:

1. A new user can find Search immediately on desktop.
2. A mobile traveler can invoke Search at the top of a page and after scrolling far down without hunting or returning to the top.
3. Dismissing Search restores the exact prior context.
4. Search is never mistaken for a sixth destination/tab.
5. Current-trip content clearly outranks broader content when appropriate.
6. Results deep-link to real Waypoint content rather than invented recommendation output.
7. The UI remains useful with the current build-time index before richer semantic search work lands.
8. 320px reflow, keyboard/focus, reduced motion, and degraded/offline behavior retain a usable search path to locally indexed/cached content where available.

## Final decision

**LOCKED:** Desktop uses a prominent persistent global Search field in top/utility chrome. Mobile uses an expanded Search field at the natural top, a compact sticky Search control while scrolled, and one focused full-height Search overlay from either state. Search never disappears, never becomes a sixth destination, and never becomes an AI/chat/recommendation product by default.
