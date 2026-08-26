# V01 — Combined Research Run A (Tokyo) evidence packet

Status: **YELLOW — research-quality conditions PASS; bounded gap recorded below**
Authority: `VALIDATION_RUNBOOK.md` §V01 · frozen scenario `VALIDATION_TRIAL_PACKETS.md` §"Combined Research Run A — V01"
Verdict process: orchestrator judgment from durable artifacts, independently challenged by a fresh-context Opus 5 adversarial review before this record was written. The reviewer agreed on every condition and on the class verdict.

## Run identity

- Slug `tokyo` · runId `tokyo-20260826-41ae82` · branch `research-v2/tokyo`
- Scaffold/dispatch head: `9ace94c` on `claude/new-session-eeqncm` (frozen intent copied verbatim into `guides-intake/tokyo/intake.md` before any model output existed)
- Last **gate-accepted** checkpoint: `b13e4c7` (reconcile complete) · final HEAD `21fba55` (critic output, retained but never checkpointed)
- Workflow runs: 32950852089 → 32970542856 → 32976808860 (auto-repair) → 32979405175 → 32995615329
- Models: exactly the frozen candidate — Sonnet 5 high (Pass A + reconcile), Sonnet Pass B, Opus 5 critic. No substitution.
- `landMode: pr` derived; `publication.published: false`; landing never reached. The publication boundary held throughout.

## Stage history (durable `run.v2.json`)

| Stage | Attempts | Outcome |
|---|---|---|
| Pass A | 2 | attempt 1 lost to **usage-limit** (756 s); attempt 2 complete (2 354 s) |
| Pass B | 1 | complete (744 s), isolation leak-check green |
| Reconcile | 3 | offline-verify findings converged **26 → 18 → 0**; complete at `b13e4c7` |
| Critic | 2 | attempt 1 lost to **usage-limit** (199 s); attempt 2's critique completed (1 701 s) but post-critic verify left **1 blocking finding** (undated price figure on one budget row) — never checkpointed |

Attempt budget exhausted (5/5; auto-repair 1/1). Two of five dispatches were consumed by account usage limits, not by run behavior. The pipeline refused blind retries and escalated exactly as designed.

## Pre-registered PASS conditions — all seven hold

1. **Saturation, not quota** — 62 candidates across ~20 food formats; `saturation.stopped: true`, `trend: "duplicates"`, `unresolvedCouldChange: false`, with named residual leads classified as pre-trip rechecks. Pass B records a native search class that returned nothing and shipped nothing — the opposite of padding.
2. **Source-family independence** — `family`/`independent` marked on exactly the experiential rows; the reconcile gate **refused** single-family crowd claims twice until repaired; aggregator-vs-official price disagreement resolved to the fetched official figure.
3. **Reservation depth proportional** — 8 finalist dossiers (release windows, party rules, deposits, cancellation, foreign friction, walk-in, fallback); casual venues carry no dossier and traveler copy says "walk-in or a one-tap online booking, never a project."
4. **Party of six changes decisions** — Florilège rejected (max 4), Sushi Masashi (9+4), Unotoki (16 seats), Uogashi Nihon-Ichi (standing 6–7 spots), Kohaku shortlisted-not-shipped (6-capacity unconfirmed), Aragawa demoted to detour (≈22-seat press estimate), RyuGin anchored on 6–8 private rooms.
5. **Tradeoff recorded** — role-based reconciliation (RyuGin anchor: quality + documented route + capacity buffer; Ukai-tei: low-friction fallback; Ohno: exclusivity at friction cost) with written dispositions including honest rejects ("not disproved, just not adopted").
6. **Worth-the-Effort preserved** — Aragawa and the native-only find Kobikicho Ohno shipped as labeled detours; Ohno cites the intake instruction by name.
7. **No overstated booking certainty (at HEAD)** — press-estimate caveats, `unconfirmed-lead` typing, "if the concierge booking doesn't come through." The RyuGin Sept-1 window is arithmetic on a fetched official rule (`appliesToYears: [2026]`, recheck date recorded), not invention.

**No immediate-FAIL condition triggered.** (Independent reviewer verified each against the artifacts.)

## The bounded gap (why YELLOW, not PASS)

The run never produced a state that is simultaneously **gate-accepted and self-consistent**:

- The critic's citation audit found 6 of 21 sampled perishable facts drifted at the accepted checkpoint `b13e4c7` — including a ¥8,050/person anchor-price error (cancellation fee misread as course price) and two reservation rules attributed to pages that do not carry them. The critic corrected all of them — **containment worked** — but those corrections live only in unaccepted commits.
- `evidence.v2.json` is never re-emitted after the critic stage, so at HEAD the durable evidence artifact contradicts the corrected guide on three shipped facts (Ushigoro party rules, RyuGin price row, Ohno price assertion).
- Completion needs one successful critic re-run (past the exhausted cap — an owner-granted dispatch) **plus** an evidence re-sync; neither is available autonomously.

## Defect classification (runbook §10)

- **Deterministic pipeline:** (R-A) post-critic fact corrections structurally desync `evidence.v2.json` — a consequence of the (correct) critic-blindness design; needs an architecture decision on who owns evidence truth after criticism. (R-B) usage-limit failures decrement the same bounded attempt counter as real failures.
- **Research quality (contained):** the 6/21 perishable-fact drift at the accepted checkpoint; the pipeline's own critic caught 100% of it before landing.
- **UI/reporting:** "(D2 advisory)" suffix on a blocking finding; "8 finding(s)" headline conflating 1 blocking + advisories + checklist reminders; no critic telemetry entry (absence, not a preserved null); stale `state.json` and dead pre-renumber paths in `ledger.md`/`geocode.v2.json`.
- **Enforcement asymmetry:** Aragawa's two `search-preview`, undated experiential rows kept `independent: true` while the same freshness rule forced dated replacements elsewhere.

No frozen PASS criterion was weakened; no research prompt was rewritten; the guide content was not touched by the orchestrator.

## Rerun necessity

Not for V01 itself: the class question — does V2 research behave correctly on a mega-city food/reservation trial — is answered by inspectable evidence. A rerun (or completion of this run) is only needed if the owner wants the draft PR landed and the evidence artifact re-synced. Judging protocol for Run B: where the critic corrects facts, score conditions at both the accepted checkpoint and HEAD, as done here.
