# Korea 2026 — learnings (maker's private synthesis)

**Trip:** Seoul · Daejeon · Busan, Jul 8–15, 2026 · 3 travelers.
**Status: PRE-REFLECTION.** No post-trip critiques have been submitted yet, so this file
records only what is *evidenced* — planning-time constraints and the divergences visible in
the guide's own history. **Nothing below is a claim about how the group felt or what they
skipped; there is no data for that yet.**

## What this file is (and isn't)

- A **synthesis**, not a dump. Raw traveler critiques from the Trip Feedback survey
  (`freeform`) are **never pasted here verbatim** and never rendered in the app — they get
  summarized and anonymized into patterns.
- The **public** counterpart is the guide's `learnings` block (the curated post-mortem the
  Learnings tab renders). This file is the working notes behind it.
- Cross-trip patterns graduate to `docs/TRAVELER_PATTERNS.md`, which the
  `waypoint-guide-author` skill consults when building the next guide.

## Evidenced divergences (plan vs. what the plan became)

These are drawn from the guide's git history — the plan demonstrably moved during the trip:

1. **Monday Busan was rebuilt mid-trip.** The original Monday day trip was re-cut around new
   KTX times (Daejeon→Busan 10:44→12:53; Busan→Seoul 18:00→20:52) and re-clustered into one
   eastern pocket — Bonjeon Dwaeji Gukbap near Busan Station → T1 Base Camp Busan (Haeundae)
   → Haeundae Beach — to fit roughly 4.5 hours of real exploration in July heat.
   *Learning candidate:* a fixed-train day trip should be planned backwards from the return
   train, in a single pocket, budgeting ~4–5 usable hours rather than the full window.

2. **The group forked.** A solo Tokyo weekend (Jeju Air, Sat Jul 11 → Mon Jul 13) was added
   for the third traveler after the guide was already live, forcing a carve-out of the
   shared Sat–Mon itinerary *and* the budget.
   *Learning candidate:* assume a multi-person trip may fork; keep per-person maths and
   "the 3 of you" phrasing derivable rather than hardcoded.

3. **Monday Busan was re-plotted a SECOND time — from inside Busan.** An unmerged branch
   (`claude/busan-seoul-itinerary-update-svykyx`, commit `780d1fa`) was written 13:05 KST on
   Mon Jul 13 — roughly 12 minutes after the 12:53 arrival. It never merged, so the live
   guide never showed it; but what it *chose* is the signal:
   - **taxi → subway** (Line 1 → Seomyeon → Line 2 → Haeundae Exit 5), explicitly trading
     ~25 min of taxi for a ~55 min predictable ride;
   - **lunch moved off Busan Station onto Gunam-ro** (Choryang Milmyeon / Obok gukbap), so
     lunch + T1 Base Camp + Haeundae Beach all sit on **one street**;
   - **bags into a Busan Station locker** rather than carried;
   - **Seoul reunion moved Jonggak → Jongno-3-ga**, chasing a *late* kitchen (~21:30) plus
     pojangmacha tents past midnight.
   *Learning candidate — the strongest one here:* when this group is under time pressure in
   heat, they don't optimise for speed, they optimise for **predictability and zero
   inter-stop commute** — collapse a day onto a single walkable street even at the cost of
   a slower transit leg. And the reunion venue kept drifting later, which says the
   post-event dinner window was the fragile part of the whole day.

3. **A factual near-miss worth remembering.** A celebration KBBQ venue was initially written
   as hanwoo *beef* when the venue is an aged-**pork** specialist; a Korean primary source
   caught it and the beef pick was replaced (Yakiniku Doryong). Nothing shipped wrong, but
   it is the clearest example of why perishable venue facts get a primary source.

## Open questions — answer these from real critiques

- Which planned stops were actually **skipped**, and why? (heat? fatigue? event overrun?)
- Was the pace right? The itinerary carried 36 planned stops across 8 days.
- Did the MSI-night 8:00–9:30pm dinner window actually work, or did games overrun it?
- Was the Busan day worth the round trip, or should it have been cut?
- Did the Tokyo fork feel good for the group, or did it fracture the trip?

## Next step

Run the reflection pass once critiques exist:
1. Read the feedback (`trips/southkorea/feedback`) + whatever the traveler says directly.
2. Update this file, then promote durable patterns to `docs/TRAVELER_PATTERNS.md`.
3. Author the guide's public `learnings` block (curated post-mortem) — get it approved
   before publishing, since it summarizes other people's critiques outward.
