# Reconcile & verify (V2)

Guide slug: {{slug}}
Section focus: {{section}}

You are stage 3 of four independent agent sessions in the V2 pipeline. You merge two
independent research passes into one guide and leave a gate-ready artifact for the workflow's
offline verification. A fresh-context critic runs after you; landing, the networked gate and
publication are the workflow's job — **you have no shell or git tool, you do not checkpoint, and
you never touch the `draft` flag. Do not spend time attempting node/npm/shell commands; they
cannot run in this agent sandbox.**

## Validator feedback — read before anything else

{{feedback}}

If the block above begins with `REPAIR ATTEMPT`, this is a targeted repair pass, not a fresh
research sweep. Fix every named finding first, preserve unaffected retained work, and do not
restart broad candidate discovery. For source-access failures, fetch/read the true origin before
using `access: "fetched"`; if it is blocked, record that honestly, seek another legitimate
authority, and flag/omit any guide claim that still lacks fetched support. Never relabel a search
preview merely to clear a gate.

## Read first

- `.agents/skills/waypoint-guide-author/SKILL.md` — Reconcile (AGREE / A-only / B-only /
  CONFLICT), authenticity woven into existing bodies, the done gate's self-correction loop.
- `.agents/skills/waypoint-guide-author/references/verification-rules.md`, `.agents/skills/waypoint-guide-author/references/research-efficiency.md`,
  `.agents/skills/waypoint-guide-author/references/research-depth.md`, `.agents/skills/waypoint-guide-author/references/block-types.md`, `.agents/skills/waypoint-guide-author/references/image-sourcing.md`.

## Stage contract

- Inputs: Pass A's guide (in `src/content/guides/{{slug}}/`) + `guides-intake/{{slug}}/
  evidence.v2.json` (Pass A's machine record) + `guides-intake/{{slug}}/passB.v2.json` (Pass
  B's independent findings, validated and transferred by the workflow).
- **Merge into ONE evidence artifact.** Fold Pass B's `candidates[]` and `evidence[]` records
  into `evidence.v2.json` (keep their `origin: "passB"` and their ids), then give EVERY
  passB-origin evidence record a typed disposition in `reconciliation[]`:
  `{ findingId, disposition (agree|adopt|replace|reject|conflict-resolved|detour), note }`.
  A silently dropped find fails the run — the deterministic gate checks this before the critic.
- Keep the human trail: the `## Research reconciliation` table and `## Amendments` in
  `ledger.md` as SKILL.md describes. The ledger explains; `evidence.v2.json` proves.
- **Write `guides-intake/{{slug}}/coverage.v2.json`** (schema `wp-coverage/2.0`): one row per
  material intake ask — `{ id, ask, status (covered|excluded), where
  ["NN-<group>.json#anchor", …] (required when covered — real refs, not prose), evidenceIds,
  reason (required when excluded — an honest exclusion names why) }`. Every ranked priority,
  constraint, and special requirement in the intake is an ask.
- Update the merged `saturation` record so it reflects the RUN's final state, and record any
  `disagreements[]` reconciliation surfaced.
- A fork reconciliation reveals goes to `## Questions for the traveler` in `ledger.md` with the
  assumption you proceeded on. Research never waits for an answer.
- Apply the deterministic constraints you can prove from the artifacts. The workflow runs offline
  verify and build after your output; never silence a flag you cannot source — downgrade to `⚠`
  or omit.
- If retained validator feedback names a map-point `__VERIFICATION_REQUIRED__` place ID, do NOT
  attempt `lookup-place.mjs` or any shell command. Use only a targeted authoritative map/geocoder
  fetch available through WebFetch, and accept an ID only when the returned entity matches the
  point's name and existing coordinates. If identity is ambiguous, leave it unresolved rather than
  guessing. This is a narrow repair, not a reason to restart destination research.
- STOP only after the merge, dispositions, coverage, **and the traveler-facing synthesis required
  by SKILL.md** are done and your artifact-level self-check is complete. Evidence agreement without
  a finished traveler product is not a completed Reconcile stage. The workflow runs offline
  verify/build after you return. Do not attempt shell/node/npm, do not run the
  networked verify, do not commit, do not land.
- Touch nothing outside `src/content/guides/{{slug}}/` and `guides-intake/{{slug}}/`.

- **`source.access` is recorded honestly, never inflated** — `fetched` only when you retrieved
  and read the origin page itself; `search-preview` for a search-result snippet (discovery, not
  verification); `blocked` for a refused/failed origin (record the block, seek a legitimate
  alternative). Mirror/proxy services are never the origin. The authoritative rule:
  `research-efficiency.md` "Fetch discipline".

{{contract}}
