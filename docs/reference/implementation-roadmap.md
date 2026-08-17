# Waypoint completion roadmap — August to October 2026

> Objective: research and engineering freeze by 2026-09-30; UI finalization 2026-10-01 through
> 2026-10-07.

The project is not starting over. The Atlas, guide renderer, group tools, New Guide intake,
four-stage Claude workflow, deterministic gates, evidence ledger, perishable facts, pretrip
checks, and Pipeline shell are working assets. This roadmap aligns and completes them.

## Execution loop

Each package follows one ownership loop:

1. **Codex scopes** the package against `decision-register.md` and writes acceptance criteria.
2. **Claude Code implements** only that package on a dedicated branch.
3. **Codex reviews** the diff independently for decision fidelity, regressions, and excess scope.
4. **Claude Code repairs** concrete findings.
5. The normal ship loop and relevant boundary checks pass before merge.

Chat history is evidence, not the handoff mechanism. The register, this roadmap, package issue,
tests, and code are the shared state.

## Model and effort routing

| Work | Recommended model | Effort |
|---|---|---|
| Decision reconciliation, architecture, independent final review | Codex GPT-5.6 Sol | High |
| Research doctrine, prompts, evidence semantics, adversarial pipeline judgment | Claude Opus 5 | High, bounded to the package |
| TypeScript/Astro/scripts implementation from an approved contract | Claude Sonnet 5 | High |
| Mechanical parity edits, fixtures, routine test repairs | Claude Sonnet 5 | Medium |
| Full-guide benchmark runs | Claude Sonnet 5 first; Opus only as an explicit variant | High |
| Optional GPT experiment after the production freeze | Codex GPT-5.6 Sol | High |

Default production research remains Claude/Sonnet. Opus is an escalation or controlled test, not
an automatic tax on every run. Every session must state its model and effort before work begins.

## Package 0 — alignment baseline (2026-08-17 to 2026-08-20)

Deliverables:

- `decision-register.md`: product contract and R1–R61 with honest decision status.
- `run-metrics.md`: one Intake-to-Finished measurement contract.
- this executable roadmap.
- corrected public issue-form descriptions and current handoff.

Completion criterion: every creator decision is recorded or explicitly marked provisional; every
subsequent package points to register rows and has a testable boundary.

## Package 1 — doctrine alignment (target 2026-08-23)

Claude Code’s first bounded assignment:

### Scope

- Keep Pass A, independent Pass B, Reconcile, and cold Critic for now; architecture evaluation
  occurs later.
- Change native-language research from unconditional full native-first success criteria to an
  adaptive trigger recorded in the ledger. Local-language evidence may stand without English
  duplication when operational claims are verified.
- Separate **operational fact evidence** from **experiential corroboration**. Primary authority
  governs hours, prices, rules, dates, addresses, and schedules; recent independent firsthand
  evidence governs crowds, friction, atmosphere, and practical difficulty.
- Add bounded reservation doctrine: top 2–3 or itinerary-changing candidates; demand-driven
  concierge investigation; honest unconfirmed leads; Worth the Effort/Detour output.
- Add transport doctrine for fragile/consequential legs: door-to-door, actual party, physical
  transfer, missed-service penalty, last practical service, and verified fallback.
- Add stop-reason requirements: saturation evidence, serious alternatives, failure conditions,
  and remaining decision-changing uncertainty.
- Preserve existing independence, source dates, negative evidence, ship/flag/omit, coverage
  verdict, critic, and publish gates.

### Likely files

- `.claude/skills/waypoint-guide-author/` — production Claude doctrine.
- `.agents/skills/waypoint-guide-author/` — Codex mirror; contents must remain behaviorally equal.
- `prompts/research-passA.md`, `prompts/research-passB.md`, `prompts/research-reconcile.md`, and
  `prompts/research-critic.md` only where stage contracts need the new artifacts.
- `scripts/scaffold-guide.mjs` and focused verification tests for ledger headings/fields.
- `docs/reference/pipeline.md` only for durable behavior, after implementation agrees.

### Guardrails

- No new external API/MCP.
- No pipeline-role merge.
- No UI redesign.
- No generalized research-memory engine.
- Quantitative candidate floors may remain safety alarms, but they cannot overrule an evidenced
  saturation/insufficient-market conclusion.
- `.claude` and `.agents` must not drift; add or use a parity check rather than relying on memory.

### Acceptance

- Fixtures cover: strong local experiential evidence with primary operational facts; English-only
  research that legitimately does not trigger native escalation; thin/tourist-heavy English that
  does; concierge investigation on one exceptional candidate but not every hotel; practical plus
  Worth-the-Effort output; fragile rural transfer versus forgiving urban transit; explicit stop
  reason.
- Existing guide, prompt-boundary, Pass B coverage, verify, build, lint, typecheck, and test gates
  remain green.
- A cold reviewer can map every changed behavior to specific register rows.

## Package 2 — truthful run state and metrics (2026-08-24 to 2026-09-06)

- Make Critic an explicit durable stage rather than hiding it inside `verified`/UI phase grouping.
- Implement the single recorder defined in `run-metrics.md` at workflow/stage boundaries.
- Capture time, attempts, model/effort, outcome, gates, and measured token/cache/cost data when the
  runner exposes it; store `unavailable` rather than inventing precision.
- Keep subscription marginal cost and API-equivalent estimate separate.
- Produce bounded summary data for the Pipeline UI; avoid a high-volume event log in git.

Completion criterion: an interrupted, failed, resumed, and successful fixture run each produce a
valid truthful summary, and absence of provider usage data renders explicitly as unavailable.

## Package 3 — architecture and model evaluation (2026-09-07 to 2026-09-13)

Run frozen representative fixtures, including Japan/Korea food and reservations, a fragile transit
leg, a stale event, a contradiction, and a low-complexity destination.

Compare at minimum:

- four-role all-Sonnet;
- current four-role configuration;
- one plausible three-role merge only if a written hypothesis predicts savings without weakening
  independence;
- optional GPT critic/research experiment only if it works within the user’s existing plan or an
  explicitly approved capped expense.

Score factual/citation correctness, defect recall, itinerary quality, native discovery novelty,
reservation completeness, unresolved-uncertainty honesty, total measured tokens, retries, and wall
time. Architecture changes only when evidence shows a material quality-per-token improvement.

## Package 4 — backend-to-UI actualization (2026-09-14 to 2026-09-20)

Bind the existing Pipeline owner surface to real data:

- exact active stage including Critic;
- outcome, attempts, failure reason, and resume state;
- gates and unresolved flags;
- sources/candidates/decisions/nuggets only where a real producer exists;
- token/time/cost summary with measured/estimated/unavailable labeling;
- stop reason and deep evidence available to the owner on demand.

Traveler-facing Waypoint stays calm. Surface operational facts, uncertainty, booking actions,
contingencies, and Worth the Effort choices; keep research machinery in owner views.

## Package 5 — freeze hardening (2026-09-21 to 2026-09-30)

- Run real-trip scenarios on desktop and mobile.
- Test offline cold load and offline return paths for required field features.
- Force critical failure paths: unavailable source, provider usage missing, interrupted agent,
  stale fact, failed gate, exhausted attempt cap, unavailable booking, delayed remote transit.
- Complete pre-trip reverification behavior and the Japan regression fixture.
- Fix defects only; experiments and architecture expansion are deferred.

Freeze criterion on 2026-09-30: no known severity-one travel failure, all required gates green,
offline field contract demonstrated, run telemetry honest, and outstanding work explicitly deferred.

## UI finalization (2026-10-01 to 2026-10-07)

Polish and accessibility work may continue against frozen behavior. Compare the running production
build at mobile and desktop against the approved Waypoint design references. UI text must describe
only data the backend actually produces. No new research architecture enters during this week.

## Claude Max 5x operating rhythm

- Weekly reset: Wednesday 03:00 America/New_York.
- Start full-guide benchmarks and expensive research passes soon after reset.
- Prefer Sonnet for baseline production and implementation; reserve Opus for the bounded doctrine
  package, contested reconciliation, or an explicit benchmark variant.
- Checkpoint between stages. Do deterministic CI, documentation, and UI work late in the window.
- Do not start another expensive stage near a known five-hour boundary when the last durable
  checkpoint would be lost.
- The recorder measures observed use; it does not claim access to Anthropic’s private remaining
  quota unless such a signal is actually available.

## Clarifying questions

None block Package 1. R23 and R42–R48 are labeled provisional and cannot expand Package 1’s scope.
Any newly discovered fork that changes user-visible behavior returns to the creator before build.
