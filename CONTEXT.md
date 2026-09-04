# Waypoint — durable non-design decisions

`CONTEXT.md` is the compact ledger for durable **non-design** engineering and product-process decisions that future work must preserve. It is not a visual authority, roadmap, session log, or implementation diary.

Current operational state belongs in `docs/handoff.md`; current architecture belongs in `docs/reference/`; Pipeline V2 proof/delivery state belongs in `docs/pipeline v2/`; **all visual/interaction design authority lives only in `docs/reference/design-system.md`.**

If a future decision supersedes one below, replace it here and let Git history preserve the old version.

## Product boundary

Waypoint is a personal travel command center built around verified, creator-tailored trip information that remains useful on the street, not merely during planning. It is not currently trying to become a generic social network, booking marketplace, or omnipresent AI chat product. Specialized external apps remain appropriate where Waypoint would only duplicate them poorly.

Do not duplicate visual hierarchy, navigation, surface composition, palette, motion, responsive behavior, or visual acceptance rules in this file. Those belong solely to `docs/reference/design-system.md`.

## Durable shared-add acknowledgment

A supported durable collection addition remains locally pending until the server acknowledges its stable-key write. Server acknowledgment removes the active outbox entry and resolves its `addAsync` caller. Offline or transient failure keeps the full payload in the active durable retry outbox, and `addAsync` may remain pending.

A confirmed permanent rejection normally preserves the full payload durably in a separate rejected/dead-letter local bucket, removes it from active outbox capacity and replay, does not retry it on every room join, and rejects `addAsync` with the original or classified error. If writing that bucket fails while active storage remains writable, the ordinary payload stays at its stable path inside `tg-outbox` and system-owned metadata in the same atomic outbox write marks it terminal; marked payloads are excluded from replay and the active 50-entry capacity. If neither terminal representation can be persisted, the full original active payload remains and the caller receives an explicit `WaypointSyncDurabilityError`; retry suppression is then physically unprovable. Waypoint adds no traveler-facing dead-letter management UI.

This decision governs durable collection additions, including Trip Split and Learnings feedback. It does not extend the same outbox guarantee to collection or document `set`, `update`, or `remove`; those paths require separate proof and an explicit contract decision.

## Itinerary and guide breadth

The scheduled itinerary is not the entire knowledge base. **Sights and Food are repositories, not itinerary duplicates.** They may contain worthwhile unscheduled alternatives so the guide remains useful when plans change, weather intervenes, reservations fail, or the traveler wants something different.

Contingencies should fail differently from the primary plan. Plan B is not useful when it depends on the same closure, reservation, route, weather condition, or operational assumption that killed Plan A.

## Trip Split ownership

Trip Split owns actual shared expenses, deterministic split math, balances, settlements, and trip-specific shared state. Planned budgeting is a separate concept. Itinerary/place context may prefill known trip facts without making the financial engine dependent on itinerary UI.

The visual hierarchy and presentation of Split are owned solely by `docs/reference/design-system.md`.

## Research quality

Waypoint research must not rely solely on model training knowledge for current operational facts.

- current operational facts require current evidence;
- objective facts favor official/primary authority;
- experiential claims may use recent independent firsthand evidence where appropriate;
- blocked access is an honest evidence fact, not permission to pretend a preview was fetched;
- reader/proxy/cache/translation hosts are not silently treated as the original authority;
- uncertainty is stated instead of guessed;
- research memory proposes leads; current research verifies them.

Research breadth is adaptive, not a fixed candidate quota. Adequacy is demonstrated through evidence saturation, material-intake coverage, source-quality rules, and written disposition/rejection history.

## Pass independence and criticism

Pass A and Pass B are independent research passes. Pass B must not inherit Pass A’s research result simply because that would be cheaper. Reconcile owns comparison and written dispositions.

The critic runs with fresh context and audits the resulting product/evidence rather than continuing the research conversation.

Pipeline critic findings are process evidence, not traveler learnings. Traveler feedback/preferences and pipeline/process failures remain separate knowledge domains.

## Frozen intake

The original intake is the traveler requirement contract and remains frozen once scaffolded. Research state, questions, evidence, assumptions, and resolutions live in separate artifacts. A pipeline stage must not fix a contradiction by rewriting what the traveler asked for.

## Two product lifecycles

Waypoint has exactly two product lifecycles:

1. **Research** — creates or re-researches a guide.
2. **Change** — modifies a guide that already exists.

CI, deployment, recertification detection, progress UI, Worker endpoints, and agent tooling support those lifecycles; they are not additional product lifecycles.

## Pipeline V1 / V2 cutover

Pipeline V2 was deliberately built beside V1, not by progressively mutating V1 into a hybrid.

During cutover:

- V1 remains the default/rollback path while `WAYPOINT_RESEARCH_ENGINE` is unset;
- V2 is selected through the explicit selector on the trusted `/new` path;
- manual V2 dispatch is always draft/PR authority (`landMode=pr`);
- V1 is not retired until separate production-cutover acceptance is earned;
- shared pipeline/publication/history surfaces must not be deleted merely because V2 also consumes them.

A green draft canary is evidence for the product path, not automatic permission for production cutover.

## Pipeline truth and publication

Run state, gate truth, merge truth, publication truth, announcement truth, and deployment truth are distinct facts. Never infer one from another.

A passing evidence gate is not yet a merge; a merge is not yet a confirmed deploy; a failed announcement does not un-merge content; an old published guide must not make a newer active run appear complete; a typed PR number or matching slug is not enough to prove run identity.

V2 publication uses durable run identity and a two-phase landing/finalization contract. Failed/conflicted auto landing must leave remote content draft-quarantined; failure to persist quarantine is loud/blocking, not a safe-state claim.

## V2 failure and recovery

Failure classes describe the execution plane that actually failed:

- agent process: `usage-limit`, `agent-failure`, `cancelled`;
- returned-output verdict: `void-run`, `gate-failure`;
- unattributed deterministic/control failure: fail closed rather than inventing a more specific story.

A failed agent process cannot enter the successful artifact path with partial output.

Automatic repair is narrow and bounded. Only actionable `gate-failure` / `void-run` cases with matching validator findings and remaining budgets may auto-repair. Usage limits, cancellation, generic process failure, missing findings, unreadable state, exhausted budgets, or already-published runs do not earn blind retries.

Do not repeatedly spend full model/research runs to debug deterministic state, schema, workflow, or test defects.

## Progress and telemetry honesty

Progress reports only what durable backend state can prove.

- absent telemetry remains null/empty;
- token/cost/fetch/nugget metrics are not estimated merely to fill a dashboard;
- run events are joined by run identity, not just slug;
- ambiguous active generations refuse visibly rather than selecting one silently;
- owner notes target an exact V2 `slug + runId + issue` tuple and the Worker independently verifies the same identity before writing.

V1 does not receive a guessed note target where it lacks the same durable issue identity.

## Worker / owner boundary

The site is the human interface; GitHub remains the durable record. Owner-capable Worker actions fail closed when owner authentication is absent/invalid. Public issue filing must not grant outsiders the ability to spend agents, publish content, or bypass collaborator/owner checks.

Secrets and privileged write authority should be exposed only to the smallest trusted control-plane surface that needs them. Temporary agent-to-agent integration scaffolding is not permanent product architecture merely because it once helped a migration.

## Agent instructions

`AGENTS.md` and `CLAUDE.md` are runtime configuration, not ordinary prose. Their shared policy should remain synchronized, with only explicitly agent-specific runtime names allowed to differ. Do not deduplicate them by moving required runtime instructions into a file the agents will not automatically load.

## Documentation authority

The active reading path is intentionally small:

- `README.md` — repository orientation;
- `PRODUCT.md` — product identity/rules;
- `docs/handoff.md` — current operational state;
- `docs/reference/` — current architecture/operations;
- `docs/pipeline v2/` — locked/current V2 decision, proof, validation, tracker files;
- `docs/reference/design-system.md` — **sole design authority**;
- `docs/reference/component-registry.json` — machine-facing current component inventory;
- `CONTEXT.md` — durable non-design decisions in this file.

Completed plans, superseded handoffs, old design references, review transcripts, and design archaeology belong in Git history, not the live tree.

## Shipping discipline

A change is not done merely because its focused unit test passes.

Use the repository’s canonical verification hierarchy:

- `npm run check:fast` for a cheap broad local gate;
- `npm run check` for invariants + lint + typecheck + coverage + production build;
- `npm run check:offline` for the service-worker/offline contract;
- `npm run ship:check` for the full check + offline + performance budget;
- CI accessibility/deploy checks remain authoritative for environment-specific surfaces.

A known red gate, unresolved high-severity defect, stale authority contradiction, or unproven claim must not be relabeled green to meet a date.
