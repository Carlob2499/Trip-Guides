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
  `docs/COMPETITIVE_LANDSCAPE.md` (market parity reference) ·
  **`docs/PLAN_ATLAS_MIGRATION.md`** (the current work order — its own Progress ledger is the
  source of truth for which stage is next; read that before re-deriving status from git log).

## Snapshot (2026-08-09 — the creator's 11-point list, nine fixed in nine commits)

The creator opened with "you broke quite a few features" and eleven numbered complaints. Two
were not breakage at all and one was not mine, which matters more than the count.

**The worst one was reported as cosmetic and was destroying text.** "The Day by Day activity
card section is broken and looks janky, goes out-of-space." `.pnl-body` is a grid that exists
only to animate rows 1fr→0fr on collapse, and its COLUMN was never declared — an `auto` track
whose floor is its content's min-content width. Measured on korea/Transit at 375px: the body
box 347px, its own column 529px. And `body` is `overflow-x: clip`, so the 182px hanging off was
not scrollable, it was CUT. Every paragraph in the panel had already wrapped to the wider
measure, so each line lost its ending with no gesture that could reveal it — "fly into and out
of T". A figure at the top of a card was deleting prose three elements below it. Three
contributing causes, all the same shape (route rail, `.venue-pill`, `.hint-bubble`), and no
gate could see any of it: the unit suites lay nothing out and axe does not measure geometry.
`tests/visual/no-h-overflow.spec.ts` is that gate now, and it names the offending selector.

**Two bugs turned out to be bigger underneath than on the surface**, both found by writing the
test rather than by reading the code. `resetView()` had no caller when a pin sheet closed — and
also did not work AT ALL during a flight, because flyTo's rAF step rewrote `_targetK` every
frame, which is exactly the 1100ms window in which someone opens a sheet and closes it. And the
bottom sheets never declared `touch-action`, so one downward swipe had three claimants (sheet
drag, page scroll, pull-to-refresh) and which won depended on where the thumb landed.

**The Korea budget was not lost.** A guide that gains a `roomId` switches source of truth:
autoConnect() joins the room and never calls load(). Korea gained one in f50ca17, so a ledger
typed during the trip is still in localStorage on whichever device typed it, unread, behind an
empty room. persist() refuses to write while `room` is set, so it was never at risk — only
invisible. It is now offered back, and only into an EMPTY room, because merging two solo
ledgers silently picks a winner. The identity remap is the real risk and is pure and tested
(`rekeyForRoom`, 6 cases): a room mints its own ids, and a missed reference leaves every amount
intact, every total correct, and only the BALANCES quietly wrong.

**The prose complaint got a gate, not an opinion.** Thresholds are measured from the corpus —
1087 shipped paragraphs, median 28 words, p75 48, p95 104 — so the ceiling is the distribution's
own tail, not my taste. Existing debt (43 offences) is a recorded baseline that can only shrink,
because reshaping a verified guide's prose is a content edit under the continuity discipline,
not something a lint script does to four trips behind anyone's back. Craft rules the gate cannot
check live beside it in the skill.

Nine commits, `069011d..795b835`, all CI green. Every new gate verified non-vacuous by reverting
the source and watching it fail. Zero `src/content/guides/` diff throughout — no guide content
was touched.

## Open items

- **Two of the eleven are NOT done, and neither is quietly dropped.**
  · **Print preview** (part of #8). The page-print buttons hand off to the browser's own dialog,
    which HAS a preview; the budget sheet builds a document and prints it without ever showing
    it. That is the real gap and it wants a preview-then-print shell — its own change, and the
    synchronous-gesture constraint (`window.print()` must not sit behind an await) shapes it.
  · **"Is there a need for the Next Guide?"** (#11). There is no "Next Guide" anywhere in this
    codebase. Rather than delete something I have misidentified — ask what it is.
- **A visual call for the creator.** SPEC-COMPONENTS rule 1 decided two ambiguous cases the
  kit's mobile screenshots could not settle: the bottom-bar slots and day chips are full pills.
- **Airports for Sedona/Japan** — record them WHEN flights get booked. No fact yet; don't invent.
- Tools, `/about/` and `/new/` are not in the SW precache shell. Cover overlay does not trap
  focus. LOCAL branch `worktree-agent-a7dc7eeb397c6a368` (`5917f8f`) — keep or lose.
- Cloudflare dashboard Git integration still failing 0s builds on every push.
- Korea 03: critic flagged a swapped 명동 label on the Gyeongbokgung map point → file its issue.
- No guide uses a direct royalty-free `sights[].img.src` yet — capability live, unexercised.

## Where we left off

Nine of the creator's eleven points are fixed, verified and live. The two that are not are named
above with the reason, not buried.

The reusable lesson is about which complaints deserve escalation. "Looks janky" was a
text-destroying layout bug; "the globe doesn't re-orient" was an API whose own escape hatch lost
a race with its animation; "the split lost my data" was data that had never been lost, only
orphaned by a source-of-truth switch. In each case the reported symptom was a smaller thing than
the defect, and measuring — not reading the code — is what found the gap.

**Recommended next step:** ask the creator what "Next Guide" refers to, then build the
print-preview shell for the budget sheet. After that the hub visual-fidelity pass is still the
oldest open item.

**Re-prompt the creator with:** "Nine of your eleven are fixed and live. The Day-by-Day one was
worse than it looked — a panel grid column was never declared, so cards grew wider than the
phone and `overflow-x: clip` was cutting the end off every line of prose in them; that's why
sentences just stopped. Your Korea budget isn't gone either: it's still on the device that typed
it, orphaned when the guide gained a shared room, and the panel now offers it back. The prose
complaint got a real gate, with thresholds measured off your own 1087 paragraphs rather than my
taste. Two I did NOT do: the budget sheet still prints with no preview, and I couldn't find a
'Next Guide' anywhere in the code — what is it?"
