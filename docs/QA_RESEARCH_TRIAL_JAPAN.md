# QA Report — First Unattended Pipeline Run (Japan, PR #26)

> Adversarial quality evaluation of the 2026-07-29 research trial: scaffold → dual-pass →
> reconcile → verify → critic → compose → auto-graduate, zero human touches after intake.
> Written on `claude/research-trial-results-h32hlk`. Evidence cited by commit hash and grep
> count throughout; nothing here is asserted from memory.

## Verdict

**The factory works, and the product it shipped is genuinely above the generic-AI bar — but
the run quietly violated three of its own contracts (checkpointing, pass independence,
silent-fork logging), needed two human interventions it doesn't count, and the guide's prose
has developed a self-referential tic that is the same slop-class the descriptor ruling
banned.** Ship-quality: yes. Contract-compliance: no. The gap between those two is exactly
what a second trial should close.

## Scorecard

| Axis | Grade | One line |
|---|---|---|
| Research depth & sourcing | **A−** | 26-row reconciliation ledger, disproved-claim flagging, real conflict resolution |
| Tailoring to this party | **B** | Anchor/birthday/pace nailed; Filipino-culture ask silently dropped; "Hokkaido tour" silently narrowed |
| Honesty discipline | **A** | Phrases card omitted rather than guessed; advisory unfabricated; gaps stated |
| Prose voice | **C+** | "this pass" ×11, "honest" ×11 in traveler-facing text; the guide narrates its own production |
| Pipeline reliability | **C** | Attempt 1 = total loss needing human diagnosis; checkpoints committed in one burst (theater) |
| Token economy | **C+** | ~50% of total spend was the dead attempt; search budget starved the last-scheduled duties |
| Critic effectiveness | **B−** | One real catch (Dazaifu), but same-context self-review and the fix was a hedge, not a replacement |
| Differentiation potential | **A− (unrealized)** | The moat exists (ledger, calendar-truth, disproofs) but is buried in the repo, invisible to users |

## What the trial proved (credit where due)

1. **The reconciliation ledger is the crown jewel.** 26 items, each recording what Pass A
   found, what Pass B found, how conflicts resolved, and which source won (Ippudo downgraded
   on local sentiment; Maedaya promoted over the easy-to-book pick; a one-source Naruko
   shortcut *dropped* for lack of corroboration). No competitor product produces this artifact.
2. **The Amendments log shows real judgment**: routing reordered Fukuoka-first with the flight
   graph and koyo calendar agreeing; ONE ryokan splurge kept to protect the singular
   belated-birthday narrative; the Korea-shaped "give the anchor its own tab" default resisted
   with a reason.
3. **Calendar-aware micro-decisions**: Otaru deliberately on a Monday; Nov 3 flagged as
   Culture Day; the Yukemuri train correctly identified as weekends-only (the visit is a
   Wednesday); the Nov 1 tax-free cutover turned into an actual itinerary decision (Oct 31
   shopping day). This is the tailoring generic AI guides structurally can't do.
4. **The self-correction loop caught real defects** (64c9363): missing/mis-pasted
   source_urls, wrong rank facets — fixed before the gate, not after.
5. **Honest blanks survived pressure**: phrases card omitted when the search budget died
   rather than transliterated from memory; travel advisory left unset rather than shipped
   with a fabricated `verified_on`.

## Findings (severity-ordered)

### SEV-1 — contract violations and reliability

- **F1 · Checkpoint theater.** Pass A, Pass B, and reconcile were all committed at
  **10:32:33 — the same second** (d68524e, a3bc3a7, 12c6939); the state-file stage stamps are
  35 ms apart. The workflow prompt mandates commit+push *after each stage* so a cut-off run
  resumes; the agent batched all three at the end. Had attempt 2 died at minute 50, every
  stage would have been lost and attempt 3 would restart from scratch — the resumability the
  workflow's own header advertises did not exist during this run. **A prompt-level mandate is
  not a guarantee; only the harness can enforce this** (per-stage job steps, or a gate that
  asserts the stage's commit exists before the next stage's tools unlock).
- **F2 · Attempt 1 was a total, undiagnosable loss — and a human fixed it.** 84 turns, $11+,
  10+ minutes, zero durable output, `success` status, output hidden "for security." A human
  had to read the Action log, diagnose it, and patch the workflow (877a1b0) before attempt 2
  could run. The "one human touch" claim was actually three touches this run. The fix shipped
  (`show_full_output`) is observability, not prevention: the pipeline still has **no
  structural assertion that an agent run produced durable output** (checkpoint advanced OR
  commits pushed), and no auto-retry-with-diagnostics on a zero-output "success."
- **F3 · Pass B is not independent.** Both passes ran in one agent context (one session,
  commits seconds apart). Pass B's charter — "research INDEPENDENTLY... do not just re-read
  Pass A" — cannot be honored by the same context that just wrote Pass A; it is
  lens-switching within one mind, anchored by everything A already concluded. The *external*
  source convergence (3 independent write-ups for Daruma, etc.) is real; the *pass-level*
  corroboration the two-pass design promises is overstated. A separate, A-blind agent for
  Pass B would deliver real independence and can run on a cheaper model.

### SEV-2 — tailoring and coverage

- **F4 · A stated traveler interest was silently dropped.** The intake names the party's
  tastes as "gaming, anime, food, **and Filipino food/culture**." Grep across all 11 guide
  files: **zero hits**, and zero entries in the reconciliation ledger or Amendments recording
  a decision to skip it. Maybe the right call is "not applicable on a Japan trip" — but that
  is a *decision*, and CLAUDE.md's own doctrine says silently guessing and silently ignoring
  are both wrong. This is the run's clearest doctrine violation on the content side.
- **F5 · "A real tour through Hokkaido" became a Sapporo hub with three day trips** — and
  the narrowing was never logged as an Amendment. Hakodate (prime late-October koyo at Onuma,
  *and* the literal Shinkansen gateway toward Sendai, i.e. on the route) was never evaluated
  anywhere. The narrowing may be right for a slow-pace trip; unlogged, it's a silent fork.
- **F6 · The date fork undermines the guide's best work.** The itinerary is written
  date-absolute against the unconfirmed Oct 15 start. The guide's *cleverest* tailoring —
  Monday-Otaru, Wednesday-Naruko/no-Yukemuri, Culture-Day warning, the Oct 31/Nov 1 tax-free
  split placement — is all day-of-week keyed, so if Oct 22 wins, the smartest details are
  precisely the ones that break. A ⚠ on Day 1 flags the risk but nothing *handles* it: no
  Oct-22 variant, no "what shifts" section, no mechanism to re-cut the calendar when the date
  locks. The kicker meanwhile states "Oct 15–Nov 10, 2026" unhedged.
- **F7 · The intake's own blanks were never forced.** Voice/tone, splurge-vs-save
  specifics, dietary — all blank; the intake doc's instruction is "complete the blanks WITH
  THE TRAVELER before research," and the pipeline proceeded anyway. Root cause: **the
  headless pipeline has no channel to ask the traveler anything.** The clarifying-questions
  doctrine binds every session, but this workflow structurally cannot comply — forks degrade
  into prose flags instead of questions.
- **F8 · Flight research is thin for the trip's biggest line item.** "HND or NRT, whichever
  has the better fare"; the open-jaw-vs-round-trip question (which shapes the whole routing's
  cost) is unexamined; the intake's points/miles ask got one clause (ANA/United/AA alliance
  mapping) — flagged, technically, but not evaluated.

### SEV-2 — voice and product surface

- **F9 · The guide narrates its own production, in-content.** "this pass" appears **11
  times** in traveler-facing prose; "honest note / honest call-out" **11 times**; plus
  self-praise — "genuinely the rare 'a generic guide couldn't have written this' fact" is the
  guide *complimenting itself inside the guide*, the exact quip-that-praises-the-work pattern
  the descriptor ruling banned by name. A traveler doesn't know what "a pass" is. Provenance
  belongs in the structured layer (⚠, `verified_on`, source flags), never narrated in prose.
  This is a systematic voice defect, not a one-off — it needs a banned-phrase list in the
  voice standard and a grep gate.
- **F10 · The hero image promises the trip's least-likely sight.** The cover is Okama Crater
  — which the guide itself rates as ~50% fog-obscured and probably seasonally closed by the
  Nov 5 visit. Beautiful, on-theme, and quietly at odds with the Honest property when it's
  the first thing a traveler sees. The footage scout, meanwhile, never ran at all (budget
  exhausted — see F11), so the ledger's empty table is starvation, not a searched blank.

### SEV-3 — economy and mechanics

- **F11 · Search budget starved by FIFO.** 200/200 searches spent in stage order; the
  last-scheduled duties (phrases card, footage scout) got zero, and several ⚠s
  (Daruma hours, Ryūtei hours, Yanagibashi schedule, Sapporo koyo spots) exist only because
  the budget died before them. No reservation for mandatory duties, no priority ordering,
  no cheap-model delegation for mechanical lookups.
- **F12 · One effort setting (`xhigh`) governs the entire session** — including compose,
  palette extraction, and commit mechanics that need none of it. Effort should step down per
  stage, not be a single session-wide knob.
- **F13 · The rank-facet defect (food tagged rank 2, should be 1)** was only caught in the
  verify loop. Intake priorities → facet ranks is a deterministic mapping; a 5-line script at
  scaffold time makes this class of error impossible instead of catchable.
- **F14 · The budget tab never closes its own loop.** Line items are estimated but never
  summed against the intake's $150–300/day target — "does this plan actually hit the
  traveler's stated budget" is left unanswered by a tab whose entire job is that question.

## Could a hand-run session have done better?

Honestly: **on coverage, somewhat; on evidence, no; on economics, absolutely not.** An
interactive Opus/Fable session with the same skill would likely have caught F4 and F6-F7 —
because a conversational session *asks* (AskUserQuestion exists there), and the pipeline
can't. It would probably have written cleaner prose (F9) under live taste feedback. But it
would not have produced the reconciliation ledger, the state file, the enforced verify gates,
or the reproducibility — a hand session produces prose; the pipeline produces *evidence* —
and it would have consumed ~90 minutes of human presence per guide, which is the product's
entire scaling premise inverted. The correct conclusion is not "hand-run flagships": it is
**give the pipeline the two things the hand session has** — a traveler-question channel and a
fresh-eyes critic.

## Recommendations, by axis

### 1 · Automation (after the one human touch)
- **R1 — Harness-enforced checkpoints** (F1): split stages into separate workflow steps/jobs,
  or gate each stage on the previous stage's commit existing on the remote. The prompt asks;
  the harness must verify.
- **R2 — Zero-output detection** (F2): after the agent step, assert durable output
  (state advanced or commits pushed); on failure, auto-retry once with diagnostics attached,
  then open the stuck-issue. No more silent-success losses, ever.
- **R3 — A traveler-question channel** (F4/F6/F7): when research hits a genuine fork, the
  agent posts a structured question comment on the originating intake issue, checkpoints, and
  exits cleanly; the traveler's reply re-dispatches the workflow. This makes the
  clarifying-questions doctrine *mechanically possible* in headless runs — today it is
  structurally impossible, which is why forks degrade into ⚠ prose.
- **R4 — Date-lock as a trigger** (F6): when the start date confirms, a modify-guide dispatch
  re-cuts the calendar (dates, day-of-week reasoning, holiday warnings) automatically. The
  ⚠-recheck ledger (JMC ~mid-Sept, JR East Aug/Sept, Wild Area tickets) should likewise feed
  `pretrip-check.yml` with expected-publication dates so recerts self-schedule.

### 2 · Token economy
- **R5 — Reserved sub-budgets per mandatory duty** (F11): e.g. 10 searches held for the
  footage scout and phrases card before Pass A may spend; starvation becomes impossible
  rather than logged.
- **R6 — Per-stage effort and model** (F3/F12): Pass B as a separate, A-blind agent (fixes
  independence *and* parallelizes); mechanical stages at low effort; the verify loop at high,
  not xhigh. The single biggest realized saving remains R2 — attempt 1 was ~50% of this
  trial's total spend.
- **R7 — Structured verification ledger** (JSON, not prose) so "reuse the ledger before
  re-searching" is a cheap lookup instead of a re-read.

### 3 · Authenticity, originality, attractiveness of the first pass
- **R8 — Fresh-context critic** (F3-adjacent): the critic ran inside the author's own
  context and found exactly one item on a 27-day guide — self-review under-finds. Make it a
  separate agent given only intake + finished guide, required to score every marquee pick on
  generic-probability and party-fit, with a minimum-coverage requirement (every tab cleared
  explicitly, findings-or-clearance per item).
- **R9 — Critic must replace, not hedge.** The Dazaifu fix made it "optional, or do more
  food" — more of what the guide already had. The bar for a critic finding should be a
  *researched, novel* alternative (Itoshima coast, Yanagawa canal punting, Kurume as the
  actual tonkotsu birthplace — all in range) entering the same verification ledger.
- **R10 — Voice gate** (F9): banned-phrase greps ("this pass", "this research", "honest
  note", self-referential quality claims) added to the voice standard and enforced in verify.
  Provenance lives in flags only.

### 4 · Differentiation (productive and competitive)
- **R11 — Surface the ledger.** The reconciliation trail is the moat and it is invisible —
  buried in `guides-intake/`. A per-fact "How we know this" popover (source tier, date,
  A/B agreement, convergence count) is a product surface no AI-itinerary competitor
  (Wanderlog, Layla, GuideGeek) can render, because none of them *have* the data.
- **R12 — "What generic guides get wrong."** The Mentai Park disproof is shareable
  differentiation gold: a rendered block of researched, cited corrections to claims that
  circulate in generic guides. Adversarial to the *claim*, not the competitor; uniquely
  credible because each entry carries its disproof source.
- **R13 — Calendar-truth badge.** "Checked against the real 2026 calendar" (holidays,
  day-of-week crowd logic, seasonal closures, the tax-cutover) — name the capability
  competitors lack; it's already being done, unadvertised.
- **R14 — The self-updating guide.** R4's recert triggers, framed as product: the guide
  ripens between purchase and departure ("your foliage dates re-verify when Japan publishes
  its forecast"). No static competitor artifact can follow.

### 5 · Research quality / tailoring
- **R15 — Intake-coverage matrix as a verify gate** (F4/F5/F8): at scaffold time, extract
  every intake ask into a checklist; verify fails unless each maps to guide content, an
  Amendment, or an explicit logged skip. Silent drops become build failures.
- **R16 — Deterministic intake→facet mapping** (F13) at scaffold time.
- **R17 — Budget closure** (F14): the budget tab computes its own daily total against the
  intake target and states the verdict.

### 6 · Other surfaces
- **R18 — Cover honesty check** (F10): a cover whose subject the guide itself flags as
  likely-inaccessible should require either a swap or an explicit caption ("if the season
  holds"). One-line rule in the cover-art standard.
- **R19 — Sentiment mining as a datum:** Pass B already aggregates local sentiment
  informally ("3 independent sources converge"); make convergence a structured score per
  venue and render it as evidence, feeding the same surface as R11.

## Actionable questions for the creator

1. **Pass B independence (F3/R6):** split Pass B into a separate, A-blind agent — at the
   cost of a second agent session per guide? (Recommended: yes; it also parallelizes and can
   run on a cheaper model.)
2. **Traveler-question channel (R3):** should the pipeline be allowed to pause and ask the
   intake-filer questions mid-run via issue comments — accepting that a guide can now take
   days of wall-clock if the traveler is slow to answer? (Recommended: yes, with a 72h
   timeout that falls back to today's flag-and-proceed.)
3. **Filipino-culture ask (F4):** was skipping it the right call for a Japan trip? Either
   way it needs a logged decision — should a modify-guide pass add e.g. a note, or just the
   Amendment recording the deliberate skip?
4. **Date fork (F6/R4):** wait for the travelers to lock Oct 15 vs 22 and re-cut then, or
   pre-generate the Oct 22 variant now while the research is warm? (Recommended: wire the
   date-lock trigger; don't pre-generate.)
5. **Voice gate (F9/R10):** confirm the banned-phrase list ("this pass", "honest note",
   self-referential quality claims) as a doctrine addition to block-types.md's voice
   standard, and whether the Japan guide should get a cleanup pass now or at its first
   recert.
6. **Hokkaido narrowing (F5):** does the Sapporo-hub shape stand, or should a modify pass
   evaluate Hakodate (it's on the route to Sendai and peaks for koyo exactly in the trip's
   window)?
7. **Critic strictness (R8):** minimum-coverage critic as a separate agent adds one more
   agent session per guide — worth it on every guide, or flagship guides only?
8. **Cover (F10/R18):** keep Okama as the hero with an honesty caption, or swap to a
   sight the itinerary guarantees (Naruko Gorge / Zao Onsen townscape)?

---

## Addendum — Readability & UI audit (2026-07-29, session #16, creator-commissioned)

Verified in `astro preview` :4322 with Playwright screenshots at 375px and 1280px.

### Root cause of "hard to read": the schema has no venue block

The repo has already cured dense prose four times — `habitats`, `infogrid`, `tierlist`,
and `raids` each exist, per their own schema comments, to "replace dense prose." But there
is **no structured block for restaurants/shops/venues**, so every food and shopping fact
lands in `prose`: one paragraph per venue carrying address, phone, seat count, hours,
closed-day dispute, booking method, provenance narration, and transit — inline, bolded,
unscannable. On mobile, ONE venue ≈ 1.5 screens of solid text. 53 prose blocks across the
four guides carry this pattern. **Recommendation R20 — a `venues` block type** (name /
area / address / hours / book / how / price / crowd-tip / one-line "why this one" as
fields), rendered as scannable cards; migrate the food + gaming tabs; teach the research
pass to emit it. This is the single highest-leverage readability change available, and it
also fixes F9 structurally: fielded facts leave no room for process-narration prose.

### Defects found (and status)

| # | Finding | Status |
|---|---|---|
| U1 | `.guide-stats` used `justify-content:center` on an overflowing scroll row — the first pill was clipped *unreachably*: "78 days to go" rendered as "**8 days to go**" at 375px (misinformation, not just cosmetics) | **Fixed** (`safe center` + edge padding) |
| U2 | Masthead kicker wrapped mid-date ("OCT 15–NOV / 10, 2026") | **Fixed** (`text-wrap:balance` + narrow no-break spaces in the date) |
| U3 | "More detail · 2 more paragraphs" chips hid *primary picks* (Maedaya — the motsunabe pick — was behind one) with zero information scent | **Fixed for Japan's food tab** via `moreLabel`; other tabs/guides still show count-fallback chips |
| U4 | The fold's fade-out preview cuts text mid-address ("Ganso Nagahamaya — 2-5-25 Nagahama, Chuo-ku, Trust Par…") — reads as a rendering bug, not a teaser | Open — fade should end at a paragraph/sentence boundary, or the split should not open mid-venue |
| U5 | Derived group subtitles are an ALL-CAPS run-on with repeated prefixes ("FUKUOKA — RAMEN · FUKUOKA — YATAI, MOTSUNABE & MENTAIKO · FUKUOKA — …") — doctrine says dedup derived labels at the layout level | Open — collapse shared "City —" prefixes in the derivation |
| U6 | Right-edge pill clipping ("LOCAL 04:1…") has no scroll affordance — nothing signals the row scrolls | Open — edge fade mask on `.guide-stats` |
| U7 | Lead-first violated at the content level: sections bundle 2–3 topics (yatai + motsunabe + mentaiko) so the fold necessarily buries topic 2 and 3 | Open — one-topic-per-section rule for food content; largely superseded by R20 |

### R20 impact estimate

Venue block + subtitle dedup + fold-boundary fix together address the creator's exact
complaint ("information mixed inside lots of prose... should look polished"). Estimated
effect: food/gaming tabs go from ~6 screens of prose to ~2 screens of scannable cards at
375px; every guide benefits at once (shared component); the research pass emits structure
instead of paragraphs going forward. This is a schema + component + migration pass — it
wants its own session, not a small-touches commit.
