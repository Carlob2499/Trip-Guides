# Kickoff prompt for Claude Code

Paste the block below into Claude Code, with the bundle in the repo (or attached). Fill in the
**seven answers** first — they are the things only you know, and Claude Code will otherwise
either guess or stall.

---

## Answers Claude Code needs from you

Fill these in before starting. They map to the "Open questions" list in `README.md`.

1. **Home base** for the globe's route traverses — the airport or city you actually depart
   from. The prototype guesses LAX.
2. **Exchange rates** — should the split tool pull live rates through
   `src/features/live-data/model/rate.ts`, or keep showing "no local rate captured" for the
   three guides without a sourced rate?
3. **Denmark's party size** — absent from its budget section. What is it?
4. **Traveller names** — does the Firebase room supply them, or should the split keep
   placeholders until someone types them?
5. **Japan holiday data** — fetch `JP-2026` into `src/data/holidays/`, or leave the tool
   honestly reporting no record?
6. **Scope** — which of these twelve shipped features need a design pass rather than being left
   alone for now: budget-pact, trip-kit, change-request, voting, share panel, story mode,
   learnings survey, field-tools, palette, SOS, telemetry, About/health pages.
7. **Delivery** — one branch and one PR, or staged PRs per phase (see the sequence below)?

---

## The prompt

```
I'm redesigning Waypoint (this repo). The design is finished and handed off in
design_handoff_waypoint_atlas/. Implement it.

READ FIRST, IN THIS ORDER
1. This repo's CLAUDE.md — the architecture contract, the silo boundaries, and the
   conventions. Nothing in the handoff overrides it.
2. design_handoff_waypoint_atlas/DESIGN.md — the design system. This SUPERSEDES the
   DESIGN.md currently at the repo root; replacing it is part of the job. Its Named
   Rules each state the reason they exist — honour the reasons, not just the rules.
3. design_handoff_waypoint_atlas/README.md — screens, exact specs, motion timings,
   state, and the mobile-navigation lessons. Self-sufficient; read it fully.

WHAT THE BUNDLE IS
The files in prototype/ are DESIGN REFERENCES built in HTML. They are not production
code. Recreate them in this repo's existing stack — Astro pages and layouts, vanilla JS
feature modules under src/features/, pure logic under src/lib/, DOM scripts under
src/scripts/, plain CSS under src/styles/. Do not introduce React. Do not copy the
prototype HTML into the repo.

TWO EXCEPTIONS
- prototype/atlas-map.js is a dependency-free custom element and can be used almost
  as-is. It needs d3 and topojson-client. Put it in src/features/atlas/ui/.
- prototype/trip-split.js is a JS port OF THIS REPO'S OWN
  src/features/trip-split/model/{money,settle,summary}.ts, made only so the prototype
  could run. DO NOT port it back. The TypeScript originals are the source of truth and
  they have tests.

REUSE, DON'T REBUILD
The tools in the design are already backed by logic in this repo. Wire the new UI to
these rather than reimplementing:
- src/lib/jetlag.ts + src/lib/tz-offset.ts   → the jetlag tool
- src/lib/holidays.ts + src/data/holidays/   → the closures tool
- src/lib/staleness.ts                       → the provenance popover's staleness line
- src/features/trip-split/model/*            → the split tool
- src/features/route-opt/model/optimize.ts   → route order
- src/features/mobile-nav/model/*            → the mobile bottom bar, yielding chrome,
                                                and swipe. Keep the constants exactly.
- src/lib/accent-tokens.ts, src/lib/contrast.ts → all colour derivation

SUGGESTED SEQUENCE (each phase ships independently)
1. Tokens and the panel. Update DESIGN.md, reconcile base.css to the variable contract,
   then build the panel component — collapse, drag-reorder, persisted order — and the
   panel grid with its three anti-dead-space rules. Everything else sits on this.
2. The guide sheet. Move the sixteen section renderers onto panels. Masthead as a plate;
   remove the graticule from guide photography. Notation layer: provenance dot with the
   staleness popover, flag chips, stamps, the gap state.
3. The hub. atlas-map.js, the overlays, the pin-card collision solver, table view with
   cross-guide search, and the cover with its iris transition.
4. Mobile. Bottom bar wired to the existing rank model, yielding chrome, swipe, the
   Groups sheet, ping sheet, safe-area insets, viewport-fit=cover.
5. Tools. The five tools, each seeded from the guide's own record, reachable from all
   four entry points with a single data-load guard on the tools screen.

NON-NEGOTIABLE
- Every colour comes from a CSS variable. The one literal allowed is #9c4421 (identity
  data, same in both themes).
- Nothing gets authored content. If a fact can't be sourced, the interface says so in
  ochre. The prototype had invented jetlag advice, holiday lists, and reminders at one
  point; all three were replaced with the repo's own data and that is how it must stay.
- prefers-reduced-motion disables motion entirely, never softens it.
- 44px minimum tap targets; every fixed edge padded with max(reserved, var(--safe-*)).
- Run the axe gate after any colour work. Two pairings are new and unverified: the 10px
  oxide panel kicker on --card, and ochre at 9.5–10.5px.
- Keep everything working offline that works offline today.

TELL ME BEFORE YOU BUILD
Read the handoff, then come back with your implementation plan and anything in it you
think is wrong or risky. I'd rather argue about the plan than the diff.
```

---

## What to say if Claude Code proposes shortcuts

Three shortcuts are tempting and all three are mistakes the prototype already made and had to
undo:

- **"I'll use masonry for the panel grid."** Tried; it packs tightly but destroys reading order
  and needs constant JS re-measurement. Stretch rows plus sorting collapsed panels after open
  ones achieves the same density with no measurement at all.
- **"I'll position the globe's pin cards with `left`/`top`."** That forces layout every frame
  and visibly stutters. Transform only, solver in idle time.
- **"I'll seed the split tool on first render."** The guide cache may not exist yet; a seed
  built without the budget section must be provisional, and every entry point into Tools must
  load the trip's data.
