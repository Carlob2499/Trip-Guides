# Research Depth — scale effort to decision impact

Binding for every research pass. The principle in one line: **research depth scales with
decision impact, disagreement, booking friction, and transport risk** — not with a checklist.
Casual stops do not owe forensic detail; the trip's anchors do. Time spent researching matters
less than token efficiency and final quality.

## Disagreement — investigate what could change the answer

If evidence strongly disagrees AND the disagreement could change the recommendation, spend
extra research effort investigating why. Record the investigation and its resolution (V2:
`evidence.v2.json` `disagreements[]`, impact `recommendation-changing` | `minor`). For every
recommendation-changing disagreement, also record `evidenceIds` naming at least two distinct
existing evidence records that actually disagree; prose alone is not proof of a conflict.
Do not waste tokens on trivial disagreement — two blogs disputing which gate is prettier is
not an investigation, two sources disputing whether the last train exists is.

## Reservations — a major research focus, scaled by importance

The closest restaurant should not automatically win; food quality is heavily weighted, and
meaningfully better experiences tolerate more inconvenience (larger groups shift the balance
toward logistics; solo travel tolerates much more detour and friction).

For **serious finalists and anchors** (not every casual lunch), research as relevant:

- official booking link/provider · booking release window · the **exact date to attempt
  booking** · party-size rules · deposit/prepayment · cancellation/no-show rules
- foreign phone/account restrictions · foreign-card compatibility if knowable
- last seating · walk-in viability · alternative booking methods · fallback if booking fails

**Unconfirmed local booking leads are allowed and labeled.** If local reports say concierge
booking may work but it is not officially confirmed, record it as an `unconfirmed-lead` (V2:
`reservations[].leads[]` with `status`) — never promote it to a confirmed booking method
without current evidence, and actively confirm it for exceptional experiences when practical.

**Easier booking wins when the quality difference is small.** When the difficult option is
meaningfully better and a practical workaround exists, preserve it — as **Worth the Effort**
(booking/logistics friction) or **Worth the Detour** (distance). Exceptional but inconvenient
options never silently disappear; a shipped or detour-retained candidate may carry the label
(V2: `candidates[].worth`). Hidden gems earn a place by being genuinely better, unusually
special, or crowd-avoiding — obscurity alone is not merit.

## Transport — robust door-to-door, simple where forgiving

Optimize for realistic, robust door-to-door travel, not the fastest theoretical route. When
transport is forgiving, keep research and presentation simple — routine city transit stays a
one-liner. When a route is fragile or failure would materially hurt the trip (risk R3+),
research the physical reality (V2: `transport[]`):

- real origin/destination · exact service · service-date validity · weekday/weekend/holiday
  differences · transfer time AND the physical transfer (station layout, walking burden)
- luggage/group/mobility effect — six travelers with suitcases are not one solo traveler
- ticket method · reservation requirement · missed-connection consequence · next service ·
  last practical return · fallback · local-language stop names · offline instructions

A timetable connection is not automatically a good connection — for important or tight
transfers, verify the transfer is physically realistic. Sometimes the right conclusion is that
a taxi or another mode is more sensible. Prefer a slightly slower but much more robust route
when missing the fast one causes a major problem. Research fallbacks even when they won't all
be shown; surface detailed fallback instructions only where the risk justifies it.

## Contingencies — high-risk days get a plan, simple days don't

Check important itinerary days for their likely failure modes: closure, bad weather, late
events, missed transport, reservation failure, excessive walking, fatigue, sold-out tickets,
holiday closure, redundant activities. A fallback should ideally fail DIFFERENTLY from the
primary plan (an outdoor backup for a rained-out outdoor day is not a backup). Simple low-risk
days do not need a disaster plan; the day `plan_b` mechanics live in `block-types.md`.

## Freshness — category-specific, with recheck dates

Facts age at different speeds; `shelf_life` categories (`src/lib/staleness.ts`) carry that.
Two V2 additions:

- **Important volatile facts get a meaningful recheck date** — the date by which the fact must
  be re-verified to still be trusted, not a generic stamp. The pre-trip sweep re-checks
  high-risk facts close to the day they matter.
- **Recurring events: prior-year data is a LEAD, never a confirmed date.** Last year's festival
  dates suggest the recurrence window and nothing more. A future-year date ships only from a
  current official announcement; until then it is `⚠ expected around <window>, unconfirmed` or
  omitted. Writing last year's pattern as this year's schedule is a fabrication with a
  citation.

## Research memory — memory proposes, current research verifies

Previous research may accelerate future trips, but **memory is not proof**. A remembered venue,
price, or booking method enters a new guide only after current re-verification — historical
research is inspectable lead memory, nothing more. Rejected high-quality candidates are worth
remembering when the rejection reason could change on a future trip ("closed for renovation
until 2027" is a future lead; "tourist trap" is not). Learn source usefulness by claim type,
not one global trust score.
