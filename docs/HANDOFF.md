# HANDOFF — read this first, then re-prompt the creator

> **Ritual (binding):** at SESSION START, read this file INSTEAD of re-deriving history from
> the conversation, memory sprawl, or git log — it is the single warm-start context. Then
> greet the creator with the **"Where we left off"** line below and the recommended next step.
> At SESSION END, rewrite the Snapshot + Where-we-left-off sections (keep this header), commit.
> Keep it under ~80 lines — a handoff, not a chronicle. Deep context lives in the north-star
> docs it links; only follow those when the task actually needs them.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits run on **Sonnet** (light Opus only for a
  contested reconcile). Fable/Opus = design sessions only, on exception. Binding detail:
  `.claude/skills/waypoint-guide-author/references/research-efficiency.md`.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → test → `astro preview` :4322 (never `astro dev`) →
  grep `dist/` → commit → push.
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/VISUAL_COVERS.md` +
  `docs/MOTION.md` (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar).

## Snapshot (updated 2026-07-19, session close)

**The traveler pivoted mid-session: Hawaii → Sedona, AZ.** The Hawaii guide (fully
researched, verified, nominated as issue #10) was deleted entirely and rebuilt from scratch
for Sedona under the same slug (`us`) and the same intake parameters. Sedona is now the
one sitting on a graduation nomination — **issue #11**, superseding #10 (closed). Same
caveat as before: this was a MANUAL dual-pass, not the automated agent, which is still
blocked on one missing secret only the creator can supply. 450 tests, all on `main`.

- **Retrigger + two real agent-config bugs (earlier this session):** re-applied `new-guide`
  to issue #9 (Hawaii) — scaffold succeeded. `research-pass.yml` then failed twice:
  `anthropic/claude-code-action` was misspelled `anthropics/claude-code-action` in all three
  agent workflows (none had ever actually run before this), and `allowed_tools` is a
  deprecated v0.x input on that action's v1.0. Both fixed and pushed. **The agent still
  can't run at all** — the repo has no `CLAUDE_CODE_OAUTH_TOKEN` secret. That needs
  `claude setup-token` in a real terminal — purely the creator's action, can't be done from
  here or from a phone without a terminal app.
- **Hawaii → Sedona pivot (this turn):** the traveler changed their mind after Hawaii was
  fully done. Deleted the full record (guide, intake, state, palette — commit `95e33fc`),
  closed issue #10 with an explanation, added a closing comment to issue #9. Then ran a
  fresh dual-pass for Sedona, AZ, same intake parameters throughout: TSA ID rules (reused),
  the Coconino National Forest Red Rock Pass (fs.usda.gov), Sedona Shuttle's *live* route
  status (2 of 3 free trailhead routes currently suspended — checked directly, not assumed),
  NWS flash-flood guidance for Arizona's monsoon season (mid-June–end of Sept, squarely
  inside these trip dates), Tlaquepaque's hours, and local-food picks (Wildcraft/Elote/
  Coffee Pot) routed in ahead of the generic Uptown-strip listicle default. Verify --network
  PASS (0 blocking, 0 dead links, 0 missing photos); browser-verified desktop+mobile; grepped
  `dist/` and caught two leftover "vs. the Hawaii guide" sentences that meant nothing to an
  actual reader before landing. **Still draft: true.** Filed graduation nomination as
  **issue #11**. Also fixed the Arizona twin of the earlier Hawaii bug: `countries.mjs` had
  no row correcting for Arizona's year-round no-DST Mountain time — added one.
- **Pipeline complete (P0–P4) + streamlined:** typed intake → resumable dual-pass research
  → `npm run verify` scorecard → graduate-on-evidence → weekly recert. **Only manual step
  (by design):** the owner's `graduate-approved` label. **Scoped edits:** a **✎ Request a
  change** button on every guide.
- **Visual/motion + `docs/FEATURES.md` wave complete:** card→hero morph, first-open
  day-story, story-mode itinerary, cover-extracted palettes, PWA, all 7 planned traveler
  features. Held: #2/#3 (revivable). Dropped: #4.

**Known waits:** the automated agent chain is STILL unproven end-to-end — every bug found
across both rounds was a config/wiring bug the agent never got past, not a content bug. The
real proof only happens after the OAuth secret is added. TRAVELER_PATTERNS still has only 2
data points; this solo-traveler profile matches neither existing party (logged in
`guides-intake/us.md`'s Amendments as a new, unestablished pattern — carries over from the
deleted Hawaii intake unchanged).

## Where we left off

**Two things are ready for the creator right now, independently:**

1. **Review issue #11** (graduate: us/Sedona) — fully researched, verified, live on `main`
   as a draft at `/guides/us/`. Apply `graduate-approved` if it holds up. Three open
   judgment calls worth a look first: rental-car-over-rideshare (checked live, but Sedona's
   shuttle status could shift before the trip), Mii amo's real multi-night booking model vs
   the more flexible L'Auberge day-spa alternative, and an honest budget flag — Sedona's
   lodging runs toward the top of the stated $150–300/day range once priced in.
2. **Unblock the automated agent** — run `claude setup-token` in a real terminal, then add
   the result as a repo secret named exactly `CLAUDE_CODE_OAUTH_TOKEN` (Settings → Secrets
   and variables → Actions). Once that's done, filing a fresh New-guide issue is the real
   first end-to-end proof of the automated chain — nothing else is blocking it now.

**Re-prompt the creator with:** "Sedona is fully researched and waiting on your graduation
call at issue #11 (Hawaii's been deleted — that trip pivoted). Still did this by hand, not
through the real pipeline, since the repo still has no CLAUDE_CODE_OAUTH_TOKEN secret. Want
to add that so the NEXT guide can prove the automated agent for real, or review #11 first?"
