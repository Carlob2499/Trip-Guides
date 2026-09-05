# Agent prompts

Every prompt the pipeline hands to a Claude Code agent lives here as a versioned markdown file,
never inline in workflow YAML. A workflow composes one with

```
node scripts/pipeline.mjs prompt prompts/<name>.md
```

which substitutes `{{placeholder}}` tokens from `WP_*` environment variables (`WP_SLUG` →
`{{slug}}`), fails loudly on any placeholder the environment does not supply, and writes the
result to `$GITHUB_OUTPUT` as `text` for the agent step's `prompt:` input.

## What belongs in a prompt

Only what nothing else enforces: the stage's I/O contract (paths, checkpoints, forbidden reads),
the independence rules, the evidence requirements, and the STOP conditions.

Not here: anything the schema, `npm run verify`, the coverage gates, or `scripts/pipeline.mjs`
already enforces mechanically, and nothing the `waypoint-guide-author` skill already says —
the skill is the single source of truth for content doctrine, and a prompt that restates it
creates a second copy that drifts. Point at the file; don't paraphrase it.

Untrusted text (an issue body, a traveler's words) never enters a prompt. It rides the DATA
channel as a file the prompt names — `change.txt`, `feedback-export.working.json` — and the
prompt says so.

## V1 vs V2 research prompts

The four `research-*-v2.md` prompts are Pipeline V2's stage contracts, composed only by
`research-pass-v2.yml`. That workflow has **two entry points**: the trusted `workflow_call`
from `new-guide.yml`, taken when the `WAYPOINT_RESEARCH_ENGINE` selector is `v2`; and a
manual `workflow_dispatch`, which is **always `landMode=pr`** and therefore structurally cannot
publish. The owner-selected current product state is `WAYPOINT_RESEARCH_ENGINE=v2`, so trusted
`/new` routes to V2. The unsuffixed `research-*.md` four remain V1's rollback/compatibility
contracts, composed by `research-pass.yml`; V1 is retained until a separate post-ratification
retirement decision rather than being deleted as a side effect of selection.

The V2 contracts differ on purpose: agents never run git or checkpoint (the workflow validates,
commits and checkpoints every stage), Pass B runs in a mechanically clean baseline workspace,
the critic's forbidden inputs are absent rather than merely banned, and the machine artifacts are
`evidence.v2.json` / `passB.v2.json` / `coverage.v2.json` instead of ledger prose + `passB.json`.
Do not "sync" one set to the other; if V1 is later retired, its prompt set is removed only as part
of that separately approved bounded retirement change.
