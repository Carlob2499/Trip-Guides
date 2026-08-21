# The Waypoint Pipeline — the two lifecycles

The north star for what this repo *is*: **a factory-with-a-maintenance-department for refined,
researched, creator-tailored travel guides — where creating a guide and keeping it fresh are both
nearly toil-free, and human effort is spent only where judgment genuinely lives.**

There are exactly **two lifecycles**. *Research* builds a guide that does not exist yet. *Change*
edits one that does, whatever prompted the edit. Everything else — the front door, the gates, the
circuit breakers — exists to serve one of those two.

This doc is **policy**: the contracts, the invariants, the operations. How the architecture was
reached lives in `docs/archive/INDEX.md → pipeline-history` and `→ PLAN_EVIDENCE_FIRST`, records
and never work orders. Read alongside `docs/standards/guide-rubric.md` (the bar) and the
`waypoint-guide-author` skill (the content discipline).

---

## Two lifecycles, and nothing else

|  | **Research** | **Change** |
|---|---|---|
| Builds | a guide that does not exist yet | a guide that already exists |
| Workflow | `research-pass.yml` | `change.yml` |
| Agents | 4 (Pass A · Pass B · reconcile · critic) | 2 (change · critic) |
| Stages | `scaffold → passA → passB → reconcile → verified` | none — one run, start to finish |
| Resumable | **yes**, per stage, from a committed checkpoint | **no** — a dead run re-runs from scratch |
| Attempt cap | 5 (`state.json` `attempts`) | 3 (`state.json` `change.attempts`) |
| Branch | `research/<slug>` | `change/<slug>-<issue-or-run>` |
| Lands as | auto-merge + publish on a passing gate, else draft PR | same, except sources nobody asked for |

The asymmetry in resumability is deliberate. A research pass is five to ten agent-hours of
irreplaceable work, so its progress is checkpointed and committed stage by stage. A change run is
one scoped edit whose plan is recomputed from its trigger in seconds — persisting a plan-status
state machine to resume it would cost more than re-running it, and a stale persisted plan is a
whole class of bug that now cannot exist.

## The research lifecycle — build a guide, publish it if the evidence holds

```
  intake (site wizard → Worker → issue)          ← the only human step
        └─ new-guide.yml → scaffold, committed straight to main (draft: true)
             └─ research-pass.yml, branch research/<slug>
                  agent 1  Pass A   canonical & verified   (Sonnet)
                  agent 2  Pass B   local, authentic, crowd-aware (Sonnet, A-blind)
                  agent 3  Reconcile A+B → one guide + ledger, then the verify loop
                  agent 4  Critic   fresh context, 5 scans, citation audit (Opus)
                  └─ pipeline land --gate → verify PASS ⇒ draft flag off + merged, live
                                          → anything less ⇒ draft PR for a human
```

**Each agent is a separate action invocation, so independence is infrastructure, not a request.**
Pass B receives the intake spec and never the guide Pass A wrote; the critic starts cold and reads
the product, not the transcript.

**Every stage checkpoints and commits before the next one starts.** The agent runs
`npm run pipeline -- --slug <slug> --checkpoint <stage>` and commits; a run cut off by the
wall-clock or a usage window resumes at the next un-done stage. The CLI **refuses** a checkpoint
whose predecessor is not committed at HEAD — batching stages into one commit at the end is not
resumable, so it is mechanically impossible rather than asked for.

**Deterministic gates sit between the agents**, so a failure costs a step and not a full run:
`gate preflight` (intake contradictions, surfaced as traveler questions, never a hard stop) ·
`gate coverage` (every `passB.json` finding carries a written verdict in the ledger — the reconcile
blind spot no later critic can see) · `gate artifacts` (the critic's findings + citation audit +
sweep record exist) · `gate compose` · `gate integrity` (void and burst detection).

## The change lifecycle — every edit to a guide that already exists

One workflow absorbs what used to be three (scoped edits, major revisions, and recert's execution
half): the same edit, the same continuity sweep, the same verify loop, differing only in weight —
and **weight is carried by the plan, not by a workflow choice or an approval label.**

| Source | Trigger | Lands |
|---|---|---|
| `request` | a change-request issue (the guide's ✎ button, via the Worker) | auto-merge on a passing gate |
| `answers` | the traveler answered a question the guide assumed past | auto-merge |
| `date-lock` | dates went from assumed to confirmed; the calendar is re-cut | auto-merge |
| `staleness` | `recert.yml`'s weekly sweep found facts past shelf life | **always a PR** |
| `feedback` | a feedback-derived proposal the creator approved | **always a PR** |

**A change nobody asked for never auto-merges, however green it is.** That rule lives in
`scripts/pipeline/plan.mjs` (`ALWAYS_PR`) where the workflow cannot override it.

**The plan is built by code, not by a planner agent.** `pipeline plan` reads the trigger, resolves
any section hints against the guide's real group files, and refuses a plan that names a group which
does not exist or touches more than `MAX_GROUPS` (5) — past that it is a re-research and says so.
The requester's own words never enter a prompt: they are written to `change.txt`, the DATA channel
the prompt names by filename.

Then one working agent (Sonnet — a scoped edit carries no dual-pass reconcile judgment) and one
fresh-context critic on the diff (Opus, Sonnet fallback). Two hard gates follow: the **continuity
artifact gate** (a written sweep record — greps run · ripples fixed · "none" stated — because a
change that landed without one is exactly the silent-skip the continuity doctrine exists to
prevent) and the same evidence gate every other run faces.

**The fork gate is the Clarifying-Questions Doctrine, headless.** An agent that hits a decision only
the creator can make writes `change-forks.json` and stops; `gate forks` comments the questions on
the issue, applies `needs-decision`, and halts the run before anything lands. A fork with no issue
to ask on is a hard failure — a run waiting on nobody is worse than a red build.

### The two loops that feed it

**REFRESH** — `recert.yml` runs weekly, detection-only. One job publishes the no-LLM accuracy audit
(dead links, missing photos, API health, stale stamps) into a single tracking issue; the other lists
every guide with a fact past its shelf life and dispatches one `staleness` change run per guide, so
each lands its own reviewable PR. A *published* guide never silently rots.

**LEARN** — trip feedback → `learnings/<slug>.md` + `docs/evidence/traveler-patterns.md`, so each
guide starts more personalized than the last. When divergence signals trip
(`scripts/feedback-signals.mjs`), the synthesis pass auto-files an **inert** proposal issue
(aggregates only, zero verbatim freeform); it runs nothing until the creator approves it, which
dispatches a `feedback` change run.

## The verify gate — one command, one verdict

`npm run verify -- --slug <slug>` rolls readiness, staleness, links and photos, candidate floors,
source mix, facts hygiene, risk gates, uncertainty, route legs and — under `--network` — source
drift into ONE verdict plus a rubric-shaped scorecard: AUTO rows the machine passes or fails, HUMAN
rows a reviewer checks. Schema stays `npm run build`'s job.

**Findings BLOCK on drafts and ADVISE on published guides** (creator ruling, `CONTEXT.md`). Because
publication is gated on a draft's verify, blocking there means a defective guide can never go live,
while published guides accumulate visible advisories naming what will block once enforced.

**The honest tradeoff, stated plainly:** rubric rows #6/#8/#9/#12 (anchor coverage, priority depth,
party fit, authenticity) are HUMAN-judged and the machine cannot score them. They print in every
scorecard but do NOT block publication — a guide passing every automated gate goes live even if
nobody glanced at them. That is the price of "file an intake, get a guide"; the mitigations are the
Learnings loop after the fact and a change run that fixes it without a re-research.

## Publish-on-verify — there is no graduation step

**Publishing is the landing step, not an event of its own.** `pipeline land --gate` runs the
networked verify itself, writes the scorecard as the PR body, deletes the `draft` key from
`<slug>/_guide.json`, and merges — live on the next Pages deploy. No issue, no label, no human. A
run that fails the gate lands a draft PR instead.

The graduate workflow, its issue form, its approval label and `graduate-guide.mjs` are gone: a human
step that always said yes to the same evidence this code checks was ceremony. What is NOT gone —
the evidence gate itself (`npm run build` + `npm run verify --network`, and `publishGuide()` refuses
to flip anything without a passing verdict); the **veto** (`land-branch.sh` files a "🚀
Auto-published" issue with a one-line rollback); and the manual override,
`node scripts/pipeline.mjs publish --slug <slug>`, which runs the same gate before the same flip.

**retire / soft-delete stays the one always-human decision.** Nothing here ever decides to
un-publish a guide.

## The front door — the site, not GitHub

**GitHub is the record, not the interface.** The creator's surfaces all reach the pipeline through
the Cloudflare Worker (`worker/`, its own README carries setup): the New-Guide wizard files the
intake issue silently and returns a progress-page URL; a guide's ✎ change request files a
change-request issue; the progress page's owner controls answer traveler questions and resolve
blocking forks; and `/progress/triage/`, the owner's queue, starts a change on a waiting request or
approves a feedback proposal by dispatching `change.yml` directly.

**Two gates protect that, in different places.** The Worker's three owner endpoints require an
`X-Owner-Key` header (unset key ⇒ 503, fail CLOSED) — that header is what replaced the deleted
approval labels. And because the issue *templates* are public and auto-apply the request label,
`change.yml`'s resolve job additionally requires the issue's AUTHOR to be the owner or a
collaborator. Without that, filing the identical issue by hand would bypass the key entirely. An
outsider's request still files, still reads; it just spends no agent until a human dispatches it.

Stuck-run alerts still file GitHub issues — those are owner alerts, not a UX.

## The progress surface — what a run is allowed to say about itself

`/progress/` reports a live research run to the person waiting on it, so its rules are honesty
rules before they are layout rules. Three of them cannot be read back off the code and are
recorded here; everything else lives in `src/features/pipeline-progress/`. (They came from the
design bundle that built the page, retired with its plan — `docs/archive/INDEX.md →
PLAN_PIPELINE_SURFACES`.)

**The note panel speaks in three colours, and only one of them takes input.** It is the only
place on the page a person can put something INTO a run, so its colour is a promise about what
happens next:

| Tone | States | What it promises |
|---|---|---|
| `--muted` | `monitoring`, empty page | Nothing is being asked of you — the run is reading, or there is no run |
| `--warn` | `awaiting`, `processing`, stalled page | The run is waiting on a person, or the answer you gave is in flight |
| `--green` | `resumed`, done page | Your answer landed and the run picked up, or the research is finished |

Only `awaiting` (and its in-flight `processing`) has a real endpoint behind the control — the
Worker's POST `/answer`, which already resumes the run. A mid-run note has no endpoint anywhere
in the stack, so `monitoring` and the stalled panel render one line of copy where the control
would sit. **A textarea that posts nowhere is a worse lie than an admitted gap.** When the
emitter exists, the control replaces the copy and nothing else about the panel changes.

**A stalled run holds its frame — every animation on the page stops.** No plane drift, no
marching route dashes, no breathing dot; the page says "Stalled" in words and stops moving,
because a pulse over a dead run is the page inventing activity (`docs/reference/motion.md`, the
work-in-progress amendment). One ordering rule sits above it: an unanswered question OUTRANKS the
stall it caused, since "answer this" is the same fact as "nothing has moved", stated in the form
the reader can act on.

**The route map is written frame by frame, never by a transition.** `offset-distance` animates
via neither CSS transitions nor the Web Animations API in any engine, so the plane and the flown
line are a rAF loop writing `transform` and `stroke-dashoffset` from ONE `t` — always together,
so the nose can never point along a stretch the line has not reached. Three consequences are not
optional: every state change also writes its exact frame **synchronously** (rAF never fires in a
hidden tab, and this is a page people deliberately leave and come back to), the route is
re-measured on `visibilitychange`, and the plane sits at the last station the pipeline actually
CLEARED. Interpolating toward the next one would animate a guess — the run reports at stage
boundaries and nowhere else.

## Run state — one directory per guide

```
guides-intake/<slug>/
  intake.md      the traveler's intent, FROZEN after scaffold. No research state, ever.
  ledger.md      ALL research state: spec summary, reconciliation, amendments, candidates,
                 verification ledger, traveler questions, critic findings, citation audit, sweeps
  state.json     { slug, createdAt, updatedAt, stages{…}, attempts, notes[], change{attempts} }
  passB.json     Pass B's raw findings — data handed between stages
  coverage.json  the intake-asks coverage matrix verify gates on
```

**The intent/ledger split is the point.** When research forces the plan to change, that goes in the
ledger's `## Amendments` — never by rewriting what the traveler asked for. `state.json` is ONE
schema for both lifecycles: the stage map plus a `change` block, written read-modify-write-whole so
either lifecycle can add its own keys without the other's writers knowing.

These files are **generated** — machine-written, git-tracked because git is the durable store.
Hand-edit them only deliberately; the attempt counter resets no other way.

## Prompts — the stage contracts

**Every prompt lives in `prompts/` as a versioned file, never inline in workflow YAML.** A workflow
runs `node scripts/pipeline.mjs prompt prompts/<name>.md`, which substitutes `{{placeholder}}` from
`WP_*` environment variables, **fails loudly on any unresolved placeholder**, and hands the text to
the agent step. `prompts/README.md` governs what belongs in one; `scripts/__tests__/prompt-contract.test.mjs`
gates the seam so a rename cannot silently ship a prompt containing a literal `{{slug}}`.

The division of ownership is strict: **prompts own the stage's I/O contract** (paths, checkpoints,
forbidden reads, STOP conditions), **the `waypoint-guide-author` skill owns what "good" means**, and
anything the schema, `npm run verify` or `scripts/pipeline.mjs` already enforces belongs in none of
them. Untrusted text never enters a prompt — it rides the DATA channel as a named file.

## Circuit breakers — what stops a runaway

- **Attempt caps** (research 5, change 3), bumped *before* the agents run and committed on the run's
  own branch, so the breaker's memory survives a run that dies early. Past the cap: a `stuck` issue,
  and no agent spend.
- **Void detection** — an agent step can burn a session, exit success, and leave nothing behind.
  `gate integrity` compares HEAD and stage count before and after. Research gets exactly ONE
  automatic re-dispatch (which spends an attempt, so the cap still bounds it); a second void files
  the stuck issue. A change run has no auto-retry — it enforces directly.
- **Burst detection** — several stages recorded in one commit is a run that is not resumable, and it
  goes red.
- **Concurrency groups** — research (V1 and V2) and change all share ONE `guide-<slug>` group, so
  any two runs on the same guide queue rather than interleave (research and change share an
  exclusion boundary — they can never land concurrently); the scaffold job serializes globally
  because the slug isn't known until the body is parsed.

## The workflow set

Workflows are **thin**: trigger → setup → agent step(s) → one `pipeline` command. If you are about
to add a `run: |` block with logic in it, it belongs in `scripts/pipeline/` or `prompts/` instead.

| Workflow | Does | Logic lives in |
|---|---|---|
| `new-guide.yml` | scaffold on the `new-guide` label, then start research (engine chosen by the `WAYPOINT_RESEARCH_ENGINE` repository variable: unset/anything-else ⇒ V1 via `gh workflow run`, `v2` ⇒ the V2 pipeline via **workflow_call** — the trusted product invocation whose caller-event provenance is what lets V2 mint auto landing intent; the intake issue threads through) | `pipeline scaffold` |
| `research-pass.yml` | V1: the four research agents, resumable | `pipeline route/gate/land` |
| `research-pass-v2.yml` | V2: one job per stage, mechanical Pass-B/critic isolation, durable run.v2.json. Landing authority is derived, never typed: `auto` only for the trusted /new workflow_call (caller-event provenance — a manual workflow_dispatch is always a draft run, even on main with the selector set) on the default branch with the selector live, re-checked at landing time; everything else is a draft PR. Publication is a two-phase transaction: gate verdict pre-merge, publication finalized only after the merge is CONFIRMED against GitHub — including that the merge commit's own run.v2.json carries the runId being finalized (branch names are reused across generations; a PR proves the run, not just the slug). Every non-merged auto landing re-quarantines the remote branch (draft:true pushed back), and a quarantine that cannot reach origin is a BLOCKED landing, never a safe draft claim | `pipeline-v2 …` + `pipeline land` |
| `change.yml` | every change run, all five sources; answers route to the run that owns the slug — an active research run's ledger (V2 branch preferred) BEFORE any historical publication check, so a live prior run never steals an active run's answer; only with no owning run does a published guide get a change run | `pipeline plan/gate/land/report` |
| `recert.yml` | weekly audit + staleness detection → dispatches change runs | `scripts/recert.mjs` |
| `feedback-export.yml` | export survey feedback → synthesis PR + inert proposal | `scripts/feedback-signals.mjs` |
| `pretrip-check.yml` | T-7 departure window: stale facts on a trip about to happen | `scripts/pretrip-check.ts` |
| `deploy` · `deploy-worker` · `test` · `a11y` · `ensure-labels` · `mutation` (manual) | the substrate | — |

## Model economy — the backbone runs on a Claude subscription

Designed on heavy models; *operated* on light ones.

| Work | Model | Why |
|---|---|---|
| Research passes A + B, reconcile | **Sonnet** (workflow default) | Verification is procedure-driven — the skill and the gates carry the judgment |
| Contested reconcile / anchor calls | **Opus** (explicit dispatch input) | Rare, bounded judgment moments |
| The research critic (one per run) | **Opus** (`critic_model` default) | The last gate before a guide publishes itself |
| The change agent | **Sonnet** | A scoped edit against a code-built plan |
| The change critic | **Opus**, Sonnet fallback | Fresh eyes on the diff |

## What "done" means for the pipeline (exit criteria)

- Filing an intake on the site reaches a corroborated, verify-PASSing guide **merged, published and
  live** with **zero further human action** — and without the creator ever seeing GitHub. A run that
  can't reach PASS lands as a draft PR: the toil floor, not the common case.
- The traveler sees **tangible progress while it runs**, read from the same git-tracked state the
  pipeline already writes, so nothing is maintained twice.
- A **published** guide cannot silently rot: recert opens a freshness PR before facts mislead, and a
  wrong fact is one ✎ request away from a scoped, verified fix with no re-research.
- No stage depends on remembering a separate script: one intake, one research pass, one change
  lifecycle, one verify, one publish — each a named `pipeline` subcommand and a thin workflow,
  inherited by every guide because the machinery lives at the pipeline level, never per guide.
