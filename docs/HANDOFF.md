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

**Issue #9 (Hawaii) is scaffolded, fully researched, verified PASS, landed on `main`, and
sitting on a graduation nomination — but by a MANUAL dual-pass, not the automated agent.**
The automated agent is still blocked on one missing secret only the creator can supply.
450 tests, all on `main`.

- **Retrigger round (this session):** re-applied the `new-guide` label to issue #9 — the
  scaffold succeeded this time (the prior session's `npm ci` fix held), landing as slug
  `us` (country-derived from the intake's "US" field, not "hawaii" — expected, not a bug).
  `research-pass.yml` then auto-dispatched and failed **twice**, surfacing two more real,
  general bugs (not guide-specific): `anthropic/claude-code-action` was misspelled
  `anthropics/claude-code-action` in all three agent-invoking workflows (research-pass,
  modify-guide, recert — none had ever actually run before this), and `allowed_tools` is a
  deprecated v0.x input on that action's v1.0 (moved into `claude_args`). Both fixed and
  pushed. **The agent still can't run** — the repo has no `CLAUDE_CODE_OAUTH_TOKEN` secret
  at all. Generating one needs `claude setup-token` in a real terminal (an interactive
  OAuth login), which can't be done from here or from a phone without a terminal app —
  purely the creator's action.
- **To prove the pipeline's research side without the blocked agent**, ran the exact dual-pass
  procedure by hand this session (Pass A canonical → Pass B local/authentic → reconcile →
  self-correction loop) on Hawaii/Oʻahu: TheBus fares, TSA ID rules, the reef-safe-sunscreen
  law, Diamond Head's mandatory-reservation rule, Helena's Hawaiian Food, all from primary
  sources; 7-day itinerary; verify --network PASS (0 blocking, 0 dead links, 0 missing
  photos); browser-verified desktop+mobile. Landed straight to `main` (2 commits) and filed
  the graduation nomination as **issue #10**, exactly matching what the automated agent
  would do on a verify PASS. **Still draft: true** — needs the human graduation checklist,
  same as always. Also fixed a real general bug found along the way: `countries.mjs` had
  one row for "United States" (Eastern time, DC coordinates) — wrong for Hawaii by 5–6
  hours and ~4,800 miles — now has its own "Hawaii" row.
- **Pipeline complete (P0–P4) + streamlined:** typed intake → resumable dual-pass research
  → `npm run verify` scorecard → graduate-on-evidence → weekly recert. Scaffold auto-starts
  research; a persisted attempt counter caps stuck runs at 5. **Only manual step (by
  design):** the owner's `graduate-approved` label. **Scoped edits:** a **✎ Request a
  change** button on every guide files an issue; `modify-approved` runs `modify-guide.yml`.
- **Visual/motion + `docs/FEATURES.md` wave complete:** card→hero morph, first-open
  day-story, story-mode itinerary, cover-extracted palettes, PWA, all 7 planned traveler
  features. Held: #2/#3 (revivable). Dropped: #4.

**Known waits:** the automated agent chain (research-pass/modify-guide/recert) is STILL
unproven end-to-end — every bug found so far was a config/wiring bug the agent never got
past, not a content bug. The real proof only happens after the OAuth secret is added.
TRAVELER_PATTERNS still has only 2 data points; Hawaii's solo-traveler profile matches
neither existing party (logged in `guides-intake/us.md`'s Amendments as a new, unestablished
pattern).

## Where we left off

**Two things are ready for the creator right now, independently:**

1. **Review issue #10** (graduate: us/Hawaii) — the guide is fully researched, verified,
   and live on `main` as a draft. Read it at `/guides/us/` and, if it holds up, apply
   `graduate-approved` to feature it. Two open research-judgment calls worth a look first:
   the island was resolved to Oʻahu only (not Maui — the original intake left it open) and
   the entry-requirements card was omitted (home country was left blank in the intake).
2. **Unblock the automated agent** — run `claude setup-token` in a real terminal, then add
   the result as a repo secret named exactly `CLAUDE_CODE_OAUTH_TOKEN` (Settings → Secrets
   and variables → Actions). Once that's done, filing a **fresh** New-guide issue (Hawaii's
   already done by hand) is the real first end-to-end proof of the automated chain —
   nothing else is blocking it now.

**Re-prompt the creator with:** "Hawaii is fully researched and waiting on your graduation
call at issue #10 — but I did that by hand, not through the real pipeline, because the repo
still has no CLAUDE_CODE_OAUTH_TOKEN secret. Want to add that (needs `claude setup-token` on
your end) so the NEXT guide can prove the automated agent for real, or review #10 first?"
