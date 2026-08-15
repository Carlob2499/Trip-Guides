# Guide Rubric — the standard every guide is judged against

The single, prioritized bar for a Waypoint guide — used by the research self-correction loop
(the `waypoint-guide-author` skill) and by `npm run verify` (the rolled-up gate that scores this
rubric — see `docs/reference/pipeline.md`). That verify PASS is also what PUBLISHES a guide: the
draft flag comes off in the same step that merges, with no separate human approval on the happy
path (`docs/reference/pipeline.md`, "Publish-on-verify"). A human only ever reads this rubric
directly when triaging a draft that couldn't reach PASS on its own. Derived from the four
properties (**Verified · Personal · Actionable · Honest**), the
verification rules (`.claude/skills/waypoint-guide-author/references/verification-rules.md`), and
the post-mortems of the Korea/Denmark builds.

**Tiers:** **P0** blocks publication (a draft with any P0 failure is not shippable). **P1** is the
Korea-tier quality bar (all P0 + all P1 = publishable). **P2** is continuous polish.

**Gate column:** `readiness` / `build` / `axe` = auto-enforced (a machine says pass/fail);
`human` = judgment the tooling can't make, done via the skill's §8 self-check + the "bar test".

| # | Dimension | Property | Measurable criterion | Gate | Tier |
|---|-----------|----------|----------------------|------|------|
| 1 | Schema valid | — | `npm run build` clean (zero content-collection errors) | build | **P0** |
| 2 | No fabrication | Verified | 0 `__VERIFICATION_REQUIRED__`; 0 guessed `img.file`/`img.src` (Commons filename script-confirmed, direct URL fetch-confirmed); every named venue/event actually exists (spot-check) | readiness + human | **P0** |
| 3 | Provenance on perishables | Verified | no `verified_on` without `source_url`; strict mode: no `≈` without a `verified_on` | readiness + build | **P0** |
| 4 | Completeness | Actionable | no empty `panel`/`prose` bodies (checklist-only ok; References exempt); every day card has a real "Mon D" date + a real body | **readiness** | **P0** |
| 5 | Itinerary integrity | Actionable | dates contiguous, no gap/duplicate; day count matches the intake's trip span (human confirms span) | readiness + human | **P0** |
| 6 | Anchor coverage | Personal | on an anchor trip, the non-negotiable event is verified against a **T0** source (dates + venue) and the trip is built around it | human | **P0** (anchor trips) |
| 7 | 4-question venue rule | Actionable | every venue answers **where / how to get there / when it fits / book?** — and (S1, 2026-08-02) every venue + named map point passes a Places **operating-status check** at the network gate: `CLOSED_PERMANENTLY` blocks, notFound/temporary advise | readiness (heuristic) + **verify --network** + human | **P1** |
| 8 | Priority depth | Personal | the intake's top-2–3 ranked priorities get real depth; low-ranked ones are light or cut — never "optimize for everything". **Quantified since S2/S3 (2026-08-02):** the ledger's `## Candidates considered` tables must meet per-priority floors (defaults 16/8 · 10/5 · 6/3 considered/shipped; `researchFloors` in `_guide.json` overrides), and every `shipped` name must exist in the guide | **verify (candidates row)** + human | **P1** |
| 9 | Party fit ("bar test") | Personal | "could a generic AI have written this without knowing this traveler?" must be **no** — the correct TRAVELER_PATTERNS party is applied | human | **P1** |
| 10 | Honest gaps | Honest | every unknown is `⚠`-flagged or omitted, never invented; an admitted blank is a feature | readiness + human | **P1** |
| 11 | Recency | Verified | every perishable fact is within its `shelf_life`; the `verified` stamp is current for the trip | check-staleness + human | **P1** |
| 12 | Authenticity & crowd-awareness | Personal | marquee sights/food carry a **crowd reality + off-peak best-time** note; where the obvious pick is a tourist trap, a **novel local alternative** is offered; the guide reads like someone who has *been*, not a model summarizing — passes the "bar test". **Floor since S4 (2026-08-02):** a full Pass B owes ≥8 finds, ≥3 crowd/timing, ≥2 novel/alternative (`check-passb-coverage.mjs --floors`, CI-gated on full passes) | **CI (passB floors)** + human | **P1** |
| 13 | Design doctrine | — | tab-budget gate + a11y (axe, moderate+) pass; open-not-crowded; clickable-looks-clickable | build + axe + human | **P2** |
| 14 | Source mix (S5, 2026-08-02) | Verified | verify reports distinct citation domains, top-domain share, destination-ccTLD presence per guide; blocking only past **60% top-share** (a monoculture ratchet set above the measured worst real guide, 25%) — a healthy guide leaning on its destination's canon never trips it | **verify (sources row)** + human | **P1** |

## Verdict logic
- **Not ready** — any **P0** fails. (`npm run verify` returns `NEEDS WORK`, exit 1; or `npm run build` errors.)
- **Ships as draft** — all **P0** pass. (`readiness` PASS + `build` clean, `draft: true` kept.)
- **Publishable (Korea-tier)** — all **P0** + all **P1** pass. On the pipeline's happy path a
  full verify PASS **publishes** (`docs/reference/pipeline.md`, "Publish-on-verify" — the HUMAN
  rows print for visibility but do not block); a human judges the P1 HUMAN rows via the skill's §8
  self-check when triaging a draft that couldn't reach PASS, and retire/un-publish stays
  always-human.

## What the machine can and cannot judge
`readiness` + `build` enforce the mechanical half: schema, no fabricated placeholders, provenance
hygiene, completeness, itinerary integrity. They are a **floor** — they stop broken/empty/
unsourced guides. They cannot judge **depth, personalization, actionability, or authenticity**
(#7–#9, #12): a guide can pass every automated check and still be shallow, generic, or read
"AI-written." Those are the human/agent's job, and they are what separates a passing draft from a
Korea-tier guide. **Readiness PASS means "no detectable errors," not "good."**

**The method behind #8, #9, and #12 is the dual-pass procedure** (guide-author skill's Research
workflow): a *single* research pass can corroborate no depth and surface no authentic angle — it
only fills the guide once, and the readiness loop can only error-correct that one draft. Two
independent passes (A canonical / B local-authentic) **reconciled** into one guide is what makes
depth and authenticity achievable and auditable — the `## Research reconciliation` table in
`guides-intake/<slug>/ledger.md` is the evidence. Deliberately *not* a hard auto-gate: mechanically detecting "generic"
cries wolf on good guides (the coverage-metric lesson), so authenticity is a human/rubric judgment,
made reachable by the dual-pass method rather than enforced by a brittle detector.

## Pipeline gaps — closed, and the one that remains
- ~~**Intake form** has no first-class *anchor event* or *party* field.~~ **Closed** — the issue
  form + `docs/standards/new-guide-intake.md` now carry first-class **Anchor event**, **Who's this for /
  party**, and **Travel style** fields, threaded through `issue-to-scaffold.mjs` and
  `scaffold-guide.mjs` into the generated `intake.md`.
- ~~**No amendment log** for research-forced re-plans.~~ **Closed** — every scaffolded guide gets a
  `ledger.md` with an append-only **`## Amendments`** section (plus a **`## Research
  reconciliation`** table for the dual-pass corroboration trail), separate from the frozen intake.
- ~~**No second generation to corroborate the first.**~~ **Closed** — the skill's Research workflow
  is now a two-pass generate-then-reconcile procedure (see the dual-pass note above).
- **Itinerary length vs trip span** (#5) is still human-checked — the guide JSON has no stored
  "intended trip length" to auto-compare against. Mitigated at the source: the scaffold now emits
  exactly the right number of dated day cards from the trip dates (`dayLabelsFromRange`), so the
  residual risk is only later hand-drift, which the rubric row covers. A stored trip-span field for
  a true auto-compare remains a future improvement.
