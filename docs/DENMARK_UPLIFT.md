# Denmark uplift — bringing the guide to the current standard

**Status: DRAFT PLAN. Not scheduled.** Denmark stays an archive for now (maker's call,
2026-07-17). This is what the work would be if that changes.

> **This document was wrong three times before it was right, and every correction came from
> running something rather than reasoning about it.** (1) "Denmark is half a guide" — the
> line count says so; the field-by-field count says its days are *fully* populated and it has
> more of them. (2) "Add a weather section, ~15 min" — I added one, rebuilt, loaded the page:
> it renders nothing, because the service refuses to forecast a concluded trip. (3) "Add
> weather to the scaffold so it can't be forgotten" — it's been there all along, with a
> capital-city coord fallback, verified by scaffolding a throwaway guide. Each wrong version
> was plausible, internally consistent, and would have aimed real work at nothing. If you
> extend this plan, extend it the same way: **check the claim before you cost it.**

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

**2. "A daily weather forecast" — CANNOT be delivered to Denmark. The window has closed.**

My first draft of this document said the fix was "add one `weather` section, ~15 min."
**That was wrong, and testing it is the only reason I know.** I added a real weather section
to Denmark, rebuilt, and loaded the page: the strip stayed hidden, nothing fetched, nothing
cached. Not a bug — `guide-ui.js:784`:

```js
var isPastTrip = hasTripDates && todayMid > tripEnd;
// A concluded trip has nothing useful to show …
if (isPastTrip) return;   // skips the network call entirely
```

The weather service is **correct and deliberately refuses to forecast a trip that already
ended** — the same "don't show misleading weather" reasoning as its beyond-horizon guard,
just checked before the network call. Denmark ended Jun 16; Korea ended Jul 15. Both past.
**A weather section added to either today renders nothing, forever.** The feature was never
broken and was never really "unadopted" either — it simply needed to exist *during* the
trip, and on Denmark it didn't.

So the honest statement of this gap: **the forecast was askable-for and deliverable in June,
and the guide didn't have the section.** There is no retrofit. The only thing left is the
lesson, and it belongs to guide #3:

→ **Guide #3 is already protected — no action needed.** I was about to recommend adding
`weather` to the scaffold's defaults; checking first showed `scaffold-guide.mjs:78` has done
it all along, and `coords` falls back to the country capital, so *every* scaffolded guide
gets a weather section whether or not `--lat/--lng` is passed. Verified by scaffolding a
throwaway guide with no coords: `weather: 1, map: 1`. **Denmark's missing forecast is a
legacy artifact** — it predates that backbone. There is nothing to fix and nothing to
harden.

(Denmark does have the prerequisite — a `map` section at Copenhagen 55.676, 12.568 — so the
section would have worked in June. That's what makes this a miss rather than a limitation.)

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

**B. Weather — NOT DOABLE. Removed from this plan.** See above: the service skips concluded
trips by design, so a section added now renders nothing on Denmark or Korea. The action
moved to guide #3 (scaffold default), where it can still work.

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

**Do A (~30 min). That is the entire honest uplift.** Tagging `energy` is the only item here
that both works on a past trip and answers something real — and it's pointed straight at the
party whose whole trip was shaped by not being able to walk far.

Do **C** partially and without `strict`. **Skip D.** **B is impossible** — see above.

Which means the answer to "whip Denmark into Korea's shape" is: **there is far less to do
than the line count implies, and most of what's left can't be done at all.** Two of the three
things Denmark was missing were features that shipped after its trip; the third had a hard
expiry that passed. That is not a content debt to repay — it's a timing fact to record.

**The real lesson is the one with teeth, and it's for guide #3, not Denmark:**

1. **A guide isn't finished when it ships — it's finished when it's at the current
   standard.** Denmark's traveller got the June site. Nobody went back.
2. **Some features have a hard expiry, and the platform already knows it.** The weather
   forecast could only ever be delivered *during* the trip window — `guide-ui.js` skips
   concluded trips on purpose, and the scaffold has pre-wired a weather section all along.
   Denmark simply predates that backbone. Nothing to build; the guard rail exists.
3. **`energy` tagging matters most for the party least able to absorb a bad day** — and got
   0/9 on exactly that party. Tag it at authoring time, from the intake's mobility answers,
   not retroactively from a post-mortem.

Denmark stays an archive. Its value now is as evidence, and it has already paid for itself:
the party split in `TRAVELER_PATTERNS.md`, the structure-vs-roaming finding, and the three
lessons above all came out of a trip nobody will take again.
