# WayPoint D7 — Creator Visual Fidelity Gate

Status: **BINDING FOR D7 VISUAL ACCEPTANCE**  
Owner: Carlo  
Added: 2026-09-04 after PR #186 visual review exposed composition drift.

## Why this exists

D7 can be functionally correct and still fail the approved redesign. Functional checks such as routing, accessibility, map fallback, responsive reflow, schema validity, and retired-feature grep do **not** prove that the rendered product matches the creator-approved D6 visual direction.

The previous handoff over-corrected for hallucinated mockup content by excluding the original approved raster mockups from implementation authority. That made the sanitized SVGs and prose sufficient for acceptance and allowed a visually different composition to pass the matrix. This file closes that gap.

## Authority split

Use the following split instead of treating visual fidelity and factual truth as the same problem:

1. **Product/content truth** comes only from canonical repository content, `PRODUCT.md`, verified guide data, schemas, and explicit D6 decisions. Mockup text, names, times, amounts, people, ratings, live state, controls, and travel facts are never factual authority.
2. **Visual composition truth** comes from the creator-approved D6 mockups for the surfaces they depict, plus explicit late-review visual decisions. For those surfaces, the approved mockup is authoritative for hierarchy, proportion, density, imagery prominence, navigation character, spatial relationships, major geometry, and overall visual tone.
3. **Sanitized SVGs** in `visual-references/` are secondary annotations. They help isolate safe composition ideas but do not replace the approved mockups.
4. An explicit written D6 decision may override a specific visual element. The override must be named. Generic design-system prose is not permission to silently restyle an approved composition.

This is **not** a pixel-perfect cloning rule. Production must use real WayPoint data, real components, accessibility constraints, responsive sibling compositions, and the executable token system. It is a fidelity rule: the resulting screen must clearly be the production realization of the approved design rather than a new design that merely contains the same features.

## Current blocking gap

The original creator-approved raster mockups are not stored in this repository. Therefore:

- D7 functional acceptance may be recorded independently.
- D7 **visual acceptance cannot be PASS** until those approved references are supplied to the implementation/review session or durably added to the repository.
- A model must not infer the missing visual target from prose or the sanitized SVGs and then declare visual completion.

If the approved raster references are unavailable, record `VISUAL_REFERENCE_MISSING` and stop before baseline approval. Do not compensate by inventing a replacement design.

## Minimum reference set for convergence

The visual convergence pass must have creator-approved references covering at least:

- active Trip on mobile;
- Itinerary on mobile;
- Itinerary temporal-spatial workbench on desktop;
- Map on mobile and/or desktop where the composition materially differs;
- Guide landing/editorial treatment;
- desktop shell/navigation treatment;
- any Split composition that Carlo explicitly approved and expects preserved.

Where multiple mockups explored alternatives, only the final creator-approved direction is binding. Superseded alternatives must be marked as such rather than averaged together.

## Fidelity dimensions

For every referenced surface, review all of the following:

- primary information hierarchy;
- visual weight of hero/media versus text;
- content density and dead space;
- major region proportions;
- navigation placement and visual treatment;
- desktop use of width and simultaneous context;
- mobile thumb-zone economy and chrome footprint;
- typography scale relationships;
- component/card frequency versus editorial/spatial composition;
- imagery role and crop prominence;
- working-surface versus immersive-background relationship;
- distinctive WayPoint identity versus generic application chrome.

A surface fails fidelity if it preserves feature names but materially changes these relationships without an explicit approved reason.

## Usage-control checkpoints

Do not spend another long model run implementing every surface before proving the translation is correct.

### V0 — Reference preflight

Before visual edits:

- load the approved mockups and this gate;
- identify which reference controls each production surface;
- list any explicit textual override;
- confirm no required reference is missing.

If a required reference is missing, stop visual implementation with `VISUAL_REFERENCE_MISSING`.

### V1 — Two-surface canary

First implement/repair only:

1. active Trip mobile; and
2. Itinerary desktop workbench.

Render production screenshots using South Korea content. Compare them against the approved references on every fidelity dimension above. Do **not** continue the full visual sweep while either surface is materially off-target.

### V2 — Full surface convergence

After V1 passes, apply the approved visual language to the remaining surfaces while preserving the already-working D7 architecture, data projection, accessibility, offline behavior, Search, SOS, map fallback, and Split engine.

### V3 — Creator acceptance

Produce a compact review artifact containing paired reference/production views for the required surfaces at representative phone and desktop widths.

Only Carlo's explicit acceptance, or an explicit instruction to delegate that acceptance, changes visual status to PASS.

## Baseline rule

Screenshot baselines are regression locks, not design approval.

- Do not regenerate or approve new gallery baselines merely because the new render is stable.
- Do not treat a matching regenerated baseline as evidence of design correctness.
- Regenerate final baselines only after V3 visual acceptance.

## Scope of the correction pass

The D7 visual convergence pass should **reuse PR #186 engineering**. It should not rebuild routing, Search, SOS, map failover, schema work, Split math/state, accessibility gates, or other functioning architecture unless the visual correction exposes a real defect.

The objective is narrow:

> Preserve the D7 engine; converge the rendered product to the creator-approved D6 design.
