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

**The park conflict, resolved (2026-07-17).** The first pass flagged an apparent conflict —
the account named **King's Garden (Kongens Have)**; the guide and the official venue said
**Fælledparken**. Asking rather than guessing dissolved it: *both are true, for different
days.* Fælledparken was the **ticketed in-person park event** and ran as planned. King's
Garden is where the **citywide gameplay day** actually concentrated, against a plan that
mapped the Strøget/Vimmelskaftet and Nyhavn–Kongens Nytorv clusters instead. The LEGO stamp
rally did happen around the city.

**The lesson is about the synthesis, not the trip.** My first pass compressed two different
days into one "GO Fest was great in one park" claim and then flagged the leftover as a
conflict. Nothing was invented, but the *shape* was wrong — a month-old recollection
naturally drops the distinction between "the ticketed thing" and "the roaming thing", and I
took the compression at face value. The real finding was only visible once the days were
separated: **the fixed commitment held and the unstructured day collapsed.** When a
recollection sounds like one event, check whether it was two.

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
- **The ticketed event held; the roaming day didn't roam.** Fælledparken (paid, fixed time)
  ran as written. The citywide day settled into King's Garden instead of the mapped Strøget
  and Nyhavn clusters — concentration over coverage, no commuting between spawn clusters.
  The LEGO stamp rally still worked citywide, because it had specific places to be.
- **Malmö underdelivered.** Little to do once there, and the distances on foot were past what they could manage; the
  half-day ended early.
- **Oslo had almost no slack.** After the guided tour: a pier walk, a Starbucks mug, a
  bakery, back aboard. The "free afternoon" the plan promised didn't materialise.
- **Prices were high across the board** and the guide didn't prepare them for it.
- **Convenience stores were far**, so IKEA and the nearby mall became the default meals.

## What the guide got wrong (product, not content)

Two features were asked for **by name**. Measuring them (2026-07-17) corrected my first
read of both — full workings in `docs/DENMARK_UPLIFT.md`:

1. **Korea's scrolling day-by-day itinerary — already on Denmark, and always was fine.**
   It renders identically on both guides today. This was never a Denmark gap; it's a
   **timing** gap. The concise day cards shipped **Jun 25** and the itinerary silo **Jul
   11** — Denmark was travelled Jun 8–16, Korea Jul 8–15. The feature landed between the
   two trips. Denmark got the old site; Korea got the new one. Nothing to fix; the
   traveller just never saw it.
2. **A daily weather forecast — a real gap, and not Denmark's fault.** The `weather` section
   type is fully built (schema, `WeatherBlock.astro`, 12 refs of forecast code in
   guide-ui.js, live Open-Meteo fetch) and used by **zero guides, including Korea**. Denmark
   already has the Copenhagen `map` section the block reads coords from. One section is the
   whole fix. This is the same built-but-unadopted pattern as the staleness pill and the
   shelf-life categories — a platform gap wearing a Denmark costume.

**And the one nobody asked for, which is worse:** Denmark has **0 of 9 days tagged with
`energy`**; Korea has 2 of 8. That field drives the **Low-Energy toggle**. The party whose
binding constraint was *mobility* got zero low-energy tagging; the party that walks
everywhere got some. Exactly backwards.

**I was wrong about the depth story, and the correction matters.** I first wrote that
Denmark's 190-line itinerary against Korea's 428 measured the gap. It doesn't. Denmark has
**more** days (9 v 8) and every one carries a full `tldr`/`pace`/`fit`/`checklist`/`body` —
the structure is complete. The real difference is prose depth per day (~21 v ~53 lines) and
reference breadth (39 v 73 sections). Reaching for the easy metric and inferring "thin"
from it would have sent a research pass at the wrong target.

**This is the loop working as designed and indicting the loop** — but for a sharper reason
than "Denmark never got the good treatment": two features shipped three weeks too late for
its traveller, and one of them still hasn't shipped to anyone.

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

- Is the mobility constraint permanent for this party, or was it specific to who came?
  It determines whether "step-free" is a hard filter or a preference on the next family trip.
- Does the Denmark guide get retro-fitted to Korea's standard, or is it left as an archive
  of what the standard used to be? It's a completed trip — nobody is travelling it again.
