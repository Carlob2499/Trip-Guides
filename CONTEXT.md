# Waypoint — durable decisions

`CONTEXT.md` is the compact decision ledger for choices that future engineering work must preserve. It is **not** a session log, roadmap, review transcript, or implementation diary. Current status belongs in `docs/handoff.md`; current architecture belongs in `docs/reference/`; Pipeline V2 proof/delivery state belongs in `docs/pipeline v2/`.

If a future decision supersedes one below, replace the decision here and let Git history preserve the old version.

## Product identity

Waypoint is a personal travel command center built around verified, creator-tailored trip information that remains useful on the street, not merely during planning.

The intended field-use hierarchy is:

**Today · Itinerary · Map · Split · Guide**

The day-by-day itinerary is the organizing surface. New capabilities should attach to trip/day context whenever that produces a simpler field experience.

Waypoint is not trying to become a generic social network, booking marketplace, or omnipresent AI chat product. Specialized external apps remain appropriate where Waypoint would only duplicate them poorly.

## Field-use doctrine

Design and engineering decisions should assume the traveler may be:

- holding a phone in bright sunlight;
- walking or standing rather than sitting at a desk;
- on poor, intermittent, or no network;
- carrying luggage or traveling with a group;
- trying to answer “what now / what next / how do I get there / what if this fails?” quickly.

Mobile execution is primary in the field; desktop remains the stronger planning/research workspace. Tablet may combine itinerary and map/context more comfortably.

Offline/poor-network behavior is a core requirement, not a badge. Cached useful trip information must remain reachable when a network request hangs or fails.

Accessibility is product quality. Work should move toward WCAG 2.2 AA while preserving all already-proven accessibility behavior, touch targets, reduced-motion behavior, and truthful labels.

## Durable shared-add acknowledgment

A supported durable collection addition remains locally pending until the server acknowledges its stable-key write. Server acknowledgment removes the active outbox entry and resolves its `addAsync` caller. Offline or transient failure keeps the full payload in the active durable retry outbox, and `addAsync` may remain pending.

A confirmed permanent rejection normally preserves the full payload durably in a separate rejected/dead-letter local bucket, removes it from active outbox capacity and replay, does not retry it on every room join, and rejects `addAsync` with the original or classified error. If writing that bucket fails while active storage remains writable, the ordinary payload stays at its stable path inside `tg-outbox` and system-owned metadata in the same atomic outbox write marks it terminal; marked payloads are excluded from replay and the active 50-entry capacity. If neither terminal representation can be persisted, the full original active payload remains and the caller receives an explicit `WaypointSyncDurabilityError`; retry suppression is then physically unprovable. Waypoint adds no traveler-facing dead-letter management UI.

This decision governs durable collection additions, including Trip Split/reminder additions and Learnings feedback. It does not extend the same outbox guarantee to collection or document `set`, `update`, or `remove`; those paths require separate proof and an explicit contract decision.

## Itinerary and guide breadth

The itinerary is the scheduled plan, not the entire knowledge base.

**Sights and Food are REPOSITORIES**, not itinerary duplicates. They may contain worthwhile unscheduled alternatives so the guide remains useful when plans change, weather intervenes, reservations fail, or the traveler simply wants something different.

Contingencies should fail differently from the primary plan. “Plan B” is not useful when it depends on the same closure, reservation, route, weather condition, or operational assumption that killed Plan A.

## Trip Split

Trip Split is a first-class protected feature and must not be removed as “scope” or merged away because another feature also discusses money.

- **Trip Split** owns actual shared expenses, deterministic split math, balances, and settlements.
- planned trip budgeting remains a separate concept;
- cross-trip Tools may surface Trip Split data but must not clone its ledger/state machine.

Long-term product direction is tighter itinerary integration: adding an expense from day/venue context should be cheap and able to prefill known trip facts without making Trip Split dependent on the itinerary UI itself.

## Feature ownership

Similar names are not proof of duplicate responsibility.

`trip-split`, `trip-tools`, and `trip-kit` are separate systems:

- `trip-split` — shared-money engine and ledger;
- `trip-tools` — cross-trip Tools surface that derives actions/views from existing systems;
- `trip-kit` — focused field utilities such as arrival, packing, language/entry helpers.

Consolidation requires duplicated product ownership or durable state, a safe consumer migration, and tests proving the surviving implementation covers both behaviors.

## Research quality

Waypoint research must not rely solely on model training knowledge for current operational facts.

Key principles:

- current operational facts require current evidence;
- objective facts favor official/primary authority;
- experiential claims may use recent independent firsthand evidence where appropriate;
- blocked access is an honest evidence fact, not permission to pretend a preview was fetched;
- reader/proxy/cache/translation hosts are not silently treated as the original authority;
- uncertainty is stated instead of guessed;
- research memory proposes leads, current research verifies them.

Research breadth is **adaptive**, not a fixed candidate quota. Fixed research floors are gone as the definition of adequate research. The replacement protection is evidence saturation: additional searching is yielding duplicates/weaker evidence and unresolved evidence is unlikely to change the decision.

Research quality still requires coverage of the traveler’s material asks, written rejection/disposition history, source-quality rules, and deterministic gates. “No fixed quota” never means “stop when the first plausible answer appears.”

## Pass independence and criticism

Pass A and Pass B are independent research passes. Pass B must not inherit Pass A’s research result simply because that would be cheaper. Reconcile owns comparison and written dispositions.

The critic runs with fresh context and audits the resulting product/evidence rather than continuing the research conversation.

Pipeline critic findings are **process evidence**, not traveler learnings. Traveler feedback/preferences and pipeline/process failures remain separate knowledge domains.

## Frozen intake

The original intake is the traveler requirement contract and remains frozen once scaffolded. Research state, questions, evidence, assumptions, and resolutions live in separate artifacts.

A pipeline stage must not “fix” a contradiction by rewriting what the traveler asked for.

## Two product lifecycles

Waypoint has exactly two product lifecycles:

1. **Research** — creates or re-researches a guide.
2. **Change** — modifies a guide that already exists.

CI, deployment, recertification detection, progress UI, Worker endpoints, and agent tooling support those lifecycles; they are not additional product lifecycles.

## Pipeline V1 / V2 cutover

Pipeline V2 was deliberately built **beside V1**, not by progressively mutating V1 into a hybrid.

During cutover:

- V1 remains the default/rollback path while `WAYPOINT_RESEARCH_ENGINE` is unset;
- V2 is selected through the explicit selector on the trusted `/new` path;
- manual V2 dispatch is always draft/PR authority (`landMode=pr`);
- V1 is not retired until separate production-cutover acceptance is earned;
- shared pipeline/publication/history surfaces must not be deleted merely because V2 also consumes them.

A green draft canary is evidence for the product path, not automatic permission for production cutover.

## Pipeline truth and publication

Run state, gate truth, merge truth, publication truth, announcement truth, and deployment truth are distinct facts.

Never infer one from another.

In particular:

- a passing evidence gate is not yet a merge;
- a merge is not yet a confirmed deploy;
- a failed announcement does not un-merge content;
- an old published guide must not make a newer active run appear complete;
- a typed PR number or matching slug is not enough to prove run identity.

V2 publication uses durable run identity and a two-phase landing/finalization contract. Failed/conflicted auto landing must leave the remote content draft-quarantined; failure to persist quarantine is loud/blocking, not a safe-state claim.

## V2 failure and recovery

Failure classes describe the execution plane that actually failed.

- agent process: `usage-limit`, `agent-failure`, `cancelled`;
- returned-output verdict: `void-run`, `gate-failure`;
- unattributed deterministic/control failure: fail closed rather than invent a more specific story.

A failed agent process cannot enter the successful artifact path with partial output.

Automatic repair is narrow and bounded. Only actionable `gate-failure` / `void-run` cases with matching validator findings and remaining budgets may auto-repair. Usage limits, cancellation, generic process failure, missing findings, unreadable state, exhausted budgets, or already-published runs do not earn blind retries.

Do not repeatedly spend full model/research runs to debug deterministic state, schema, workflow, or test defects.

## Progress and telemetry honesty

Progress reports what durable backend state can prove.

- absent telemetry remains null/empty;
- token/cost/fetch/nugget metrics are not estimated merely to fill a dashboard;
- run events are joined by run identity, not just slug;
- ambiguous active generations refuse visibly rather than selecting one silently;
- owner notes target an exact V2 `slug + runId + issue` tuple and the Worker independently verifies the same identity before writing.

V1 does not receive a guessed note target where it lacks the same durable issue identity.

## Worker / owner boundary

The site is the human interface; GitHub remains the durable record.

Owner-capable Worker actions fail closed when owner authentication is absent/invalid. Public issue filing must not grant an outsider the ability to spend agents, publish content, or bypass collaborator/owner checks.

Secrets and privileged write authority should be exposed only to the smallest trusted control-plane surface that needs them. Temporary agent-to-agent integration scaffolding is not permanent product architecture merely because it once helped a migration.

## Agent instructions

`AGENTS.md` and `CLAUDE.md` are runtime configuration, not ordinary prose. Their shared policy should remain synchronized, with only explicitly agent-specific runtime names allowed to differ.

Do not “deduplicate” them by moving required runtime instructions into a file the agents will not automatically load.

## Design authority

The future Atlas redesign authority lives in `docs/design-handoff/` until that redesign is implemented and formally retired.

Current cleanup/backend work must not reinterpret those design assets as dead documentation solely because the corresponding UI has not yet been built.

Design authority and current backend architecture are separate concerns: stabilize data/contracts first; broad visual redesign follows on stable interfaces.

## Documentation authority

The active reading path is intentionally small:

- `README.md` — repository orientation;
- `PRODUCT.md` — product identity/rules;
- `docs/handoff.md` — current operational state;
- `docs/reference/` — current architecture/operations;
- `docs/pipeline v2/` — locked/current V2 decision, proof, validation, tracker files;
- `docs/design-handoff/` — future design authority;
- `CONTEXT.md` — durable decisions in this file.

Completed plans, cleanup ledgers, superseded handoffs, and review transcripts belong in Git history. Do not create another parallel “current state” document when an existing authority owns the subject.

## Shipping discipline

A change is not done merely because its focused unit test passes.

Use the repository’s canonical verification hierarchy:

- `npm run check:fast` for a cheap broad local gate;
- `npm run check` for invariants + lint + typecheck + coverage + production build;
- `npm run check:offline` for the service-worker/offline contract;
- `npm run ship:check` for the full check + offline + performance budget;
- CI accessibility/deploy checks remain authoritative for their environment-specific surfaces.

A known red gate, unresolved high-severity defect, stale authority contradiction, or unproven claim must not be relabeled green to meet a date.
