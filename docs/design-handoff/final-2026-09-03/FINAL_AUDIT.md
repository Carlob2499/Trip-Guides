# WayPoint D6 — Final Drift / Handoff Audit

Date: **2026-09-03**
Verdict: **PASS — frozen for implementation with explicit late-review deltas**

## What this audit checked

- final user decisions against the longer D6 ledger;
- generated mockup drift against actual repository features/content;
- palette/type drift against executable tokens;
- Search/SOS placement against the stable five-destination architecture;
- Map behavior against the existing Google Maps/OSM code path;
- Split redesign against the existing expense engine;
- Guide additions against the Composer/semantic-object direction;
- mobile vs desktop composition intent;
- Korea fixture fidelity and Denmark generalization requirements;
- Claude/Codex entry instructions so neither agent discovers an obsolete handoff first and treats it as authority.

## Conflicts found and resolved

### 1. Palette wording
An older high-level identity paragraph says “Night Navy & Amber,” while D6-23 and `src/styles/base.css` preserve the actual sage/cartographic-paper + oxide system. `FINAL_DECISIONS.md` F1 resolves this explicitly in favor of executable tokens.

### 2. Split hierarchy
Older D6-41 says mobile is balance-first. The final user review instead makes **Recent Expenses + Add Expense primary**, with balance/settlement secondary. `FINAL_DECISIONS.md` F3 is the binding late-review decision.

### 3. SOS scope
Older D6-25 describes a broader layered urgent-help surface. Final review intentionally simplifies SOS to low-key, always-available **verified numbers/links** with no proactive triage/orchestration. `FINAL_DECISIONS.md` F4 + `docs/reference/sos-ui-final.md` are binding.

### 4. Raw mockups
Several generated boards contained hallucinated dates, people, ratings, controls, navigation, collaboration features, map claims, or visual-theme drift. Raw generated boards are therefore **not shipped in the implementation package**. They were converted into five sanitized SVG composition references containing only approved layout signals.

## Included visual references

- `visual-references/itinerary-mobile-composition.svg`
- `visual-references/map-responsive-composition.svg`
- `visual-references/guide-place-detail-composition.svg`
- `visual-references/split-responsive-composition.svg`
- `visual-references/search-responsive-final.svg`

Atlas, general Trip, and SOS intentionally have **no visual reference** because available generated renders were more likely to mislead implementation than help it. Those surfaces are implemented directly from authority docs.

## Agent routing verified

Both root entry files now point visual/frontend work to the frozen handoff before implementation:
- `CLAUDE.md`
- `AGENTS.md`

Claude and Codex therefore share the same D6 freeze, mockup manifest, and drift rules.

## Implementation freedom retained

Fable is not micromanaged. It may choose component boundaries, responsive mechanics, CSS/JS/TS organization, migration order, safe refactors, tests, and performance techniques as long as the behavior passes `ACCEPTANCE_MATRIX.md` and does not reopen product decisions.

## Stop conditions for Fable

Fable should stop only for:
- a contradiction still unresolved after `FINAL_DECISIONS.md`;
- a destructive migration with no safe compatibility path;
- a genuinely new product decision.

It should not stop for routine engineering choices, facts the repository can answer, or confirmation to continue an already-approved slice.

## Final implementation entrypoint

Claude Fable 5 should start with:
`docs/design-handoff/final-2026-09-03/FABLE5_IMPLEMENTATION_PROMPT.md`

Acceptance owner:
`docs/design-handoff/final-2026-09-03/ACCEPTANCE_MATRIX.md`
