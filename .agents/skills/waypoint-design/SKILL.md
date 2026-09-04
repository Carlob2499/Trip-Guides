---
name: waypoint-design
description: Design or implement Waypoint UI while preserving the sole design authority, factual truth, responsive siblings, and field-use constraints.
user-invocable: true
---

## Read first

For every visual/frontend task, read `docs/reference/design-system.md` first. It is the **only human-readable design authority**.

Then read only the affected production component/style/model files and the tests that gate the change. `PRODUCT.md` owns product purpose/capabilities. `docs/reference/component-registry.json` is a machine-facing shipped-component inventory, not design authority.

Do not search for or resurrect historical design handoffs, prototypes, screenshots, archived redesigns, old motion specs, research packets, or PR prose as alternate authority. Those live in Git history only.

## Scope boundary

This skill owns presentation, not destination truth.

- Preserve factual guide values verbatim during presentation work.
- Creating/correcting/verifying prices, hours, venues, transit, events, itineraries or recommendations belongs to `waypoint-guide-author`.
- Never invent data, people, statuses, actions, ratings, live state or controls to make a layout look complete.

## Non-negotiable contract

1. Field-first: the traveler on the street wins tradeoffs.
2. Stable destinations: `Trip · Itinerary · Map · Guide · Split`; Atlas one obvious action away; Search and SOS global.
3. Responsive sibling compositions; mobile is not compressed desktop.
4. Hierarchy before features; composition before card count.
5. Useful imagery may be prominent, but operational truth stays on readable Waypoint working surfaces.
6. Truth remains visible: missing/stale/uncertain/conflicting/offline states are honest.
7. Preserve approved tokens/type and robust CJK/system fallbacks.
8. Motion explains state/orientation; no scroll hijack, Story Mode, or top-level swipe navigation.
9. 320px reflow, ~44px key targets, text zoom, long/CJK text, keyboard/touch, reduced motion, safe areas, dark mode and degraded/offline states are acceptance requirements.
10. Merge before adding; retire before replacing; do not restore obsolete Tools/More, adaptive nav, Story, Trip Kit, voting/shared-readiness, command-palette or dashboard lineage.

## Visual acceptance

Functional green does not equal visual green. Follow the visual-fidelity program in `docs/reference/design-system.md`:

- first implement/rework only the South Korea **active Trip mobile** and **Itinerary desktop workbench** canary;
- compare production renders against the creator-approved target descriptions;
- do not expand the visual sweep while the canary is materially off-target;
- require explicit creator visual acceptance before regenerating final screenshot baselines;
- baselines are regression locks, never design approval.

## Execution rule

Do not reopen settled design questions. Ask only for a genuine creator fork explicitly listed as open in the sole design authority, or for a newly demonstrated accessibility/truth/feasibility conflict. Otherwise choose the safest implementation consistent with the authority, test it, and continue.
