# Research Efficiency — model economy + judicious searching

Binding operational rules for every research/recert pass. The backbone must be sustainable on a
**Claude Pro** plan: research is executed by **Sonnet** (default) or **light Opus** (reconciliation
/ judgment-heavy passes only). Fable/heavy-Opus sessions are for *designing the pipeline*, never for
running research. These rules exist so verification quality stays Korea-tier while tokens and
searches stay Pro-sized. They encode what past passes learned — follow them instead of rediscovering.

## Model economy

| Work | Model |
|---|---|
| Research passes (Pass A + Pass B), recert re-verification | **Sonnet** |
| Reconcile A+B conflicts; anchor-event verification on an event trip | Sonnet, or **light Opus** if genuinely contested |
| Formatting, ledger cleanup, mechanical sweeps | Haiku (or stay in Sonnet) |
| Pipeline/skill/workflow design | Fable/Opus — separate sessions, not research |

**Checkpoint often** (`npm run pipeline -- --slug X --checkpoint <stage>` + commit). Pro sessions
are shorter than Max ones; the P2 spine exists precisely so a session can end at any checkpoint and
the next one resumes without re-research. Plan-mode first on any multi-section pass: plan cheap,
execute the plan, don't wander.

## Search budget (per fact / per venue)

- **Scripts before web, always.** `lookup-place.mjs` (coords/place_id), `search-commons.mjs`
  (photos), `fetch-wikivoyage.mjs` (grounding leads) answer for free — never web-search what a
  script answers.
- **Reuse before re-search.** The verification ledger, the intake doc, and the existing guide are
  first stops. Never re-verify a fact the ledger already carries with a current date. In recert,
  start from the flagged fact's own `source_url`.
- **Go direct-to-primary.** Guess the official domain and fetch it (`WebFetch`) before searching.
  One venue's official page usually answers all four questions (where / how / when / book) in ONE
  fetch — batch by *venue*, not by *fact*.
- **Two rounds, then decide.** Max ~2 searches + 1–2 fetches per fact. If no T0/T1 source
  surfaces, apply the stopping conditions (verification-rules §5): flag `⚠` or omit. More
  searching past that point produces confidence, not verification.
- **Search precisely.** `site:` queries on the official domain; the venue's native-language name
  (the local-language official page is often the true T0 — fetch it and translate, don't keep
  searching English).

## Fetch discipline — learned from this repo's own audits

- **A HEAD/first 404 can be a live page** (visitseoul.net answered HEAD 404 / GET 200 for every
  URL). If a fetch fails oddly, retry the plain page once; judge by content, not status.
- **Bot-blocked (403/429/Cloudflare) → don't burn retries.** Mark it blocked in the ledger and
  find a different primary. Two attempts max.
- **Aggregators die; officials persist** (the MangoPlate lesson — a dead-since-2020 aggregator
  shipped from training data). Aggregators are *leads only*; the citation is always the official
  page. Never cite what you didn't fetch.
- **Don't paste pages into the ledger.** Extract the row (claim · value · tier+URL · date · flag)
  and move on. The ledger is evidence, not an archive.

## Token hygiene

- Don't re-read files already in context (CLAUDE.md and this skill auto-load — never re-Read them).
- Read only the group file a fact lives in, never the assembled guide.
- Keep the completion report to the standard format — the ledger table plus one line per category.
