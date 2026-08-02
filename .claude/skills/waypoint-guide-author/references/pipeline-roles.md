# Pipeline Roles — the stage-role law the headless agents execute

The single home for what each research-pass stage *judges and produces* beyond the core
skill. `research-pass.yml`'s prompts point HERE instead of restating any of this — editing
this file edits every agent that plays the role, and there is no second copy to drift.
Interactive sessions playing one of these roles follow the same law.

The chain is four agents: **Pass A → Pass B → Reconcile & verify → Critic**. The critic is
ONE agent carrying every judgment lens (2026-08-02: the separate Fable vibe critic and its
Opus executor were merged in — three sessions of context-rebuilding and two extra verify
loops bought no findings the merged critic can't reach, and splitting "judge" from "fix"
meant the judge never had to live with its own suggestion).

## Traveler questions — research never blocks on a fork

When research or reconciliation hits a REAL fork (dates, lodging style, splurge-vs-save —
a decision only the traveler can make), emit a structured question to the intake doc
(`guides-intake/<slug>.md`) under `## Questions for the traveler`:

```
### q-<slug>-<n>
- **Q:** <traveler-framed question — NO pipeline vocabulary>
- **Assumed:** <what you'll build if they don't answer>
- **Context:** <which section/day this affects>
- **Status:** open
```

Then PROCEED on the assumption — research never blocks on an answer. Emit questions only
for genuine forks, not for facts you can research yourself. (Interactive sessions ask the
creator directly instead — `AskUserQuestion` — same bar for what counts as a fork.)

**The workflow surfaces these to the traveler** (2026-08-02): when the run was dispatched
with the originating intake issue number, a deterministic step posts every `open` question
as a comment on that issue after research and again after the critic. It is a NOTIFICATION,
never a gate — no label swap, no pause, no failed step (creator's ruling: surface questions,
never hard-stop a run). An answer becomes a `modify-guide` / `revise-guide` issue later; the
guide ships on the stated assumption meanwhile. So `**Assumed:**` is load-bearing: it is what
actually gets built, and it is what the traveler is being asked to confirm or correct.

## The fresh-context critic — five scans, then execution under full discipline

A deliberately blind quality gate, run AFTER all mechanical verification: it sees ONLY the
intake spec, the finished guide, `docs/GUIDE_RUBRIC.md`, and this skill — **never
`passB.json`, `.state.json`, or git history.** Its job is to catch what the researchers
couldn't see because they were inside the process. It judges the PRODUCT, not the process,
and it owns graduation.

### The five scans

1. **INTAKE FIT** — do the top 2–3 ranked priorities get REAL depth (multiple verified
   picks woven into the day plan)? Are low-ranked priorities appropriately light? Is the
   anchor event verified against a T0 source with dates + venue?
2. **GENERIC-PROBABILITY** — for every marquee recommendation: would it appear in a
   generic "things to do in X" AI response? If yes, does the guide add SPECIFIC value a
   generic response wouldn't have (crowd timing, off-peak window, neighborhood context,
   booking reality, the local alternative)? The obvious pick with no added depth is a
   finding.
3. **PARTY FIT** — does the guide feel written FOR this party? Budget splits match party
   size, pace matches party type, recommendations suit the party.
4. **AUTHENTICITY** — marquee food/experience picks carry crowd/off-peak notes; at least
   one novel local pick that isn't in the TripAdvisor top 10.
5. **THE VIBE LENS — how the finished trip FEELS.** Read it the way a well-travelled friend
   would: not for facts (verify handled those), but for flow. This scan is judged on the
   same inputs as the rest — the product, never the process.
   - **PACING ARC** — does the trip breathe? A packed jet-lagged arrival day? Three museum
     days in a row? A "slow" day listing six stops?
   - **GEOGRAPHY** — does any day zigzag across the city when reordering stops would halve
     the transit?
   - **MEALS & ENERGY** — are food picks where the day actually puts the traveler at
     mealtimes? A late night followed by a dawn start?
   - **TONE** — does any copy read like a brochure or a model? Flat, useful, human.
   - **COMMON SENSE** — whatever a friend would catch: thin buffers, a "backup" worse than
     nothing, a plan that ignores the party's stated pace.

Scans 1–4 cite a `docs/GUIDE_RUBRIC.md` row; scan 5 cites its lens (pacing arc / geography /
meals & energy / tone / common sense). Judge boldly — a reorder or a swap you can justify is
worth proposing even when nothing is factually wrong.

### Findings — `## Critic findings` in the intake doc, ALWAYS present

Each finding states: what's wrong, WHERE (group file + item), which **rubric row or lens**
it violates, and a **researched replacement** — "consider adding" is not sufficient; research
a specific alternative, verify it against a primary source, write the replacement with source
+ date. A clean pass writes exactly: `None — guide passes the bar test.`

### Execution — implementing your own findings, discipline intact

Then resolve each finding IN the guide (edit the group file, extend the ledger) under the
FULL skill discipline — ledger, provenance (`source_url` + `verified_on` + `shelf_life`),
≈/⚠ legal states, continuity sweep. **Judgment never lowers the bar:**

- A reorder or swap keeps every fact's provenance intact.
- Anything NEW (a venue, a time, a claim) is researched and verified against a primary
  (T0) source before it ships — or it doesn't ship.
- A finding you judge WRONG on second look gets a one-line rebuttal appended beneath it in
  the intake doc instead of an edit. **Disagreement is allowed; silence is not.**

Then the continuity sweep for everything the edits ripple into, and re-run
`npm run verify -- --slug <slug>` + `npm run build` until both are clean (≤3 rounds).
**Record the sweep (required artifact)** — append beneath `## Critic findings`:

```
#### Continuity sweep — critic execution
- greps run: <what you actually grepped>
- ripples found & fixed: <list, or "none — no stale touchpoints">
- deferred to human: <list, or "none">
```

The workflow hard-gates on this block whenever the critic edited the guide — edits with no
recorded sweep fail the run.

### Citation audit — the critic owns done-gate #3 in CI

Sample ≥5 verified perishable facts (weighted toward prices, hours, the anchor event),
fetch each fact's own `source_url`, and confirm the page still supports the stated value.
Record the `## Citation audit` table in the intake doc (claim · value · fetched y/n ·
verdict `supports` / `drifted → fixed` / `unreachable → flagged`), fixing drift and
downgrading unreachables on the spot. **The workflow hard-gates on all three artifacts**
(`## Critic findings` + `## Citation audit` + the sweep record when edits were made) — a
critic run that ends without them fails the run.

### Feed the loop — `docs/PIPELINE_PATTERNS.md` (required, every run)

Before landing, distill this run's findings into the Finding ledger: one row per
finding-CLASS, tagged `[critic]`, with the slug, the date, and the rubric row or lens
violated. A clean run appends its honest-blank row ("clean run — no findings"). Never paste
raw finding text; never let these rows touch `learnings/` or `TRAVELER_PATTERNS.md` — critic
findings are process evidence, not lived experience. Commit the append with the run. If an
OPEN pattern in that ledger already covers what you just caught again, note the recurrence in
your row — recurrence ≥2 is the promotion trigger (a human or a design session moves the rule
into the skill and marks the row promoted).
