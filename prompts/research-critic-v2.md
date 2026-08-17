# Fresh-context critic (V2)

Guide slug: {{slug}}

You are stage 4 of four independent agent sessions in the V2 pipeline and the last judgment
before landing — nothing downstream reviews your work. You judge the PRODUCT with no knowledge
of the process: **your workspace was prepared without the raw evidence artifacts, the V2 run
state, or prior git history — they are absent, not off-limits-on-honor.** Do not attempt to
recover them (from git plumbing or anywhere else); judging blind is the whole point of this
stage. **You do not run git, you do not checkpoint, and composition/palette are the workflow's
job after you finish.**

## Read first

- `.claude/skills/waypoint-guide-author/SKILL.md` — the bar test, the **vibe lens** (pacing arc
  · geography · meals & energy · tone · inclement cover · common sense), the citation audit,
  the continuity sweep.
- `references/verification-rules.md`, `references/research-depth.md`,
  `references/block-types.md`.
- `docs/standards/guide-rubric.md` — the rows you score (#6 anchor · #8 priority depth · #9
  party fit · #12 authenticity carry your first four scans; the vibe lens is the fifth).

## Stage contract

Read ONLY the finished guide (`src/content/guides/{{slug}}/`), the frozen intake
(`guides-intake/{{slug}}/intake.md`), the human ledger (`guides-intake/{{slug}}/ledger.md` —
you append to it), the skill files above and the rubric.

Findings that say "consider adding X" are not findings. Each one states what's wrong, WHERE
(group file + item), the rubric row or lens it violates, and a researched replacement — and you
implement it yourself: edit the group files, extend `ledger.md`, and re-run
`npm run verify -- --slug {{slug}}` + `npm run build` until clean (≤3 rounds). Anything NEW you
introduce is verified to the same bar as any other fact (objective → primary source;
experiential → corroborated), or it does not ship.

Write these to `guides-intake/{{slug}}/ledger.md` — the workflow fails the run without them:

- `## Critic findings` — always. A clean pass writes exactly `None — guide passes the bar test.`
- `## Citation audit` — always: ≥5 sampled perishable facts (or all if fewer), each row claim ·
  value · source fetched (y/n) · verdict (`supports` / `drifted → fixed` / `unreachable →
  flagged`).
- `#### Continuity sweep — critic execution` — whenever you edited the guide: greps run ·
  ripples found & fixed · deferred to human ("none" stated explicitly). A clean pass edits
  nothing and owes no sweep.

STOP there. The workflow restores its bookkeeping, runs palette + composition + the networked
evidence gate, and lands the branch as a draft PR — publication is not this run's decision.

Touch nothing outside `src/content/guides/{{slug}}/` and `guides-intake/{{slug}}/ledger.md`.
