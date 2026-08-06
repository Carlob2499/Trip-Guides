# HANDOFF — the warm-start context

> **Ritual (binding):** this file auto-loads at session start via the SessionStart hook
> (`scripts/handoff-head.mjs`) — do not Read it again. Greet the creator with the
> **"Where we left off"** line below and the recommended next step. At SESSION END, rewrite
> the Snapshot + Where-we-left-off sections, move the PREVIOUS snapshot to
> `docs/archive/HANDOFF_ARCHIVE.md`, and commit. The ≤120-line budget is gated by
> `scripts/__tests__/docs-integrity.test.mjs`; deep context lives in the north-star docs.

## Operating rules (stable — rarely change)

- **Model economy:** research/recert/fact edits + mechanical builds run on **Sonnet**; **Opus**
  for design sessions and judgment/first-run-triage work. Remind the creator to
  `/model`-switch at session start.
- **Never number guides as milestones** — the product is the backbone; a new guide is the
  backbone exercising.
- Ship loop on every change: build → **lint** → **typecheck** → test → `astro preview` :4322 →
  grep `dist/` → commit → push to `main` (the only branch — `verify-live` guards every deploy).
  Lint and typecheck are not optional: CI runs all three and session #20 pushed red twice by
  treating build+test as the whole gate.
- North stars: `docs/PIPELINE.md` (generation/maintenance) · `docs/MOTION.md`
  (presentation/motion) · `docs/GUIDE_RUBRIC.md` (quality bar) ·
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference).

## Snapshot (2026-08-06, session #36 — the deploy was never broken; our retry chain was)

**One commit, `661b5a7`, merged to main (fast-forward).** Session #35's four pushes all went red on
Deploy while the site was live and correct. The cause was not Pages — it was our own retry chain
turning a slow queue into a guaranteed failure.

**The mechanism.** `actions/deploy-pages` CANCELS the deployment it created when it times out, and the
deployment ID *is* the commit SHA. So every retry re-submitted that same ID and was handed back the
record the previous attempt had just cancelled — `Deployment cancelled.` five seconds in, every time,
unconditionally. The retries could not succeed. Worse, they left the deployment half-alive, so the
NEXT push died on `due to in progress deployment. Please cancel <prev sha> first` — which is how one
slow queue became four consecutive red runs (`43a05fa`, `f2f7fad`, `5f3e52f`, `e0c787f`). The real
failure was mundane: deployments sat in `deployment_queued` ~12.5 min against the action's 10-min
default and landed about a minute AFTER the workflow gave up.

**The fix.** One attempt, `timeout: 900000` (15 min); retry chain deleted; environment url reads the
single attempt. Plus `verify-live` now runs even when deploy reports failure (`needs: [build, deploy]`,
`if: !cancelled() && needs.build.result == 'success'` — gated on build, so nothing-to-deploy still
skips). It had SKIPPED on all four red runs: the one check that speaks about the SITE rather than the
deploy step stayed silent exactly when it was the only thing that could have said "the site is fine".

**Two lessons for the permanent book.** (1) A retry is only a retry if the operation is IDEMPOTENT —
keyed on a commit SHA, a re-submit is a re-read of a dead record, so the safety net was the bug. (2) A
did-it-land check gated on the deploy step succeeding goes quiet in precisely the case it exists for.

**NOT YET PROVEN — read this first.** No deploy has run since the merge: live `last-modified` is still
13:15:35, the old `e0c787f` deploy. The change is workflow-only so the built site is byte-identical
either way and nothing is missing. The next push carrying real content is the test: deploy green AND
`verify-live` actually running. If it goes red again the failure now means something different — the
queue genuinely exceeded 15 min, not that we cancelled ourselves.

**Dependabot triaged, not fixed (creator's call).** `pdfjs-dist` 6.1.200 — GHSA-hq66-cqwq-w95j,
arbitrary JS on opening a malicious PDF, fixed in 6.2.108 (patch bump, same major). Reachability is
narrow: a traveler must obtain a hostile PDF and deliberately drop it into the New-Guide wizard's
booking-doc upload (`src/features/hub/model/pdf-text.ts`), itself a lazy chunk — no drive-by, no
server-side path, no login or session to steal, only same-origin localStorage. Not urgent; do it on a
routine pass. **Unverified:** could NOT confirm it is literally alert 13 — the GitHub MCP set has no
Dependabot endpoint and direct api.github.com is 403 in agent sessions. It is the only HIGH that is a
direct, shipped, runtime dep; `js-yaml`/`brace-expansion`/`fast-uri`/`ajv` are dev-only, moderate is
`postcss`.

**Phase 2 answered (asked this session).** Per `docs/design-handoff/PROMPT.md` it is **the guide
sheet**: move the sixteen section renderers onto Panels, masthead becomes a plate, graticule comes off
guide photography, and the notation layer lands (provenance dot + staleness popover, flag chips,
stamps, gap state). No spec issue exists yet — #33 deliberately left Phases 2–5 unspecced until the
primitive shipped, and it now has.

## Open items

- **Needs the creator:** (1) LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (progress-study,
  `5917f8f`, exists nowhere else) — keep or lose; (2) sign off revise-guide `land` default `draft` →
  `auto` + V6 Q4 thresholds; (3) Cloudflare dashboard Git integration still failing 0s builds on every
  push — consider disabling; (4) skill-evals `push` trigger yes/no (fired 0 times as
  `pull_request`-only).
- **Deploy fix unproven** until the next real push — see the snapshot. Do not treat `661b5a7` as
  verified; it is merged, not demonstrated.
- Branch `claude/phase-2-design-implementation-2ydnnn` exists on the remote and carries only
  `661b5a7`, now also on main. Delete it once the deploy fix proves out.
- `pdfjs-dist` 6.1.200 → 6.2.108 pending (triaged above, not urgent).
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- S1–S5 research standards + dossier contract still await their first real research pass.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.
- feedback-export Monday cron: if 2026-08-10's scheduled fire is also absent, investigate.
- `.card:has(.brow)` 3px `border-left` — incumbent, revisit only if card language reworked.
- **Panel, deferred by design:** two tabs on one scope clobber each other's collapse state (accepted);
  Phase 2 must enforce the prose tag allowlist inside Panels (fixtures use raw `set:html`); Phase 2
  should re-assert no-animate-on-restore + no-JS against a real guide page (verified, deleted with the
  `_tmp-*` specs, still ungated); guide surfaces must render their own reset-order control — the Panel
  component deliberately carries none; story-mode's accent mixes ride a fixed dark ground with no
  contrast gate (recorded residual risk, #38).
- `.claude/launch.json` gained `astro-preview-alt` (:4323) because another session held :4322 — remove
  if it reads as debris; :4322 stays the canonical ship-loop surface.

## Where we left off

**Session #36 (2026-08-06):** short session, one commit. Diagnosed why session #35's four pushes went
red on Deploy despite a healthy site, fixed it (`661b5a7` — 15-min single attempt, retries deleted,
`verify-live` no longer gated on deploy succeeding), and merged to main by the creator's explicit ask.
Also triaged the open Dependabot HIGH (`pdfjs-dist`, not urgent, deliberately left unfixed) and
answered what Phase 2 is. Gates green before push: lint clean, typecheck 0 errors, 1447 tests, build
clean. `astro preview` and a `dist/` grep were NOT run and were not applicable — the diff touches only
`.github/workflows/deploy.yml` and produces no site output.

**Recommended next step:** write the Phase 2 spec issue (the guide sheet) and let its first real push
double as the deploy fix's proof — or bump `pdfjs-dist` if you want the security surface clean first.

**Re-prompt the creator with:** "The deploy was never broken — our retry chain was. `deploy-pages`
cancels the deployment it created when it times out, and the deployment ID is the commit SHA, so every
retry re-submitted an ID that had just been cancelled and failed in five seconds, guaranteed. That is
the whole four-red-run streak: a safety net that could only ever fail, plus a half-alive deployment
blocking the next push. Two things worth keeping: a retry is only a retry if the operation is
idempotent, and a did-it-land check gated on the deploy step succeeding goes quiet exactly when it is
the only thing that could reassure you — `verify-live` skipped on all four runs while the site was
perfectly fine. The fix is merged but NOT proven; no deploy has run since. Phase 2 is the guide sheet
and its list is stacked in Open items — the tag allowlist inside Panels is the one with teeth."
