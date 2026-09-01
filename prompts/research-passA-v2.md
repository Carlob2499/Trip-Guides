# Pass A (V2) — canonical & verified

Guide slug: {{slug}}
Section focus: {{section}}

You are stage 1 of four independent agent sessions (Pass A → Pass B → Reconcile → Critic) in
the V2 pipeline. Pass B runs next in a mechanically clean workspace that cannot contain your
output; a third agent reconciles both; a fourth judges the result.

**You have no shell or git tool and you do not checkpoint.** The workflow validates your output, commits
it, and records the stage — a stage whose owed artifact is missing is recorded as a void
failure, so the artifact below is your deliverable, not a courtesy.

## Validator feedback — read before anything else

{{feedback}}

If the block above begins with `REPAIR ATTEMPT`, this is a targeted repair pass, not a fresh
research sweep. Fix every named finding first, preserve unaffected retained work, and do not
restart broad candidate discovery. For source-access failures, fetch/read the true origin before
using `access: "fetched"`; if it is blocked, record that honestly, seek another legitimate
authority, and flag/omit any guide claim that still lacks fetched support. Never relabel a search
preview merely to clear a gate.

## Read first

The `waypoint-guide-author` skill is the single source of truth for how to research and what
"done" means. Read and follow it — do not work from any summary of it:

- `.agents/skills/waypoint-guide-author/SKILL.md` — Pass A, fact discipline, the Living Atlas
  duties, the deterministic lookup scripts.
- `.agents/skills/waypoint-guide-author/references/verification-rules.md` (objective vs experiential evidence, source families),
  `.agents/skills/waypoint-guide-author/references/research-efficiency.md` (adaptive stopping rule — no fixed candidate quotas),
  `.agents/skills/waypoint-guide-author/references/research-depth.md` (reservation depth, transport robustness, disagreement
  investigation, recurring-event year safety), `.agents/skills/waypoint-guide-author/references/block-types.md`,
  `.agents/skills/waypoint-guide-author/references/image-sourcing.md`.

## Stage contract

- Target is the DIRECTORY `src/content/guides/{{slug}}/` — `_guide.json` plus one
  `NN-<group>.json` per tab group. Never create a flat `src/content/guides/{{slug}}.json`.
- Run-state lives in `guides-intake/{{slug}}/`: `intake.md` is FROZEN — never edit it. The
  human trail (candidates tables, verification ledger, traveler questions) still goes to
  `ledger.md`; a research-forced change of plan is an entry under `## Amendments`.
- **The machine contract is `guides-intake/{{slug}}/evidence.v2.json`** — create it (schema
  `wp-evidence/2.0`; `slug`, `runId` from `guides-intake/{{slug}}/run.v2.json`, then):
  - `candidates[]` — every venue/experience you EVALUATE: `{ id (kebab, stable), name, branch
    (exact location when it matters, else null), priority, status
    (considered|shortlisted|shipped|rejected|detour), shortlisted (bool — shipped requires
    true), reason (required for rejected/detour), worth
    (worth-the-effort|worth-the-detour|null) }`.
  - `evidence[]` — one record per verified claim: `{ id, candidateId|null, claim, kind
    (objective|experiential), origin: "passA", source { url, kind
    (official|operator|firsthand|press|reference|aggregator), language, publishedAt|null,
    family|null, independent|null, appliesToYears[] }, verifiedOn (YYYY-MM-DD), firsthand|null }`.
    For a recurring event dated after its source publication year, `appliesToYears` names the
    exact season the current official announcement supports; last year's pattern is only a lead.
    Each objective record also carries `freshness { perishable, shelfLife
    (fx|transit|hours|venue|default)|null, recheckOn|null }`; perishable facts require the
    category and next recheck date.
  - `reservations[]` for important finalists and `transport[]` for risky routes, per
    `research-depth.md` — casual stops owe nothing here.
  - `disagreements[]` where evidence conflicted and it mattered.
  - `depth` — explicitly enumerate the candidate ids requiring reservation depth and route ids
    requiring R3+ transport depth. If either class is genuinely inapplicable, record a concrete
    `notApplicableReason`; an omitted/empty obligation is not accepted.
  - `saturation` — the adaptive stop record: `{ stopped, trend (novel|duplicates|weaker),
    unresolvedCouldChange (bool — must be answered to stop), note }`. A stop is EARNED:
    duplicates/weaker trend AND unresolvedCouldChange false, or keep researching.
- If a section focus is named above, scope this pass to it and leave every other section as-is.
- The anchor event is verified against a T0 source FIRST, before any other research.
- A fork research cannot resolve becomes a question card under `## Questions for the traveler`
  in `ledger.md` (SKILL.md's format). Proceed on the stated assumption — never wait.
- STOP when Pass A's research is written and `evidence.v2.json` is complete. The workflow runs
  deterministic verification; do not run Pass B,
  do not reconcile, do not verify-loop, do not commit.
- Touch nothing outside `src/content/guides/{{slug}}/` and `guides-intake/{{slug}}/`.

- **`source.access` is recorded honestly, never inflated** — `fetched` only when you retrieved
  and read the origin page itself; `search-preview` for a search-result snippet (discovery, not
  verification); `blocked` for a refused/failed origin (record the block, seek a legitimate
  alternative). Mirror/proxy services are never the origin. The authoritative rule:
  `research-efficiency.md` "Fetch discipline".

{{contract}}
