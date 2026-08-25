# Product UI Contract

> **Approved product behavior for DS1 calibration; not a claim that the redesign is shipped.**
> This contract is separate from fonts, radii, color, depth, imagery, and motion. Those may
> evolve without changing the traveler model below.

## Fixed information architecture

The traveler product has five persistent top-level destinations, in this order:

**Today · Itinerary · Map · Split · Guide**

Search and SOS are global. Do not replace the five destinations with adaptive ranking, hide a
destination behind telemetry, or turn current R5 group tabs into the product IA.

## Today

An active trip opens to Today. The timeline comes first, followed by only a few high-value
operational cards. Warnings appear when they matter.

Within seconds Today answers:

- Where am I?
- What is next?
- When should I leave?
- How do I get there?
- What is the fallback?

Weather stays compact unless it changes the plan. Fallbacks usually remain hidden until they
become relevant.

## Itinerary

Itinerary is the day-by-day organizing surface. The verified traveler plan is read-only to
group members. Optionality and open windows are legitimate planned states, not missing data.
The interface may show plan versus reality where real feedback exists; it never invents an
actual layer.

## Map

Map is a major product surface for spatial reasoning, nearby options, route context, and
backup comparison. It is not turn-by-turn navigation. Full maps belong here; route traces and
geographic context may also connect other surfaces when useful.

## Split

Split is a first-class shared ledger. Current settlement is primary. It does not nag and does
not seed forecast spending as debt. Offline edits and data integrity are protected; a failed
connection may delay synchronization but must not take away the trip.

## Guide

Guide is rich and editorial for food, sights, and culture, and concise where the traveler is
performing an operational task. It supports contextual verification and evidence depth.
Repositories remain broader than the itinerary so the traveler still has options when the
plan changes.

## Global Search

Search searches the whole trip: itinerary, guide repositories, reservations, notes, and other
available trip records. Results preserve context and open the right destination/state.

## Global SOS

SOS remains reliable, obvious, and quickly reachable. Emergency actions and critical state do
not depend on animation, network success, or color alone.

## Group behavior

Group members may change shared trip state such as:

- expenses;
- reminders;
- saves, completion, and feedback; and
- shared notes.

They may not rewrite the verified itinerary. The trip has one scratchpad, not a separate
Documents hub or Trip Prep hub.

## Offline and failure behavior

Assume poor connection, low battery, interrupted synchronization, and cached content. Core trip
content and actions remain available wherever the existing product contract supports them.

> A failed connection may delay synchronization. It must not take away the trip.

Communicate queued, stale, unavailable, conflicting, or local-only state honestly. Never turn
network uncertainty into false success or delete a traveler's local record silently.

## Mobile field principle

Assume glare, one hand, fatigue, little patience, and a need to act quickly. Mobile prioritizes
without removing capability. Desktop uses its space to reveal relationships, compare options,
and support planning.
