# AI research pass — staged, not live

The "Guides-to-be" scaffolds ship with structure + live data but empty content. A
**research pass** fills them with primary-source-verified facts (per `CLAUDE.md`),
toward `denmark.json` / `korea.json` polish. This directory stages that capability
**without any live API usage** — nothing here runs or spends money until you deliberately
activate it.

What's here:

- **`../../.github/prompts/research-guide.md`** — the reusable research prompt (encodes the
  accuracy standard, intake-driven priorities, price flags, photo rules, keep-`draft`,
  build-check). Works for both the local flow and the future CI workflow.
- **`research-guide.yml`** — the CI workflow **template, kept inert** (it's under `docs/`,
  not `.github/workflows/`, so GitHub never registers or runs it). Activation steps are in
  its header.

## Run a pass locally now (zero setup, you control the cost)

This is the recommended way to validate the approach before wiring any automation — it's a
sharper version of what you already do:

1. Check out the draft's branch (or just work on `main` against a draft file, e.g.
   `src/content/guides/germany.json`).
2. In a **Claude Code** session in this repo, paste/point at
   `.github/prompts/research-guide.md` and tell it which slug to research
   (e.g. "research `germany`").
3. Claude reads the guide + `CLAUDE.md` + the gold-standard reference, researches with web
   search, fills sections with `≈`/`⚠` flags, runs `npm run build`, and commits.
4. **You** review the flagged items, remove `draft: true` when satisfied, and commit —
   that's what graduates it from Guides-to-be to the curated grid.

The only cost is your own Claude Code usage for that session; there's no CI, no repo
secret, and nothing runs on its own.

## Activate the CI automation later (deliberate, incurs cost)

When you want `/research`-on-a-PR automation, follow the header of `research-guide.yml`:
**verify the `anthropics/claude-code-action` step against its current README** (the input
names there are placeholders and must not be trusted from memory), add the
`ANTHROPIC_API_KEY` secret, and move the file into `.github/workflows/`. It's owner/
collaborator-gated and never auto-merges or drops `draft` — the human gate stays.
