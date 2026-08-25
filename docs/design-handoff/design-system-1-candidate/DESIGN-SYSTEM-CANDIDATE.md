# Design System 1.0 — candidate constitution

> **Calibration candidate.** This records completed creator direction without pretending the
> remaining visual choices are decided or shipped.

## A. Identity

Waypoint is a **spatial travel instrument with editorial depth**:

- approximately 50% modern spatial travel operating system;
- approximately 35% premium editorial travel object; and
- approximately 15% cartographic field instrument.

Cartography is selective and useful, not a costume. Ordinary utility uses ordinary language.
Geographic styling appears where it clarifies place, movement, relationship, or orientation.

The visual ambition is high: rich photography, maps, diagrams, timelines, charts, weather and
transit visuals, motion, and spatial transitions are welcome when they improve understanding.
Operational contexts reduce competition, not visual quality.

## B. Foundations

### Color

Keep the existing Waypoint foundation: sage/paper, deep ink, oxide, and status semantics.
System color establishes Waypoint; content color establishes place. Contextual place/content
color may add character without weakening contrast, uncertainty, emergency, or status meaning.

### Typography

Typography is an unresolved visual gate. Do not replace the shipped Literata + Source Sans 3
pair until the candidate systems are tested on realistic Waypoint content and approved.

### Geometry and material

Retire the constitutional `0 / 999px only` rule. DS1 will use one purposeful, coherent radius
scale: evidence may remain square, controls may be pill-shaped, and containers may use
restrained radii. The exact scale is unresolved.

Controlled depth, blur, gradients, transparency, and elevation are allowed when they improve
hierarchy, atmosphere, or spatial understanding. They remain accountable to performance,
readability, field conditions, and reduced motion.

### Photography and media

Photography is a major expressive pillar and part of information architecture. It may be
full-width, use varied crops, form galleries, or participate in transitions. Mounted evidence
photography remains one useful subtype, not the only permitted treatment.

Text and visuals are equal layout materials. Choose the medium that communicates the
information best, using repeatable composition patterns rather than one rigid article shell.

### Truth and provenance

Presentation never rewrites travel truth. Perishable facts remain sourced and dated; unknowns
remain honest gaps. Verification may be selectively visible, uncertainty must be meaningful,
and deep provenance may sit on demand. Stale, conflicting, and unconfirmed states get louder.
The exact provenance treatment is unresolved.

## C. UI grammar

### Containers

Cards are a tool, not the default canvas. Use bounded containers for tools, operational data,
and editable state. Editorial sections may compose more freely.

### Density

Density is context-adaptive. Waypoint should waste neither screen space nor attention.
Desktop should reveal relationships; mobile should use nearly all useful area; whitespace
must have a job.

### Navigation and chrome

Persistent navigation is part of Waypoint's personality. Destination meaning and order stay
stable while chrome may move, compress, dock, or recompose with context and scroll. Exact
choreography is unresolved. The fixed destinations themselves belong to the separate Product
UI Contract.

### Icons

A coherent curated icon system is allowed. The five primary destinations should have
recognizable silhouettes and keep text labels. Icons must remain legible offline and to
assistive technology; decoration never replaces meaning.

### Motion

Routine interactions are fast, spatially coherent, and context-preserving. Flagship geographic
or spatial moments may be cinematic. Old R5 timings and easings are references, not sacred
values. Reduced-motion behavior is complete, not decorative aftercare. Exact motion is an
unresolved gate.

### Standardization

Use stable foundations and recognizable patterns without forcing every surface into sameness.
Feature-specific compositions may be justified locally.

## D. Responsive and accessibility principles

Mobile and desktop are siblings, not responsive clones. **Mobile should reduce competition,
not capability.** It is better prioritized, never dumbed down.

Design the mobile field state for glare, one hand, low battery, poor connection, fatigue, and
little patience. Critical traveler state must be understandable within seconds.

Accessibility does not flatten Waypoint's ambition, but ambition may never block the trip:

- core tasks remain fully operable;
- text remains readable and reflows at the 320px safety floor;
- hostile unbroken and multilingual content cannot escape its owner;
- touch and focus targets remain sound;
- critical state never relies on color alone;
- assistive technology understands navigation and state;
- safe-area insets are handled explicitly; and
- reduced motion supplies a complete alternative.

## E. Component governance

New feature-specific UI starts local. Promote it into the design system only after proven reuse
or repeated evidence.

> New feature ≠ new design-system component. A pattern starts locally, proves itself, gets
> reused, then graduates.

Use shared components where a stable pattern already exists. Do not create a second design
system or globalize a one-off composition preemptively.

## F. Change policy

After creator approval, Design System 1.0 is strongly frozen with an evidence escape hatch.
Reopen it only for:

- a repeated/material accessibility problem;
- a repeated/material usability problem;
- a platform requirement;
- an explicit brand change;
- a recurring unsupported feature class; or
- a tested material improvement.

A difficult one-off feature does not reopen the system.

## The five unresolved visual gates

Nothing in this constitution decides these by prose:

1. **Typography** — the approved comparison set and role performance.
2. **Geometry** — the coherent shape/radius scale.
3. **Provenance** — visible verification, uncertainty, and evidence depth.
4. **Mobile + desktop navigation/composition** — fixed five-destination IA as sibling systems.
5. **Motion** — routine motion, one flagship spatial transition, and reduced-motion behavior.

Their test briefs and output states live in `VISUAL-CALIBRATION.md`.
