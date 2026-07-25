# HANDOFF — read this first, then re-prompt the creator

> **Ritual (binding):** at SESSION START, read this file INSTEAD of re-deriving history from
> the conversation, memory sprawl, or git log — it is the single warm-start context. Then
> greet the creator with the **"Where we left off"** line below and the recommended next step.
> At SESSION END, rewrite the Snapshot + Where-we-left-off sections (keep this header), commit.
> Keep it under ~80 lines — a handoff, not a chronicle. Deep context lives in the north-star
> docs it links; only follow those when the task actually needs them.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Every grand-plan session below lists
  its own model — remind the creator to `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → test → `astro preview` :4322 (never `astro dev`) →
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (updated 2026-07-24, session close #5)

**Close #4's 35-file diff is shipped** (was sitting uncommitted for the whole of that session,
despite that session's own HANDOFF claiming a clean git state — it wasn't). Landed as 7 ordered
commits (tokens before consumers), verified once against the full tree first: build clean, 825
unit tests green, e2e exactly the 3 known pre-existing failures below and no others, dist grep
confirmed the token/alpha changes actually reached the build. `main` is pushed and live.

- Close #4's work in full (type scale's micro-label role, font specimen, Impeccable run, mobile
  measure, credit-badge contrast) is unchanged from what that session reported — see git log
  `4ee1012..7dbf74f` for the 7 commits. The ~70 (measured precisely this session: **272**) ad-scale
  font-sizes remain undeclared-scale — see Left to do.
- **The 3 pre-existing Playwright failures are now diagnosed — root cause found, not fixed (out of
  scope on the creator's instruction).** All three are **test bugs, not source bugs**:
  - `field-tools.spec.ts` "masthead burn tile" + "?stops= link": both use a stale test constant
    (`SPLIT_KEY`/`STOPS_KEY` = `"...southkorea"`) left over from before a slug rename. The guide's
    current `storeKey` is `"korea"` (`"southkorea"` is now only `legacyStoreKey`). Confirmed live in
    the browser: seeding/reading `tg-split-korea` / `tg-stops-korea` (the keys the source actually
    reads/writes) works exactly as the tests expect — burn tile renders `$45,013 logged →`, `?stops=`
    decodes/merges/scrubs the URL correctly. A frozen-clock timer-starvation theory was tested first
    and refuted (real time, no clock freeze, still failed against the wrong key).
  - `sos.spec.ts` "Tab wraps focus (R3)": off-by-one in the test, not a focus-trap bug. Focus starts
    on `.sos-x` (index 0); the trap correctly wraps back to it after exactly `count` Tabs (confirmed
    live). The test presses `count + 1` Tabs, landing one element past the wrap, then asserts on
    `.sos-x` and fails. The trap itself is correct.
  - Fix for all three is a one-line-per-test correction to the tests themselves — not attempted this
    session per the creator's explicit instruction (diagnose only).

## Prior session's work (2026-07-24, close #2, #3, #4)

Close #2: all 78 measured contrast violations fixed. Token system gained `--on-accent` and
`readableOnAll()`/`mix()` in `contrast.ts`. `aria-prohibited-attr`, `frame-title-unique`, all three
font fixes (Literata italic, dead `font-optical-sizing`, CJK fallback) shipped. `frame-tested`
confirmed structurally unfixable.

Close #3: `tests/visual/a11y.spec.ts` wired for dark mode + all tab panels + a verified incomplete-
bucket allowlist (both failure paths deliberately triggered and confirmed before trusting them). A
third real bug found this way: sight-card photos under `loading=lazy` never attempt to load on a
blocked/slow network, so `.media-fail`'s `onerror` path never fired — fixed via a new `.media-ok`
opt-in class instead of an unsafe default.

Close #4: type scale's undeclared 4th role (48 uppercase micro-label rules → one size/tracking/
typeface across 18 files), font specimen rebuilt from verified real candidates, Impeccable's
detector run clean on code (findings were content-layer, out of lane), mobile measure 30→32.6
chars/line, two credit-badge contrast fixes. Left the diff uncommitted — close #5 shipped it.

## Left to do

1. **Type-scale migration — needs Opus, not Sonnet.** 391 `font-size` declarations, 85 distinct
   values; 60 already tokenized, leaving 331 hardcoded across 83 values. Only 59 of those exactly
   equal one of the scale's 8 steps and could move with zero rendered change. The other **272 are
   off-scale** — mapping each onto a step changes rendered text size per cluster, a design decision,
   not a mechanical refactor. `/model` switch before starting it.
2. **The 3 Playwright test fixes** — diagnosed above, not applied. `field-tools.spec.ts`'s two
   stale-key constants and `sos.spec.ts`'s off-by-one Tab count. Small, mechanical, safe for Sonnet.

## Owner tasks (unchanged, still outstanding)

1. **Revoke** the old GROQ key at the Groq console (out of `.env`, not revoked).
2. **W5 label-free test — approved but NEVER RUN.** `GH_TOKEN` is on the Worker; the plan was to
   disable `New guide scaffold`, POST a real payload, confirm the issue files, delete it, re-enable.
   The permission classifier blocks the workflow toggle, so the creator must flip it.
3. **W2:** mint a read-only Firebase RTDB service account → repo secret `FIREBASE_SERVICE_ACCOUNT`.
4. Delete merged remote branch `claude/test-coverage-analysis-siftjs` (sandbox 403s on ref deletion).
5. Commit `eae5573`'s subject line is a literal `@` (PowerShell here-string leaked into Bash); the
   body is intact. The Fact-Forcing Gate blocks `--amend`, so repairing it needs the guard off.

**W6 (real end-to-end pipeline proof) stays deferred, gated on an actual trip** — creator's choice.
Prior W0–W5 arc (token canary, pre-trip auto-recert, LEARN loop, IMPROVE loop, PDF intake,
zero-click Worker) is complete and live; detail in `docs/PIPELINE.md` and the git log.

## Where we left off

This session's job was narrow: ship close #4's 35-file diff (it had never been committed), diagnose
— not fix — the 3 pre-existing Playwright failures, and rewrite this file. All three are done.

The diff landed as 7 commits, ordered so foundation tokens (`--on-accent`, the `--text-*` scale)
land before anything that consumes them. Verified once against the whole tree before splitting:
build clean, 825 tests green, e2e produced exactly the 3 known failures and nothing else, dist grep
confirmed the token/alpha changes actually reached the built CSS. Pushed to `main` on the creator's
go-ahead. A stray `.claude/launch.json` entry for an unrelated project (`wayfinder`) was dropped in
its own commit, also on the creator's go-ahead.

The 3 failures turned out to be **entirely test bugs** — traced with hard evidence (seeded real
`localStorage` keys and Tab sequences live in the browser, not guessed): two `field-tools.spec.ts`
tests read/write a stale `"...southkorea"` storage key left over from a slug rename, when the
guide's real key is `"korea"`; `sos.spec.ts`'s focus-trap test presses one Tab more than the trap's
own wrap point. Source code is correct in all three cases. Left unfixed per instruction — the fix
is a one-line constant/count correction per test, flagged in Left to do as safe, small Sonnet work.

One leftover, unrelated to this session, deliberately not touched: `git stash list` still holds
`stash@{0}: WIP on main: 541b755 …`, a leftover based on a commit far behind `main`.

**Re-prompt the creator with:** "Close #4's diff is shipped — 7 commits, pushed, build/tests/e2e all
green against the expected baseline. The 3 pre-existing Playwright failures are diagnosed: all three
are test bugs (two stale storage-key constants, one off-by-one Tab count), not source bugs — fix is
small and safe whenever you want it done. The type-scale migration (272 off-scale font-size sites)
still needs an Opus session — that's real design judgment, not a mechanical refactor. There's also
still a leftover `git stash` from a much older commit, untouched. Where would you like to start?"
