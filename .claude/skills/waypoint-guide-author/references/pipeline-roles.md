# Pipeline Roles — the stage-role law the headless agents execute

The single home for what each research-pass stage *judges and produces* beyond the core
skill. `research-pass.yml`'s prompts point HERE instead of restating any of this — editing
this file edits every agent that plays the role, and there is no second copy to drift.
Interactive sessions playing one of these roles follow the same law.

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

## The vibe lens — judging how a finished trip FEELS

Runs AFTER mechanical verification, BEFORE the rubric critic. Read the guide the way a
well-travelled friend would: not for facts (verify handled those), but for flow.

**Inputs (and ONLY these):** the intake spec (`guides-intake/<slug>.md`) and the finished
guide (`src/content/guides/<slug>/`). Never passB.json, .state.json, or git history — the
vibe critic judges the product, not the process.

**Judge:**
- **PACING ARC** — does the trip breathe? A packed jet-lagged arrival day? Three museum
  days in a row? A "slow" day listing six stops?
- **GEOGRAPHY** — does any day zigzag across the city when reordering stops would halve
  the transit?
- **MEALS & ENERGY** — are food picks where the day actually puts the traveler at
  mealtimes? A late night followed by a dawn start?
- **TONE** — does any copy read like a brochure or a model? Flat, useful, human.
- **COMMON SENSE** — whatever a friend would catch: thin buffers, a "backup" worse than
  nothing, a plan that ignores the party's stated pace.

**Output — findings only, never edits.** Write to the intake doc under `## Vibe findings`:
each finding states WHAT feels wrong, WHERE (group file + item), and a CONCRETE suggested
change. Suggest swaps and reorders freely, but never invent a fact — anything new proposed
here must be verified by the executor before it ships. If the trip reads well, write
exactly: `None — the trip reads well.` (the findings gate greps for this sentinel — keep
the wording exact). The vibe critic touches nothing but the intake doc and never graduates.

## The vibe executor — implementing findings under full discipline

Implements `## Vibe findings` in the guide directory under the FULL skill discipline —
ledger, provenance (source_url + verified_on + shelf_life), ≈/⚠ legal states, continuity
sweep. Vibe never lowers the bar:
- A reorder or swap keeps every fact's provenance intact.
- Anything NEW (a venue, a time, a claim) is researched and verified against a primary
  (T0) source before it ships — or it doesn't ship.
- A finding the executor judges WRONG gets a one-line rebuttal appended beneath it in the
  intake doc instead of an edit. **Disagreement is allowed; silence is not.**
Then the continuity sweep for everything the edits ripple into, and re-run
`npm run verify -- --slug <slug>` + `npm run build` until both are clean (≤3 rounds).
The executor never graduates — the rubric critic runs next with fresh eyes.

## The fresh-context critic — bar test, rubric scoring, citation audit

A deliberately blind quality gate: it sees ONLY the intake spec, the finished guide,
`docs/GUIDE_RUBRIC.md`, and this skill — never passB.json, .state.json, or git history.
Its job is to catch what the researchers couldn't see because they were inside the process.

**The four scans:**
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

**Findings — `## Critic findings` in the intake doc, ALWAYS present.** Each finding: what's
wrong, which rubric row it violates, and a **researched replacement** — "consider adding"
is not sufficient; research a specific alternative, verify it against a primary source,
write the replacement with source + date. A clean pass writes exactly:
`None — guide passes the bar test.` Then resolve each finding IN the guide (edit the group
file, extend the ledger), and re-run verify + build until clean (≤3 rounds).

**Citation audit — the critic owns done-gate #3 in CI.** Sample ≥5 verified perishable
facts (weighted toward prices, hours, the anchor event), fetch each fact's own
`source_url`, and confirm the page still supports the stated value. Record the
`## Citation audit` table in the intake doc (claim · value · fetched y/n · verdict
`supports` / `drifted → fixed` / `unreachable → flagged`), fixing drift and downgrading
unreachables on the spot. **The workflow hard-gates on both artifacts** (`## Critic
findings` + `## Citation audit`) — a critic run that ends without them fails the run.
