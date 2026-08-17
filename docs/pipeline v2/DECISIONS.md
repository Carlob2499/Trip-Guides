# Waypoint Pipeline V2 — Creator Decisions

Status: LOCKED unless Carlo changes it.

This file is the plain-English source of truth for the new research pipeline.

Do not reinterpret these decisions just because the current code works differently.

## Main goal

Waypoint should produce travel guides that are:

- highly researched
- hard to catch making avoidable factual mistakes
- useful during stressful travel situations
- personalized to the actual group
- efficient with Claude tokens
- easy for one non-engineer owner to maintain

Time spent researching is less important than token efficiency and final quality.

Claude remains the production research backbone for now.

GPT may be tested separately later, but the production pipeline should not depend on both models.

## Research breadth

Do not use fixed candidate quotas.

Research should scale to the destination.

A small town may only have a few serious options. Tokyo may require dozens.

Stop when:
1. new searches mostly produce duplicates or clearly weaker options, and
2. unresolved evidence is unlikely to change the final recommendation.

This is the default research stopping rule.

## Food

Food quality and menu quality matter a lot.

The closest restaurant should not automatically win.

Default behavior:
- choose the best fit for the actual itinerary
- keep food quality heavily weighted
- tolerate more inconvenience when the experience is meaningfully better
- larger groups should make logistics matter more
- solo travel can tolerate much more detour and booking friction

Exceptional but inconvenient options should not disappear. They can appear as **Worth the Effort** or **Worth the Detour**.

Hidden gems are valuable when they are genuinely better, unusually special, or useful for avoiding crowds. Being obscure is not itself a reason to recommend something.

## Native-language research

Native-language research is adaptive.

It becomes especially important when English results are generic, tourist-heavy, thin, contradictory, or clearly missing local information.

Japan and Korea will often need stronger local-language research.

Strong Japanese/Korean/local evidence is valid even if there is little English coverage.

Do not merely translate English queries word-for-word. Search using the way locals actually describe the problem.

Keep a light Pass B audit trail showing:
- what kind of native searches were used
- why they were used
- what useful new information they produced

Do not save every search result.

## Objective facts vs traveler experience

These are different types of evidence.

Objective facts such as opening hours, ticket prices, reservation rules, event dates, and train schedules should normally use official or primary sources.

Experiential evidence such as crowds, queue reality, atmosphere, transfer difficulty, neighborhood feel, or quality decline may be better supported by multiple recent independent firsthand sources.

Do not use an official venue website as fake proof of a subjective claim it does not support.

## Source quality

Source independence matters.

Ten copied articles do not count as ten independent opinions.

For important subjective recommendations, look for firsthand experience, specificity, recency, independence, and exact branch/location when relevant.

SEO and affiliate pages may help discovery, but should carry little weight in final judgment.

If evidence strongly disagrees and the disagreement could change the recommendation, spend extra research effort investigating why. Do not waste tokens on trivial disagreement.

## Reservations

Reservations are a major research focus.

Important restaurants or experiences should get a deeper reservation check.

For serious finalists, research as relevant:
- official booking link/provider
- booking release window
- exact date Carlo should attempt booking
- party-size rules
- deposit/prepayment
- cancellation/no-show rules
- foreign phone/account restrictions
- foreign-card compatibility if knowable
- last seating
- walk-in viability
- alternative booking methods
- fallback if booking fails

Depth should scale with importance.

Do not perform a forensic reservation investigation for every casual lunch.

For the top few candidates, or when solving booking friction could change the itinerary, deeper investigation is justified.

Hotel concierge help is relevant when it could realistically solve an important booking problem. Do not research every hotel concierge in advance.

If local reports suggest concierge booking may work but it is not officially confirmed, keep it clearly labeled as an unconfirmed lead and actively confirm it for exceptional experiences when practical.

In most cases, easier booking should win if the quality difference is small. If the difficult option is meaningfully better and a practical workaround exists, preserve it.

## Transportation

Waypoint should optimize for realistic, robust door-to-door travel, not only the fastest theoretical route.

When transportation is forgiving, keep research and presentation simple.

When a route is fragile or failure would materially hurt the trip, research more deeply.

Important transport research may include:
- real origin and destination
- exact service
- service-date validity
- weekday/weekend/holiday differences
- transfer time
- physical transfer reality
- station/terminal layout
- walking burden
- luggage/group/mobility effect
- ticket method
- reservation requirement
- missed-connection consequence
- next service
- last practical return
- fallback
- local-language stop names
- offline instructions

A timetable connection is not automatically a good connection.

For important or tight transfers, verify that the physical transfer is realistic.

Group size matters. Six travelers with luggage are not the same as one solo traveler.

The system should sometimes conclude that taxis or another mode are more sensible.

In general, prefer a slightly slower but much more robust route when missing the faster connection would cause a major problem.

Fallbacks should be researched even if they are not always shown. Only surface detailed fallback instructions when the risk justifies it.

## Contingencies

Important itinerary days should be checked for likely failure modes such as closure, bad weather, late events, missed transport, reservation failure, excessive walking, fatigue, sold-out tickets, holiday closure, or redundant activities.

Simple low-risk days do not need an elaborate disaster plan. High-risk days do.

A fallback should ideally fail differently from the primary plan.

## Freshness

Different facts age at different speeds.

Freshness must be intelligent and category-specific.

Important time-sensitive facts should have a recheck date.

There should be a pre-trip re-verification sweep, with high-risk facts checked again close to the day they matter when appropriate.

Prior-year event dates may help understand recurrence but must never be presented as confirmed future-year dates.

## Research memory

Previous research may help future trips, but memory is not proof.

**Memory proposes. Current research verifies.**

Reusable memory should reduce repeated work without causing stale information to propagate.

Learn source usefulness by claim type, not one global trust score.

Research memory should only exist if it changes future research choices, reduces unnecessary token use, and remains inspectable by Carlo.

Rejected high-quality candidates may be worth remembering when the rejection reason could change on a future trip.

## Post-trip learning

Carlo is willing to give lightweight feedback when something notably succeeds or fails.

Useful signals include food quality, reservation accuracy, transit stress, walking difficulty, crowd prediction, contingency usefulness, and plan-vs-actual behavior.

Do not turn one result into a permanent personality rule. Repeated evidence should matter more than a single event.

## Tools and APIs

Do not add complicated APIs or MCPs just because they exist.

Normal web research, native-language search, and simple deterministic scripts are preferred for now.

A new tool should become permanent only if it generally improves:
1. discovery
2. correctness

Token/time savings are a bonus.

Do not redesign the system around NAVER, Resy, or similar integrations right now.

## Models

Claude is the production backbone through the current engineering push.

Current Claude pipeline work should continue to use Sonnet intelligently.

Agent count is not sacred. More or fewer agents are acceptable only if testing shows better output quality and/or token efficiency.

GPT can be tested separately later. Do not add GPT into production merely for model diversity.

## Research visibility and cost

Waypoint should eventually measure how expensive it was to create a guide from Intake to Finished.

Useful internal metrics include:
- stage duration
- model
- token usage where available
- tool calls
- searches
- fetches
- retries
- candidates considered
- candidates deeply verified
- facts verified
- disagreement investigations
- native-language research activity
- total run time
- estimated API-equivalent cost when meaningful

This should help answer: **Are newer guides becoming cheaper to research without losing quality?**

Internal research can be deep. Traveler-facing UI should only surface the parts that help the traveler.

Carlo should have a deeper owner view available when he wants to inspect why the system made a decision.

## Deadline

Backend engineering should be effectively frozen by September 30, 2026.

Late September should focus on real-trip simulations, bugs, adversarial testing, offline behavior, mobile behavior, and failure paths.

UI should be finalized immediately after.

Avoid new architecture late in September unless it fixes a serious observed problem.
