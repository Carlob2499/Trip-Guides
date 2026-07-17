# Denmark 2026 — maker's synthesis

**Trip:** Copenhagen · Malmö · Oslo, Jun 8–16 2026. Five travellers (a family group;
"Mom's group" + the GO Fest pair, all five converging for dinner).
**Post-mortem written:** 2026-07-17, ~1 month after the trip.

**Evidence base — read this before trusting anything below.** No Trip Feedback survey was
ever submitted for Denmark. This synthesis comes from **a single recollection, narrated
once, a month after the fact**. That is thinner than Korea's (itself only 1 submission).
Recall at a month's distance compresses and reorders; treat the *patterns* as real and any
*specific* as soft. Raw narration is never pasted here verbatim — it is summarized, per
CLAUDE.md's Learnings Loop. If a line below reads like a quote, rewrite it.

**One unreconciled conflict.** The account says GO Fest was played in a single park it
names **King's Garden (Kongens Have)**. The guide — and the official venue, verified from
pokemongo.com — was **Fælledparken**. Kongens Have appears nowhere in the guide. Either the
group played somewhere other than the official venue, or the park was misremembered a month
on. Not resolved, not guessed: recorded in both the public block and here as reported.
Worth a direct question before any of it hardens into a pattern.

---

## The headline

The plan's *skeleton* was sound — the anchors (GO Fest, the Oslo cruise) both delivered.
What bent it was **mobility**. This guide was written for people who walk, and it went to a
party that couldn't. That single mismatch explains the Malmö day collapsing, the subway
being abandoned for Uber, the base area being hard to navigate, and probably the general
sense that the itinerary was only "marginally useful".

This is a *different failure mode from Korea's*. Korea's plan died of heat and rain —
environmental, unpredictable, arguably unplannable. Denmark's died of **stairs**, which are
on a map. That's a research failure, not bad luck.

## What actually happened

- **Mobility drove everything.** Subways were usable but demanded too much walking per leg
  — not feasible for this party. Taxis were affordable, so Uber became the default mode.
  The cost of getting this wrong was low (taxis were cheap); the cost of *planning* it wrong
  was a guide the group had to route around.
- **Stairs at the train overpasses near the base cut off otherwise-walkable ground.** The
  area was nice. It was also, in practice, hard to get out of on foot. Proximity on a map
  meant nothing.
- **The hotel had no AC.** Windows open every night. **Second trip running.**
- **GO Fest concentrated in one park worked** — and absorbed most of the days. No commuting
  between spawn clusters. (Park name unresolved — see above.)
- **Malmö underdelivered.** Little to do once there, and the distances on foot were past what they could manage; the
  half-day ended early.
- **Oslo had almost no slack.** After the guided tour: a pier walk, a Starbucks mug, a
  bakery, back aboard. The "free afternoon" the plan promised didn't materialise.
- **Prices were high across the board** and the guide didn't prepare them for it.
- **Convenience stores were far**, so IKEA and the nearby mall became the default meals.

## What the guide got wrong (product, not content)

Two features were asked for **by name**, and both already exist — in Korea:

1. **A daily weather forecast.** The weather was sporadic and hard to plan around. There is
   a `weather` section type; Denmark doesn't use it, or doesn't use it per-day.
2. **Korea's scrolling day-by-day itinerary.** Named explicitly as what would have made the
   days runnable.

And the flat verdict: the itinerary was **marginally useful**, and would have been better
"at the same standard Korea was at". Denmark predates Korea and never got the same depth.
That gap is now measurable — Denmark's itinerary file is 190 lines against Korea's 428.

**This is the loop working as designed and indicting the loop.** Denmark shipped, Korea got
the good treatment, and Denmark was never brought up to it. The feature disparity is the
finding.

## What I changed

- Wrote the public `learnings` block (per-day Plan⇄Actual on the four days there's reality
  for: Jun 10, 12, 13, 15).
- **Split `docs/TRAVELER_PATTERNS.md` by travel party.** It was written as "how *this group*
  travels" — singular — describing Korea's three mid-20s friends. Denmark was five people
  with mobility constraints those patterns say nothing about. Left merged, the next guide
  would inherit advice drawn from the wrong travellers. This is the biggest structural
  change to come out of Denmark.
- Promoted the durable, party-scoped lessons (step-free routing, plan-for-the-slowest-
  walker, port-stop timing) and the one genuinely cross-party pattern (**AC as a hard
  booking filter — 2/2 trips**) into the patterns file.

## Open questions for the next trip

- Which park was GO Fest actually played in? (see above)
- Is the mobility constraint permanent for this party, or was it specific to who came?
  It determines whether "step-free" is a hard filter or a preference on the next family trip.
- Does the Denmark guide get retro-fitted to Korea's standard, or is it left as an archive
  of what the standard used to be? It's a completed trip — nobody is travelling it again.
