# Traveler patterns — how these travelers actually travel

Cross-trip synthesis consulted by the `waypoint-guide-author` skill during intake and
research, so new guides start personalized instead of generic. Written by the maker, never
auto-generated.

> **There is more than one travel party. Check which one you're planning for before you use
> anything below.** This file used to describe a single group; Denmark's post-mortem proved
> that wrong. **Party A** (Korea) is three mid-20s friends who walk everywhere and travel on
> esports/gaming anchors. **Party B** (Denmark) is a five-person family trip where walking
> was the binding constraint. They overlap only in the maker. A pattern proven on one party
> is **not** evidence about the other — applying Korea's pace assumptions to a Party B trip
> is exactly how Denmark's itinerary ended up "marginally useful". Only the
> **Cross-party** section is safe to apply blind.

**Read the provenance tags. They are the point.**

- **[stated]** — the traveler said this explicitly when planning. High confidence.
- **[observed]** — evidenced by what actually changed in a live guide (git history / a
  mid-trip rebuild). High confidence: the plan demonstrably moved.
- **[reported]** — came from post-trip feedback (the Trip Feedback survey / a critique).
- **[hypothesis]** — a hunch worth testing on the next trip. **Never plan around these as
  if they were facts.**

Do not promote a tag without evidence. An empty section is a feature — see CLAUDE.md's
Honest property.

---

## Party A — the Korea three

*Everything from here to the "Party B" heading is Party A only. Evidence base: the Korea
2026 trip, whose post-mortem rests on **one** survey submission — real, but thin.*

- 3 travelers, mid-20s, close friends. Korea 2026 was their first trip **together** in that
  country. **[stated]**
- The group **splits when interests diverge, and that's normal** — don't force a single
  itinerary. On the Korea trip one traveler took a solo Tokyo weekend (Jul 11–13) while the
  other two stayed on the group plan; the guide had to carve him out of the shared
  itinerary + budget mid-trip. **[observed]**
  → *Design implication:* build guides so a day can fork without breaking budget maths,
  ticket counts, or "the 3 of you" phrasing.

## Anchors and scheduling

- Trips are **built around fixed anchor events**, not around a city. Korea 2026 existed
  because of Pokémon GO Fest Global + MSI 2026; everything else bent around those. **[stated]**
- **Esports/event end-times are unpredictable**, and the plan must absorb that. The traveler
  explicitly asked for post-MSI dinner options open **8:00–9:30pm** "due to variances in
  games". **[stated]**
  → *Design implication:* for event days, give a time **window** with venues that survive the
  late end of it — not a single booking that dies if the event runs long.

## Pace, heat and commuting

- **Low-commute clustering is an explicit priority**, especially in heat. The Monday Busan
  day was rebuilt to "combine whatever is possible for highest efficiency and lower
  stress/commute times in this heat". **[stated]**
- **The plan did not survive contact — and was rebuilt TWICE.** Monday's Busan day trip was
  re-cut before the day around new KTX times (Daejeon→Busan 10:44, Busan→Seoul 18:00) into a
  single eastern pocket, then **re-plotted again at 13:05 KST from inside Busan** (an
  unmerged branch, minutes after arrival). **[observed]**
  → *Design implication:* for a day-trip on a fixed train, plan **backwards from the return
  train**, keep stops in one geographic pocket, and assume ~4–5 hours of real exploration,
  not the full clock.
- **Heat doesn't just slow a day down — it can cancel the whole outdoor half of it, on
  repeat.** Real feedback: both Pokémon GO Fest days at EXPO Science Park were abandoned for
  remote play from the hotel room — the park was reported unbearably hot, with few raids
  actually running in person — the same decision made independently both days. **[reported]**
  → *Design implication:* for any full-day outdoor commitment in July/August Korea, build the
  indoor/remote fallback into the plan from the start — not as a contingency footnote, but as
  an equally real branch, since this group took it on consecutive days without hesitation.
- **Rain is a second, near-equal disruptor to heat, and the group is under-equipped for it.**
  Real feedback, summarized: umbrellas didn't keep anyone dry — clothes and especially shoes
  were soaked repeatedly — and the group explicitly asked for better rain recommendations. A
  rain day directly cancelled a planned Secret Garden visit and a planned walk. **[reported]**
  → *Design implication:* July/August Korea guides need explicit waterproof-shoe and real-
  rain-gear advice (umbrellas alone are stated as insufficient), not just a "rainy day
  fallback" panel.
- **This group buys predictability and clustering over almost anything — EXCEPT when a taxi
  is cheap, in which case taxi wins outright.** The unmerged Busan re-plot proposed swapping
  a ~25-min taxi for a ~55-min subway ride to Haeundae; that idea was never actually
  field-tested (the branch wasn't live during the trip). Real feedback says the group **took
  a taxi anyway**, reporting it very cheap and direct. **[observed]** the clustering-onto-one-street
  choice (Gunam-ro: lunch + T1 + beach), **[reported]** that taxi beat subway for the
  connecting leg.
  → *Design implication:* don't reflexively recommend subway-for-cost-savings once a taxi
  fare is small in absolute terms (a few dollars split 2–3 ways) — this group will pay it for
  directness. Cluster the STOPS onto one street; be more careful before also prescribing
  which transit mode connects the cluster to the station.
- Related booking-tool + transit friction, all **[reported]**: Uber (used as a Kakao T
  substitute) was a bad experience on a foreign number — get a Korean e-SIM before relying on
  Kakao T. VIP/first-class KTX sells out **days** in advance; standing-room tickets exist but
  are uncomfortable and not guaranteed — book early. Buses were difficult outside the direct
  Limousine bus. Naver/Kakao Maps were rated distinctly worse than Google Maps or word-of-
  mouth for navigation — don't lean on map-app links alone for wayfinding advice. CatchTable
  under-lists real venues — treat it as one source, not the source, for bookability.
  → *Design implication:* book KTX premium/VIP seats as early as the guide can identify them;
  give written turn-by-turn navigation notes rather than relying on the traveler's own map
  app; set expectations that Kakao T needs a Korean SIM to work well.
- **The post-event dinner is the fragile part of the day.** The Monday reunion kept drifting
  later and toward venues with later kitchens (Jonggak ~21:15 → Jongno-3-ga ~21:30 + pocha
  tents past midnight). **[observed]**
  → *Design implication:* for a late reunion, lead with venues whose kitchens survive past
  23:00 and a no-reservation fallback (pojangmacha / Hongdae), not a place that closes 22:30.
- July in Korea is hot enough that heat was a stated planning constraint, not an
  afterthought. **[stated]**

## Food

- **Korean BBQ with a stated preference for beef.** When the guide offered a pork specialist
  for a celebration meal, the requirement was re-checked and a hanwoo (beef) venue found
  instead. **[stated]**
- Food is a first-class priority, not filler — the group asks for specific venues near the
  route rather than "where to eat in X". **[stated]**

## Money, payment & booking

- Tax-free is easier than expected but inconsistent — some venues (Olive Young) do it
  instantly at checkout, others don't. **[reported]**
- Apple Pay T-money needs a **Korean** credit card; the physical T-money card needs **cash**
  to top up. Don't assume a foreign Apple Pay wallet covers transit. **[reported]**
  → *Design implication:* state the T-money/cash requirement plainly in the money panel
  rather than assuming contactless-everywhere.

## Accommodation (Party A)

- Airbnb **AC** in Korean summer is not a nice-to-have — its absence was reported as
  genuinely disruptive, and framed as poor value at the price paid. **[reported]**
  → See **Cross-party** below: this one replicated on Denmark, so it is no longer a
  Party-A-only observation.

---

# Party B — the Denmark five

*Evidence base: **one recollection, narrated once, a month after the trip**. No Trip
Feedback survey was ever submitted for Denmark. Thinner than Party A's. The patterns are
real; treat any specific as soft. See `learnings/denmark.md`.*

## The party

- 5 travelers on a family trip (a GO Fest pair + "the mums", converging for dinners).
  Not the Party A group; they overlap only in the maker. **[observed]** from the guide's own
  two-crews-two-cities day structure.
- **Walking is the binding constraint, and it is the single most important fact about this
  party.** Subway routes were usable on paper but demanded far too much walking per leg to
  be feasible; taxis were affordable, so Uber became the default mode. **[reported]**
  → *Design implication:* plan for the **slowest walker, not the average one**. Do not
  price a transit route as viable on fare and journey time alone — cost out the walk at each
  end. For this party a cheap taxi isn't a luxury upgrade, it's the thing that makes the day
  happen at all.
- **Step-free beats short.** Stairs at the train overpasses near the base cut off ground
  that a map said was perfectly walkable, and this was called out as a major hindrance to
  finding navigable areas. **[reported]**
  → *Design implication:* for a Party B guide, a route with steps is not a short route.
  Check the base's step-free egress before endorsing the neighbourhood, and say so in the
  guide rather than leaving the traveler to discover it.
- **A cross-border day trip needs a better reason than proximity.** Malmö was cut short:
  little the group wanted to do once there, and walking distances beyond what the group could manage. **[reported]**
- **A cruise port stop has almost no slack.** Oslo after the guided tour amounted to a pier
  walk, a Starbucks mug and a bakery before reboarding. **[reported]**
  → *Design implication:* plan a port day **backwards from the reboarding time**, and treat
  the guided tour as consuming the day rather than seeding it. (Compare Party A's Busan
  day-trip lesson — same shape, different cause: plan backwards from the fixed departure.)
- **Structure holds; unstructured time collapses inward.** The two GO Fest days went
  opposite ways, and the difference wasn't difficulty — it was whether the day had a fixed
  shape. The **ticketed Fælledparken session** (paid, timed, one place to be) ran exactly as
  written. The **citywide day** — a plan that asked them to roam between the
  Strøget/Vimmelskaftet and Nyhavn–Kongens Nytorv spawn clusters — didn't roam at all: the
  group settled into King's Garden, a park the guide never mentions, and played there.
  Tellingly, the **LEGO stamp rally still worked citywide** on that same day, because it had
  specific places to be. **[reported]**
  → *Design implication:* for Party B, a "roam these clusters" day is not a plan, it's a
  suggestion, and it will be replaced by whatever green space is nearest and most
  comfortable. Either give the day a fixed anchor (a ticket, a time, a named place) or
  design it as errands with specific stops — the stamp rally is the working model. Don't
  write a day whose only structure is a suggested route between areas.
  → *Cross-check against Party A:* Korea's GO Fest days collapsed too, but for a different
  reason — heat drove them to remote play indoors. Same outcome (the outdoor roaming plan
  died), two unrelated causes. Don't merge these into one "GO Fest days fail" rule; the
  Party A fix is a heat fallback, the Party B fix is structure.
- Prices ran high across the board and the guide under-prepared them for it. **[reported]**
  → *Design implication:* Nordic budget figures need to be sharp and honest, not indicative.
- Convenience stores were far from the base, so **IKEA and the nearby mall became the
  default meals** — cheap, reliable, close. **[reported]**

## What Party B asked the product for, by name

- A **daily weather forecast** — the weather kept turning over and was hard to plan around. **[reported]**
- Korea's **scrolling day-by-day itinerary** — named explicitly as what would have made the
  days runnable. **[reported]**
- The verdict on the itinerary was **"marginally useful"**, and that it should have been at
  Korea's standard. **[reported]**
  → *Design implication:* this is a **product** finding, not a content one. Both features
  exist and both shipped on Korea. Denmark predates them and never got them. A guide is not
  finished when it ships — it's finished when it's at the current standard.

---

# Cross-party patterns

*The only section safe to apply to any trip. A pattern earns a place here by replicating on
**both** parties — not by seeming general.*

- **AC is a hard booking filter, not an amenity.** Korea: the Airbnb's missing AC was
  reported as genuinely disruptive and poor value. Denmark: the hotel had none and the
  windows stayed open every night. **2 for 2, two different parties, two different
  countries, both summer.** **[reported]**
  → *Design implication:* verify AC explicitly on any summer booking, in the booking
  checklist, as a pass/fail. This is the most strongly evidenced pattern in this file.
- **A cheap, direct taxi beats a clever transit route — every time it has been tested.**
  Korea: the Busan subway plan was dropped for a taxi the group found cheap and direct.
  Denmark: the subway was abandoned for Uber. The *reasons* differ (Party A optimises for
  directness, Party B for not walking), but the decision has never once gone the other way.
  **[reported]**
  → *Design implication:* don't reflexively recommend transit for cost savings when the taxi
  fare is small in absolute terms. Give the taxi option first and the transit option as the
  alternative, not the reverse.
- **Trips are built around fixed anchor events**, and the anchors hold even when everything
  else bends. Korea: GO Fest + MSI. Denmark: GO Fest + the Oslo cruise. **[stated]**

## Which sections actually get used — rank guide #3's tabs from this

Korea's post-mortem tags each skipped stop with the group it belonged to (the Learnings
tab renders the tally). What died on contact, Party A, Korea 2026: **[reported]**

| Group | Planned stops that didn't happen |
|---|---|
| Food & shopping | 5 |
| Sights | 4 |
| Getting around | 3 |
| Pokémon GO | 3 |

Counts, not ratios — the block records what was skipped, never what was attempted, so
there is no honest denominator. Read it as *where the plan over-committed*, not as a
success rate.

→ *Design implication for guide #3:* **Sights is the most over-planned section type for
this group** — four separate stops written up and none reached (Gyeongbokgung, Bukchon,
Changdeokgung/Huwon, the Cheonggyecheon walk), all lost to heat, rain or a group vote.
Write fewer, and make them fallback-aware. **Food & shopping's 5 is a different story** and
must not be read the same way: those weren't skipped from disinterest, they were traded for
something closer (Myeongdong over Apgujeong, a nearer grill over Gobang) — food stayed a
first-class priority, only the *specific venue* lost to distance. Cluster food; cut Sights.

⚠ **This is a Party A signal only, and it rests on one trip.** Denmark's post-mortem
carries no group tags, so there is no Party B equivalent and nothing to compare against.
Do not generalise the table to a family trip.

---

## Trips covered

| Trip | Party | Dates | Status |
|---|---|---|---|
| Denmark (Copenhagen · Malmö · Oslo) | B — family of 5 | Jun 8–16, 2026 | live; **reflected** (1 recollection, 2026-07-17) — see `learnings/denmark.md` |
| South Korea (Seoul · Daejeon · Busan) | A — 3 friends | Jul 8–15, 2026 | live; **reflected** (1 submission, 2026-07-16) — see `learnings/korea.md` |

**Honest note on the evidence base:** every pattern in this file derives from **two trips,
one data point each** — one survey submission and one month-old recollection. That is enough
to plan from and nowhere near enough to generalise from. Weight them as leads that were
right once, not as laws.
