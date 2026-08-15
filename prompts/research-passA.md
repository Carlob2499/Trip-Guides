# Pass A — canonical & verified

Guide slug: {{slug}}
Section focus: {{section}}

You are stage 1 of four independent agent sessions (Pass A → Pass B → Reconcile → Critic). You
clear `scaffold` + `passA` only. Pass B runs next in a session that cannot read your output; a
third agent reconciles both; a fourth judges the result.

## Read first

The `waypoint-guide-author` skill is the single source of truth for how to research and what
"done" means. Read and follow it — do not work from any summary of it:

- `.claude/skills/waypoint-guide-author/SKILL.md` — Pass A, fact discipline, the Living Atlas
  duties, the deterministic lookup scripts.
- `references/verification-rules.md`, `references/research-efficiency.md`,
  `references/block-types.md`, `references/image-sourcing.md`.
- SKILL.md's "Traveler questions" — the question-card format you emit at a real fork.

## Stage contract

- Target is the DIRECTORY `src/content/guides/{{slug}}/` — `_guide.json` plus one
  `NN-<group>.json` per tab group. Never create a flat `src/content/guides/{{slug}}.json`; it
  silently shadows the directory.
- Run-state lives in `guides-intake/{{slug}}/`: `intake.md` is the traveler's own intent and is
  FROZEN — never edit it. Everything research produces goes in `ledger.md` beside it (a
  research-forced change of plan is an entry under `## Amendments`, not a rewrite of the intake).
  `state.json` is the checkpoint spine.
- If a section focus is named above, scope this pass to it and leave every other section as-is.
- Resume, never restart: begin with `npm run pipeline -- --slug {{slug}} --status` and do only
  the un-done stages up to and including `passA`.
- The Living Atlas duties ship inside your passA commit — no separate checkpoint.
- Record every venue or experience you EVALUATE in `ledger.md`'s `## Candidates considered`
  tables as you research — `shipped`, or `rejected: <one-line reason>`. A survivors-only table
  is a failed pass; the rejections are the evidence that the option was seen.
- A fork research cannot resolve (a date, a lodging style, a splurge-vs-save call) becomes a
  question card under `## Questions for the traveler` in `ledger.md`. State the assumption you
  proceed on and keep going — research never waits for an answer.
- Finish the stage:
  `npm run pipeline -- --slug {{slug}} --checkpoint passA && git add -A && git commit -m "research({{slug}}): Pass A" && git push`
- STOP after `passA`. If wall-clock or usage runs short, stop at a clean committed checkpoint
  rather than leaving a half-done stage uncommitted — a committed checkpoint is what lets the
  next run resume instead of restarting.
- Touch nothing outside `src/content/guides/{{slug}}/` and `guides-intake/{{slug}}/`.
