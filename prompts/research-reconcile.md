# Reconcile & verify

Guide slug: {{slug}}
Section focus: {{section}}

You are stage 3 of four independent agent sessions. You merge two independent research passes into
one guide and drive it through verification. A fresh-context critic runs after you; publication is
handled by the workflow, not by you.

## Read first

- `.claude/skills/waypoint-guide-author/SKILL.md` — Reconcile (AGREE / A-only / B-only / CONFLICT,
  the `## Research reconciliation` ledger, `## Amendments`), authenticity woven into existing
  bodies rather than new tabs, and done-gate step 1 (the self-correction loop).
- `references/verification-rules.md`, `references/research-efficiency.md`,
  `references/block-types.md`.
- `references/image-sourcing.md` — binding for the Living Atlas cover duty and any sight photo.
- SKILL.md's "Traveler questions" — the question-card format, for any real fork reconciliation
  reveals.

## Stage contract

- Target is the DIRECTORY `src/content/guides/{{slug}}/` — never a flat
  `src/content/guides/{{slug}}.json`.
- Resume, never restart: `npm run pipeline -- --slug {{slug}} --status` first, then do ONLY the
  un-done stages (`reconcile` and/or `verified`).
- Two sources to reconcile: Pass A's guide (already in the guide directory, with its verification
  ledger) and Pass B's findings in `guides-intake/{{slug}}/passB.json` — independent, each entry
  primary-source verified. EVERY passB.json entry needs a written verdict in `ledger.md`'s
  `## Research reconciliation` (AGREE / B-only / CONFLICT / explicit rejection). A deterministic
  gate checks this before the critic runs: nothing downstream can see what a silent merge dropped,
  which is why the verdicts are the deliverable and not just a courtesy.
- A fork reconciliation reveals goes to `## Questions for the traveler` in `ledger.md` with the
  assumption you proceeded on. Research never waits for an answer.
- After reconciling:
  `npm run pipeline -- --slug {{slug}} --checkpoint reconcile && git add -A && git commit -m "research({{slug}}): reconcile" && git push`
- SELF-CORRECTION LOOP (the `verified` stage) — iterate, never one-shot:
  - Offline rounds first: `npm run verify -- --slug {{slug}}` + `npm run build`. Fix each blocking
    ⚠ by re-researching that fact against a T0 source — never silence a flag you cannot source.
    Up to 4 rounds.
  - THEN the final network gate, the only one that checks links and Commons photos:
    `npm run verify -- --slug {{slug}} --network`.
    - content FAIL → fix each finding (dead link → re-source from a live primary; missing photo →
      correct via `search-commons.mjs` or omit) and re-run the SAME networked verify. Never fall
      back to the offline command from here on.
    - UNVERIFIABLE (a checker outage — not the same as "checked, found nothing") → wait 60s, retry
      ONCE. Still UNVERIFIABLE → do NOT proceed: commit as-is and write the outage into the
      scorecard, so landing takes the draft-PR path.
- STOP once the networked verify PASSes:
  `git add -A && git commit -m "research({{slug}}): verify PASS — awaiting critic" && git push`
- If the 4-round cap ends still NEEDS WORK, commit whatever fix attempts you made (check
  `git status --short` first; skip if nothing) so the remote reflects your actual last state:
  `git add -A && git commit -m "research({{slug}}): NEEDS WORK after 4 rounds" && git push`
- Touch nothing outside `src/content/guides/{{slug}}/` and `guides-intake/{{slug}}/`.
