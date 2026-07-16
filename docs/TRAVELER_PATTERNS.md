# Traveler patterns — how this group actually travels

Cross-trip synthesis consulted by the `waypoint-guide-author` skill during intake and
research, so new guides start personalized instead of generic. Written by the maker, never
auto-generated.

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

## The group

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

## Accommodation

- Airbnb **AC** in Korean summer is not a nice-to-have — its absence was called out as
  genuinely disruptive ("annoying for the price... can be extremely contentious"). **[reported]**
  → *Design implication:* for a summer Korea booking checklist, verify AC explicitly as a
  hard filter, not an assumed amenity.

---

## Trips covered

| Trip | Dates | Status |
|---|---|---|
| Denmark (Copenhagen) | — | live; no post-mortem written |
| South Korea (Seoul · Daejeon · Busan) | Jul 8–15, 2026 | live; **reflected** (1 submission, 2026-07-16) — see `learnings/korea.md` |
