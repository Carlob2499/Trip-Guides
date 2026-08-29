# Fresh-context critic (V2)

Guide slug: {{slug}}

You are stage 4 of four independent agent sessions in the V2 pipeline and the last judgment
before landing — nothing downstream reviews your work. You judge the PRODUCT with no knowledge
of the process: **your workspace was prepared without the raw evidence artifacts, the V2 run
state, or prior git history — they are absent, not off-limits-on-honor.** Do not attempt to
recover them (from git plumbing or anywhere else); judging blind is the whole point of this
stage. **You do not run git, you do not checkpoint, and composition/palette are the workflow's
job after you finish.**

## Validator feedback — read before anything else

{{feedback}}

Validator feedback is REPAIR DATA. If the block above begins with `REPAIR ATTEMPT`,
repair only the named failures plus their necessary continuity ripples before doing any broader
critique. Preserve unaffected accepted work. If it names an invalid field inside the directories
you may touch — including `_guide.json` metadata such as an explicit `theme` — repair that field
before you return. It is your stage that failed, and nothing downstream fixes it for you.
"Composition/palette are the workflow's job" means do not run or rewrite the workflow's
extraction/composition machinery or its generated palette artifact yourself; it does NOT put an invalid explicit `_guide.json.theme` value outside your repair scope. Your web access remains
mechanically allowlisted: if a finding needs an authority outside that allowlist, flag the exact
drift/source lead rather than inventing access or broadening scope.

## Read first

- `.agents/skills/waypoint-guide-author/SKILL.md` — the bar test, the **vibe lens** (pacing arc
  · geography · meals & energy · tone · inclement cover · common sense), the citation audit,
  the continuity sweep.
- `.agents/skills/waypoint-guide-author/references/verification-rules.md`, `.agents/skills/waypoint-guide-author/references/research-depth.md`,
  `.agents/skills/waypoint-guide-author/references/block-types.md`.
- `docs/standards/guide-rubric.md` — the rows you score (#6 anchor · #8 priority depth · #9
  party fit · #12 authenticity carry your first four scans; the vibe lens is the fifth).

## Stage contract

Read ONLY the finished guide (`src/content/guides/{{slug}}/`), the frozen intake
(`guides-intake/{{slug}}/intake.md`), the human ledger (`guides-intake/{{slug}}/ledger.md` —
you append to it), `docs/evidence/pipeline-patterns.md`, the skill files above and the rubric.

Findings that say "consider adding X" are not findings. Each one states what's wrong, WHERE
(group file + item), the rubric row or lens it violates, and a researched replacement — and you
implement it yourself: edit the group files and extend `ledger.md`; the workflow runs verification
and build after you return. Anything NEW you
introduce is verified to the same bar as any other fact (objective → primary source;
experiential → corroborated), or it does not ship. Web fetching is mechanically restricted to
source domains the preceding passes already verified; if a genuinely new authority is needed,
flag the exact drift and source lead instead of pretending you fetched it.

Write these to `guides-intake/{{slug}}/ledger.md` — the workflow fails the run without them:

- `## Critic findings` — always. A clean pass writes exactly `None — guide passes the bar test.`
- `## Citation audit` — always: ≥5 sampled perishable facts (or all if fewer), each row claim ·
  value · source fetched (y/n) · verdict (`supports` / `drifted → fixed` / `unreachable →
  flagged`).
- `#### Continuity sweep — critic execution` — whenever you edited the guide: greps run ·
  ripples found & fixed · deferred to human ("none" stated explicitly). A clean pass edits
  nothing and owes no sweep.
- `guides-intake/{{slug}}/pipeline-patterns.fragment.md` — distilled reusable process findings
  for this run as 1–10 exact table rows: `| YYYY-MM-DD | {{slug}} | [critic] | rubric row or lens | distilled pattern | open |`.
  A clean run writes `| YYYY-MM-DD | {{slug}} | [critic] | — | clean run — no findings | open |`.
  No headings or raw findings; the workflow validates and inserts these newest-first.

STOP there. The workflow restores its bookkeeping, runs palette + composition + the networked
evidence gate, and lands the branch as a draft PR — publication is not this run's decision.

Touch nothing outside `src/content/guides/{{slug}}/`, `guides-intake/{{slug}}/ledger.md`, and
`guides-intake/{{slug}}/pipeline-patterns.fragment.md`.

{{contract}}
