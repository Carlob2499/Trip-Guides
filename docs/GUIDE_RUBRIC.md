# Guide Rubric — the standard every guide is judged against

The single, prioritized bar for a Waypoint guide — used by the research self-correction loop
(the `waypoint-guide-author` skill), by `npm run readiness`, and by the human who graduates a
guide. Derived from the four properties (**Verified · Personal · Actionable · Honest**), the
verification rules (`.claude/skills/waypoint-guide-author/references/verification-rules.md`), and
the post-mortems of the Korea/Denmark builds.

**Tiers:** **P0** blocks graduation (a draft with any P0 failure is not shippable). **P1** is the
Korea-tier quality bar (all P0 + all P1 = graduate-ready). **P2** is continuous polish.

**Gate column:** `readiness` / `build` / `axe` = auto-enforced (a machine says pass/fail);
`human` = judgment the tooling can't make, done via the skill's §8 self-check + the "bar test".

| # | Dimension | Property | Measurable criterion | Gate | Tier |
|---|-----------|----------|----------------------|------|------|
| 1 | Schema valid | — | `npm run build` clean (zero content-collection errors) | build | **P0** |
| 2 | No fabrication | Verified | 0 `__VERIFICATION_REQUIRED__`; 0 guessed `img.file`; every named venue/event actually exists (spot-check) | readiness + human | **P0** |
| 3 | Provenance on perishables | Verified | no `verified_on` without `source_url`; strict mode: no `≈` without a `verified_on` | readiness + build | **P0** |
| 4 | Completeness | Actionable | no empty `panel`/`prose` bodies (checklist-only ok; References exempt); every day card has a real "Mon D" date + a real body | **readiness** | **P0** |
| 5 | Itinerary integrity | Actionable | dates contiguous, no gap/duplicate; day count matches the intake's trip span (human confirms span) | readiness + human | **P0** |
| 6 | Anchor coverage | Personal | on an anchor trip, the non-negotiable event is verified against a **T0** source (dates + venue) and the trip is built around it | human | **P0** (anchor trips) |
| 7 | 4-question venue rule | Actionable | every venue answers **where / how to get there / when it fits / book?** | readiness (heuristic) + human | **P1** |
| 8 | Priority depth | Personal | the intake's top-2–3 ranked priorities get real depth; low-ranked ones are light or cut — never "optimize for everything" | human | **P1** |
| 9 | Party fit ("bar test") | Personal | "could a generic AI have written this without knowing this traveler?" must be **no** — the correct TRAVELER_PATTERNS party is applied | human | **P1** |
| 10 | Honest gaps | Honest | every unknown is `⚠`-flagged or omitted, never invented; an admitted blank is a feature | readiness + human | **P1** |
| 11 | Recency | Verified | every perishable fact is within its `shelf_life`; the `verified` stamp is current for the trip | check-staleness + human | **P1** |
| 12 | Authenticity & crowd-awareness | Personal | marquee sights/food carry a **crowd reality + off-peak best-time** note; where the obvious pick is a tourist trap, a **novel local alternative** is offered; the guide reads like someone who has *been*, not a model summarizing — passes the "bar test" | human | **P1** |
| 13 | Design doctrine | — | tab-budget gate + a11y (axe, moderate+) pass; open-not-crowded; clickable-looks-clickable | build + axe + human | **P2** |

## Verdict logic
- **Not ready** — any **P0** fails. (`npm run readiness` returns `NEEDS WORK`, exit 1; or `npm run build` errors.)
- **Ships as draft** — all **P0** pass. (`readiness` PASS + `build` clean, `draft: true` kept.)
- **Graduate-ready (Korea-tier)** — all **P0** + all **P1** pass, judged by a human via the skill's §8 self-check. Graduation is always a human decision.

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
depth and authenticity achievable and auditable — the `## Research reconciliation` ledger in the
intake doc is the evidence. Deliberately *not* a hard auto-gate: mechanically detecting "generic"
cries wolf on good guides (the coverage-metric lesson), so authenticity is a human/rubric judgment,
made reachable by the dual-pass method rather than enforced by a brittle detector.

## Pipeline gaps — closed, and the one that remains
- ~~**Intake form** has no first-class *anchor event* or *party* field.~~ **Closed** — the issue
  form + `docs/NEW_GUIDE_INTAKE.md` now carry first-class **Anchor event**, **Who's this for /
  party**, and **Travel style** fields, threaded through `issue-to-scaffold.mjs` and
  `scaffold-guide.mjs` into the generated intake doc.
- ~~**No amendment log** for research-forced re-plans.~~ **Closed** — every scaffolded intake now
  has an append-only **`## Amendments`** section (plus a **`## Research reconciliation`** ledger
  for the dual-pass corroboration trail).
- ~~**No second generation to corroborate the first.**~~ **Closed** — the skill's Research workflow
  is now a two-pass generate-then-reconcile procedure (see the dual-pass note above).
- **Itinerary length vs trip span** (#5) is still human-checked — the guide JSON has no stored
  "intended trip length" to auto-compare against. Mitigated at the source: the scaffold now emits
  exactly the right number of dated day cards from the trip dates (`dayLabelsFromRange`), so the
  residual risk is only later hand-drift, which the rubric row covers. A stored trip-span field for
  a true auto-compare remains a future improvement.
