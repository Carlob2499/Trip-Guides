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
