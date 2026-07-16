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
- **Under time pressure in heat, this group buys predictability over speed, and hates
  inter-stop commuting more than it hates a slow leg.** The in-Busan re-plot swapped a ~25-min
  taxi for a ~55-min subway ride, moved lunch off Busan Station onto **Gunam-ro** so lunch +
  T1 Base Camp + the beach all sat on **one walkable street**, and put the bags in a station
  locker. **[observed]**
  → *Design implication:* collapse a pressured day onto a single street/strip even if the
  transit leg gets slower. Don't scatter a 4-hour window across a city.
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

## Post-trip reported patterns

*(Empty. The Korea 2026 Trip Feedback collection has no submissions yet, so nothing here is
**[reported]**. Do not invent entries — the honest blank is the feature. Fill this in from
real critiques via the reflection pass; see `learnings/korea.md`.)*

---

## Trips covered

| Trip | Dates | Status |
|---|---|---|
| Denmark (Copenhagen) | — | live; no post-mortem written |
| South Korea (Seoul · Daejeon · Busan) | Jul 8–15, 2026 | live; **post-mortem pending real critiques** |
