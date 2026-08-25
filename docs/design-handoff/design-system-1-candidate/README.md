# Waypoint Design System 1.0 — calibration candidate

> **CANDIDATE, NOT SHIPPED.** This package is approved input for visual calibration. It does
> not replace the current R5 production authority, production tokens, components, navigation,
> or behavior. Nothing becomes production law until the creator reviews the five visual gates
> and explicitly approves Design System 1.0.

## What this package does

It gives the next deliberate Claude `/design` session a bounded problem:

1. preserve Waypoint's product truth and field-use safety floors;
2. use the completed creator decisions in the candidate constitution;
3. prototype exactly five unresolved visual gates at high fidelity; and
4. return each gate as `LOCK`, `REVISE`, `REJECT`, or `UNRESOLVED`.

It is calibration preparation, not the redesign and not permission to edit production UI.

## Read in this order

1. [DESIGN-SYSTEM-CANDIDATE.md](DESIGN-SYSTEM-CANDIDATE.md) — candidate visual constitution.
2. [PRODUCT-UI-CONTRACT.md](PRODUCT-UI-CONTRACT.md) — fixed traveler behavior, separate from style.
3. [VISUAL-CALIBRATION.md](VISUAL-CALIBRATION.md) — the five gates and first canvas set.
4. [R5-RECONCILIATION.md](R5-RECONCILIATION.md) — answer to “is this old R5 rule still law?”
5. [REFERENCE-BOARD.md](REFERENCE-BOARD.md) — bounded internal references; inspiration, not authority.

Only after those five files, consult the specific historical R5 source named by the
reconciliation matrix. Do not reread the whole R5 bundle by default.

## Authority map during calibration

Current production continues to follow:

```text
waypoint-design skill
  → docs/design-handoff/DESIGN.md (R5 written authority)
    → src/styles/base.css token values
      → docs/design-handoff/enforcement/ machine checks
```

For an explicitly named **DS1 calibration** task only:

```text
this README
  → Design System Candidate
  → Product UI Contract (parallel product authority)
  → Visual Calibration gates
  → R5 Reconciliation
  → bounded references
```

## Intended authority map after approval

Approval will require a separate production change. That later change should establish:

```text
waypoint-design skill
  → approved Design System 1.0
    → approved tokens + machine safety constraints

Product UI Contract
  → Today · Itinerary · Map · Split · Guide
  → Atlas · Search · SOS · group/offline behavior
```

Historical R5 then becomes consult-only implementation history. This candidate package must
not be silently renamed or treated as that approval.

## Current and historical references

- `docs/design-handoff/DESIGN.md` remains current shipped R5 authority.
- `src/styles/base.css` remains the source of truth for shipped token values.
- `docs/design-handoff/enforcement/` remains the machine-checkable R5 implementation contract;
  safety floors classified `KEEP` in the reconciliation remain redesign constraints too.
- `docs/design-handoff/design_handoff_guide_ui/` and its prototypes remain shipped-reference
  history. Use a named file only when the matrix or reference board points to it.
- The fixed product information architecture is recorded separately in
  `PRODUCT-UI-CONTRACT.md`; it is not a radius, font, color, or motion decision.

## Approval boundary

Design System 1.0 becomes authoritative only when all five gates have a creator-reviewed
outcome and the creator explicitly approves the system. Until then:

- no production CSS, component, or navigation behavior changes;
- no font is purchased or licensed;
- no unresolved gate is inferred from this package;
- factual guide content and Pipeline V2 remain outside scope.
