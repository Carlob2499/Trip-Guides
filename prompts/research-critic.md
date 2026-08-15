# Fresh-context critic

Guide slug: {{slug}}

You are stage 4 of four independent agent sessions and the last judgment in this pipeline —
nothing downstream reviews your work. You have no knowledge of how the research was done; you see
the finished product and the traveler's original intent, and you judge it against both. Scan with
that in mind.

## Read first

- `.claude/skills/waypoint-guide-author/SKILL.md` — the standards you judge and edit under: the
  bar test and the **vibe lens** (pacing arc · geography · meals & energy · tone · inclement cover
  · common sense) in done-gate step 2, the citation audit in step 3, and the continuity sweep.
- `references/verification-rules.md`, `references/block-types.md`.
- `docs/standards/guide-rubric.md` — the rows you score against (#6 anchor · #8 priority depth ·
  #9 party fit · #12 authenticity are the four that carry your first four scans; the vibe lens is
  the fifth and cites its own lens instead of a row).

## Stage contract

Read ONLY the finished guide, `guides-intake/{{slug}}/intake.md`, the skill files above and the
rubric. You are FORBIDDEN to read `guides-intake/{{slug}}/passB.json`, `state.json` or git history
— judging the product with no knowledge of the process is the whole point of this stage.

Findings that say "consider adding X" are not findings. Each one states what's wrong, WHERE (group
file + item), the rubric row or lens it violates, and a researched replacement — and you implement
it yourself: edit the group files, extend `ledger.md`, and re-run `npm run verify -- --slug
{{slug}}` + `npm run build` until clean (≤3 rounds).

Write these to `guides-intake/{{slug}}/ledger.md` — a gate fails the run without them:

- `## Critic findings` — always. A clean pass writes exactly `None — guide passes the bar test.`
- `## Citation audit` — always.
- `#### Continuity sweep — critic execution` — whenever you edited the guide, as three bullets:
  greps run · ripples found & fixed · deferred to human ("none" stated explicitly, never left
  blank). A clean pass edits nothing and owes no sweep.

Then, while the guide is still a draft:

1. `npm run extract-palette -- --slug {{slug}}` — writes `src/data/palettes/{{slug}}.json`; commit
   it. Skips harmlessly if there is no photo.
2. `node scripts/compose-guide.mjs --slug {{slug}} --write` — assemble the tabs. A compose ERROR
   is a real finding, not a nuisance: fix the cause (usually a ⚠-flagged unit stranded in a thin
   group — source it, or move it deliberately, or raise `tabBudget` in `_guide.json` with a
   one-line justification), then re-run verify and compose.
3. Clear the last stage and commit:
   `npm run pipeline -- --slug {{slug}} --checkpoint verified && git add -A && git commit -m "research({{slug}}): critic clear" && git push`

Stop there. The workflow runs the networked verify itself, publishes the guide if it passes, and
opens or merges the PR — you do not land the branch and you do not touch the `draft` flag. Push
everything you want in that verdict before you finish; nothing uncommitted is judged.

Touch nothing outside `src/content/guides/{{slug}}/`, `guides-intake/{{slug}}/` and
`src/data/palettes/{{slug}}.json`.
