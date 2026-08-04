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

## Snapshot (2026-08-04, session #33 — the ground moved: palette R2, and the repo got a design record)

**The surface tonal ramp widened (`base.css` R2, live).** The three light surfaces sat within
1.10:1 of each other, so a card barely separated from the page under it and `--bg2` read as the
same surface as `--bg`. Same hues, same identity — the ground drops, the card lifts. Light:
card/bg 1.104 → 1.238, bg/bg2 1.094 → 1.128. Dark: card/bg 1.140 → 1.319. Chosen by the creator
from four rendered candidates, not from hex read in chat.

**What moved WITH the ground, none of it taste.** `--green`/`--warn` (on the darker `--bg2` the
old values fell to 4.19:1 and 4.38:1, under the 4.5 floor they hold everywhere else) · country
accent `#b07a1f → #a6721b` (Spain/Colombia/Indonesia/Egypt — it hit 2.85:1 and failed the ≥3.0
build gate; **the gate is the invariant, the accent is the variable**) · `accent-tokens.ts`
LIGHT/DARK_SURFACES are derivation *inputs*, so all 52 accent-inks re-derived and still clear
4.5:1 on all six flat and tinted surfaces. **The method that made this safe: verify the palette
against the repo's own `contrast.ts` BEFORE editing 24 files.** It predicted every consequence.

**One real bug fell out.** `.topbar-search` improvised accent text with `color-mix` instead of
`--accent-ink` — scraped 4.63:1 on the old ground, dropped to 4.45:1 on the new, axe caught it.
Fixed at the cause. This is exactly the failure `accent-tokens.ts` was written to prevent; it
had one survivor. `contrast.test.ts`'s `CARD2` (`#f2f4eb`) was a phantom testing nothing.

**`PRODUCT.md` + `DESIGN.md` + `.impeccable/design.json` now exist** — the repo's first design
record. North Star **"The Surveyor's Sheet"**; every value extracted from the code, every named
rule traceable to a decision already made. PRODUCT.md fences the absences (no testimonials,
users, traffic, revenue, press) so no future surface invents them.

**Lint was dead repo-wide and nobody knew.** Two stale agent worktrees under
`.claude/worktrees/` each carried a tsconfig; typescript-eslint saw two candidate roots and
failed to PARSE all 740 files. Both pruned (verified merged into main + one dir literally
empty); `npm run lint` is clean. `Trip-Guides-progress-preview` was deliberately NOT pruned.

## Open items

- **Needs the creator:** ① decide the fate of LOCAL branch `worktree-agent-a7dc7eeb397c6a368`
  (progress-study design work, `5917f8f`, unreviewed — exists nowhere else; deleting it loses
  the work). **Still the only unpruned worktree**, deliberately preserved in #33; ② sign off
  revise-guide `land` default `draft` → `auto` + V6 Q4 thresholds (overall ≤3, pacing ≤2, ≥3
  skips); ③ Cloudflare dashboard Git integration builds "tripguides" on every push and fails
  in 0s — external config noise, consider disabling (deploy-worker.yml owns the real Worker
  deploy); ④ yes/no on giving skill-evals a `push: main, paths: .claude/skills/**` trigger —
  as written (`pull_request` only) it has fired 0 times ever because skills land by direct push;
  ⑤ **NEW:** add `.claude/worktrees/**` to `eslint.config.mjs`'s `ignores` so a future agent
  worktree cannot kill lint again (see snapshot). The `config-protection` hook blocks Claude
  from editing that file — a deliberate guard, not worked around. One line, creator's hands.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- The S1–S5 research standards + dossier contract have never met a real research pass; the next
  new guide is the calibration test (a floor firing on a legitimately thin priority is data
  about the floor, not the guide).
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.
- feedback-export's Monday cron: proven working via dispatch (PR #32, merged), but the
  2026-08-03 08:13 scheduled fire never appeared. If next Monday's is also absent, investigate
  the schedule registration.
- `.card:has(.brow)` carries a 3px coloured `border-left` (`guide.css`) — incumbent and
  deliberate-looking, flagged in #33, not touched. Revisit if the card language is ever reworked.

## Where we left off

**Session #33 (2026-08-04):** moved the ground under every guide and gave the repo its first
design record. Palette R2 shipped live (24 files, 2 commits, CI 4/4 green, live assets grepped
clean of every old token string); `PRODUCT.md`, `DESIGN.md` and `.impeccable/design.json`
written against the verified state; two stale worktrees pruned, restoring repo-wide lint.

**Re-prompt the creator with:** "The ground moved and it's live. The rule that made a 24-file
palette change safe: verify the candidate against the repo's own `contrast.ts` BEFORE editing
anything — it predicted every consequence in advance, including the two that mattered
(`--green`/`--warn` falling under 4.5:1 on the darker `--bg2`, and `#b07a1f` failing the ≥3.0
build gate). When a colour and a gate disagree, the gate is the invariant and the colour moves.
The axe run then caught one thing static analysis couldn't: `.topbar-search` had improvised its
own accent text with `color-mix` instead of `--accent-ink`, passing on the old ground and
failing on the new — the exact failure `accent-tokens.ts` exists to prevent, with one survivor.
The repo now carries `DESIGN.md` (North Star: The Surveyor's Sheet) so the next component
doesn't re-derive the tokens from scratch. And lint had been dead repo-wide for as long as a
stale agent worktree sat in `.claude/worktrees/` — 740 parse errors, none of them real. Pruned.
Item ⑤ is one line in `eslint.config.mjs` that only you can add; the config-protection hook
blocks me, and I left it blocked."
