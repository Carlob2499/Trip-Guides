# Pipeline history — how the current architecture was reached

**This is a historical record, not a work order.** `docs/reference/pipeline.md` is the live
policy doc and the only one a session should execute against; this file exists so that doc can
state the pipeline's *contract* without also carrying the story of how each piece arrived
(F2, `docs/PLAN_EVIDENCE_FIRST.md`). Nothing here is a spec. Where a claim below has since
been superseded, the reference doc wins.

---

## The P-series — the pipeline phases (all shipped)

| Phase | Deliverable | Serves |
|-------|-------------|--------|
| **P0 · Verify roll-up** | `npm run verify` — one verdict + rubric scorecard over readiness + staleness + audit; the gate every later stage reuses | VERIFY |
| **P1 · Intake unification** | `scripts/intake-schema.mjs` becomes the one source of truth (FIELDS + zod); the issue form, parser and scaffold derive from it, and a contract test fails CI on drift | INTAKE |
| **P2 · Resumable generate** | `scripts/pipeline.mjs` checkpoint spine (`<slug>.state.json`, stages scaffold→passA→passB→reconcile→verified); research-pass resumes the branch and commits per stage | GENERATE |
| **P3 · Recert / self-freshening** | `recert.yml` (weekly + on-demand): detect all stale guides → matrix → per-guide recert agent re-verifies flagged facts → freshness PR | REFRESH |
| **P4 · Graduate on evidence, auto** | `research-pass.yml` auto-graduates the moment verify PASSes; `graduate-guide.yml` demoted to a manual-override/rescue path | PUBLISH |

Sequencing at the time was P0→P1→P2→P3→P4 before any new guide — "infrastructure and pipelines
before Guide #3", the creator's framing — with R3→R6 (dynamic runtime, per-country visual
identity, tool suite, app-ready distribution) to follow.

### Implementation detail retired from the reference doc

- **GENERATE auto-chaining + circuit breaker.** `new-guide.yml` dispatches `research-pass.yml`
  itself the moment a scaffold commits, so filing the New-guide issue is the only manual step to
  start a guide. Each run bumps a persisted attempt counter before spending agent tokens; past 5
  attempts without reaching `verified` the workflow stops and files a `stuck` issue rather than
  resuming forever. The research stages stay judgment work, so the "chainer" is the Action or an
  interactive session; `pipeline.mjs` is the resumable spine and attempt budget it runs against.
- **VERIFY network budgeting.** The dead-link/photo gate runs only with `--network` because it
  makes real HTTP requests. Both auto-publish paths pass it explicitly so a guide can never
  auto-publish with dead citations behind a silent PASS. Roughly one HEAD check per citation —
  a guide with ~40 cited URLs adds about 20–40 s to that job.
- **PUBLISH mechanics.** On a full verify PASS the same job calls `graduate-guide.mjs --slug` to
  remove `draft: true` in place (the PASS the agent just confirmed *is* the evidence — there is no
  separate evidence run), then merges its own branch to `main` via `scripts/land-branch.sh`,
  shared with `modify-guide.yml`. The guide is live on the next Pages deploy.

---

## The W-series (2026-07-23) — the skill-loop optimization arc

A skill-loop optimization arc that closed the remaining manual seams. Each ended the arc's own
Ship Loop (build + test + typecheck green); all inert-until-configured pieces degrade gracefully.

- **INTAKE — zero-click option (W5).** A Cloudflare Worker (`worker/`, deployed by
  `deploy-worker.yml`, config-gated by `src/features/hub/intake-proxy-config.js`) files the
  `new-guide` issue FOR an anonymous visitor — no GitHub account, no click — validating with the
  same intake schema and rate-limiting anonymous submissions (Turnstile + per-IP cap). The site
  stays on Pages; the wizard falls back to the prefilled-issue path when the proxy is off. Booking
  upload also parses **PDFs** client-side (W4, `pdf-text.ts`), still never uploading the file.
- **LEARN — automated (W2).** `feedback-export.yml` + `scripts/export-feedback.mjs` read new trip
  feedback via a read-only service account and draft the synthesis (`learnings/<slug>.md` + the
  public `learnings` block + party-scoped traveler-pattern deltas) as a **review PR** — the maker
  edits, no longer types. Freeform stays summarized-only, never verbatim; the sync marker
  (`learnings/.sync.json`) advances only on merge.
- **REFRESH — pre-trip auto-dispatch (W1).** `pretrip-check.ts` dispatches `recert.yml` for any
  T-7 guide with real stale facts (deduped, `AUTO_DISPATCH`-gated) — the daily granularity
  recert's weekly sweep lacked, so a guide can't reach departure on facts that went stale between
  Mondays. recert still opens a human-reviewed freshness PR.
- **IMPROVE — the self-improvement loop (W3).** Every research/recert run appends a report to a
  pinned **run-ledger** issue (`append-run-report.mjs`); a monthly **skill-retro** agent proposes
  evidence-cited skill edits as a review PR; and **`skill-evals.yml`** runs the skill's evals on
  any `.claude/skills/**` PR (`run-skill-evals.mjs` — deterministic gate + Haiku judge), so a
  skill edit can't regress guide-authoring quality unnoticed.
- **Hardening (W0).** Token-expiry canary (`token-canary.yml` — the agent pipeline's silent SPOF),
  modify-guide `section`-field injection sanitization, and the flaky screenshot-diff gate removed
  in favour of a slim reliable a11y gate (`a11y.yml`).

---

## Critic merge (2026-08-02)

The chain is four agents — Pass A · Pass B · Reconcile · Critic. The experimental Fable vibe
critic, its Opus fallback, and its Opus vibe executor were folded into the single critic, which
runs the vibe lens as its fifth scan and implements its own findings under full verification
discipline (`.claude/skills/waypoint-guide-author/references/pipeline-roles.md`). Three extra
agent sessions and two extra verify loops per run bought no findings the merged critic can't
reach, and splitting "judge" from "fix" meant the judge never had to live with its own
suggestion.
