# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the traveler in the field.** Waypoint is first personal trip infrastructure for the maker, their travel party, and friends/family receiving a guide built for their trip. Non-technical readers should never need to understand the repository, research pipeline, or authoring model.

**Not the current design target:** strangers arriving cold as a mass-market audience. External adoption is an aspiration, not a reason to compromise the current field-use product.

**Tiebreak scene:** on the street, on a phone, mid-trip; one-handed, bright light, poor/no signal, possibly tired or lost. Field need beats desk-planning convenience when they conflict.

## Product purpose

Waypoint produces **verified, personalized, actionable, honest travel guides** backed by a research/verification pipeline rather than plausible model output.

Success means:

- the trip goes better because the needed answer/action appears at the right moment;
- perishable facts survive scrutiny or remain honestly blank;
- the product is materially better than generic aggregator/AI itinerary output;
- post-trip reality/Plan-vs-Actual/Learnings improve later travel knowledge without silently rewriting verified truth.

Positioning: **the research pipeline is the backend.** Personalization precedes content; verified facts carry evidence/freshness; honest gaps remain gaps.

## Operating contexts

- **Mid-trip:** dominant read; offline-capable, glanceable, thumb-prudent; “what now?” and SOS remain immediately reachable.
- **Pre-trip:** plan inspection, bookings/readiness, itinerary/map context, Guide reference, trip-specific expense splitting.
- **Post-trip:** editorial recap, Plan-vs-Actual, structured Trip Feedback and Learnings.
- **Authoring:** structured guide content validated by build/tests; malformed or unsupported truth fails closed.

Sights and Food remain repositories, not itinerary echoes: a traveler who exhausts the plan should still have useful researched options.

## Stable traveler architecture

Primary destinations are **Trip · Itinerary · Map · Guide · Split**. Atlas is the world/trip entry surface. Search and SOS are global utilities. Learnings lives inside Trip.

No generic Tools/More destination, Story Mode, voting/shared-readiness product, Trip Kit, adaptive/reordered primary navigation, or command-palette identity is part of the current product.

The **sole visual/interaction design authority** is `docs/reference/design-system.md`. No other design handoff/spec/research packet is current authority. Machine tests, tokens and the component registry enforce implementation but do not form a second design packet.

## Capabilities and constraints

Current/reconciled capabilities include day-by-day itinerary/Plan-vs-Actual, trip lifecycle/arrival focus, sights/food/place references, canonical coordinates and map context, transit/navigation handoff, verified phrase/entry/emergency guidance where content supports it, Trip Learnings/feedback, trip-specific cost splitting, Search, exports where applicable, offline PWA behavior, and config-gated connected mapping.

Technical constraints:

- **Static Astro site** on GitHub Pages under a base path; internal links respect `import.meta.env.BASE_URL`.
- **Core function must remain useful without paid services.** Google Maps may enhance connected state behind config/quota restrictions; OSM/no-key and written/offline fallbacks remain usable.
- **Third-party SDKs are config-gated and lazy-loaded.**
- **Perishable facts live in structured registries** with claim/value/source/verification/freshness/state; unresolved truth is not fabricated for presentation.
- **Shared components are global; destination variation is data/content, not forked product code.**
- **Tests are zero-network where designed and exact-head CI is release authority.**
- Semantic travel objects should use stable IDs/relations/provenance and remain knowledge-graph-ready without requiring a full graph before the October trip.

Explicitly undecided at product level: whether Waypoint later becomes a product designed for people outside the maker’s circle. Nothing in the September implementation assumes that expansion.

## Brand commitments

- **Name:** Waypoint (repo `Trip-Guides`).
- **Public promise:** “Travel guides that show their work.”
- **Voice:** practical first, plain/non-technical, concrete, checkable, restrained personality; atmosphere only when supported and useful.
- **No fabricated social proof or business claims:** no invented testimonials, user counts, traffic, revenue, pricing, team or press.
- **Self-hosted/offline-correct assets and typography.**

## Evidence on hand

The repository contains real researched guide/content fixtures (including Korea and Denmark), primary-source citations/verification dates, structured post-trip evidence, generated build-time counts, and Pipeline V2 validation evidence. Historical/deleted guide fixtures may remain solely as regression evidence where explicitly owned by tests.

## Product principles

1. **Verified or blank — never plausible.**
2. **The traveler on the street outranks the reader at the desk.**
3. **Personal beats generic comprehensive coverage.**
4. **Surfacing beats sourcing:** verified information must be reachable when needed.
5. **Open, not crowded:** hierarchy and progressive disclosure beat feature/card accumulation.
6. **One canonical truth, many projections:** Trip, Itinerary, Map, Guide, Search and other surfaces should not create competing copies of the same fact/object.

## Accessibility and inclusion

WCAG 2.2 AA is the binding floor plus Waypoint’s field-use requirements. The exact responsive, typography, touch, long/CJK text, text-zoom, reduced-motion, dark/light, offline/degraded, safe-area and visual-acceptance contract is defined once in `docs/reference/design-system.md`.
