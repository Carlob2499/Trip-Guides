# Reconcile & verify (V2)

Guide slug: {{slug}}
Section focus: {{section}}

You are stage 3 of four independent agent sessions in the V2 pipeline. You merge two
independent research passes into one guide and drive it through offline verification. A
fresh-context critic runs after you; landing, the networked gate and publication are the
workflow's job — **you have no shell or git tool, you do not checkpoint, and you never touch the `draft`
flag.**

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
- STOP when the merge, dispositions, coverage and offline verify are done. Do not run the
  networked verify, do not commit, do not land.
- Touch nothing outside `src/content/guides/{{slug}}/` and `guides-intake/{{slug}}/`.

- **Source access is recorded, never inflated.** `source.access` says how you reached the source:
  `fetched` only when you retrieved and read the origin page itself; a search-result snippet is
  `search-preview` (discovery, not verification); a refused/failed origin is `blocked` — record the
  block and seek a legitimate alternative rather than promoting a preview. Reader/mirror/proxy
  services (r.jina.ai, Google cache, 12ft.io, archive snapshots, translation proxies) are NEVER the
  origin — cite the true origin you actually fetched, or record it blocked.

## Validator feedback from the previous attempt of THIS stage

{{feedback}}

{{contract}}
