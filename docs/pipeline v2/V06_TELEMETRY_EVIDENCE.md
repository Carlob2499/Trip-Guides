# Pipeline V2 — V06 telemetry evidence

Status: **PASS**  
Evidence run: `uruguay-20260823-9789de`  
Source: `guides-intake/uruguay/run.v2.json` on `main`

## Question

V06 asks what model/tool/token/time telemetry Pipeline V2 can measure truthfully today. The acceptance rule is deliberately asymmetric: record values only when the control plane or a durable artifact can prove them; leave everything else unavailable rather than estimating it.

## Trust boundary

The contract in `scripts/pipeline/v2/contracts.mjs` and producer in `scripts/pipeline/v2/telemetry.mjs` make `null` an honest value, not a missing implementation to be filled by inference. Tokens and cost may be written only from a trustworthy producer report. Search, fetch, tool-call, and native-language-search counts are not derivable from prose or output size.

## Real-run evidence

Uruguay Canary #4 provides a completed, retry-bearing V2 sample:

| Metric | Observed | Evidence quality |
| --- | ---: | --- |
| Pass A successful duration | 2,049 s | workflow timestamps |
| Pass B successful duration | 732 s | workflow timestamps |
| Reconcile successful duration | 863 s | workflow timestamps |
| Reconcile failed-attempt duration | 2,541 s | per-attempt history |
| Reconcile cumulative duration | 3,404 s | successful + failed attempt history |
| Critic successful duration | 1,580 s | workflow timestamps |
| Total run wall time | 16,416 s | run start/end boundary |
| Candidates considered | 26 | `evidence.v2.json`-derived count |
| Candidates deep-verified | 20 | shortlisted evidence rows |
| Facts verified | 37 | evidence record count |
| Disagreement investigations | 3 | disagreement record count |
| Models | Sonnet 5 for Pass A/B/Reconcile; Opus 5 for Critic | durable stage state |
| Effort | `high` for all model stages | durable stage state |
| Reconcile retries | 3 failed attempts before success | stage history |

The four model stages consumed **7,765 s (2 h 9 m 25 s)** of recorded active stage time when failed reconcile attempts are included. The run-level wall clock was **16,416 s (4 h 33 m 36 s)**. The **8,651 s (2 h 24 m 11 s)** difference is real elapsed orchestration/queue/wait time, but this evidence does not subdivide that remainder further, so no finer attribution is claimed.

## Intentionally unavailable

These values remain `null` in the accepted run and MUST NOT be inferred:

- tool calls per stage;
- searches per stage;
- fetches per stage;
- native-language search count;
- input tokens;
- output tokens;
- dollar cost.

No API-equivalent cost is calculated from wall time, output size, model name, subscription price, or guessed token counts. A future producer may populate these fields only if it obtains a trustworthy machine-readable usage report.

## Verdict

**V06 PASS.** Pipeline V2 already records the trustworthy telemetry it can prove and preserves honest blanks for the rest. Adding speculative counters would weaken, not improve, the evidence model.

This PASS does **not** claim that current telemetry is sufficient for V07 by itself. V07 compares research quality against resource use after V01–V05 evidence exists; it may use the measured durations/retries/counts above and must keep unavailable values unavailable.
