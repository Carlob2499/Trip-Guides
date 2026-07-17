# Denmark uplift — bringing the guide to the current standard

**Status: DRAFT PLAN. Not scheduled.** Denmark stays an archive for now (maker's call,
2026-07-17). This is what the work would be if that changes.

**Why this exists.** Denmark's post-mortem rated the itinerary *"marginally useful"* and
said it should have been at Korea's standard, naming two missing features. This plan is
the measured answer to that — and the measurement matters, because the headline number is
misleading.

---

## What the gap actually is (measured 2026-07-17, not estimated)

The line count says Denmark is half a guide: **1,491 lines / 39 sections** against Korea's
**2,871 / 73**. That framing is wrong, and acting on it would waste the effort.

Denmark is **not** thin where it was accused of being thin:

| | Korea | Denmark |
|---|---|---|
| Itinerary days | 8 | **9** |
| Days with `tldr` | 8/8 | **9/9** |
| Days with `pace` | 8/8 | **9/9** |
| Days with `fit` | 8/8 | **9/9** |
| Days with `checklist` | 8/8 | **9/9** |
| Days with `body` | 8/8 | **9/9** |

Every structural field is fully populated on every day. Denmark has *more* days than Korea.
The real difference is **prose depth per day** (~21 lines/day vs ~53) and **reference
breadth** (39 sections vs 73), not missing structure.

### The two features that were asked for by name

**1. "The same scrolling itinerary that Korea had" — ALREADY DONE. No work required.**

This is the important finding. It renders on Denmark *today*, identically to Korea
(`planner-days` deck present on both, 9 `tldr`s vs Korea's 8). It was never a Denmark gap —
it's a **timing** gap:

| | |
|---|---|
| Denmark trip | **Jun 8–16** |
| Concise day cards shipped | Jun 25 — *after* |
| Itinerary silo + day rail | Jul 11 — *after* |
| Korea trip | Jul 8–15 |

The feature shipped between the two trips. Denmark was travelled on the pre-June-25 site;
Korea got the post-June-25 site. Nothing is missing — the traveller simply never saw it.
**Do not "fix" this.** If it matters, the fix is telling the traveller it's there now.

**2. "A daily weather forecast" — a real gap, and a one-section fix.**

The `weather` section type is **fully built and used by zero guides** — not Denmark's
failing, the platform's. Schema type ✓ · `WeatherBlock.astro` ✓ · 12 refs of forecast code
in `guide-ui.js` ✓ · live Open-Meteo fetch ✓ · **0 guides use it.** Same
built-but-unadopted pattern as the staleness pill (fixed 2026-07-17) and the shelf-life
categories (fixed same day).

Denmark already has the one prerequisite: a `map` section at Copenhagen
(55.676, 12.568) — the block reads coords from the guide's first map. Adding one
`weather` section is the entire fix, and it delivers the thing that was asked for.

### The gap nobody asked for, which is worse

**Denmark has 0 of 9 days tagged with `energy`.** Korea has 2 of 8.

`energy` (`packed | balanced | slow`) drives the **Low-Energy toggle**. So the party whose
*binding constraint was mobility* — where walking distances collapsed the Malmö day and
pushed everyone into Uber — got **zero** low-energy tagging, while the party that walks
everywhere got some. That is exactly backwards, and it's the single most on-point thing in
this document.

### Section types Denmark lacks

`infogrid` (Korea ×4) · `habitats` (×2) · `tierlist` (×2). All three are Korea-specific by
nature (GO Fest habitat rotations, raid tiering). **Not a gap** — Denmark has no content
that wants them. Do not add types for parity's sake.

---

## The plan, in cost order

**A. Tag `energy` on all 9 days — highest value, ~30 min.**
Derive from each day's real `pace`/`body`, and from the post-mortem (the Malmö day is
demonstrably `slow`; the Fælledparken ticketed day is `packed`). Turns on the Low-Energy
toggle for the party that needed it most. No research required — it's a judgment over
content that already exists.

**B. Add one `weather` section — ~15 min, delivers a named request.**
`{ type: "weather", group: "Plan", title: "…", note?: "…" }`. Coords already resolve.
Verify it renders (the block self-hides on fetch failure, so confirm the strip actually
appears rather than trusting the build).
→ *Also worth doing for Korea in the same pass* — it has 3 map sections and no weather
either. This is a platform gap wearing a Denmark costume.

**C. Provenance backfill + `provenance: "strict"` — ~2h.**
Denmark carries `≈`/`⚠` flags across 8 files with **zero** `verified_on`. Same treatment
Korea got: date what the stamp can evidence, `shelf_life`-tag it, then flip to strict.
⚠ **Blocker:** Denmark's stamp is a single undated-per-item blob ("✓ Verified Jun 2026 —
…"), unlike Korea's, which records dated re-verification passes. So most sections have **no
evidencable date**. Do not invent one. Realistic outcome: date the handful the stamp
supports, leave the rest undated, and **do not** flip to strict (a half-dated guide under
strict just fails the build — see the skill's warning).

**D. Prose depth — the expensive one, ~1 day+, and probably not worth it.**
Bringing 9 days from ~21 to ~53 lines each is a full research pass on a **completed trip
nobody will travel again**. Every perishable fact re-verified would be re-verifying prices
for June 2026. Recommend **not** doing this. If Denmark is an archive, depth serves nobody;
A + B + C are what make it *honest and current*, which is the part that matters.

---

## Recommendation

Do **A + B** (≈45 min combined) and treat that as the uplift. They're small, they answer
the actual complaints, and B fixes a platform gap that also affects Korea and every future
guide. Do **C** partially, honestly, without strict. **Skip D** — and if Denmark's depth
ever matters again, that's a signal the trip is being re-run, which changes the question.

The larger lesson for the loop, already recorded in `learnings/denmark.md`: **a guide isn't
finished when it ships, it's finished when it's at the current standard.** Denmark's real
failing was never depth — it was that two features shipped three weeks too late for its
traveller, and one of them (weather) hasn't shipped to *anyone* yet.
