# Research run metrics contract

> Lifecycle: Intake → Pass A → Pass B → Reconcile → Critic → Finished
> Consumers: pipeline scripts/workflows, owner Pipeline UI, architecture evaluation

Waypoint needs enough observability to improve quality per token without pretending provider data
exists when it does not. This contract defines one durable summary. It does not authorize a second
orchestration system.

## Principles

1. **Truth before completeness.** Every usage number carries `measured`, `estimated`, or
   `unavailable` provenance.
2. **One lifecycle clock.** Intake creation begins the run; successful publication/terminal failure
   ends it. Each agent stage also has its own wall clock.
3. **Separate money concepts.** Claude Max marginal subscription spend is not an API invoice.
   Display marginal billed cost and API-equivalent estimate separately.
4. **Summary in git.** Persist stage summaries and important gate outcomes, not every fetch or token
   tick. High-volume raw telemetry belongs in workflow artifacts/observability storage when useful.
5. **Attempts remain visible.** Retries and wasted work are part of the cost of a guide.
6. **Owner detail, traveler calm.** Metrics live in the owner Pipeline view, not ordinary guide UI.

## Durable artifact

Store one versioned summary at `guides-intake/<slug>/metrics.json`. `state.json` remains the
checkpoint authority; metrics describe the run and may never advance state.

```json
{
  "schemaVersion": 1,
  "runId": "research-japan-2026-08-19T07:14:00Z",
  "slug": "japan",
  "lifecycle": "research",
  "trigger": "new-guide",
  "startedAt": "2026-08-19T07:14:00Z",
  "finishedAt": "2026-08-19T08:02:00Z",
  "outcome": "succeeded",
  "stages": [
    {
      "stage": "passA",
      "invocationId": "github-run/job-or-provider-id",
      "model": "claude-sonnet-5",
      "effort": "high",
      "startedAt": "2026-08-19T07:16:00Z",
      "finishedAt": "2026-08-19T07:28:00Z",
      "wallMs": 720000,
      "outcome": "succeeded",
      "attempt": 1,
      "usage": {
        "inputTokens": null,
        "outputTokens": null,
        "cacheReadTokens": null,
        "cacheWriteTokens": null,
        "source": "unavailable"
      },
      "cost": {
        "marginalBilledUsd": 0,
        "marginalSource": "subscription",
        "apiEquivalentUsd": null,
        "apiEquivalentSource": "unavailable"
      }
    }
  ],
  "gates": [],
  "research": {
    "candidatesConsidered": null,
    "candidatesShortlisted": null,
    "candidatesShipped": null,
    "sourcesUsed": null,
    "nativeQueryFamilies": null,
    "disagreementInvestigations": null,
    "factsReverified": null,
    "stopReason": null
  },
  "totals": {
    "wallMs": 2880000,
    "attempts": 1,
    "inputTokens": null,
    "outputTokens": null,
    "knownTokenStages": 0,
    "totalStages": 4,
    "apiEquivalentUsd": null
  }
}
```

`null` means unknown/not supplied; zero means measured zero. The UI must never render `null` as
zero.

## Stage vocabulary

Research uses `intake`, `scaffold`, `passA`, `passB`, `reconcile`, `critic`, `publish`. Change and
recert lifecycles may reuse the envelope with their own documented stage vocabulary. The UI must
not infer Critic from `verified`; Critic receives its own start, end, and outcome.

## Recorder boundary

Implementation provides one narrow interface used by scripts/workflows:

```ts
startRun(identity)
startStage(stage, invocation)
finishStage(stage, outcome, usage?)
recordGate(gate)
recordResearchSummary(summary)
finishRun(outcome)
```

Calls are idempotent by `runId + stage + attempt`. A resumed workflow updates/finishes the matching
attempt or appends the next attempt; it does not double-count a completed invocation.

## Usage acquisition

Preferred order:

1. structured usage emitted by the Claude action/runner;
2. supported observability export correlated by invocation ID;
3. a documented estimate calculated from measured token counts and a versioned price table;
4. `unavailable`.

Do not scrape human UI counters, infer exact tokens from transcript bytes, or label an API-equivalent
estimate as money charged. Provider pricing is time-dependent; the version/date of an estimate must
be retained with the raw metrics or calculation artifact.

## Gate record

Each gate stores:

```json
{
  "gate": "passb-coverage",
  "stage": "reconcile",
  "startedAt": "...",
  "finishedAt": "...",
  "outcome": "passed",
  "summary": "12 of 12 findings received verdicts",
  "artifact": "optional durable relative path"
}
```

Store concise failure summaries safe for owner display. Secrets, raw prompts, private booking data,
and full provider responses do not enter `metrics.json`.

## Owner Pipeline UI

The first truthful UI binds:

- lifecycle start/end and elapsed time;
- current/completed stage, including Critic;
- model and effort;
- attempt/retry count;
- gate outcomes and terminal failure reason;
- token totals with coverage such as “3 of 4 stages measured”;
- subscription marginal cost and API-equivalent estimate as separate labeled fields;
- candidates/sources/native/disagreement/fact counts only when produced;
- research stop reason and unresolved decision-changing uncertainty.

No estimate appears for remaining time until real historical stage-duration data supports one.
Browser notification language must not imply durable push delivery when the page/browser is closed.

## Evaluation outputs

Architecture comparisons join metrics with quality scores; they never optimize tokens alone. The
minimum comparison report includes citation/fact correctness, defect recall, itinerary/rubric
quality, reservation/transport completeness, unresolved-uncertainty honesty, total tokens, retry
tokens, wall time, and measured-data coverage.

## Acceptance fixtures

- successful four-stage run with complete measured usage;
- successful run with all usage unavailable;
- mixed measured/unavailable stages;
- failed gate and terminal run;
- interrupted/resumed stage without double counting;
- retry showing both productive and wasted usage;
- Critic explicitly running/passed/failed;
- UI rendering `null` as “Unavailable,” never `$0` or `0 tokens`.
